import os
import sqlite3
import json
import uuid
import datetime
import logging
from app.config import settings

logger = logging.getLogger("silent-voice-database")

DB_PATH = getattr(settings, "SQLITE_DB_PATH", os.path.join(os.path.dirname(__file__), "..", "silentvoice.db"))

def get_connection():
    db_dir = os.path.dirname(os.path.abspath(DB_PATH))
    if db_dir:
        os.makedirs(db_dir, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    try:
        with conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    uid TEXT PRIMARY KEY,
                    email TEXT,
                    displayName TEXT,
                    streak INTEGER DEFAULT 1,
                    stats TEXT,
                    created_at TEXT,
                    updated_at TEXT
                )
            """)
            conn.execute("""
                CREATE TABLE IF NOT EXISTS history (
                    id TEXT PRIMARY KEY,
                    uid TEXT,
                    mode TEXT,
                    phrase TEXT,
                    translation TEXT,
                    confidence REAL,
                    durationSeconds REAL,
                    timestamp TEXT
                )
            """)
            conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_history_uid_timestamp ON history (uid, timestamp DESC)
            """)
    finally:
        conn.close()

# Auto-initialize on import
init_db()

def save_history_record(uid: str, record: dict) -> bool:
    """
    Saves a translation history record locally in SQLite under the user's history table.
    """
    record_id = record.get("id") or str(uuid.uuid4())
    record["id"] = record_id
    conn = get_connection()
    try:
        with conn:
            conn.execute(
                """
                INSERT INTO history (id, uid, mode, phrase, translation, confidence, durationSeconds, timestamp)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    record_id,
                    uid,
                    record.get("mode", "translate"),
                    record.get("phrase", ""),
                    record.get("translation", ""),
                    float(record.get("confidence", 0.0)),
                    float(record.get("durationSeconds", 0.0)),
                    record.get("timestamp") or datetime.datetime.utcnow().isoformat()
                )
            )
        logger.info(f"History record {record_id} saved locally for user {uid}")
        return True
    except Exception as e:
        logger.error(f"Error saving history record to local SQLite: {e}")
        return False
    finally:
        conn.close()

def get_history_records(uid: str) -> list:
    """
    Retrieves all history records for a specific user, sorted by timestamp descending.
    """
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT id, mode, phrase, translation, confidence, durationSeconds, timestamp
            FROM history
            WHERE uid = ?
            ORDER BY timestamp DESC
            """,
            (uid,)
        )
        rows = cursor.fetchall()
        return [
            {
                "id": row["id"],
                "mode": row["mode"],
                "phrase": row["phrase"],
                "translation": row["translation"],
                "confidence": row["confidence"],
                "durationSeconds": row["durationSeconds"],
                "timestamp": row["timestamp"]
            }
            for row in rows
        ]
    except Exception as e:
        logger.error(f"Error reading history records from local SQLite: {e}")
        return []
    finally:
        conn.close()

def delete_history_record(uid: str, history_id: str) -> bool:
    """
    Deletes a specific history record for a user.
    """
    conn = get_connection()
    try:
        with conn:
            conn.execute(
                "DELETE FROM history WHERE uid = ? AND id = ?",
                (uid, history_id)
            )
        logger.info(f"History record {history_id} deleted for user {uid}")
        return True
    except Exception as e:
        logger.error(f"Error deleting history record from local SQLite: {e}")
        return False
    finally:
        conn.close()

def update_user_profile(uid: str, email: str, display_name: str, streak: int = 1, stats: dict = None) -> bool:
    """
    Updates or initializes the user profile in local SQLite.
    """
    conn = get_connection()
    now_iso = datetime.datetime.utcnow().isoformat()
    default_stats = {"totalTranslations": 0, "lessonsCompleted": 0}
    stats_to_save = stats if stats is not None else default_stats
    stats_json = json.dumps(stats_to_save)
    try:
        with conn:
            conn.execute(
                """
                INSERT INTO users (uid, email, displayName, streak, stats, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(uid) DO UPDATE SET
                    email = excluded.email,
                    displayName = excluded.displayName,
                    streak = excluded.streak,
                    stats = excluded.stats,
                    updated_at = excluded.updated_at
                """,
                (uid, email, display_name, streak, stats_json, now_iso, now_iso)
            )
        logger.info(f"User profile {uid} updated locally in SQLite")
        return True
    except Exception as e:
        logger.error(f"Error updating user profile in local SQLite: {e}")
        return False
    finally:
        conn.close()

def get_user_profile(uid: str):
    """
    Gets the profile and stats of a user from local SQLite.
    """
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT uid, email, displayName, streak, stats FROM users WHERE uid = ?",
            (uid,)
        )
        row = cursor.fetchone()
        if not row:
            return None
        stats = {"totalTranslations": 0, "lessonsCompleted": 0}
        if row["stats"]:
            try:
                stats = json.loads(row["stats"])
            except Exception:
                pass
        return {
            "uid": row["uid"],
            "email": row["email"],
            "displayName": row["displayName"],
            "streak": row["streak"],
            "stats": stats
        }
    except Exception as e:
        logger.error(f"Error fetching user profile from local SQLite: {e}")
        return None
    finally:
        conn.close()

