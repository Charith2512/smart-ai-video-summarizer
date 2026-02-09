# Smart AI Video Summarizer - Backend

## Overview
This is the backend service for the Smart AI Video Summarizer. It is built with **FastAPI** and handles:
- Text Summarization (using Local Ollama or Cloud Gemini)
- Video Summarization (YouTube Transcripts & Visual Analysis)
- Video Highlighting and Exporting
- History Management (SQLite)

## Setup

### 1. Prerequisites
- Python 3.10+
- [Ollama](https://ollama.com/) installed and running (for local mode).
- [FFmpeg](https://ffmpeg.org/) installed and added to system PATH (for video processing).

### 2. Installation
```bash
pip install -r requirements.txt
```

### 3. Environment Variables
Create a `.env` file in this directory:
```
GEMINI_API_KEY=your_gemini_api_key_here
```
*(Optional) If you don't provide a key, some cloud features will utilize free tier or fallback to local models where possible.*

### 4. Running the Server
```bash
uvicorn main:app --reload
```
The API will be available at `http://localhost:8000`.
Documentation is available at `http://localhost:8000/docs`.

### 5. Directory Structure
- `main.py`: Entry point for the FastAPI application.
- `services/`: Core logic for summarization, video processing, and exporting.
- `scripts/`: Debug and maintenance scripts.
- `uploads/`: Temporary storage for file uploads.
- `downloads/`: Temporary storage for video exports.
