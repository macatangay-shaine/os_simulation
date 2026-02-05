"""User authentication and management endpoints."""

from fastapi import APIRouter, HTTPException
import hashlib
import secrets
from models import UserLoginRequest, UserResponse
from database import get_db_connection
from security import log_security_event
from event_logger import (
    log_event, LEVEL_INFORMATION, LEVEL_WARNING,
    CATEGORY_SECURITY, EVENT_LOGIN_SUCCESS, EVENT_LOGIN_FAILURE, EVENT_LOGOUT
)
import config

router = APIRouter(prefix="/user", tags=["users"])


@router.post("/login")
def user_login(payload: UserLoginRequest):
    """Authenticate user and create session."""
    password_hash = hashlib.sha256(payload.password.encode()).hexdigest()
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, username, role, home_dir FROM users WHERE username = ? AND password_hash = ?",
        (payload.username, password_hash)
    )
    row = cursor.fetchone()
    conn.close()
    
    if row is None:
        log_security_event(
            event_type="login_failed",
            username=payload.username,
            action="login",
            success=False,
            details="Invalid credentials"
        )
        log_event(
            level=LEVEL_WARNING,
            category=CATEGORY_SECURITY,
            source="Authentication",
            event_id=EVENT_LOGIN_FAILURE,
            message=f"Failed login attempt for user: {payload.username}",
            username=payload.username,
            details={"reason": "Invalid credentials"}
        )
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    user = UserResponse(
        id=row["id"],
        username=row["username"],
        role=row["role"],
        home_dir=row["home_dir"]
    )
    
    # Create session token
    session_token = secrets.token_hex(32)
    config.active_sessions[session_token] = user.model_dump()
    
    # Log successful login
    log_security_event(
        event_type="login_success",
        username=user.username,
        action="login",
        success=True,
        details=f"User role: {user.role}"
    )
    log_event(
        level=LEVEL_INFORMATION,
        category=CATEGORY_SECURITY,
        source="Authentication",
        event_id=EVENT_LOGIN_SUCCESS,
        message=f"User logged in: {user.username}",
        username=user.username,
        details={"role": user.role, "home_dir": user.home_dir}
    )
    
    return {"user": user, "session_token": session_token}


@router.get("/list")
def list_users():
    """Get list of all users."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, username, role, home_dir FROM users")
    rows = cursor.fetchall()
    conn.close()
    return [
        {"id": r["id"], "username": r["username"], "role": r["role"], "home_dir": r["home_dir"]}
        for r in rows
    ]
