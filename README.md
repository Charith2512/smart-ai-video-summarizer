# Smart AI Video Summarizer with Text and Video Highlights

![Status: Active](https://img.shields.io/badge/Status-Active-success)
![Python](https://img.shields.io/badge/Backend-Python_3.11+-blue?logo=python&logoColor=white)
![React](https://img.shields.io/badge/Frontend-React_18+-61DAFB?logo=react&logoColor=black)

**Smart AI Video Summarizer** is a powerful, full-stack application that uses advanced AI (Google Gemma / Gemini) to extract meaningful insights from text documents and YouTube videos. It features automatic video highlight extraction, visual analysis, and export capabilities.

## 🚀 Features
- **Video Summarization**: Paste a YouTube link to get a structured summary and transcript.
- **Smart Highlights**: Automatically identifies key moments in a video and creates a highlight reel.
- **Text Summarization**: Process long articles or PDFs into concise summaries.
- **Hybrid AI**: Uses a combination of Cloud (Gemini) and Local (Ollama) models for privacy and performance.

---

## 💻 Hardware Requirements
Since this application runs AI models locally (via Ollama), decent hardware is recommended for the best experience.

| Component | Minimum | Recommended |
| :--- | :--- | :--- |
| **RAM** | 16 GB | 32 GB+ |
| **GPU** | NVIDIA RTX 2060 (6GB VRAM) or Apple M1 | NVIDIA RTX 3060 (12GB VRAM) or Apple M2/M3 |
| **Disk Space** | 10 GB Free | 20 GB+ (SSD) |
| **OS** | Windows 10/11, macOS, Linux | Windows 11 (WSL2) or macOS |

---

## 🛠️ Prerequisites
Before starting, ensure you have the following installed on your computer:

1.  **Git**: [Download Here](https://git-scm.com/downloads)
2.  **Python (3.12 or higher)**: [Download Here](https://www.python.org/downloads/)
    *   *Make sure to check "Add Python to PATH" during installation.*
3.  **Node.js (v18 or higher)**: [Download Here](https://nodejs.org/en)
4.  **FFmpeg** (For video processing): [Download Here](https://ffmpeg.org/download.html)
    *   *Required for video cutting and audio extraction.*

---

## 🔑 Getting Your API Key
This project requires a **Google Gemini API Key** to power its AI features.

1.  Go to **[Google AI Studio](https://aistudio.google.com/app/apikey)**.
2.  Click **Create API key**.
3.  Copy the key string (it starts with `AIza...`).
4.  You will need this key in the next step.

---

## 📦 Installation & Setup

### 1. Clone the Repository
Open your terminal (Command Prompt or PowerShell) and run:
```bash
git clone https://github.com/YOUR_USERNAME/smart-ai-video-summarizer.git
cd smart-ai-video-summarizer
```

### 2. Backend Setup (The Brain)
Open a new terminal in the `smart_video_summarizer_backend` folder.

1.  **Navigate to the backend folder**:
    ```bash
    cd smart_video_summarizer_backend
    ```

2.  **Create a Virtual Environment** (Recommended):
    ```bash
    python -m venv venv
    .\venv\Scripts\activate
    ```

3.  **Install Dependencies**:
    ```bash
    pip install -r requirements.txt
    ```

4.  **Configure API Key (.env File)**:
    - Create a new file named `.env` in the `smart_video_summarizer_backend` folder.
    - Open it with a text editor (Notepad or VS Code).
    - Add the following line (replace with your actual key):
      ```env
      GEMINI_API_KEY=AIzaSyDxxxxxxxxxxxxxxxxxxxxxxxxxxxx
      ```
    - Save the file.

### 3. Frontend Setup (The Interface)
Open a new terminal in the `smart_video_summarizer_frontend` folder.

1.  **Navigate to the frontend folder**:
    ```bash
    cd smart_video_summarizer_frontend
    ```

2.  **Install Dependencies**:
    ```bash
    npm install
    ```

---

## ▶️ Running the Application

You need two terminal windows running at the same time:

**Terminal 1: Backend**
```bash
cd smart_video_summarizer_backend
# Activate venv if not already active
.\venv\Scripts\activate
uvicorn main:app --reload
```
*You should see "Uvicorn running on http://127.0.0.1:8000"*

**Terminal 2: Frontend**
```bash
cd smart_video_summarizer_frontend
npm run dev
```
*You should see "Local: http://localhost:5173/"*

**Final Step**: Open your browser and go to `http://localhost:5173`.

---

## 📖 How to Use

1.  **For Videos**:
    - Click on the **Video** tab.
    - Paste a YouTube URL.
    - Select your summary length preference (Short/Medium/Long).
    - Click **Summarize**.
    - *The AI will fetch the transcript, analyze visual frames, and generate a summary.*

2.  **For Text/PDF**:
    - Click on the **Text** tab.
    - Paste text or upload a PDF document.
    - Click **Summarize**.

---

## 🛡️ Troubleshooting
- **"FFmpeg not found"**: Ensure FFmpeg is installed and added to your system environment variables.
- **"Module not found"**: Make sure you activated the virtual environment (`venv`) before running the backend.
- **"API Key Error"**: Check your `.env` file and ensure the variable name is exactly `GEMINI_API_KEY`.
