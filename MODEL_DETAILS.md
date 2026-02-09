# Current Model Specification: Smart AI Summarizer (Hybrid Architecture)

This document details the exact configuration, code, and parameters of the currently running AI model.

## 1. The Model Architecture: Hybrid (Cloud + Local)
The system uses a **Hybrid Intelligence** approach to balance privacy, speed, and quality.

### Cloud Engine (Complex Reasoning & Multimodal)
*   **Provider**: Google Gemini API
*   **Model**: `gemma-3-27b-it` (Instruction Tuned)
*   **Role**: Handling large video contexts, multimodal analysis (Frames + Text), and final high-level synthesis.
*   **Capabilities**: 128k context window, visual understanding.

### Local Engine (Privacy & Speed)
*   **Provider**: Ollama (Local Inference)
*   **Model**: `gemma3:12b`
*   **Role**: Text-only processing, privacy-sensitive summarization, and extracting "Key Quotes" verbatim.
*   **Hardware**: optimized for RTX 4060 execution.

## 2. The Algorithm: "UAMSA Hybrid Pipeline"
**User-Aware Multimodal Summarization Algorithm**

To handle complex media, we use a 4-Stage Pipeline:
1.  **Micro-Chunking**: Text is split into small, overlapping chunks (600 tokens) to preserve context.
2.  **Mathematical Scoring**: Each sentence is scored based on Keyword Density and Proper Noun weight.
3.  **Skeleton Extraction**: We extract a "Fact Skeleton" (top 15% important sentences) locally.
4.  **Generative Synthesis**: The Fact Skeleton is sent to the AI Model (Local or Cloud) to write a cohesive, human-like report.

## 3. The Code & Parameters
Here is the core configuration from [summarization.py](file:///c:/Users/CHARITH/Desktop/major%20project/Smart%20AI%20Video%20Summarizer%20with%20Text%20and%20Video%20Highlights/smart_video_summarizer_backend/services/summarization.py):

```python
# Cloud Initialization
model = genai.GenerativeModel('gemma-3-27b-it')

# Local Initialization
response = ollama.chat(
    model='gemma3:12b',
    messages=[{'role': 'user', 'content': prompt}],
    options={
        'temperature': 0.7,   # Creativity Balance
        'num_ctx': 32768      # Extended Local Context
    }
)
```

## 4. Current Capabilities
*   **Multimodal**: Can see video frames if transcripts are missing.
*   **Structure**: Supports Bullet Points, Paragraphs, and Structured JSON Highlights.
*   **Optimization**: Fallback logic ensures service continuity even if Cloud API is busy (uses Local Gemma).
