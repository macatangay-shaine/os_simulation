"""Notification management endpoints."""

from fastapi import APIRouter, Query
from datetime import datetime
from models import NotificationRequest
from database import get_db_connection

router = APIRouter(prefix="/notification", tags=["notifications"])


@router.post("/send")
def send_notification(payload: NotificationRequest):
    """Create a new notification."""
    conn = get_db_connection()
    cursor = conn.cursor()
    now = datetime.utcnow().isoformat()
    cursor.execute(
        """
        INSERT INTO notifications (title, message, type, app_id, created_at, read)
        VALUES (?, ?, ?, ?, ?, 0)
        """,
        (payload.title, payload.message, payload.type, payload.app_id, now)
    )
    conn.commit()
    notif_id = cursor.lastrowid
    conn.close()
    
    return {"id": notif_id, "title": payload.title, "message": payload.message, "type": payload.type}


@router.get("/list")
def list_notifications(unread_only: bool = Query(False)):
    """Get all notifications, optionally filtered to unread only."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    if unread_only:
        cursor.execute(
            "SELECT id, title, message, type, app_id, created_at, read FROM notifications WHERE read = 0 ORDER BY created_at DESC"
        )
    else:
        cursor.execute(
            "SELECT id, title, message, type, app_id, created_at, read FROM notifications ORDER BY created_at DESC LIMIT 50"
        )
    
    rows = cursor.fetchall()
    conn.close()
    
    return [
        {
            "id": r["id"],
            "title": r["title"],
            "message": r["message"],
            "type": r["type"],
            "app_id": r["app_id"],
            "created_at": r["created_at"],
            "read": bool(r["read"])
        }
        for r in rows
    ]


@router.patch("/{notification_id}/read")
def mark_notification_read(notification_id: int):
    """Mark a notification as read."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE notifications SET read = 1 WHERE id = ?", (notification_id,))
    conn.commit()
    conn.close()
    return {"status": "ok"}


@router.delete("/{notification_id}")
def delete_notification(notification_id: int):
    """Delete a notification."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM notifications WHERE id = ?", (notification_id,))
    conn.commit()
    conn.close()
    return {"status": "ok"}
