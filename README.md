# SilentVoice – Sign Language Translator
*Breaking communication barriers, one sign at a time.*

SilentVoice is an AI-powered sign language translation platform designed to bridge the communication gap between sign language users and non-signers. It uses computer vision and machine learning to recognize American Sign Language (ASL) fingerspelling gestures and convert them into text in real time.

## Features

- **Real-Time Hand Tracking:** Detects hand landmarks using MediaPipe.
- **ASL Recognition:** Recognizes fingerspelling gestures (A–Z) using a trained machine learning model.
- **Live Translation:** Converts recognized signs into text.
- **Text-to-Speech:** Converts translated text into speech.
- **Translation History:** Keeps track of previous translations.
- **Interactive Guide:** Provides visual references for learning ASL signs.
- **Responsive UI:** Clean, modern interface with dark mode support.

## Tech Stack

- **Frontend:** Next.js 15, React, TypeScript, Tailwind CSS
- **Computer Vision:** MediaPipe Tasks Vision
- **Machine Learning:** Python, TensorFlow / MLP
- **Backend:** FastAPI
- **Authentication & Database:** Firebase (planned)

## How It Works

1. The webcam captures hand gestures.
2. MediaPipe detects 21 hand landmarks.
3. Landmark coordinates are preprocessed and normalized.
4. The trained ML model predicts the corresponding ASL letter.
5. Stable predictions are converted into text.

## Project Status

The frontend, real-time hand tracking, and ASL fingerspelling recognition pipeline have been implemented. Further improvements are planned for recognition accuracy, dynamic gestures, and additional language support.

## Future Enhancements

- Support for complete ASL words and sentences.
- Improved recognition of dynamic gestures.
- Multilingual translation.
- Enhanced model accuracy and performance.


**Phase 1: Project Foundation & Design System**.

## Project Architecture

```text
SignSpeak-AI/ (silentvoice)
├── frontend/             # Next.js client application
│   ├── app/              # App Router pages and layouts
│   ├── components/       # Custom and shadcn/ui components
│   │   ├── ui/           # Atomic UI elements
│   │   ├── layout/       # App layout containers (Navbar)
│   │   └── common/       # Specialized reusable patterns
│   └── lib/              # Styling utils
└── backend/              # FastAPI Python service
    ├── app/              # App controllers and configs
    └── websocket/        # Real-time WebSocket manager
```

## Technology Stack

### Frontend
- **Framework**: Next.js 15 (App Router, TypeScript)
- **Styling**: Tailwind CSS v4 & shadcn/ui
- **Animation**: Motion (formerly Framer Motion)
- **Camera integration**: React Webcam

### Backend
- **Framework**: FastAPI (Python 3.12+)
- **Communication**: WebSockets
- **AI Models & Processing**: OpenCV, MediaPipe Hands, TensorFlow (Phase 2 implementations)
- **Database & Authentication**: Local SQLite persistence and local session authentication

### Running the Frontend
1. Navigate into the frontend folder:
   ```bash
   cd frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Start the Next.js development server:
   ```bash
   npm run dev
   ```
4. Access [http://localhost:3000](http://localhost:3000) in your web browser.

### Running the Backend
1. Navigate into the backend folder:
   ```bash
   cd backend
   ```
2. Create and active a Python virtual environment:
   ```bash
   python -m venv venv
   # On Windows PowerShell:
   .\venv\Scripts\Activate.ps1
   ```
3. Install required Python packages:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
5. View API Swagger docs at [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).
