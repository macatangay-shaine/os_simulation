"""Security and permissions management endpoints."""

from fastapi import APIRouter, HTTPException, Header
from typing import Optional
from models import PermissionCheckRequest, SecurityLogEntry
from security import (
    get_security_logs,
    check_admin_permission,
    log_security_event,
    is_system_path
)
from database import get_db_connection
import config

router = APIRouter(prefix="/security", tags=["security"])


def get_username_from_token(session_token: Optional[str]) -> Optional[str]:
    """Extract username from session token."""
    if not session_token or session_token not in config.active_sessions:
        return None
    return config.active_sessions[session_token].get("username")


@router.post("/check-permission")
def check_permission(payload: PermissionCheckRequest, session_token: Optional[str] = Header(None)):
    """Check if user has permission for an action."""
    username = get_username_from_token(session_token)
    
    if not username:
        return {"allowed": False, "reason": "Not authenticated"}
    
    # Check if action requires admin
    if payload.action in ["delete_system_file", "modify_system", "install_app", "change_permissions"]:
        is_admin = check_admin_permission(username)
        
        # Log the permission check
        log_security_event(
            event_type="permission_check",
            username=username,
            action=payload.action,
            resource=payload.resource,
            success=is_admin,
            details=f"Admin check for {payload.action}"
        )
        
        if not is_admin:
            return {
                "allowed": False,
                "reason": "Administrator privileges required",
                "requires_elevation": True
            }
    
    # Check if accessing system path
    if payload.resource and is_system_path(payload.resource):
        is_admin = check_admin_permission(username)
        
        log_security_event(
            event_type="system_access",
            username=username,
            action=payload.action,
            resource=payload.resource,
            success=is_admin,
            details="System path access attempt"
        )
        
        if not is_admin:
            return {
                "allowed": False,
                "reason": "System files require administrator access",
                "requires_elevation": True
            }
    
    return {"allowed": True}


@router.get("/logs")
def get_logs(
    limit: int = 100,
    event_type: Optional[str] = None,
    session_token: Optional[str] = Header(None)
):
    """Get security logs (admin only)."""
    username = get_username_from_token(session_token)
    
    if not username:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    if not check_admin_permission(username):
        log_security_event(
            event_type="unauthorized_access",
            username=username,
            action="view_security_logs",
            success=False,
            details="Non-admin attempted to view security logs"
        )
        raise HTTPException(status_code=403, detail="Administrator access required")
    
    logs = get_security_logs(limit=limit, event_type=event_type)
    
    log_security_event(
        event_type="log_access",
        username=username,
        action="view_security_logs",
        success=True
    )
    
    return {"logs": logs}


@router.post("/elevate")
def request_elevation(session_token: Optional[str] = Header(None)):
    """Request privilege elevation (placeholder for UAC prompt)."""
    username = get_username_from_token(session_token)
    
    if not username:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    is_admin = check_admin_permission(username)
    
    log_security_event(
        event_type="elevation_request",
        username=username,
        action="request_elevation",
        success=is_admin,
        details="User requested privilege elevation"
    )
    
    return {
        "allowed": is_admin,
        "username": username,
        "role": "admin" if is_admin else "user"
    }


@router.get("/user-role")
def get_user_role(session_token: Optional[str] = Header(None)):
    """Get current user's role."""
    username = get_username_from_token(session_token)
    
    if not username:
        return {"role": "guest"}
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT role FROM users WHERE username = ?", (username,))
    row = cursor.fetchone()
    conn.close()
    
    if row:
        return {"username": username, "role": row["role"]}
    
    return {"username": username, "role": "user"}
