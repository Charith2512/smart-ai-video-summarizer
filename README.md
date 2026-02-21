# Smart AI Video Summarizer with Text and Video Highlights

![Status: Active](https://img.shields.io/badge/Status-Active-success)
![Python](https://img.shields.io/badge/Backend-Python_3.11+-blue?logo=python&logoColor=white)
![React](https://img.shields.io/badge/Frontend-React_18+-61DAFB?logo=react&logoColor=black)

---

## 🎓 Academic Context
This project is developed as a part of the **Bachelor of Technology (B.Tech)** curriculum at the **Institute of Aeronautical Engineering (IARE)**. 

- **Project Title**: Smart AI Video Summarizer with Text and Video Highlights
- **Institution**: Institute of Aeronautical Engineering (IARE), Hyderabad
- **Department**: Computer Science and Engineering (Artificial Intelligence and Machine Learning)
- **Objective**: To research and implement an efficient pipeline for localized LLM inference (Gemma 3 12B) combined with cloud-based multimodal analysis for automated video content extraction.

---

## 📄 Documentation
The full technical project report, including literature survey and system methodology, is available below:
- [**Download Project Report (PDF)**](./docs/project_report.pdf)

---

**Smart AI Video Summarizer** is a powerful, full-stack application that uses advanced AI (Google Gemma / Gemini) to extract meaningful insights from text documents and YouTube videos. It features automatic video highlight extraction, visual analysis, and export capabilities.

## 🚀 Features
- **Video Summarization**: Paste a YouTube link to get a structured summary and transcript.
- **Smart Highlights**: Automatically identifies key moments in a video and creates a highlight reel.
- **Text Summarization**: Process long articles or PDFs into concise summaries.
- **Hybrid AI**: Uses a combination of Cloud (Gemini) and Local (Ollama) models for privacy and performance.

---

## 🏗️ Technical Architecture & Methodology
The project explores a **Hybrid AI Orchestration** model to balance privacy, performance, and multimodal accuracy:

```mermaid
graph TD
    A[User UI - React/Vite] --> B[API Gateway - FastAPI]
    B --> C{Orchestration Layer}
    C -->|Local| D[Ollama - Gemma 3 12B]
    C -->|Cloud| E[Gemini API - Gemma 3 27B]
    B --> F[Processing Pipeline]
    F --> G[OpenCV/FFmpeg]
    F --> H[yt-dlp]
    
    subgraph "Inference Environment"
    D
    E
    end
    
    style D fill:#ffe6f2,stroke:#ff0080,stroke-width:1px,color:#000
    style E fill:#e6fff2,stroke:#00cc66,stroke-width:1px,color:#000
```

1.  **Local Inference Layer**: Utilizes **Ollama** to serve **Gemma 3 12B** for privacy-focused text processing, summarization, and verbatim quote extraction.
2.  **Cloud Vision Layer**: Integrates **Gemma 3 27B** (via Google Gemini API) for advanced multimodal analysis, including visual frame analysis and scene understanding.
3.  **Data Processing Pipeline**:
    *   **yt-dlp**: For direct media stream extraction.
    *   **OpenCV & FFmpeg**: For intelligent frame sampling, video cutting, and highlight reel generation.
    *   **YouTube-Transcript-API**: For high-speed text retrieval with visual fallback logic.

> [!NOTE]
> **Environment Agnostic Design**: The Inference Layer is designed to be environment-agnostic, supporting local execution via Ollama or remote execution via Dockerized Inference Servers (e.g., Hugging Face ZeroGPU).

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
2.  **Python 3.11** (Recommended): [Download Here](https://www.python.org/downloads/release/python-3119/)
    *   *⚠️ **Important**: Please use Python 3.11. Newer versions (3.12+) have known compatibility issues with OpenCV video streaming.*
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

### 2. Setup Local AI (Ollama)
This project uses **Ollama** to run the privacy-focused local model (`gemma3:12b`).

1.  **Download Ollama**:
    - Go to [ollama.com](https://ollama.com) and download the installer for your OS.
    - Run the installer.

2.  **Pull the Model**:
    - Open your terminal and run:
      ```bash
      ollama run gemma3:12b
      ```
    - *This will download the model (approx. 5-7 GB). Once you see a chat prompt like `>>>`, you can type `/bye` to exit.*

3.  **Keep Ollama Running**:
    - Ensure the Ollama app is running in the background (check your system tray) whenever you use the Summarizer.

### 3. Backend Setup (The Brain)
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
    - You can copy the example file:
      ```bash
      cp .env.example .env
      ```
    - Or create a new `.env` file and add your credentials:
      ```env
      GEMINI_API_KEY=AIzaSyDxxxxxxxxxxxxxxxxxxxxxxxxxxxx
      DATABASE_URL=mysql+pymysql://root:password@localhost:3306/summarizer_db
      ```
    - *Replace `root:password` with your actual MySQL username and password.*

5.  **Database Setup (MySQL)**:
    - Install **MySQL Server**: [Download Here](https://dev.mysql.com/downloads/installer/).
    - Open your MySQL Workbench or Terminal.
    - Run this command to create the database:
      ```sql
      CREATE DATABASE summarizer_db;
      ```
    - *The backend will automatically create the tables when you run it.*

### 4. Frontend Setup (The Interface)
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

> **Tip (Windows)**: You can also just double-click `run_backend.bat` inside the backend folder to start it automatically!

**Terminal 2: Frontend**
```bash
cd smart_video_summarizer_frontend
npm run dev
```
*You should see "Local: http://localhost:3000/"*

**Final Step**: Open your browser and go to `http://localhost:3000`.

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

