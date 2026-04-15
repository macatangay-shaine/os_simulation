"""Database utilities and initialization functions."""

import sqlite3
import hashlib
from datetime import datetime
from pathlib import PurePosixPath
from config import DB_PATH, OS_VERSION, UPDATE_CHANNEL


def get_db_connection() -> sqlite3.Connection:
    """Create and return a database connection with Row factory."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def normalize_path(raw_path: str) -> str:
    """Normalize a filesystem path to POSIX format."""
    normalized = str(PurePosixPath("/" + raw_path.lstrip("/")))
    return normalized


def init_users() -> None:
    """Initialize users table and create default users."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL,
            home_dir TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
        """
    )
    conn.commit()
    
    # Create default user if not exists
    cursor.execute("SELECT 1 FROM users WHERE username = ?", ("user",))
    if cursor.fetchone() is None:
        password_hash = hashlib.sha256("password".encode()).hexdigest()
        cursor.execute(
            """
            INSERT INTO users (username, password_hash, role, home_dir, created_at)
            VALUES (?, ?, ?, ?, ?)
            """,
            ("user", password_hash, "user", "/home/user", datetime.utcnow().isoformat())
        )
        conn.commit()
    
    # Create admin user if not exists
    cursor.execute("SELECT 1 FROM users WHERE username = ?", ("admin",))
    if cursor.fetchone() is None:
        password_hash = hashlib.sha256("admin".encode()).hexdigest()
        cursor.execute(
            """
            INSERT INTO users (username, password_hash, role, home_dir, created_at)
            VALUES (?, ?, ?, ?, ?)
            """,
            ("admin", password_hash, "admin", "/home/admin", datetime.utcnow().isoformat())
        )
        conn.commit()
    
    conn.close()


def init_notifications() -> None:
    """Initialize notifications table."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            type TEXT NOT NULL,
            app_id TEXT,
            created_at TEXT NOT NULL,
            read INTEGER DEFAULT 0
        )
        """
    )
    conn.commit()
    conn.close()


def init_filesystem() -> None:
    """Initialize filesystem table and create default directories."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS fs_nodes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            path TEXT UNIQUE NOT NULL,
            parent TEXT NOT NULL,
            node_type TEXT NOT NULL,
            content TEXT,
            size INTEGER DEFAULT 0,
            owner TEXT DEFAULT 'user',
            created_at TEXT NOT NULL,
            modified_at TEXT NOT NULL,
            attributes TEXT DEFAULT 'normal'
        )
        """
    )
    conn.commit()

    def ensure_dir(path: str) -> None:
        cursor.execute("SELECT 1 FROM fs_nodes WHERE path = ?", (path,))
        if cursor.fetchone() is None:
            parent = str(PurePosixPath(path).parent)
            now = datetime.utcnow().isoformat()
            cursor.execute(
                """
                INSERT INTO fs_nodes (path, parent, node_type, content, created_at, modified_at, owner, size)
                VALUES (?, ?, 'dir', '', ?, ?, 'user', 0)
                """,
                (path, parent, now, now),
            )

    ensure_dir("/")
    ensure_dir("/home")
    ensure_dir("/home/user")
    ensure_dir("/home/admin")
    ensure_dir("/bin")
    ensure_dir("/system")

    cursor.execute("SELECT 1 FROM fs_nodes WHERE path = ?", ("/home/user/notes.txt",))
    if cursor.fetchone() is None:
        now = datetime.utcnow().isoformat()
        content = "Welcome to JezOS!"
        cursor.execute(
            """
            INSERT INTO fs_nodes (path, parent, node_type, content, created_at, modified_at, owner, size)
            VALUES (?, ?, 'file', ?, ?, ?, 'user', ?)
            """,
            ("/home/user/notes.txt", "/home/user", content, now, now, len(content.encode())),
        )
    conn.commit()
    conn.close()


def init_startup_processes() -> None:
    """Initialize startup processes table and load configuration."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS startup_processes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            app_name TEXT UNIQUE NOT NULL,
            enabled INTEGER DEFAULT 1,
            created_at TEXT NOT NULL
        )
        """
    )
    conn.commit()
    conn.close()


def init_updates() -> None:
    """Initialize update state and history tables."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS update_state (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            current_version TEXT NOT NULL,
            latest_version TEXT NOT NULL,
            update_available INTEGER DEFAULT 0,
            last_checked TEXT,
            channel TEXT NOT NULL,
            status TEXT NOT NULL,
            restart_required INTEGER DEFAULT 0,
            progress INTEGER DEFAULT 0,
            patch_notes TEXT
        )
        """
    )
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS update_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            version TEXT NOT NULL,
            status TEXT NOT NULL,
            notes TEXT,
            applied_at TEXT NOT NULL,
            requires_restart INTEGER DEFAULT 0
        )
        """
    )
    conn.commit()

    cursor.execute("SELECT 1 FROM update_state WHERE id = 1")
    if cursor.fetchone() is None:
        cursor.execute(
            """
            INSERT INTO update_state
            (id, current_version, latest_version, update_available, last_checked, channel, status, restart_required, progress, patch_notes)
            VALUES (1, ?, ?, 0, NULL, ?, 'idle', 0, 0, '')
            """,
            (OS_VERSION, OS_VERSION, UPDATE_CHANNEL)
        )
        # Add initial history entry for baseline version
        cursor.execute(
            """
            INSERT INTO update_history (version, status, notes, applied_at, requires_restart)
            VALUES (?, ?, ?, ?, 0)
            """,
            (OS_VERSION, "initial", "Initial OS installation", datetime.utcnow().isoformat() + 'Z')
        )
        conn.commit()

    conn.close()


