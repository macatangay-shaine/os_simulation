"""Security logging and event tracking for JezOS."""

from datetime import datetime
from database import get_db_connection


def init_security_logs():
    """Initialize security_logs table."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS security_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            event_type TEXT NOT NULL,
            username TEXT NOT NULL,
            action TEXT NOT NULL,
            resource TEXT,
            success INTEGER NOT NULL,
            ip_address TEXT,
            details TEXT
        )
        """
    )
    conn.commit()
    conn.close()


def log_security_event(
    event_type: str,
    username: str,
    action: str,
    resource: str = None,
    success: bool = True,
    ip_address: str = None,
    details: str = None
):
    """Log a security event to the database.
    
    Args:
        event_type: Type of event (login, file_access, permission_check, etc.)
        username: Username performing the action
        action: Specific action being performed
        resource: Resource being accessed (file path, system setting, etc.)
        success: Whether the action was successful
        ip_address: IP address of the request
        details: Additional details about the event
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT INTO security_logs 
        (timestamp, event_type, username, action, resource, success, ip_address, details)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            datetime.utcnow().isoformat(),
            event_type,
            username,
            action,
            resource,
            1 if success else 0,
            ip_address,
            details
        )
    )
    conn.commit()
    conn.close()


def get_security_logs(limit: int = 100, event_type: str = None):
    """Get security logs from the database.
    
    Args:
        limit: Maximum number of logs to return
        event_type: Filter by event type (optional)
    
    Returns:
        List of security log dictionaries
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    if event_type:
        cursor.execute(
            """
            SELECT * FROM security_logs 
            WHERE event_type = ?
            ORDER BY timestamp DESC 
            LIMIT ?
            """,
            (event_type, limit)
        )
    else:
        cursor.execute(
            """
            SELECT * FROM security_logs 
            ORDER BY timestamp DESC 
            LIMIT ?
            """,
            (limit,)
        )
    
    rows = cursor.fetchall()
    conn.close()
    
    return [dict(row) for row in rows]


def check_admin_permission(username: str) -> bool:
    """Check if a user has admin permissions.
    
    Args:
        username: Username to check
    
    Returns:
        True if user is admin, False otherwise
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT role FROM users WHERE username = ?", (username,))
    row = cursor.fetchone()
    conn.close()
    
    if row and row["role"] == "admin":
        return True
    return False


def is_system_path(path: str) -> bool:
    """Check if a path is a system path that requires admin access.
    
    Args:
        path: File system path to check
    
    Returns:
        True if path is a system path, False otherwise
    """
    system_paths = ["/system", "/bin", "/boot", "/etc"]
    path_normalized = path.rstrip("/")
    
    for sys_path in system_paths:
        if path_normalized == sys_path or path_normalized.startswith(sys_path + "/"):
            return True
    
    return False
