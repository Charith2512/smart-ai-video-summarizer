import re
import nltk
import traceback
import os
from dotenv import load_dotenv
import ollama
from nltk.tokenize import sent_tokenize, word_tokenize
from nltk.corpus import stopwords
from collections import Counter
import string
import numpy as np
import fitz  # PyMuPDF
import docx2txt

# Load environment variables
load_dotenv()

# Configure API Key (Try .env first, then placeholder)
# Configure API Key - SKIPPED (Local Mode)
# API_KEY = os.getenv("GEMINI_API_KEY")


# Download necessary NLTK data - ROBUST
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')

try:
    nltk.data.find('tokenizers/punkt_tab')
except LookupError:
    try:
        nltk.download('punkt_tab')
    except:
        print("[WARN] Could not download punkt_tab. Proceeding...")

try:
    nltk.data.find('corpora/wordnet')
except LookupError:
    nltk.download('wordnet')

try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('stopwords')

try:
    nltk.data.find('taggers/averaged_perceptron_tagger')
except LookupError:
    nltk.download('averaged_perceptron_tagger')

try:
    nltk.data.find('taggers/averaged_perceptron_tagger_eng')
except LookupError:
    try:
        nltk.download('averaged_perceptron_tagger_eng') 
    except: 
        pass

import google.generativeai as genai

