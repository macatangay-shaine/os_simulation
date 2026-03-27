"""Pydantic models for JezOS kernel."""

from pydantic import BaseModel, Field
from typing import Optional


class ProcessStartRequest(BaseModel):
    app: str = Field(..., min_length=1, max_length=64)
    memory: int = Field(default=12, ge=1, le=512)


class ProcessRecord(BaseModel):
    pid: int
    app: str
    memory: int
    state: str
    cpu_usage: float = 0.0
    start_time: str = ""
    is_startup: bool = False


class FsCreateRequest(BaseModel):
    path: str = Field(..., min_length=1, max_length=255)
    node_type: str = Field(..., pattern="^(file|dir)$")
    content: Optional[str] = ""


class FsWriteRequest(BaseModel):
    path: str = Field(..., min_length=1, max_length=255)
    content: str


class FsReadRequest(BaseModel):
    path: str = Field(..., min_length=1, max_length=255)


class FsRenameRequest(BaseModel):
    old_path: str = Field(..., min_length=1, max_length=255)
    new_path: str = Field(..., min_length=1, max_length=255)


class TerminalCommandRequest(BaseModel):
    command: str = Field(..., min_length=1, max_length=512)
    cwd: str = Field(default="/home/user")


class TerminalCommandResponse(BaseModel):
    output: str
    cwd: str


class NotificationRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=100)
    message: str = Field(..., min_length=1, max_length=500)
    type: str = Field(default="info", pattern="^(info|warning|error|success)$")
    app_id: Optional[str] = Field(default="system", max_length=64)


class PermissionCheckRequest(BaseModel):
    action: str = Field(..., min_length=1, max_length=100)
    resource: Optional[str] = None


class SecurityLogEntry(BaseModel):
    id: int
    timestamp: str
    event_type: str
    username: str
    action: str
    resource: Optional[str] = None
    success: bool
    ip_address: Optional[str] = None
    details: Optional[str] = None
    app_id: Optional[str] = None
    duration: int = Field(default=5000, ge=1000, le=30000)


class NotificationRecord(BaseModel):
    id: int
    title: str
    message: str
    type: str
    app_id: Optional[str]
    created_at: str
    read: bool


class UserLoginRequest(BaseModel):
    username: str = Field(..., min_length=1, max_length=32)
    password: str = Field(..., min_length=1, max_length=128)


class UserResponse(BaseModel):
    id: int
    username: str
    role: str
    home_dir: str


class SystemEvent(BaseModel):
    id: int
    timestamp: str
    level: str
    category: str
    source: str
    event_id: int
    message: str
    username: Optional[str] = None
    details: Optional[dict] = None
    stack_trace: Optional[str] = None


class EventLogRequest(BaseModel):
    level: Optional[str] = None
    category: Optional[str] = None
    source: Optional[str] = None
    event_id: int
    message: str
    username: Optional[str] = None
    details: Optional[dict] = None
    stack_trace: Optional[str] = None


class ErrorDialogData(BaseModel):
    title: str = Field(..., min_length=1, max_length=100)
    message: str = Field(..., min_length=1, max_length=1000)
    error_code: Optional[str] = None
    stack_trace: Optional[str] = None
    show_details: bool = False
