# Smart AI Video Summarizer - User Guide

## 🌟 Overview

The **Smart AI Video Summarizer** is a powerful full-stack web application designed to generate intelligent summaries from various media sources using advanced AI.

### Core Features

- **Text Summarization**: Paste long articles or documents and get concise AI-generated summaries.
- **Video Summarization (Active)**: Paste YouTube links to get transcripts, key highlights, and video summaries.
- **PDF Summarization (Active)**: Upload PDF documents to extract and summarize text.

---

## 🏗️ Architecture

The application runs as two separate servers that talk to each other:

1.  **Frontend (The UI)**

    - **Tech**: React.js, Vite, Tailwind CSS.
    - **Port**: `http://localhost:3000`
    - **Responsibility**: Displays the interface, handles user inputs (text, files), and shows results.

2.  **Backend (The Brain)**
    - **Tech**: Python, FastAPI, HuggingFace Transformers, PyTorch.
    - **Port**: `http://localhost:8000`
    * **Responsibility**: Receives data from the frontend, runs heavy AI models, and sends back the intelligence.

---

## 🔬 Architecture & Algorithms (Tech Stack)

### 1. Algorithms & AI Models

- **The Brain (UAMSA)**: We implemented a **Custom User-Aware Multimodal Summarization Algorithm (UAMSA)**.
  - This is the _logic layer_ that sits above the AI models.
  - It intelligently orchestrates between **Local** and **Cloud** processing based on complexity.
- **The Engine (Gemma)**:
  - **Cloud**: Uses **Google Gemma 3 27B IT** for heavy multimodal tasks (Video + Text).
  - **Local**: Uses **Gemma 3 12B** (via Ollama) for fast, private text summarization and quote extraction.
  - _Why?_ Gemma offers state-of-the-art reasoning with manageable compute requirements.

* **Video Transcription (Active)**: Uses **YouTube Transcript API** for instant text retrieval, with visual fallback.
* **Video Processing (Active)**: **OpenCV** (streaming) and **FFmpeg** for identifying visual scenes and generating highlight reels.

### 2. Backend Tech Stack (Python)

- **FastAPI**: A modern, high-performance web framework for building APIs. It handles the requests between Frontend and AI.
- **HuggingFace Transformers**: The core library that runs the AI models.
- **PyTorch**: The deep learning engine powering the Transformers.
- **Uvicorn**: An ASGI web server that runs the FastAPI application.

### 3. Frontend Tech Stack (JavaScript)

- **React.js**: The library for building the user interface.
- **Vite**: The build tool (super fast, replaces Webpack).
- **Tailwind CSS**: For styling (handling the dark mode, gradients, and layout).

---

## 🚀 How to Run (Step-by-Step)

To use the application, you need **two terminal windows** open (one for the frontend, one for the backend).

### 1️⃣ Start the Frontend

1.  Open a terminal in the `smart_video_summarizer_frontend` folder.
2.  Run the following command:
    ```powershell
    npm run dev
    ```
3.  You will see: `Local: http://localhost:3000/`.
4.  Open this URL in your browser.

### 2️⃣ Start the Backend (GPU Accelerated)

1.  Open a **new** terminal in the `smart_video_summarizer_backend` folder.

2.  Run the **One-Click GPU Script**:

    ```text
    .\run_backend_gpu.bat
    ```

    _(Or just double-click `run_backend_gpu.bat` inside the folder)_

3.  You will see:
    - `CUDA Available: YES` (Confirming RTX 4060 usage)
    - `Uvicorn running on http://0.0.0.0:8000`
4.  This server works in the background using your GPU for blazing fast AI processing.

### 3️⃣ Use the App

- Go to `http://localhost:3000`.
- Select **Text** mode.
- Paste your text.
- Select a length (Short/Medium/Long).
- Click **Summarize Content**.

---

## 🛠️ Troubleshooting

### "Site Can't Be Reached" / Connection Refused

- **Cause**: One of the servers isn't running.
- **Fix**: Check both terminal windows. If one has stopped or errored, restart it using the commands above.

### Backend "Module Not Found"

- **Cause**: Missing Python libraries.
- **Fix**: In the backend folder, run: `pip install -r requirements.txt`.

### AI is Slow

- **Cause**: The AI models run locally on your computer.
- **Note**: The first time you run a summary, it may download a large model file (1GB+). Subsequent runs will be faster but depend on your CPU/GPU speed.
