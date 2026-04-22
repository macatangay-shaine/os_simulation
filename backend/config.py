"""Configuration and global state for JezOS kernel."""

import os
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
runtime_states: Dict[str, Dict] = {}

# Terminal command history (in-memory)
terminal_history: List[Dict] = []


def _create_runtime_state(next_pid_seed: int = 1) -> Dict:
    return {
        "process_table": [],
        "next_pid": next_pid_seed,
        "performance_history": []
    }


def resolve_runtime_key(session_token: Optional[str] = None, device_id: Optional[str] = None) -> Optional[str]:
    """Build the preferred key for isolating runtime simulation state."""
    if device_id:
        return f"device:{device_id}"
    if session_token and session_token in active_sessions:
        return f"session:{session_token}"
    return None


def get_runtime_state(session_token: Optional[str] = None, device_id: Optional[str] = None) -> Dict:
    """Return the mutable runtime state for the current device/session."""
    runtime_key = resolve_runtime_key(session_token=session_token, device_id=device_id)
    if runtime_key:
        if runtime_key not in runtime_states:
            runtime_states[runtime_key] = _create_runtime_state(next_pid)
        return runtime_states[runtime_key]

    return {
        "process_table": process_table,
        "next_pid": next_pid,
        "performance_history": performance_history
    }


def commit_runtime_state(state: Dict, session_token: Optional[str] = None, device_id: Optional[str] = None) -> None:
    """Persist runtime state updates back into the appropriate store."""
    global process_table, next_pid, performance_history

    runtime_key = resolve_runtime_key(session_token=session_token, device_id=device_id)
    normalized_state = {
      "process_table": list(state.get("process_table", [])),
      "next_pid": int(state.get("next_pid", 1)),
      "performance_history": list(state.get("performance_history", []))
    }

    if runtime_key:
        runtime_states[runtime_key] = normalized_state
        return

    process_table = normalized_state["process_table"]
    next_pid = normalized_state["next_pid"]
    performance_history = normalized_state["performance_history"]
