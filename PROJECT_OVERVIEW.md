# Smart AI Video Summarizer - Project Execution Flow

This document explains exactly how the project works, from the moment you run it to the final summary generation.

## 🏗️ Architecture Overview

The project consists of two main servers running simultaneously:

1.  **Frontend (User Interface)**
    *   **Technology**: React.js + Vite + Tailwind CSS
    *   **Address**: `http://localhost:3000`
    *   **Role**: Handles user inputs (Text, Video URLs, PDFs) and displays results.

2.  **Backend (The "Brain")**
    *   **Technology**: Python + FastAPI
    *   **Address**: `http://localhost:8000`
    *   **Role**: Runs the **UAMSA Algorithm** to process and summarize content.

---

## 🔄 Step-by-Step Execution Flow

When you click **"Summarize Content"** on the UI, here is what happens behind the scenes:

### 1️⃣ Frontend Request
*   The React App takes your input (e.g., a long paragraph) and sends a `POST` request to the backend API endpoint:
    *   `POST http://localhost:8000/summarize/text`

### 2️⃣ Backend Processing (UAMSA Algorithm)
The backend receives the text and passes it through our custom **User-Aware Multimodal Summarization Algorithm (UAMSA)**.

#### **Stage A: Extractive Processing (Filtering)**
This stage identifies the *most important* parts of the text using math, not AI.
1.  **Cleaning**: Removes special characters and noise.
2.  **Chunking**: Splits long text into smaller, manageable pieces (buckets of ~400 words).
3.  **Scoring**: mathematical formulas calculate an "Importance Score" for each chunk based on:
    *   *Keyword Frequency (TF-IDF)*
    *   *Position* (Introduction/Conclusion get higher scores)
    *   *Length*
4.  **Ranking**: Sorts chunks by score and picks the top ones (e.g., Top 30% for "Short" summary).

#### **Stage B: Abstractive Rewriting (The "Human" Touch)**
*   **Current Model**: `google/pegasus-xsum` (State-of-the-Art for rewriting).
*   The selected chunks are passed to this AI model.
*   **The AI does NOT just copy-paste.** It reads the chunk and *rewrites* it completely to be concise and natural.
    *   *Settings used*: High Creativity (Temperature 1.2), Penalty for repetition.

### 3️⃣ Response & Display
*   The backend combines the rewritten partial summaries into one final text.
*   It sends this result back to the Frontend.
*   The Frontend displays it in the "Summary Result" box.

---

## 🚀 How to Run (Fresh Start)

If you ever need to restart everything, here are the standard commands:

**Terminal 1 (Backend)**
```powershell
cd smart_video_summarizer_backend
& "C:\Users\CHARITH\AppData\Local\Programs\Python\Python314\python.exe" main.py
```
*Note: The first time you run this, it downloads the AI Model (2.2GB). This takes time.*

**Terminal 2 (Frontend)**
```powershell
cd smart_video_summarizer_frontend
npm run dev
```

Then open your browser to `http://localhost:3000`.

## 📚 AI Concepts Suggested

### What are "Tokens"?
AI models don't read words like humans do (e.g., "Apple"). They break text into **Tokens**.
*   **Token**: A piece of a word.
    *   *Example*: The word `summarization` might be split into [summar](file:///c:/Users/CHARITH/Desktop/major%20project/Smart%20AI%20Video%20Summarizer%20with%20Text%20and%20Video%20Highlights/smart_video_summarizer_backend/services/summarization.py#149-175) + `iza` + `tion`.
    *   Roughly, **1000 tokens ≈ 750 words**.

### What does "Token by Token" mean?
When the AI writes a summary, it doesn't splash the whole text instantly. It "thinks" one step at a time:
1.  It looks at the input text.
2.  It predicts the **first token** (e.g., "The").
3.  It looks at "The", then predicts the **next token** (e.g., "concept").
4.  It repeats this thousands of times per second until the sentence is complete.
This is why we can control parameters like *Creativity*—we are influencing how bold the AI is when guessing the next token.

## 📦 Libraries & Technologies Used

### Backend (Python)
These libraries power the "Brain" of the application:

| Library | Purpose | Why we need it? |
| :--- | :--- | :--- |
| **FastAPI** | API Framework | Creates the web server that listens for requests (like "Summarize this"). It's the fastest Python web framework. |
| **Uvicorn** | Server Runner | Actually runs the FastAPI application. |
| **Torch (PyTorch)** | AI Engine | The "engine" that runs deep learning models. It handles the heavy math. |
| **Transformers** | AI Face | Provides easy access to Google's Pegasus model. Without this, we'd have to write the model from scratch (impossible). |
| **NLTK** | Text Toolkit | Used for "Sentence Tokenization" (splitting text into sentences intelligently, not just by periods). |
| **Scikit-learn** | Math / Statistics | Used for **TF-IDF** (Term Frequency-Inverse Document Frequency) to calculate keyword importance in Stage 1. |
| **Numpy** | Number Crunching | Handles matrix operations for the scoring algorithm. |

### Frontend (JavaScript)
These libraries build the "Face" of the application:

| Library | Purpose | Why we need it? |
| :--- | :--- | :--- |
| **React** | UI Library | Builds the interactive user interface. Allows us to create components like buttons and text areas. |
| **Vite** | Build Tool | Runs the development server insanely fast. Replacing the old "Create React App". |
| **Tailwind CSS** | Styling | Makes the app look beautiful (Dark mode, glassmorphism) without writing thousands of lines of CSS files. |
| **Axios / Fetch** | Communication | Sends the "Summarize" request to our Backend and receives the answer. |

### 🛑 Historical Note: Why not T5?
You might see references to **T5-Base** in older versions of the code.
*   **We used T5 initially** for the rewriting stage.
*   **Problem**: T5 is a "General purpose" model (translation, classification, etc.). It was too "safe" and often just copied the text instead of summarising it.
*   **Solution**: We switched to **Pegasus-XSum**, which is trained *specifically* for extreme summarization. It is much more aggressive at rewriting.
