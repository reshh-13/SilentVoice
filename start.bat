@echo off
title Silent Voice Launcher
echo ====================================================
echo           Starting Silent Voice (SignSpeak-AI)
echo ====================================================

echo [1/2] Starting Backend (FastAPI on http://127.0.0.1:8000)...
start "Silent Voice - Backend" cmd /k "cd /d %~dp0backend && .\venv\Scripts\activate && uvicorn app.main:app --reload --port 8000"

echo [2/2] Starting Frontend (Next.js on http://localhost:3000)...
start "Silent Voice - Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ====================================================
echo  Servers are starting in separate windows!
echo  - Frontend: http://localhost:3000
echo  - Backend API: http://127.0.0.1:8000
echo  - Swagger Docs: http://127.0.0.1:8000/docs
echo ====================================================
pause
