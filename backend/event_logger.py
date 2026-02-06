"""System-wide event logging and error handling for JezOS."""

from datetime import datetime
from database import get_db_connection
from typing import Optional
import json


def init_event_logs():
    """Initialize system_events table for comprehensive logging."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS system_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            level TEXT NOT NULL,
            category TEXT NOT NULL,
            source TEXT NOT NULL,
            event_id INTEGER NOT NULL,
            message TEXT NOT NULL,
            username TEXT,
            details TEXT,
            stack_trace TEXT
        )
        """
    )
    conn.commit()
    conn.close()


# Event categories
CATEGORY_SYSTEM = "System"
CATEGORY_APPLICATION = "Application"
CATEGORY_SECURITY = "Security"
CATEGORY_HARDWARE = "Hardware"
CATEGORY_NETWORK = "Network"

# Event levels
LEVEL_CRITICAL = "Critical"
LEVEL_ERROR = "Error"
LEVEL_WARNING = "Warning"
LEVEL_INFORMATION = "Information"
LEVEL_VERBOSE = "Verbose"

# Event IDs (Windows-style event IDs)
EVENT_BOOT_START = 1000
EVENT_BOOT_COMPLETE = 1001
EVENT_SHUTDOWN_INITIATED = 1002
EVENT_SHUTDOWN_COMPLETE = 1003

EVENT_APP_START = 2000
EVENT_APP_STOP = 2001
EVENT_APP_CRASH = 2002
EVENT_APP_HANG = 2003

EVENT_LOGIN_SUCCESS = 3000
EVENT_LOGIN_FAILURE = 3001
EVENT_LOGOUT = 3002
EVENT_LOCK_SCREEN = 3003
EVENT_UNLOCK_SCREEN = 3004

EVENT_FILE_CREATED = 4000
EVENT_FILE_MODIFIED = 4001
EVENT_FILE_DELETED = 4002
EVENT_FILE_ACCESS_DENIED = 4003

EVENT_PROCESS_START = 5000
EVENT_PROCESS_KILL = 5001
EVENT_MEMORY_WARNING = 5002
EVENT_MEMORY_CRITICAL = 5003

EVENT_PERMISSION_DENIED = 6000
EVENT_PERMISSION_GRANTED = 6001
EVENT_ELEVATION_REQUESTED = 6002

EVENT_ERROR_GENERIC = 9000
EVENT_ERROR_FILE_NOT_FOUND = 9001
EVENT_ERROR_PERMISSION = 9002
EVENT_ERROR_NETWORK = 9003


def log_event(
    level: str,
    category: str,
    source: str,
    event_id: int,
    message: str,
    username: Optional[str] = None,
    details: Optional[dict] = None,
    stack_trace: Optional[str] = None
):
    """
    Log a system event to the database.
    
    Args:
        level: Event level (Critical, Error, Warning, Information, Verbose)
        category: Event category (System, Application, Security, Hardware, Network)
        source: Source component (e.g., "Kernel", "FileSystem", "ProcessManager")
        event_id: Numeric event identifier
        message: Human-readable event description
        username: Optional username associated with the event
        details: Optional dictionary with additional context (will be JSON serialized)
        stack_trace: Optional error stack trace
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    details_json = json.dumps(details) if details else None
    
    cursor.execute(
        """
        INSERT INTO system_events (
            timestamp, level, category, source, event_id, 
            message, username, details, stack_trace
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            datetime.utcnow().isoformat(),
            level,
            category,
            source,
            event_id,
            message,
            username,
            details_json,
            stack_trace
        )
    )
    
    conn.commit()
    conn.close()


