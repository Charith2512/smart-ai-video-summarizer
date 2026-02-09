# Smart AI Video Summarizer - Frontend

## Overview
The frontend interface for the Smart AI Video Summarizer, built with **React**, **Vite**, and **TailwindCSS**. It provides a modern, responsive UI for users to:
- Input text or YouTube URLs.
- View AI-generated summaries and highlights.
- Export summaries to PDF/DOCX.
- Create and download video highlight reels.

## Setup

### 1. Prerequisites
- Node.js (v18+)
- npm or yarn

### 2. Installation
```bash
npm install
```

### 3. Running Development Server
```bash
npm run dev
```
The application will launch at `http://localhost:5173` (default).

### 4. Build for Production
```bash
npm run build
```

## Features
- **Dynamic Input**: switch between Text and Video modes.
- **Visual Highlights**: Interactive video player synced with transcripts.
- **Export**: Download summaries or compile video clips into a single reel.
- **History**: View past summaries (stored locally via Backend).

## Configuration
The frontend expects the backend to be running at `http://localhost:8000`. If you change the backend port, update the API calls in `src/utils` or component files accordingly.
