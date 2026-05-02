"""Configuration and global state for JezOS kernel."""

import os
import json
from datetime import datetime
from typing import List, Dict, Optional

from models import ProcessRecord

# Database
DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL:
	DATABASE_URL = DATABASE_URL.strip().strip("\"'")
DB_PATH = DATABASE_URL

# OS versioning
OS_VERSION = "1.0.0"
UPDATE_CHANNEL = "stable"

# Process management
process_table: List[ProcessRecord] = []
next_pid = 1
MAX_MEMORY = 512  # Maximum RAM in MB
MEMORY_WARNING_THRESHOLD = 0.9  # 90%

# Performance tracking
performance_history: List[Dict] = []  # Stores historical CPU/RAM snapshots
MAX_HISTORY_SIZE = 60  # Keep last 60 data points (2 minutes at 2s intervals)

# Startup process registry
startup_processes = ["System", "Kernel Services"]  # Apps that auto-start

# Session storage (in-memory for simplicity)
active_sessions = {}
session_runtime_states: Dict[str, Dict] = {}
device_runtime_states: Dict[str, Dict] = {}

# Terminal command history (in-memory)
terminal_history: List[Dict] = []


def _create_runtime_state(next_pid_seed: int = 1) -> Dict:
    return {
        "process_table": [],
        "next_pid": next_pid_seed,
        "performance_history": []
    }


def _serialize_runtime_state(state: Dict) -> Dict:
    return {
        "process_table": [
            record.model_dump() if isinstance(record, ProcessRecord) else dict(record)
            for record in state.get("process_table", [])
        ],
        "next_pid": int(state.get("next_pid", 1)),
        "performance_history": list(state.get("performance_history", []))
    }


def _deserialize_runtime_state(payload: Dict, next_pid_seed: int = 1) -> Dict:
    return {
        "process_table": [
            record if isinstance(record, ProcessRecord) else ProcessRecord.model_validate(record)
            for record in payload.get("process_table", [])
        ],
        "next_pid": int(payload.get("next_pid", next_pid_seed)),
        "performance_history": list(payload.get("performance_history", []))
    }


def _load_persisted_runtime_state(runtime_key: str) -> Optional[Dict]:
    try:
        from database import get_db_connection

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "SELECT process_table, next_pid, performance_history FROM runtime_state WHERE runtime_key = ?",
            (runtime_key,)
        )
        row = cursor.fetchone()
        conn.close()
        if row is None:
            return None

        return _deserialize_runtime_state(
            {
                "process_table": json.loads(row["process_table"]) if isinstance(row.get("process_table"), str) else (row.get("process_table") or []),
                "next_pid": row.get("next_pid", next_pid),
                "performance_history": json.loads(row["performance_history"]) if isinstance(row.get("performance_history"), str) else (row.get("performance_history") or [])
            },
            next_pid_seed=next_pid
        )
    except Exception:
        return None


def _persist_runtime_state(runtime_key: str, state: Dict) -> None:
    try:
        from database import get_db_connection

        conn = get_db_connection()
        cursor = conn.cursor()
        serialized = _serialize_runtime_state(state)
        cursor.execute(
            """
            INSERT INTO runtime_state (runtime_key, process_table, next_pid, performance_history, updated_at)
            VALUES (?, ?::jsonb, ?, ?::jsonb, ?)
            ON CONFLICT (runtime_key)
            DO UPDATE SET
                process_table = EXCLUDED.process_table,
                next_pid = EXCLUDED.next_pid,
                performance_history = EXCLUDED.performance_history,
                updated_at = EXCLUDED.updated_at
            """,
            (
                runtime_key,
                json.dumps(serialized["process_table"]),
                serialized["next_pid"],
                json.dumps(serialized["performance_history"]),
                datetime.utcnow().isoformat()
            )
        )
        conn.commit()
        conn.close()
    except Exception:
        return


def _delete_persisted_runtime_state(runtime_key: str) -> None:
    try:
        from database import get_db_connection

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM runtime_state WHERE runtime_key = ?", (runtime_key,))
        conn.commit()
        conn.close()
    except Exception:
        return


def _resolve_runtime_key(session_token: Optional[str] = None, device_id: Optional[str] = None) -> Optional[str]:
    """Resolve the preferred runtime isolation key."""
    if device_id:
        return f"device:{device_id}"
    if session_token and session_token in active_sessions:
        return f"session:{session_token}"
    return None


def get_runtime_state(session_token: Optional[str] = None, device_id: Optional[str] = None) -> Dict:
    """Return the mutable runtime state for the current device/session."""
    runtime_key = _resolve_runtime_key(session_token=session_token, device_id=device_id)

    if runtime_key:
        runtime_store = device_runtime_states if runtime_key.startswith("device:") else session_runtime_states
        if runtime_key not in runtime_store:
            persisted = _load_persisted_runtime_state(runtime_key)
            runtime_store[runtime_key] = persisted if persisted is not None else _create_runtime_state(next_pid)
        return runtime_store[runtime_key]

    # Fallback to shared runtime only when no device/session identity exists.
    return {
        "process_table": process_table,
        "next_pid": next_pid,
        "performance_history": performance_history
    }


def commit_runtime_state(state: Dict, session_token: Optional[str] = None, device_id: Optional[str] = None) -> None:
    """Persist runtime state updates back into the appropriate store."""
    global process_table, next_pid, performance_history

    runtime_key = _resolve_runtime_key(session_token=session_token, device_id=device_id)

    if runtime_key:
        runtime_store = device_runtime_states if runtime_key.startswith("device:") else session_runtime_states
        runtime_store[runtime_key] = _deserialize_runtime_state(_serialize_runtime_state(state))
        _persist_runtime_state(runtime_key, runtime_store[runtime_key])
        return

    process_table = list(state.get("process_table", []))
    next_pid = int(state.get("next_pid", 1))
    performance_history = list(state.get("performance_history", []))


def reset_runtime_state(session_token: Optional[str] = None, device_id: Optional[str] = None) -> Dict:
    """Reset runtime state for the current device/session and clear persisted state."""
    global process_table, next_pid, performance_history

    runtime_key = _resolve_runtime_key(session_token=session_token, device_id=device_id)
    fresh_state = _create_runtime_state(next_pid_seed=1)

    if runtime_key:
        runtime_store = device_runtime_states if runtime_key.startswith("device:") else session_runtime_states
        runtime_store[runtime_key] = fresh_state
        _delete_persisted_runtime_state(runtime_key)
        return runtime_store[runtime_key]

    process_table = []
    next_pid = 1
    performance_history = []
    return {
        "process_table": process_table,
        "next_pid": next_pid,
        "performance_history": performance_history
    }
