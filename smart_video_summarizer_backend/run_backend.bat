@echo off
title Smart Video Summarizer Backend
cd /d "%~dp0"

echo Checking for virtual environment...
if exist venv\Scripts\activate.bat (
    echo Activating venv...
    call venv\Scripts\activate.bat
) else (
    echo [WARN] "venv" folder not found. Trying global Python...
)

echo Starting Backend...
python main.py
pause
