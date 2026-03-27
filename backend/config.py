"""Configuration and global state for JezOS kernel."""

from typing import List, Dict
from models import ProcessRecord

# Database
DB_PATH = "virt_os.db"

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