class UAMSASummarizer:
    def __init__(self):
        print("Initializing UAMSA Hybrid Pipeline...")
        # Check if API key is set
        self.api_key = os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            print("[WARN] Gemini API Key is missing. Cloud features will fail.")
        else:
            genai.configure(api_key=self.api_key)

    def summarize_cloud(self, text: str, preference: str = "medium", format_mode: str = "paragraph", images: list = None, metadata: dict = {}) -> str:
        """
        Direct Cloud API Call for Video Transcripts + Images (Multimodal).
        Uses Gemma 3 27B IT (High RPD, Large Context).
        Accepts full metadata dict for rich context.
        """
        try:
            print(f"[CLOUD-API] Sending {len(text)} chars + {len(images) if images else 0} frames to Gemma 3 27B IT...")
            
            # Use Gemma 3 27B IT
            model = genai.GenerativeModel('gemma-3-27b-it') 
            
            # --- Rich Context Context Engine ---
            category = metadata.get('category', 'General')
            uploader = metadata.get('uploader', 'Unknown Creator')
            title = metadata.get('title', 'Unknown Title')
            tags = ", ".join(metadata.get('tags', []))
            description = metadata.get('description', '')
            
            visual_focus = "Identify any specific people, speakers, or known figures visible in the frames."
            
            if "music" in category.lower():
                visual_focus += " Focus on the visual aesthetic, mood, and instruments. Ignore lyrics if not in transcript."
            elif "gaming" in category.lower():
                visual_focus += " Focus on gameplay HUD, graphics quality, and key moments."
            elif "tech" in category.lower():
                visual_focus += " Focus on specific products, screens, and diagrams shown."

            # Construct Prompt
            directives = {
                "short": "Provide a concise executive summary.",
                "medium": "Provide a balanced, detailed narrative summary.",
                "long": "Provide an extensive, comprehensive report covering all details.",
                "detailed": "Provide a COMPLETE, DEEP-DIVE ANALYSIS. Cover every topic, chapter, and visual detail exhaustively. Do not leave out any significant information."
            }
            directive = directives.get(preference, "balanced summary")
            
            style_instruction = "Use a professional, third-person report style."
            if format_mode == "bullet points":
                style_instruction = "Use a structured list of bullet points."
            
            prompt_parts = [
                f"""
                You are an expert video analyst.
                
                --- VIDEO CONTEXT ---
                Title: {title}
                Creator: {uploader}
                Category: {category}
                Tags: {tags}
                Description Excerpt: {description}
                
                --- INSTRUCTIONS ---
                Task: {directive}
                Visual Task: {visual_focus}
                Style: {style_instruction}
                Requirement: Use the metadata keys (tags/topics) to understand context, but DO NOT include any hashtags (e.g., #Example) in the final output.
                
                --- TRANSCRIPT ---
                {text}
                
                --- ANALYSIS ---
                Analyze the following frames and transcript together to produce the summary:
                """
            ]
            
            # Append images if available
            if images:
                prompt_parts.extend(images)
            
            response = model.generate_content(prompt_parts)
            return response.text
        except Exception as e:
            error_str = str(e)
            print(f"[CLOUD-ERROR] {error_str}")
            
            if "429" in error_str:
                return "The video is too long. Please try a shorter length video."
            
            return f"Error using Cloud API: {error_str}"

    def summarize_visual_cloud(self, images: list, metadata: dict, length: str, format_mode: str) -> str:
        """
        Visual-Only Fallback Pipeline.
        Used when transcripts are disabled/missing. Rely heavily on frames + metadata.
        """
        try:
            print(f"[CLOUD-API-VISUAL] Using Gemma 3 27B IT for Visual Analysis ({len(images)} frames)...")
            model = genai.GenerativeModel('gemma-3-27b-it')
            
            # --- Rich Context ---
            category = metadata.get('category', 'General')
            uploader = metadata.get('uploader', 'Unknown Creator')
            title = metadata.get('title', 'Unknown Title')
            tags = ", ".join(metadata.get('tags', []))
            description = metadata.get('description', '')
            
            prompt_parts = [
                f"""
                You are an Expert Visual Analyst.
                
                --- VIDEO CONTEXT ---
                Title: {title}
                Creator: {uploader}
                Category: {category}
                Tags: {tags}
                Description: {description}
                
                --- SITUATION ---
                The transcript for this video is UNAVAILABLE.
                You must generate a comprehensive summary based SOLELY on the provided video frames and the metadata above.
                
                --- INSTRUCTIONS ---
                1. Analyze the sequence of images to understand the narrative or process shown.
                2. Use the Title and Description to frame your visual understanding.
                3. Detail what happens in the video, what objects/people are shown, and any text visible on screen.
                4. Length: {length}
                5. Format: {format_mode} (If bullet points, list key visual events).
                
                --- OUTPUT ---
                Provide a detailed visual report of the video content.
                """
            ]
            
            if images:
                prompt_parts.extend(images)
            else:
                prompt_parts.append("\n[NO FRAMES AVAILABLE] Please summarize based on metadata alone.")
            
            response = model.generate_content(prompt_parts)
            return response.text
            
        except Exception as e:
            error_str = str(e)
            print(f"[CLOUD-ERROR] Visual Summary Failed: {error_str}")
            
            if "429" in error_str:
                return "The video is too long. Please try a shorter length video."
                
            return f"Visual Analysis Failed: {error_str}"

    def generate_highlights_cloud(self, transcript_data: list, images: list = None, metadata: dict = {}) -> list:
        """
        Specialized Prompt for Extracting Video Highlights (JSON Timestamps).
        Returns: List of dicts [{'start': 10, 'end': 40, 'title': 'Intro'}, ...]
        """
        FALLBACK_MODELS = [
            "gemma-3-27b-it", 
            "gemini-2.5-flash",
            "gemini-2.5-flash-lite",
            "gemini-3-flash"
        ]

        last_error = None
        
        for model_name in FALLBACK_MODELS:
            try:
                print(f"[CLOUD-API] Generating Structured Highlights using {model_name}...")
                model = genai.GenerativeModel(model_name)
                
                # Format Transcript with raw seconds for easier parsing by LLM
                formatted_transcript = ""
                for item in transcript_data:
                    # Grouping: just output start time in seconds
                    formatted_transcript += f"[{int(item.start)}] {item.text}\n"

                prompt_parts = [
                    f"""
                    You are a Professional Video Editor.
                    
                    --- VIDEO CONTEXT ---
                    Title: {metadata.get('title', 'Unknown')}
                    Category: {metadata.get('category', 'General')}
                    
                    --- TASK ---
                    Identify the top 5-7 MOST CRITICAL segments that capture the essence of the video.
                    Focus ONLY on the core narrative, major revelations, or key demonstrations.
                    Skip introductions, detailed examples, tangent topics, and minor explanations.
                    The goal is a concise "Best Of" reel, NOT a full summary.
                    
                    --- FORMAT ---
                    [
                        {{ "start": 30, "end": 65, "title": "Introduction to Topic" }},
                        {{ "start": 120, "end": 200, "title": "Key Demonstration" }}
                    ]
                    
                    RULES:
                    1. "start" and "end" must be INTEGERS (seconds).
                    2. "end" must be > "start".
                    3. Intervals should NOT overlap.
                    4. IMPORTANT: Ensure the "end" time covers the COMPLETION of the sentence/thought. Be GENEROUS with padding.
                    5. STRICT VALID JSON ONLY. No trailing commas.
                    
                    --- TRANSCRIPT ---
                    {formatted_transcript[:35000]} # Truncate to safe limit
                    """
                ]
                
                if images: prompt_parts.extend(images)
                
                response = model.generate_content(prompt_parts)
                text_response = response.text.strip()
                
                # Clean Markdown if present
                if "```json" in text_response:
                    text_response = text_response.split("```json")[1].split("```")[0].strip()
                elif "```" in text_response:
                    text_response = text_response.split("```")[1].split("```")[0].strip()
                    
                import json
                try:
                    highlights_json = json.loads(text_response)
                except json.JSONDecodeError as e:
                    print(f"[WARN] JSON Decode Error ({model_name}): {e}. Attempting repair...")
                    # Basic Repair: Fix Trailing Commas in lists/objects
                    import re
                    text_response = re.sub(r',\s*([\]}])', r'\1', text_response)
                    # Repair: Fix missing bracket
                    if text_response.startswith('[') and not text_response.endswith(']'):
                         text_response += ']'
                    
                    try:
                        highlights_json = json.loads(text_response)
                        print("[INFO] JSON Repaired successfully.")
                    except:
                        print(f"[ERROR] Failed to repair JSON from {model_name}")
                        raise e # re-raise to trigger next model fallout
                
                # Validate & Add Safety Buffer
                valid_highlights = []
                for h in highlights_json:
                    if 'start' in h and 'end' in h:
                        # Add Safety Buffer: +1 second per user request
                        h['end'] = h['end'] + 1
                        valid_highlights.append(h)
                
                # Post-Process: Sort and Smart Merge
                valid_highlights.sort(key=lambda x: x['start'])
                
                merged_highlights = []
                if valid_highlights:
                    current_clip = valid_highlights[0]
                    MAX_DURATION = 180  # Hard limit: 3 minutes per highlight
                    
                    for next_clip in valid_highlights[1:]:
                        # Calculate potential new duration
                        potential_end = max(current_clip['end'], next_clip['end'])
                        potential_duration = potential_end - current_clip['start']
                        
                        # Logic: Merge if gap < 2s AND total duration won't exceed limit
                        if (current_clip['end'] >= next_clip['start'] - 2.0) and (potential_duration <= MAX_DURATION):
                            print(f"[MERGE] Merging: '{current_clip['title']}' & '{next_clip['title']}'")
                            
                            # Extend the end time
                            current_clip['end'] = potential_end
                            
                            # Smart Title Merging: Limit to 2 titles to prevent UI overflow
                            current_titles = current_clip['title'].split(" / ")
                            if next_clip['title'].strip() not in current_titles:
                                if len(current_titles) < 2:
                                    current_clip['title'] += f" / {next_clip['title']}"
                                elif "..." not in current_clip['title']:
                                    current_clip['title'] += " ..."
                        else:
                            # No overlap or too long, push current and start new
                            merged_highlights.append(current_clip)
                            current_clip = next_clip
                    
                    # Append the final clip
                    merged_highlights.append(current_clip)
                
                print(f"[CLOUD-API] Merged {len(valid_highlights)} -> {len(merged_highlights)} highlights.")
                
                # ADD METADATA FOR UI IF FALLBACK HAPPENED (skip if primary model)
                if model_name != "gemma-3-27b-it":
                     merged_highlights.insert(0, {
                         "warning": "MODEL_SWITCHED",
                         "details": f"Automatically switched to {model_name} due to high traffic."
                     })

                return merged_highlights

            except Exception as e:
                error_msg = str(e)
                last_error = error_msg
                print(f"[WARN] Model {model_name} failed: {error_msg}")
                
                # Only retry on Quota Errors (429)
                if "429" in error_msg:
                    print(f"[FALLBACK] Quota exceeded on {model_name}. Switching to next...")
                    continue
                else:
                    # Other errors (Parsing, etc) might be fatal or worth checking
                    # But for now let's assume if parsing failed, maybe the next model is smarter?
                    # Let's retry all errors to be safe "until it tries all models"
                    continue
        
        # If loop finishes without return
        print(f"[ERROR] All models failed. Last error: {last_error}")
        
        # Quota Error Parsing (for the final error)
        if last_error and "429" in last_error:
            violation = "Quota Exceeded (All Models Busy)"
            if "requests_per_day" in last_error:
                 violation = "Daily Quota Exceeded (All Models)"
            return [{"error": "QUOTA_EXCEEDED", "details": violation}]
            
    def extract_key_quotes_local(self, transcript_text: str, metadata: dict = {}) -> list:
        """
        Uses Local Ollama (Gemma 3 12B) to find key sentences verbatim.
        Handles long transcripts by splitting into chunks.
        Returns: List of dicts [{'quote': 'Exact sentence text...'}]
        """
        import json
        import re
        
        all_quotes = []
        
        # Chunking Strategy
        # 12000 chars ~= 3000 tokens. Safe for 8k context limit including instructions.
        # This ensures we don't truncate the start of the transcript.
        CHUNK_SIZE = 12000 
        OVERLAP = 500 # Overlap to catch sentences on boundaries
        
        total_len = len(transcript_text)
        print(f"[LOCAL-AI] Processing transcript of length {total_len} chars...")
        
        start = 0
        chunk_idx = 1
        
        # Loop until we process the whole text
        while start < total_len:
            end = min(start + CHUNK_SIZE, total_len)
            
            # Snap end to nearest space to avoid cutting words
            if end < total_len:
                last_space = transcript_text.rfind(' ', start, end)
                if last_space != -1:
                    end = last_space
            
            chunk_text = transcript_text[start:end]
            print(f"[LOCAL-AI] Processing Chunk {chunk_idx}: {len(chunk_text)} chars ({start}-{end})...")
            
            try:
                # Context construction
                prompt = f"""
                --- TRANSCRIPT SEGMENT START ---
                {chunk_text}
                --- TRANSCRIPT SEGMENT END ---
                
                You are a JSON-Only Data Extractor.
                
                TASK: Identify ALL important verbatim sentences from the transcript segment above.
                
                OUTPUT RULES:
                1. Return a VALID JSON List of objects.
                2. Scan the ENTIRE segment found above.
                3. Do NOT limit the number of quotes. If there are interesting points, extract them.
                4. Each object must have a "quote" key containing the EXACT text.
                5. NO introductory text. NO markdown. JUST the JSON list.
                
                EXAMPLE OUTPUT:
                [
                    {{ "quote": "The most important feature is the new battery life." }},
                    {{ "quote": "It costs $999 which is a good deal." }}
                ]
                
                YOUR OUTPUT:
                """
                
                response = ollama.chat(model='gemma3:12b', messages=[
                    {'role': 'user', 'content': prompt}
                ])
                
                content = response['message']['content']
                
                # Robust Parsing
                match = re.search(r'\[.*\]', content, re.DOTALL)
                if match:
                    json_str = match.group(0)
                    try:
                        chunk_quotes = json.loads(json_str)
                        if isinstance(chunk_quotes, list):
                            # Basic validation
                            valid_quotes = [q for q in chunk_quotes if isinstance(q, dict) and 'quote' in q]
                            all_quotes.extend(valid_quotes)
                            print(f"[LOCAL-AI] Chunk {chunk_idx} yielded {len(valid_quotes)} quotes.")
                    except json.JSONDecodeError:
                        print(f"[WARN] Chunk {chunk_idx} produced invalid JSON.")
                else:
                    # Fallback for simple format
                    if "```json" in content:
                        try:
                            clean = content.split("```json")[1].split("```")[0].strip()
                            all_quotes.extend(json.loads(clean))
                        except: pass
            except Exception as e:
                print(f"[WARN] Failed to process chunk {chunk_idx}: {e}")
            
            # Prepare for next iteration
            
            # If we processed the very end of the text, stop.
            if end == total_len:
                break
                
            start = end - OVERLAP # Move forward but keep some overlap
            chunk_idx += 1

            
        print(f"[LOCAL-AI] Total extracted quotes: {len(all_quotes)}")
        return all_quotes


    def _preprocess_text(self, text: str) -> str:
        # ... (rest of class)

        # Basic Cleaning: Remove excessive whitespace and noise
        text = " ".join(text.split())
        return text.strip()

    def get_micro_chunks(self, text: str, max_tokens: int = 600, overlap: int = 50) -> list:
        """
        Step 1.3: Divide raw text into small overlapping chunks.
        """
        print(f"[MICRO-CHUNKING] splitting text with max_tokens={max_tokens}, overlap={overlap}...")
        
        # 1. Basic Cleaning
        text = self._preprocess_text(text)
        
        try:
            # 2. Sentence Tokenization
            sentences = sent_tokenize(text)
            
            # CRITICAL FIX: If punctuation is missing (e.g., raw transcripts), sent_tokenize fails.
            # Detect by checking ratio of sentences to words.
            word_count = len(text.split())
            if len(sentences) < (word_count // 50) and word_count > 100:
                print(f"[WARN-TOKENIZE] Detected unpunctuated text (Words: {word_count}, Sentences: {len(sentences)}). Using Fallback Split.")
                words = text.split()
                # Create pseudo-sentences of 25 words
                sentences = [" ".join(words[i:i+25]) + "." for i in range(0, len(words), 25)]
                
        except Exception as e:
            print(f"[ERROR-TOKENIZE] {e}")
            sentences = text.split('. ')
        
        chunks = []
        current_chunk = ""
        current_length = 0
        
        for sentence in sentences:
            sentence_length = len(sentence.split()) # Basic word count as token proxy
            
            if current_length + sentence_length <= max_tokens:
                current_chunk += " " + sentence
                current_length += sentence_length
            else:
                if current_chunk:
                    chunks.append(current_chunk.strip())
                
                words = current_chunk.split()
                overlap_text = " ".join(words[-overlap:]) if len(words) > overlap else current_chunk
                current_chunk = overlap_text + " " + sentence
                current_length = len(current_chunk.split())
                
        if current_chunk:
            chunks.append(current_chunk.strip())
            
        print(f"[MICRO-CHUNKING] Created {len(chunks)} chunks.")
        return chunks

    def score_sentences(self, chunk: str):
        """
        Step 2: Assign importance scores to sentences using a hybrid math formula.
        """
        try:
            stop_words = set(stopwords.words('english'))
            sentences = sent_tokenize(chunk)
            
            # Fallback tokenization here too just in case
            if len(sentences) < 2:
                 words = chunk.split()
                 sentences = [" ".join(words[i:i+25]) + "." for i in range(0, len(words), 25)]

            # 1. Identify Keywords (Simple Frequency)
            try:
                words = word_tokenize(chunk.lower())
            except LookupError:
                words = chunk.lower().split()
            
            words = [w for w in words if w not in stop_words and w not in string.punctuation]
            word_freq = Counter(words)
            
            # 2. Score each sentence
            sentence_scores = []
            for i, sentence in enumerate(sentences):
                score = 0
                try:
                    tokens = word_tokenize(sentence.lower())
                except LookupError:
                    tokens = sentence.lower().split()
                
                # A. Keyword Density Score
                keyword_score = sum([word_freq[w] for w in tokens if w in word_freq])
                score += keyword_score
                
                # B. Proper Noun Weight
                try:
                    tagged = nltk.pos_tag(tokens)
                    proper_nouns = [word for word, pos in tagged if pos == 'NNP']
                    score += len(proper_nouns) * 2.5 
                except Exception as e:
                    pass
                
                # C. Position Bias
                if i == 0:
                    score *= 1.5 
                    
                sentence_scores.append(score)
                
            return list(zip(sentences, sentence_scores))
        except Exception as e:
            print(f"[ERROR-MATH-BRAIN] Failed to score chunk: {e}")
            traceback.print_exc()
            try:
                # Fallback: Just return sentences with score 1
                return [(s, 1) for s in sent_tokenize(chunk)]
            except:
                return [(chunk, 1)]

    def extract_high_resolution_skeleton(self, chunk_with_scores):
        """
        Step 3: Keep sentences that score above the average to form the 'Skeleton'.
        """
        try:
            scores = [pair[1] for pair in chunk_with_scores]
            if not scores:
                return ""
            
            mean_score = sum(scores) / len(scores)
            
            # Keep sentences scoring above 1.1x the mean
            skeleton_sentences = [s for s, score in chunk_with_scores if score > (mean_score * 1.1)]
            
            # CRITICAL FALLBACK: If strict filtering removes everything, relax constraint
            if not skeleton_sentences:
                 # Try 0.8x mean
                 skeleton_sentences = [s for s, score in chunk_with_scores if score > (mean_score * 0.8)]
            
            # If STILL empty (very rare, e.g. uniform scores), take top 3
            if not skeleton_sentences:
                 sorted_sentences = sorted(chunk_with_scores, key=lambda x: x[1], reverse=True)
                 skeleton_sentences = [pair[0] for pair in sorted_sentences[:3]]

            return " ".join(skeleton_sentences)
        except Exception as e:
             print(f"[ERROR-SKELETON] Failed to extract skeleton: {e}")
             traceback.print_exc()
             return ""

    def generate_final_report(self, fact_skeleton: str, user_preference: str, format_mode: str = "paragraph") -> str:
        """
        Step 4: Synthesize facts into a report using Local Gemma 3 via Ollama.
        This runs entirely on your RTX 4060 with NO daily limits.
        """
        try:
             # 1. Define the persona and style instructions
            base_instructions = (
                "You are a professional third-person reporter. "
                "Synthesize the following facts into a cohesive, fluid report. "
                "Do not use first-person ('I', 'me') or meta-commentary ('The text says')."
            )

            if format_mode == "bullet points":
                base_instructions = (
                    "You are a professional analyst. "
                    "Synthesize the following facts into a structured list of bullet points. "
                    "Use clear, concise bullet points for the entire summary. "
                    "Do not use first-person ('I', 'me')."
                )

            directives = {
                "short": "Provide a high-level executive summary of the core message.",
                "medium": "Provide a balanced narrative summary of major events and themes.",
                "long": "Provide an exhaustive, detailed report preserving all nuances."
            }
            
            selected_directive = directives.get(user_preference, "balanced report")

            # 2. Construct the single-turn prompt
            full_prompt = f"{base_instructions}\n\nTask: {selected_directive}\n\nFacts: {fact_skeleton}"

            print(f"[OLLAMA] Sending {len(full_prompt)} chars to Gemma 3...")

            # 3. Call the Local Model
            response = ollama.chat(
                model='gemma3:12b',
                messages=[
                    {'role': 'user', 'content': full_prompt}
                ],
                options={
                    'temperature': 0.7,
                    'num_ctx': 32768
                }
            )
            
            return response['message']['content']

        except Exception as e:
            print(f"[OLLAMA-ERROR] {e}")
            traceback.print_exc()
            return f"[ERROR] Local Synthesis Failed: {e}\n\nBackup Skeleton:\n{fact_skeleton}"

    def get_text_stats(self, text: str) -> dict:
        """Helper to calculate text statistics."""
        if not text:
            return {"words": 0, "sentences": 0, "chars": 0}
        
        try:
            sentences = sent_tokenize(text)
            # Fix for unpunctuated text (YouTube Transcripts)
            if len(sentences) < (len(text.split()) // 20) and len(text) > 100:
                 # Fallback: Assume ~20 words per sentence
                 sentences = ["placeholder"] * (len(text.split()) // 20)
        except:
            sentences = text.split('.') 
            
        return {
            "words": len(text.split()),
            "sentences": max(1, len(sentences)), # Ensure at least 1
            "chars": len(text)
        }

    def extract_text_from_file(self, file_path: str, content_type: str) -> str:
        """
        Stage 1.1: Text Extraction (PyMuPDF)
        """
        try:
            if content_type == "application/pdf" or file_path.endswith(".pdf"):
                print(f"[PDF-EXTRACT] Extracting text from {file_path} using PyMuPDF (fitz)...")
                text = ""
                with fitz.open(file_path) as doc:
                    for page in doc:
                        text += page.get_text()
                return text
            elif content_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document" or file_path.endswith(".docx"):
                 return docx2txt.process(file_path)
            else:
                return ""
        except Exception as e:
            print(f"[ERROR] Text Extraction Failed: {e}")
            return ""

    def summarize(self, text: str, preference: str = "medium", format_mode: str = "paragraph") -> dict:
        """
        Pipeline Entry Point.
        Stages 1 -> 2 -> 3 -> 4
        """
        if not text: return {"summary_text": ""}

        print(f"\n[UAMSA-PIPELINE] Starting Hybrid Pipeline...")
        
        try:
            # Stage 1: Micro-Chunking
            chunks = self.get_micro_chunks(text)
            
            # Stage 2 & 3: Math Scoring & Skeleton Extraction
            skeleton_parts = []
            print(f"[MATH-BRAIN] Scoring {len(chunks)} chunks and extracting Fact Skeleton...")
            
            for i, chunk in enumerate(chunks):
                # Step 2
                scored_sentences = self.score_sentences(chunk)
                # Step 3
                skeleton_chunk = self.extract_high_resolution_skeleton(scored_sentences)
                if skeleton_chunk:
                    skeleton_parts.append(skeleton_chunk)
            
            final_fact_skeleton = " ".join(skeleton_parts)
            print(f"[DEBUG-INTERNAL] Chunks: {len(chunks)}")
            print(f"[DEBUG-INTERNAL] Skeleton Parts: {len(skeleton_parts)}")
            print(f"[DEBUG-INTERNAL] Skeleton Length: {len(final_fact_skeleton)} chars")
            
            if not final_fact_skeleton.strip():
                 print("[CRITICAL] Skeleton is EMPTY! Check Scoring Logic or NLTK.")
                 return {"summary_text": "Error: Could not extract facts from text. (Empty Skeleton)"}

            print(f"[SKELETON-READY] Length: {len(final_fact_skeleton.split())} words.")
            
            # Stage 4: API Synthesis
            final_summary = self.generate_final_report(final_fact_skeleton, preference, format_mode)
            
            # Calculate Stats
            orig_stats = self.get_text_stats(text)
            summ_stats = self.get_text_stats(final_summary)

            print(f"[SUCCESS] Pipeline Complete.")

            return {
                "summary_text": final_summary,
                "stats": {
                    "original": orig_stats,
                    "summary": summ_stats
                }
            }
        except Exception as e:
            print(f"[CRITICAL-PIPELINE-FAILURE] {e}")
            traceback.print_exc()
            return {"summary_text": f"Critical Error in Pipeline: {e}. Check backend logs."}

# Initialize Global Instance
uamsa_algorithm = UAMSASummarizer()

def summarize_text(text: str, length: str = "medium", format_mode: str = "paragraph") -> dict:
    return uamsa_algorithm.summarize(text, length, format_mode)
    
def summarize_text_cloud(text: str, length: str = "medium", format_mode: str = "paragraph", images: list = None, metadata: dict = {}) -> dict:
    """Wrapper for Cloud-Based Video Summarization"""
    summary = uamsa_algorithm.summarize_cloud(text, length, format_mode, images, metadata)
    
    # Generate Stats for consistency
    orig_stats = uamsa_algorithm.get_text_stats(text)
    summ_stats = uamsa_algorithm.get_text_stats(summary)
    
    return {
        "summary_text": summary,
        "stats": {
            "original": orig_stats,
            "summary": summ_stats
        }
    }

def generate_video_highlights(transcript_data: list, images: list = None, metadata: dict = {}) -> list:
    """Wrapper for Video Highlights Generation"""
    return uamsa_algorithm.generate_highlights_cloud(transcript_data, images, metadata)
    
def extract_and_summarize(file_path: str, content_type: str, length: str, format_mode: str) -> dict:
    # 1. Extract
    raw_text = uamsa_algorithm.extract_text_from_file(file_path, content_type)
    if not raw_text:
        return {"summary_text": "Failed to extract text from file."}
        
    # 2. Summarize
    return uamsa_algorithm.summarize(raw_text, length, format_mode)

def extract_key_quotes_local(transcript_text: str, metadata: dict = {}) -> list:
    """Wrapper for Local Highlight Extraction"""
    return uamsa_algorithm.extract_key_quotes_local(transcript_text, metadata)

def summarize_visual_fallback(images: list = None, metadata: dict = {}, length: str = "medium", format_mode: str = "paragraph") -> dict:
    """Wrapper for Visual-Only Fallback Summary"""
    summary = uamsa_algorithm.summarize_visual_cloud(images, metadata, length, format_mode)
    
    # Generate Stats (Visual Only stats are estimated or flagged)
    return {
        "summary_text": summary,
        "stats": {
            "original": {
                "words": 0,
                "sentences": 0,
                "chars": 0,
                "note": "Visual Analysis Only (No Transcript)"
            },
            "summary": uamsa_algorithm.get_text_stats(summary)
        }
    }
