
import re
import os
import cv2
import numpy as np
import yt_dlp
import uuid
from youtube_transcript_api import YouTubeTranscriptApi, TranscriptsDisabled, NoTranscriptFound
from services.summarization import summarize_text_cloud as summarize_text, extract_key_quotes_local, summarize_visual_fallback

class VideoService:

    def __init__(self):
        self.yt_api = YouTubeTranscriptApi()

    def get_stream_url(self, url: str) -> str:
        """
        Fetches the direct stream URL (googlevideo.com) using yt-dlp.
        Strategy: Use 'Android' client to bypass 403 Forbidden without needing Cookies (which are locked).
        """
        print(f"[VIDEO-SERVICE] Resolving stream URL for: {url}")
        try:
            ydl_opts = {
                'format': 'best[ext=mp4]', 
                'quiet': True,
                'no_warnings': True,
                'nocheckcertificate': True,
                'extract_flat': False,
                # BYPASS STRATEGY: Masquerade as Android App
                'extractor_args': {'youtube': {'player_client': ['android', 'web']}},
                'user_agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Mobile Safari/537.36'
            }
            
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=False)
                stream_url = info.get('url')
                if stream_url: return stream_url
                if 'formats' in info:
                     return info['formats'][-1]['url']
                return None

        except Exception as e:
            print(f"[WARN] Stream resolution failed: {e}")
            return None

    def extract_frames_from_stream(self, stream_url: str, num_frames: int = 30, check_cancel=None) -> list:
        """
        Streams frames directly from the URL via OpenCV.
        Zero disk usage.
        """
        import PIL.Image
        frames = []
        try:
            print(f"[STREAM-EXTRACT] Connecting to stream...")
            cap = cv2.VideoCapture(stream_url)
            
            if not cap.isOpened():
                print("[ERROR] Could not open video stream.")
                return []

            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            
            # If stream doesn't report length (common for some m3u8), we might need a time-based approach
            # But usually 'best[ext=mp4]' gives a seekable file pointer.
            if total_frames <= 0:
                 # Fallback: Capture first 30 frames if length unknown
                 total_frames = 3000 # Guess
                 
            interval = max(1, total_frames // num_frames)
            print(f"[STREAM-EXTRACT] Stream Open. Extracting ~{num_frames} frames...")

            for i in range(0, total_frames, interval):
                if check_cancel: check_cancel()
                cap.set(cv2.CAP_PROP_POS_FRAMES, i)
                ret, frame = cap.read()
                if ret:
                    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                    pil_img = PIL.Image.fromarray(rgb_frame)
                    frames.append(pil_img)
                    if len(frames) >= num_frames:
                        break
                else: 
                     break # EOF or Fail
            
            cap.release()
            print(f"[STREAM-EXTRACT] Captured {len(frames)} frames directly from cloud.")
            return frames
        except Exception as e:
            print(f"[ERROR] Stream frame extraction error: {e}")
            return []

    def _map_quote_to_timestamps(self, quote: str, transcript_data: list) -> dict:
        """
        Reverse-Engineers timestamps by matching the quote against the transcript chunks.
        """
        # 1. Normalize Helper
        def normalize(s):
            return re.sub(r'\W+', '', s.lower())

        target = normalize(quote)
        if not target: return None
        
        # 2. Build Global Text & Map
        full_text = ""
        chunk_map = [] 
        
        current_idx = 0
        for i, chunk in enumerate(transcript_data):
            # Handle both object (FetchedTranscriptSnippet) and dict access
            if hasattr(chunk, 'text'):
                 c_text_raw = chunk.text
                 c_start = chunk.start
                 c_dur = chunk.duration
            else:
                 c_text_raw = chunk.get('text', '')
                 c_start = chunk.get('start', 0.0)
                 c_dur = chunk.get('duration', 0.0)

            c_text = normalize(c_text_raw)
            
            # Clamp End Time: Use min(start + duration, next_start)
            c_end = c_start + c_dur
            if i + 1 < len(transcript_data):
                next_chunk = transcript_data[i+1]
                if hasattr(next_chunk, 'start'):
                    next_start = next_chunk.start
                else:
                    next_start = next_chunk.get('start', 0.0)
                
                # If overlap exists, clamp to next start
                if c_end > next_start:
                    c_end = next_start

            start_idx = current_idx
            end_idx = current_idx + len(c_text)
            
            chunk_map.append({
                "start_idx": start_idx,
                "end_idx": end_idx,
                "timestamp_start": c_start,
                "timestamp_end": c_end
            })
            
            full_text += c_text
            current_idx = end_idx
            
        # 3. Find Matches
        match_start = full_text.find(target)
        
        # Fallback: fuzzy-ish
        if match_start == -1:
            match_start = full_text.find(target[:50])
            
        if match_start == -1:
            return None 
            
        match_end = match_start + len(target)
        
        # 4. Map to Timestamps
        t_start = -1.0
        t_end = -1.0
        
        found_start = False
        
        for mapping in chunk_map:
            if not found_start and match_start >= mapping['start_idx'] and match_start < mapping['end_idx']:
                t_start = mapping['timestamp_start']
                found_start = True
            
            if found_start:
                # Calculate Proportional End Time
                # If the quote ends in the middle of this chunk, we shouldn't take the full duration.
                if mapping['end_idx'] >= match_end:
                    # Calculate how much of this chunk is actually used
                    chunk_text_len = mapping['end_idx'] - mapping['start_idx']
                    overlap_len = match_end - mapping['start_idx']
                    
                    if chunk_text_len > 0:
                        ratio = overlap_len / chunk_text_len
                        chunk_duration = mapping['timestamp_end'] - mapping['timestamp_start']
                        # Refined end time
                        t_end = mapping['timestamp_start'] + (chunk_duration * ratio)
                    else:
                        t_end = mapping['timestamp_end']
                    
                    break # Reached the end
                else:
                    t_end = mapping['timestamp_end'] # We used the whole chunk
        
        if t_start == -1.0: return None
        
        # 5. Apply Buffers
        final_start = max(0, t_start - 1.0) 
        final_end = t_end + 1.0 
        
        return {
            "text": quote,
            "start": round(final_start, 2),
            "end": round(final_end, 2),
            "duration": round(final_end - final_start, 2)
        }

    def get_metadata(self, url: str) -> dict:
        """
        Safely fetches video metadata (Title, Category, Tags, Description, Uploader).
        """
        try:
            ydl_opts = {
                'quiet': True, 'no_warnings': True, 'nocheckcertificate': True,
                # DEFAULT UA for metadata to avoid restricted formats (Android client etc)
                'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
            }
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=False)
                
                title = info.get('title')
                if not title: title = f"Video {info.get('id', 'Unknown')}"
                
                # Rich Metadata Extraction (Qualities + Bitrates)
                quality_data = {}
                if 'formats' in info:
                    for f in info['formats']:
                        if f.get('height'):
                            h_label = f"{f['height']}p"
                            # Prefer tbr (total bitrate), fallback to vbr + abr
                            bitrate = f.get('tbr') or ((f.get('vbr') or 0) + (f.get('abr') or 0))
                            
                            # Keep the highest bitrate found for this resolution
                            if h_label not in quality_data or bitrate > quality_data[h_label]:
                                quality_data[h_label] = bitrate
                
                def quality_key(q):
                    try: return int(q[:-1])
                    except: return 0
                    
                sorted_qualities = sorted(list(quality_data.keys()), key=quality_key)
                
                # Filter to standard set
                valid_resolutions = ["144p", "240p", "360p", "480p", "720p", "1080p", "1440p", "2160p"]
                filtered_qualities = [q for q in sorted_qualities if q in valid_resolutions]
                
                if not filtered_qualities: filtered_qualities = ["720p"] # Fallback

                return {
                    "title": title,
                    "category": info.get('categories', ['General'])[0] if info.get('categories') else 'General',
                    "uploader": info.get('uploader', 'Unknown Creator'),
                    "tags": info.get('tags', [])[:10],
                    "description": info.get('description', '')[:500],
                    "available_qualities": filtered_qualities,
                    "quality_bitrates": quality_data
                }
        except Exception as e:
            print(f"[WARN] Metadata fetch failed: {e}")
            return {
                "title": "YouTube Video", 
                "category": "Unknown", 
                "uploader": "Unknown", 
                "tags": [], 
                "description": ""
            }

    def extract_video_id(self, url: str) -> str:
        patterns = [
            r'(?:v=|\/)([0-9A-Za-z_-]{11}).*',
            r'(?:youtu\.be\/)([0-9A-Za-z_-]{11})',
            r'(?:embed\/)([0-9A-Za-z_-]{11})'
        ]
        for pattern in patterns:
            match = re.search(pattern, url)
            if match: return match.group(1)
        raise ValueError("Could not extract Video ID.")

    def get_transcript(self, video_id: str) -> list:
        print(f"[VIDEO-SERVICE] Fetching transcript for ID: {video_id}...")
        try:
            # Returns list of { 'text': str, 'start': float, 'duration': float }
            transcript_data = self.yt_api.fetch(video_id)
            return transcript_data 
        except (TranscriptsDisabled, NoTranscriptFound):
            print("[VIDEO-SERVICE] Transcripts Disabled/Not Found.")
            return []
        except Exception as e:
            print(f"[VIDEO-SERVICE] Transcript Error: {e}")
            raise e



    def process_video_url(self, url: str, length: str, style: str, task: str = "summary", check_cancel=None) -> dict:
        """
        Main Pipeline (Streaming Mode):
        URL -> VideoID -> Transcript -> Metadata -> Stream URL -> Frames -> Summary OR Highlights
        """
        if check_cancel: check_cancel()
        
        images = []
        try:
            video_id = self.extract_video_id(url)
            
            # 1. Transcript (Primary)
            transcript_data = self.get_transcript(video_id)
            transcript_text = ""
            transcript_present = False
            
            if transcript_data:
                transcript_text = " ".join([item.text for item in transcript_data])
                transcript_present = True
                print(f"[VIDEO-SERVICE] Transcript: {len(transcript_text)} chars.")
            else:
                print(f"[VIDEO-SERVICE] No Transcript Found. Switching to VISUAL FALLBACK MODE.")
            
            # 2. Metadata
            metadata = self.get_metadata(url)
            print(f"[VIDEO-SERVICE] Metadata: {metadata['title']} ({metadata['category']})")

            # 3. Visual Stream (Smart Token Budgeting)
            # Goal: Maximize Context within 15k Token Limit
            # Priority: Metadata + Transcript > Frames
            TOKEN_LIMIT = 15000
            TOKENS_PER_IMAGE = 260
            
            # Estimate Text Tokens (approx 4 chars/token)
            text_content = transcript_text + str(metadata)
            estimated_text_tokens = len(text_content) / 4
            
            # --- VALIDATION CHECK ---
            if estimated_text_tokens > TOKEN_LIMIT:
                print(f"[WARN] Video Long: Estimated {int(estimated_text_tokens)} text tokens. Proceeding with chunking for highlights.")

            remaining_tokens = TOKEN_LIMIT - estimated_text_tokens
            max_frames = 0
            
            # VISUAL FALLBACK: If no transcript, prioritize visual frames
            if not transcript_present:
                print("[TOKEN-BUDGET] Visual Fallback: Maximizing Frame Count (Limit 30).")
                max_frames = 30 # Limit for Gemma 3 27B is 32 images
            elif remaining_tokens > 0:
                max_frames = int(remaining_tokens // TOKENS_PER_IMAGE)
                # Cap at 30 frames max to avoid overload even if budget allows
                max_frames = min(max_frames, 30)
            
            print(f"[TOKEN-BUDGET] Text: ~{int(estimated_text_tokens)} tokens | Remaining: {int(remaining_tokens)} | Allocated Frames: {max_frames}")

            # Initialize Variables
            images = []
            result = {
                "title": metadata["title"],
                "category": metadata["category"],
                "uploader": metadata["uploader"],
                "available_qualities": metadata.get("available_qualities", ["720p"]),
                "quality_bitrates": metadata.get("quality_bitrates", {}),
                "summary_text": "",
                "highlights": [],
                "stats": {"original": {}, "summary": {}}
            }

            # 4. Handle Tasks
            # OPTIMIZATION: Handle Highlights FIRST (Text-Only) -> Skip Stream/Frames
            if task == "highlights":
                if transcript_present:
                    # 4a. Generate Highlights (Local Trace-Based)
                    print("[VIDEO-SERVICE] Generating Local Text Highlights (Trace-Based)...")
                    
                    # Use local model to get verbatim quotes
                    raw_quotes = extract_key_quotes_local(transcript_text, metadata, check_cancel=check_cancel)
                    print(f"[VIDEO-SERVICE] Extracted {len(raw_quotes)} raw quotes. Mapping timestamps...")
                    
                    # Map quotes to timestamps
                    mapped_highlights = []
                    for item in raw_quotes:
                        quote = item.get("quote", "")
                        mapped = self._map_quote_to_timestamps(quote, transcript_data)
                        if mapped:
                            mapped_highlights.append(mapped)
                        else:
                            print(f"[WARN] Could not map quote to timestamp: {quote[:50]}...")
                    
                    # SMART MERGE: Consolidate Overlapping Headers
                    mapped_highlights.sort(key=lambda x: x['start'])
                    
                    final_highlights = []
                    if mapped_highlights:
                        current_clip = mapped_highlights[0]
                        for next_clip in mapped_highlights[1:]:
                            if next_clip['start'] <= current_clip['end'] + 3.0:
                                current_clip['end'] = max(current_clip['end'], next_clip['end'])
                                current_clip['text'] += " " + next_clip['text']
                                current_clip['duration'] = current_clip['end'] - current_clip['start']
                            else:
                                final_highlights.append(current_clip)
                                current_clip = next_clip
                        final_highlights.append(current_clip)
                    
                    # Pass structured highlights to frontend
                    result["highlights"] = final_highlights
                    
                    print(f"[VIDEO-SERVICE] Finalized {len(final_highlights)} merged highlights.")

                    # Populate basic stats
                    total_duration = sum([h['duration'] for h in final_highlights])
                    formatted_duration = f"{int(total_duration // 60)}m {int(total_duration % 60)}s"
                    
                    result["stats"]["original"] = {
                        "words": len(transcript_text.split()), 
                        "sentences": transcript_text.count('.'), 
                        "chars": len(transcript_text),
                        "total_duration_formatted": formatted_duration
                    }
                else:
                    # Early Exit for No Transcript
                    print("[VIDEO-SERVICE] No transcript for highlights. Returning Visual Fallback Warning.")
                    result["highlights"] = [{
                        "warning": "NO_TRANSCRIPT",
                        "details": "Highlights require a transcript, which is not available for this video. Please try the 'Summary' mode for a visual analysis."
                    }]
                
                return result

            # 5. SUMMARY TASK (Multimodal)
            # Only fetch stream/frames if we need them for summary (or visual fallback)
            stream_url = self.get_stream_url(url)
            
            # Logic Update: Allow frames if task is summary OR if transcripts are missing (visual fallback)
            should_extract_frames = (task == "summary") or (not transcript_present)
            
            if stream_url and should_extract_frames and max_frames > 0:
                images = self.extract_frames_from_stream(stream_url, num_frames=max_frames, check_cancel=check_cancel)
            
            if task == "summary":
                # Summarize (Multimodal + Rich Context)
                if transcript_present:
                    summary_result = summarize_text(
                        transcript_text, 
                        length=length, 
                        format_mode=style,
                        images=images,
                        metadata=metadata,
                        check_cancel=check_cancel
                    )
                else:
                    # Visual Fallback
                    print("[VIDEO-SERVICE] Calling Visual Fallback Summary...")
                    summary_result = summarize_visual_fallback(
                        images=images,
                        metadata=metadata,
                        length=length,
                        format_mode=style,
                        check_cancel=check_cancel
                    )
                    
                result.update(summary_result) # Merges summary_text and stats

            return result

        except Exception as e:
            print(f"[VIDEO-SERVICE] Error: {e}")
            return {"error": str(e)}





    async def generate_merged_highlights_stream(self, url: str, highlights: list, quality: str = "720p"):
        """
        Async Generator that downloads clips and merges them, yielding progress events.
        """
        import asyncio
        import json
        
        output_dir = os.path.join(os.getcwd(), "downloads")
        os.makedirs(output_dir, exist_ok=True)
        
        session_id = str(uuid.uuid4())[:8]
        final_filename = f"reel_{session_id}.mp4"
        final_path = os.path.join(output_dir, final_filename)

        yield json.dumps({"status": "progress", "percent": 5, "message": f"Starting download for {len(highlights)} clips..."}) + "\n"

        height_map = {
            "480p": "480", "720p": "720", "1080p": "1080",
            "1440p": "1440", "2160p": "2160"
        }
        target_height = height_map.get(quality, "720")
        format_str = f"bestvideo[height<={target_height}]+bestaudio[ext=m4a]/best[height<={target_height}]"

        clip_paths = []
        
        try:
            total_clips = len(highlights)
            for idx, h in enumerate(highlights):
                start = max(0, h.get('start', 0))
                end = h.get('end', start + 5)
                duration = end - start
                
                if duration < 1: continue

                clip_name = f"clip_{session_id}_{idx}.mp4"
                clip_path = os.path.join(output_dir, clip_name)
                
                # Progress Update
                progress_percent = 10 + int((idx / total_clips) * 70) # 10% to 80% range
                yield json.dumps({
                    "status": "progress", 
                    "percent": progress_percent, 
                    "message": f"Downloading clip {idx+1}/{total_clips}..."
                }) + "\n"
                
                # Check cache for existing clip? Not really worth it for unique ranges.
                
                # Command Construction
                cmd = [
                    "yt-dlp",
                    "-f", format_str,
                    "--extractor-args", "youtube:player_client=android,web",
                    "--user-agent", "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Mobile Safari/537.36",
                    "--download-sections", f"*{start}-{end}",
                    "--force-keyframes-at-cuts",
                    "-o", clip_path,
                    url
                ]
                
                # Simplification check
                if format_str.startswith("bestvideo"): 
                     safe_format = f"best[height<={target_height}]" # simpler fallback
                     cmd[2] = safe_format # use potentially simpler format if complex fails? 
                     # Actually, keep original logic but apply the safe format if complex fails.
                     # For now, simplistic approach:
                     pass

                # Run Download using asyncio.to_thread (Sync Subprocess)
                # This avoids Windows asyncio loop issues with subprocesses
                def run_dl():
                    import subprocess
                    return subprocess.run(cmd, capture_output=True)
                
                result = await asyncio.to_thread(run_dl)
                
                if result.returncode != 0:
                     # Log error but try to continue?
                     print(f"[DOWNLOAD-ERROR] Clip {idx+1} Failed: {result.stderr.decode()}")
                     continue
                
                if os.path.exists(clip_path):
                    clip_paths.append(clip_path)
            
            # Merge Phase
            if not clip_paths:
                yield json.dumps({"status": "error", "message": "No clips downloaded successfully."}) + "\n"
                return

            yield json.dumps({"status": "progress", "percent": 85, "message": "Merging clips..."}) + "\n"
            
            list_file_path = os.path.join(output_dir, f"list_{session_id}.txt")
            with open(list_file_path, "w") as f:
                for p in clip_paths:
                    safe_path = p.replace("\\", "/")
                    f.write(f"file '{safe_path}'\n")
            
            ffmpeg_cmd = [
                "ffmpeg", "-f", "concat", "-safe", "0", "-i", list_file_path,
                "-c", "copy", "-y", final_path
            ]
            
            def run_merge():
                import subprocess
                return subprocess.run(ffmpeg_cmd, capture_output=True)

            merge_result = await asyncio.to_thread(run_merge)

            yield json.dumps({"status": "progress", "percent": 95, "message": "Finalizing..."}) + "\n"

            # Cleanup
            os.remove(list_file_path)
            for p in clip_paths:
                try: os.remove(p)
                except: pass

            yield json.dumps({
                "status": "completed", 
                "url": f"/download/{final_filename}", 
                "percent": 100,
                "message": "Done!"
            }) + "\n"

        except Exception as e:
            import traceback
            error_details = traceback.format_exc()
            print(f"[ERROR] Reel Generation Failed: {e}")
            with open("backend_debug.log", "a") as f:
                f.write(f"\n[ERROR] {e}\n{error_details}\n")
            yield json.dumps({"status": "error", "message": f"Export Error: {str(e)}"}) + "\n"


video_service = VideoService()
