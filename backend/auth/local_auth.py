import logging
import base64
from fastapi import Header, HTTPException
from database.local_db import get_user_profile

logger = logging.getLogger("silent-voice-auth")

async def get_current_user(authorization: str = Header(None)) -> dict:
    """
    FastAPI dependency that validates the local Bearer authorization token.
    Decodes user ID and email from local session tokens without any external cloud service.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header format")
    
    token = authorization.split("Bearer ", 1)[1].strip()
    if not token:
        raise HTTPException(status_code=401, detail="Empty authorization token")
    
    # Extract UID from supported local token formats:
    # 1. local_session_<uid>
    # 2. mock_jwt_token_payload_<uid>
    # 3. plain uid or custom identifier
    if token.startswith("local_session_"):
        uid = token.replace("local_session_", "")
    elif token.startswith("mock_jwt_token_payload_"):
        uid = token.replace("mock_jwt_token_payload_", "")
    else:
        uid = token

    # Check if a user profile exists in the local database
    profile = get_user_profile(uid)
    if profile:
        return {
            "uid": uid,
            "email": profile.get("email", f"{uid}@silentvoice.local"),
            "name": profile.get("displayName", "User")
        }

    # Fallback to deriving safe user details from UID
    clean_name = uid.replace("mock_uid_", "").replace("user_", "")
    return {
        "uid": uid,
        "email": f"{clean_name}@silentvoice.local" if "@" not in clean_name else clean_name,
        "name": clean_name.capitalize() if clean_name else "User"
    }

