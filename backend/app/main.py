import logging
import datetime
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Header, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from app.config import settings
from websocket.connection_manager import manager
from auth.local_auth import get_current_user
from database.local_db import save_history_record, get_history_records, update_user_profile, get_user_profile, delete_history_record

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("silent-voice-backend")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Real-time Sign Language Translation and Learning Platform Backend",
    version="1.0.0",
    debug=settings.DEBUG
)

# CORS Configuration for local frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust for production settings
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request validation schemas
class HistoryItem(BaseModel):
    mode: str
    phrase: str
    translation: str
    confidence: float
    duration: float

class ProfileInit(BaseModel):
    email: str
    displayName: str
    streak: int = 1
    stats: dict = None

@app.get("/")
def read_root():
    return {
        "app": settings.PROJECT_NAME,
        "status": "healthy",
        "database": "local_sqlite",
        "message": "Welcome to the SilentVoice Backend Service"
    }

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.get("/api/user/profile")
def fetch_profile(current_user: dict = Depends(get_current_user)):
    uid = current_user.get("uid")
    profile = get_user_profile(uid)
    if not profile:
        profile = {
            "uid": uid,
            "email": current_user.get("email", ""),
            "displayName": current_user.get("name", "User"),
            "streak": 1,
            "stats": {"totalTranslations": 0, "lessonsCompleted": 0}
        }
        update_user_profile(uid, profile["email"], profile["displayName"])
    return profile

@app.post("/api/user/profile")
def sync_profile(profile: ProfileInit, current_user: dict = Depends(get_current_user)):
    uid = current_user.get("uid")
    update_user_profile(
        uid, 
        profile.email, 
        profile.displayName, 
        profile.streak, 
        profile.stats
    )
    return {"status": "success"}

@app.post("/api/user/history")
def add_history(item: HistoryItem, current_user: dict = Depends(get_current_user)):
    uid = current_user.get("uid")
    record = {
        "mode": item.mode,
        "phrase": item.phrase,
        "translation": item.translation,
        "confidence": item.confidence,
        "durationSeconds": item.duration,
        "timestamp": datetime.datetime.utcnow().isoformat()
    }
    save_history_record(uid, record)
    return {"status": "success"}

@app.get("/api/user/history")
def fetch_history(current_user: dict = Depends(get_current_user)):
    uid = current_user.get("uid")
    records = get_history_records(uid)
    return records

@app.delete("/api/user/history/{history_id}")
def delete_history(history_id: str, current_user: dict = Depends(get_current_user)):
    uid = current_user.get("uid")
    success = delete_history_record(uid, history_id)
    return {"status": "success" if success else "failed"}

@app.websocket("/ws/translate")
async def websocket_endpoint(websocket: WebSocket):
    """
    Real-time Sign Language Translation websocket.
    Expects binary frames (webcam snapshots) or control commands,
    returns translated text and prediction confidence.
    """
    await manager.connect(websocket)
    logger.info("New WebSocket client connected")
    try:
        while True:
            # Receive data (could be text commands or raw image bytes)
            data = await websocket.receive_json()
            
            # Placeholder logic for AI frame translation
            action = data.get("action")
            
            if action == "ping":
                await manager.send_json({"status": "pong"}, websocket)
            elif action == "frame":
                # Raw base64 video frame received
                # (In future phases: process with OpenCV, MediaPipe, & TensorFlow model)
                frame_data = data.get("data")
                
                # Mock result for translation
                response = {
                    "status": "success",
                    "prediction": "HELLO",  # Mock sign translation
                    "confidence": 0.95,
                    "landmarks_detected": True
                }
                await manager.send_json(response, websocket)
            else:
                await manager.send_json({"error": f"Unknown action: {action}"}, websocket)
                
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        logger.info("WebSocket client disconnected")
    except Exception as e:
        manager.disconnect(websocket)
        logger.error(f"WebSocket error: {e}")
