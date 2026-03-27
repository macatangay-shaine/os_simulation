# VirtuOS Backend - Modular Structure

## Overview
The backend has been refactored into a clean modular architecture for easier debugging, testing, and maintenance.

## Directory Structure

```
backend/
├── main.py                 # Main FastAPI app & router registration
├── config.py               # Global configuration & state management
├── database.py             # Database utilities & initialization
├── models.py               # Pydantic models (request/response schemas)
├── routers/                # Feature-specific API routers
│   ├── __init__.py
│   ├── processes.py        # Process management endpoints
│   ├── filesystem.py       # Virtual filesystem operations
│   ├── terminal.py         # Terminal command execution
│   ├── users.py            # User authentication & management
│   ├── notifications.py    # Notification system
│   └── system.py           # System resources & performance
├── virt_os.db             # SQLite database
└── main_backup.py         # Backup of monolithic main.py

```

## Module Responsibilities

### `main.py` (70 lines)
- FastAPI app initialization
- CORS middleware configuration
- Router registration
- Boot endpoint
- Database initialization on startup

### `config.py`
- Global state (process table, performance history)
- Configuration constants (MAX_MEMORY, DB_PATH, etc.)
- Session management
- Startup process registry

### `database.py`
- Database connection factory
- Path normalization utility
- Table initialization functions:
  - `init_users()` - Create users table + default users
  - `init_filesystem()` - Create filesystem table + default structure
  - `init_notifications()` - Create notifications table

### `models.py`
- All Pydantic models for type validation:
  - Process models (ProcessStartRequest, ProcessRecord)
  - Filesystem models (FsCreateRequest, FsReadRequest, FsWriteRequest)
  - Terminal models (TerminalCommandRequest, TerminalCommandResponse)
  - User models (UserLoginRequest, UserResponse)
  - Notification models (NotificationRequest, NotificationRecord)

### `routers/processes.py`
**Endpoints:**
- `GET /process/list` - List all processes
- `POST /process/start` - Start new process
- `POST /process/kill` - Kill process by PID
- `POST /process/force-kill` - Force kill protected process

### `routers/filesystem.py`
**Endpoints:**
- `POST /fs/create` - Create file or directory
- `POST /fs/read` - Read file contents
- `POST /fs/write` - Write to file
- `DELETE /fs/delete` - Delete file or directory
- `GET /fs/list` - List directory contents

### `routers/terminal.py`
**Endpoints:**
- `POST /terminal/execute` - Execute terminal command

**Supported commands:** ls, cd, cat, ps, kill, clear, pwd, mkdir, touch, rm, help

### `routers/users.py`
**Endpoints:**
- `POST /user/login` - Authenticate & create session
- `GET /user/list` - List all users

### `routers/notifications.py`
**Endpoints:**
- `POST /notification/send` - Create notification
- `GET /notification/list` - List notifications (with unread filter)
- `PATCH /notification/{id}/read` - Mark as read
- `DELETE /notification/{id}` - Delete notification

### `routers/system.py`
**Endpoints:**
- `GET /system/resources` - Current CPU/Memory usage
- `GET /system/performance-history` - Historical performance data
- `GET /system/startup-processes` - List startup apps
- `POST /system/startup-processes/add` - Add to startup
- `DELETE /system/startup-processes/remove` - Remove from startup

## Benefits of Modular Structure

1. **Easier Debugging** - Isolate issues to specific modules
2. **Better Testing** - Test routers independently
3. **Code Organization** - Logical separation of concerns
4. **Maintainability** - Smaller, focused files
5. **Scalability** - Easy to add new features/routers
6. **Readability** - Clear structure for new developers

## Running the Server

```bash
cd backend
python -m uvicorn main:app --reload
```

The server will automatically:
- Initialize database tables
- Load all routers
- Start on http://127.0.0.1:8000
- Auto-reload on file changes

## Adding New Features

1. Create new router in `routers/new_feature.py`
2. Define models in `models.py` (if needed)
3. Register router in `main.py`:
   ```python
   from routers import new_feature
   app.include_router(new_feature.router)
   ```

## API Documentation

When server is running, visit:
- **Interactive Docs:** http://127.0.0.1:8000/docs
- **Alternative Docs:** http://127.0.0.1:8000/redoc
