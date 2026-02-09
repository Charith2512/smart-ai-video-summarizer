@echo off
title Smart Video Summarizer Backend (GPU ENABLED)
echo ===================================================
echo   STARTING BACKEND WITH GPU ACCELERATION (RTX 4060)
echo   Environment: Python 3.11 (ai_env)
echo ===================================================
cd /d "%~dp0"
".\ai_env\Scripts\python.exe" main.py
pause
