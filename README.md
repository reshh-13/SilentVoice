# silent voice (SignSpeak-AI)

A real-time Sign Language Learning and Translation Platform that uses computer vision and deep learning models to translate signs into text and spoken audio.

This workspace represents **Phase 1: Project Foundation & Design System**.

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

## Design & Color System

Designed with a premium, clean aesthetic (inspired by Notion & Apple).

- **Background**: `#F8F5F2` (Soft spacious sand)
- **Primary Accent**: `#B08968` (Warm desert clay)
- **Secondary Accent**: `#7F5539` (Deep chocolate brown)
- **Text & Foreground**: `#2D2A26` (Off-black charcoal)
- **Success Indicators**: `#6D9773` (Calm sage green)
- **Error Indicators**: `#B56576` (Soft muted rose)

## Reusable UI Components

The foundation includes custom, highly polished UI primitives:
- **Button**: Custom brand action button.
- **Card**: Translucent glassmorphic container (`glass-card`).
- **Input**: Tailwind inputs.
- **Search Bar**: Centered header search input.
- **Modal & Dialog**: Animated overlays.
- **Badge**: Status indicators matching Success and Error colors.
- **Progress Bar**: Animated spring loaders.
- **Skeleton Loader & Loading Spinner**: Pulsing loading states.
- **Toast**: Floating alert updates.
- **Section Header**: Structured text layouts.

## Getting Started

### Prerequisites
- Node.js 18+ (npm)
- Python 3.12+

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