def get_update_state() -> dict:
    """Get current update state from database."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM update_state WHERE id = 1")
    row = cursor.fetchone()
    conn.close()

    if row is None:
        init_updates()
        return get_update_state()

    return dict(row)


def save_update_state(state: dict) -> None:
    """Persist update state to database."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        UPDATE update_state
        SET current_version = ?, latest_version = ?, update_available = ?, last_checked = ?,
            channel = ?, status = ?, restart_required = ?, progress = ?, patch_notes = ?
        WHERE id = 1
        """,
        (
            state.get("current_version"),
            state.get("latest_version"),
            1 if state.get("update_available") else 0,
            state.get("last_checked"),
            state.get("channel"),
            state.get("status"),
            1 if state.get("restart_required") else 0,
            int(state.get("progress", 0)),
            state.get("patch_notes", "")
        )
    )
    conn.commit()
    conn.close()


def add_update_history(version: str, status: str, notes: str, requires_restart: bool) -> None:
    """Add an entry to update history."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT INTO update_history (version, status, notes, applied_at, requires_restart)
        VALUES (?, ?, ?, ?, ?)
        """,
        (version, status, notes, datetime.utcnow().isoformat() + 'Z', 1 if requires_restart else 0)
    )
    conn.commit()
    conn.close()


def list_update_history(limit: int = 10) -> list:
    """List update history entries."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT * FROM update_history ORDER BY applied_at DESC LIMIT ?",
        (limit,)
    )
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]


def load_startup_processes() -> list:
    """Load enabled startup processes from database."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT app_name FROM startup_processes WHERE enabled = 1")
    rows = cursor.fetchall()
    conn.close()
    return [row["app_name"] for row in rows]


def save_startup_process(app_name: str, enabled: bool = True) -> None:
    """Save or update a startup process configuration."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Try to update existing record
    cursor.execute(
        "UPDATE startup_processes SET enabled = ? WHERE app_name = ?",
        (1 if enabled else 0, app_name)
    )
    
    # If no rows updated, insert new record
    if cursor.rowcount == 0:
        cursor.execute(
            """
            INSERT INTO startup_processes (app_name, enabled, created_at)
            VALUES (?, ?, ?)
            """,
            (app_name, 1 if enabled else 0, datetime.utcnow().isoformat())
        )
    
    conn.commit()
    conn.close()


def remove_startup_process(app_name: str) -> None:
    """Remove a startup process from database."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE startup_processes SET enabled = 0 WHERE app_name = ?", (app_name,))
    conn.commit()
    conn.close()


def init_apps() -> None:
    """Initialize apps table."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS apps (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            version TEXT NOT NULL,
            description TEXT,
            icon TEXT,
            category TEXT,
            builtin INTEGER DEFAULT 0,
            installed INTEGER DEFAULT 1,
            permissions TEXT,
            storage_size_mb INTEGER DEFAULT 0,
            installed_at TEXT,
            created_at TEXT NOT NULL
        )
        """
    )
    conn.commit()
    conn.close()


def init_database():
    """Initialize all database tables."""
    init_users()
    init_filesystem()
    init_notifications()
    init_startup_processes()
    init_updates()
    init_apps()
    
    # Migration: Ensure initial history entry exists for existing databases
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) as count FROM update_history WHERE status = 'initial'")
    result = cursor.fetchone()
    
    if result["count"] == 0:
        # No initial entry exists, add it with the earliest possible timestamp
        cursor.execute("SELECT MIN(id) as min_id FROM update_history")
        min_result = cursor.fetchone()
        
        if min_result["min_id"] is not None:
            # There are existing entries, insert initial entry before them
            state = get_update_state()
            cursor.execute(
                """
                INSERT INTO update_history (version, status, notes, applied_at, requires_restart)
                VALUES (?, ?, ?, datetime('2026-01-01T00:00:00'), 0)
                """,
                ("1.0.0", "initial", "Initial OS installation")
            )
            conn.commit()
    
    conn.close()

def migrate_apps_storage():
    """Migrate apps table to add storage_size_mb column if it doesn't exist."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Check if column exists by trying to query it
        cursor.execute("SELECT storage_size_mb FROM apps LIMIT 1")
    except sqlite3.OperationalError:
        # Column doesn't exist, add it
        try:
            cursor.execute("ALTER TABLE apps ADD COLUMN storage_size_mb INTEGER DEFAULT 0")
            conn.commit()
            print("✓ Added storage_size_mb column to apps table")
        except sqlite3.OperationalError as e:
            print(f"Migration warning: {e}")
    
    # Update apps with correct storage sizes
    app_sizes = {
        "terminal": 45,
        "files": 32,
        "notes": 12,
        "settings": 8,
        "monitor": 25,
        "localfiles": 18,
        "appstore": 56,
        "eventviewer": 20,
        "diagnostics": 30,
        "minesweeper": 2,
        "solitaire": 2
    }
    
    for app_id, size in app_sizes.items():
        cursor.execute("UPDATE apps SET storage_size_mb = ? WHERE id = ?", (size, app_id))
    
    conn.commit()
    conn.close()