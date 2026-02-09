# Smart AI Video Summarizer with Text and Video Highlights

## Project Overview
This project is an advanced AI-powered tool that summarizes content from Text and YouTube Videos. It goes beyond simple text generation by offering:
- **Video Highlights**: Automatically extracts key moments from videos.
- **Visual Analysis**: Uses Multimodal AI to understand video frames even without transcripts.
- **Smart Export**: Generates PDF reports or compiles video highlight reels.

## Structure
- **[Backend](smart_video_summarizer_backend/)**: FastAPI server handling AI processing, database, and file management.
- **[Frontend](smart_video_summarizer_frontend/)**: React + Vite application providing the user interface.

## Quick Start
1. **Start Backend**:
   ```bash
   cd smart_video_summarizer_backend
   pip install -r requirements.txt
   uvicorn main:app --reload
   ```

2. **Start Frontend**:
   ```bash
   cd smart_video_summarizer_frontend
   npm install
   npm run dev
   ```

3. **Open Browser**:
   Navigate to `http://localhost:5173`.

## Requirements
- Python 3.10+
- Node.js v18+
- FFmpeg (for video features)
- Google Gemini API Key (recommended for best results)