def get_system_events(
    level: Optional[str] = None,
    category: Optional[str] = None,
    source: Optional[str] = None,
    limit: int = 100,
    offset: int = 0
):
    """
    Retrieve system events with optional filtering.
    
    Args:
        level: Filter by event level
        category: Filter by category
        source: Filter by source
        limit: Maximum number of events to return
        offset: Number of events to skip
    
    Returns:
        List of event dictionaries
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = "SELECT * FROM system_events WHERE 1=1"
    params = []
    
    if level:
        query += " AND level = ?"
        params.append(level)
    
    if category:
        query += " AND category = ?"
        params.append(category)
    
    if source:
        query += " AND source = ?"
        params.append(source)
    
    query += " ORDER BY timestamp DESC LIMIT ? OFFSET ?"
    params.extend([limit, offset])
    
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    
    events = []
    for row in rows:
        event = dict(row)
        if event.get("details"):
            try:
                event["details"] = json.loads(event["details"])
            except:
                pass
        events.append(event)
    
    return events


def get_event_count(
    level: Optional[str] = None,
    category: Optional[str] = None,
    source: Optional[str] = None
):
    """Get the total count of events matching the filters."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = "SELECT COUNT(*) as count FROM system_events WHERE 1=1"
    params = []
    
    if level:
        query += " AND level = ?"
        params.append(level)
    
    if category:
        query += " AND category = ?"
        params.append(category)
    
    if source:
        query += " AND source = ?"
        params.append(source)
    
    cursor.execute(query, params)
    result = cursor.fetchone()
    conn.close()
    
    return result["count"] if result else 0


def clear_old_events(days_to_keep: int = 30):
    """Delete events older than the specified number of days."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        from datetime import timedelta
        cutoff_date = (datetime.utcnow() - timedelta(days=days_to_keep)).isoformat()
        
        cursor.execute(
            "DELETE FROM system_events WHERE timestamp < ?",
            (cutoff_date,)
        )
        
        deleted = cursor.rowcount
        conn.commit()
        conn.close()
        
        print(f"Cleared {deleted} old events from database (older than {days_to_keep} days)")
        return deleted
    except Exception as e:
        print(f"Error clearing old events: {str(e)}")
        return 0


def clear_all_events():
    """Delete all events from the database."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("DELETE FROM system_events")
        
        deleted = cursor.rowcount
        conn.commit()
        conn.close()
        
        print(f"Cleared all {deleted} events from database")
        return deleted
    except Exception as e:
        print(f"Error clearing all events: {str(e)}")
        return 0


def export_events_csv(
    level: Optional[str] = None,
    category: Optional[str] = None,
    source: Optional[str] = None
):
    """
    Export events to CSV format.
    
    Returns:
        CSV string with all matching events
    """
    events = get_system_events(level, category, source, limit=10000)
    
    csv_lines = [
        "ID,Timestamp,Level,Category,Source,Event ID,Message,Username,Details"
    ]
    
    for event in events:
        details_str = ""
        if event.get("details"):
            if isinstance(event["details"], dict):
                details_str = json.dumps(event["details"])
            else:
                details_str = str(event["details"])
        
        # Escape commas and quotes in fields
        message = str(event.get("message", "")).replace('"', '""')
        username = str(event.get("username", "")).replace('"', '""')
        details_str = details_str.replace('"', '""')
        
        csv_lines.append(
            f'{event["id"]},{event["timestamp"]},{event["level"]},'
            f'{event["category"]},{event["source"]},{event["event_id"]},'
            f'"{message}","{username}","{details_str}"'
        )
    
    return "\n".join(csv_lines)


def log_error(source: str, message: str, username: Optional[str] = None, 
              details: Optional[dict] = None, stack_trace: Optional[str] = None):
    """Convenience function to log an error event."""
    log_event(
        level=LEVEL_ERROR,
        category=CATEGORY_APPLICATION,
        source=source,
        event_id=EVENT_ERROR_GENERIC,
        message=message,
        username=username,
        details=details,
        stack_trace=stack_trace
    )


def log_warning(source: str, message: str, username: Optional[str] = None, 
                details: Optional[dict] = None):
    """Convenience function to log a warning event."""
    log_event(
        level=LEVEL_WARNING,
        category=CATEGORY_APPLICATION,
        source=source,
        event_id=EVENT_ERROR_GENERIC,
        message=message,
        username=username,
        details=details
    )


def log_info(source: str, message: str, username: Optional[str] = None, 
             details: Optional[dict] = None):
    """Convenience function to log an information event."""
    log_event(
        level=LEVEL_INFORMATION,
        category=CATEGORY_SYSTEM,
        source=source,
        event_id=EVENT_ERROR_GENERIC,
        message=message,
        username=username,
        details=details
    )
