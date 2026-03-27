# Backend Structure Reference

## Quick Navigation

### Main Changes

| Folder | Purpose | Contains |
|--------|---------|----------|
| `backend/app/` | ✨ NEW: Actual FastAPI application | main.py, __init__.py |
| `backend/scripts/` | ✨ NEW: Diagnostic & utility scripts | check_*.py, test_*.py, verify_storage.py |
| `backend/archive/` | ✨ NEW: Deprecated/backup files | main_backup.py |
| `backend/routers/` | API endpoints | processes.py, filesystem.py, users.py, etc. |
| `backend/` | Root level (core modules) | database.py, config.py, models.py, security.py, event_logger.py |

## File Organization

```
backend/
├── main.py                          🔄 Wrapper (for uvicorn compatibility)
├── app/                             ✨ NEW: Application package
│   ├── __init__.py                 ✨ NEW: Package exports
│   └── main.py                     ✨ NEW: FastAPI app entry
├── scripts/                         ✨ NEW: Diagnostic utilities
│   ├── check_all_files.py
│   ├── check_history.py
│   ├── check_notes.py
│   ├── check_notes_listing.py
│   ├── test_file_read.py
│   ├── test_read_file.py
│   └── verify_storage.py
├── archive/                         ✨ NEW: Deprecated files
│   └── main_backup.py
├── routers/                         📁 Unchanged: API endpoints
│   ├── __init__.py
│   ├── apps.py
│   ├── events.py
│   ├── filesystem.py
│   ├── notifications.py
│   ├── processes.py
│   ├── security.py
│   ├── system_health.py
│   ├── system.py
│   ├── terminal.py
│   ├── updates.py
│   └── users.py
├── config.py                        📄 Configuration
├── database.py                      📄 Database access
├── models.py                        📄 Pydantic models
├── security.py                      📄 Security utilities
├── event_logger.py                  📄 Event logging
├── system_health.py                 📄 System monitoring
├── permission_validator.py          📄 Permission checking
├── start.py                         📄 Startup script
├── README.md
├── venv/                            📁 Virtual environment
└── __pycache__/                     📁 Python cache

```

## Import Patterns

### Everything Works As-Is ✅

Since imports are relative to `backend/`, nothing changed:

```python
# ✅ Still works exactly the same
from database import get_db_connection
from config import DB_PATH, OS_VERSION
from event_logger import log_event
from routers import filesystem, users, processes
```

### The Wrapper Handles Everything

```python
# backend/main.py (compatibility wrapper)
from app.main import app

__all__ = ["app"]
```

When uvicorn loads `main.py`, it gets the app from `app/main.py` transparently.

## Running the Application

### Method 1: Using start.py (Recommended)
```bash
cd backend
python start.py
# Automatically finds uvicorn in venv and runs main:app
```

**Advantages:**
- Works on Windows/Mac/Linux
- Finds venv automatically
- Shows informative startup messages

### Method 2: Direct uvicorn command
```bash
cd backend
source venv/bin/activate  # or: venv\Scripts\activate on Windows
uvicorn main:app --reload
```

### Method 3: Module syntax
```bash
cd backend
python -m uvicorn main:app --reload
```

All three methods work identically. ✅

## Scripts Folder

### Purpose
Diagnostic and utility scripts for developers/maintenance.

### Available Scripts

| Script | Purpose |
|--------|---------|
| `check_all_files.py` | List all files in virtual filesystem |
| `check_history.py` | View update history from database |
| `check_notes.py` | Inspect notes content |
| `check_notes_listing.py` | List files in notes directory |
| `test_file_read.py` | Test file read functionality |
| `test_read_file.py` | Alternative file read test |
| `verify_storage.py` | Check storage usage / app sizes |

### Running a Script
```bash
cd backend/scripts
python check_all_files.py
```

## Architecture Overview

### Startup Flow

```
User runs:
  ↓
python start.py (or uvicorn main:app)
  ↓
backend/main.py (wrapper)
  ↓
backend/app/main.py (actual app)
  ↓
FastAPI() instance created
  ↓
Database initialized
  ↓
Routers registered
  ↓
✅ Server running on port 8000
```

### Request Handler Flow

Example: POST `/fs/create` (create file/folder)

```
HTTP Request
  ↓
backend/routers/filesystem.py (handles /fs/* routes)
  ↓
database.py (read/write operations)
  ↓
SQLite (virt_os.db)
  ↓
Response sent
```

## Database

### Location
```
backend/virt_os.db
```

### Key Tables
| Table | Purpose |
|-------|---------|
| `fs_nodes` | Virtual filesystem structure |
| `users` | User accounts and permissions |
| `processes` | Running processes state |
| `security_logs` | Security event log |
| `system_events` | General system events |
| `apps` | Installed applications |
| `startup_processes` | Apps to auto-start |
| `notifications` | System notifications |
| `note_versions` | Note edit history |
| `recycle_bin_meta` | Deleted file metadata |

### Check Data
```bash
# Use check scripts:
cd backend/scripts
python check_all_files.py      # All filesystem nodes
python check_notes.py          # Note content
python check_history.py        # Update history
python verify_storage.py       # Storage usage
```

## Configuration

### Location
```
backend/config.py
```

### Key Settings
```python
DB_PATH = 'virt_os.db'
OS_VERSION = '1.0.0'
UPDATE_CHANNEL = 'stable'
startup_processes = []  # Auto-start apps
```

## API Endpoints

### Filesystem
```
POST   /fs/create      Create file/folder
GET    /fs/read        Read file
GET    /fs/list        List directory
POST   /fs/write       Write content
DELETE /fs/delete      Delete file/folder
POST   /fs/list-recycle List recycle bin
```

### Users
```
POST /user/login       User login
POST /user/list        List all users
```

### Processes
```
POST /proc/start       Start process
POST /proc/stop        Stop process
GET  /proc/list        List processes
```

### System
```
GET /system/info       System information
GET /system/stats      System statistics
```

### Apps
```
GET /app/list          List installed apps
POST /app/launch       Launch application
```

### Events
```
GET /events/log        Get event logs
POST /events/log       Create event
```

(Full API reference in routers/)

## Adding New API Endpoints

### Step 1: Create Router Module
```python
# backend/routers/my_feature.py
from fastapi import APIRouter

router = APIRouter(prefix="/myfeature", tags=["my-feature"])

@router.get("/status")
def get_status():
    return {"status": "ok"}
```

### Step 2: Register in main app
```python
# backend/app/main.py
from routers import my_feature

app.include_router(my_feature.router)
```

### Step 3: Import Pattern Stays Same
```python
# Within the router
from database import get_db_connection
from config import DB_PATH
# Everything else unchanged
```

## Debugging & Logs

### Console Output

The app prints startup information:
```
✓ JezOS Kernel initialized
✓ Database tables created
✓ Security logging enabled
✓ Standard directories initialized
✓ Loaded 3 startup processes
✓ All services ready
```

### HTTP Logs
```
INFO:     127.0.0.1:50247 - "POST /fs/create HTTP/1.1" 200 OK
INFO:     127.0.0.1:50247 - "GET /proc/list HTTP/1.1" 200 OK
```

### Status Codes
| Code | Meaning |
|------|---------|
| 200 | Success |
| 404 | Not found |
| 409 | Conflict (e.g., file already exists) |
| 500 | Server error |

## Development Workflow

### Making Changes

```bash
# 1. Edit backend code
nano backend/routers/filesystem.py

# 2. Server auto-reloads (uvicorn --reload)
# Changes take effect immediately

# 3. Test with frontend
# Frontend makes requests, see results
```

### Running Scripts

```bash
# Quick diagnostic
cd backend/scripts
python check_all_files.py

# Then return
cd ..
```

### Testing

```bash
# Simple manual test
cd backend
python test_file_read.py
```

## Common Tasks

### Check virtual filesystem
```bash
cd backend/scripts
python check_all_files.py
```

### View event logs
```bash
cd backend/scripts
python check_history.py
```

### Inspect notes
```bash
cd backend/scripts
python check_notes.py
```

### Check app storage
```bash
cd backend/scripts
python verify_storage.py
```

## Troubleshooting

### 409 Conflict on Create
**Issue:** `POST /fs/create` returns 409 repeatedly

**Cause:** Frontend tries to create files that already exist

**Solution:** 
- Check if file exists before creating
- Handle 409 responses gracefully
- Don't retry without checking

### Import Errors
**Issue:** `ImportError: cannot import name X`

**Cause:** Module moved but import statement outdated

**Note:** This shouldn't happen - wrapper handles compatibility

**Solution:** Verify import uses relative path from `backend/` level

### Database Locked
**Issue:** SQLite database is locked

**Cause:** Multiple processes accessing simultaneously

**Solution:** 
- Restart backend
- Check for stray processes: `lsof | grep virt_os.db`

## Performance Notes

### Startup Time
Normal: 2-5 seconds

### Request Latency
Typical: 50-200ms for filesystem operations

### Database Size
Initial: ~500 KB
After use: 1-5 MB (small virtual filesystem)

## Security

### Built-in Features
- User authentication (login checks)
- Permission validation (admin/user roles)
- Security event logging
- Password hashing (SHA-256)

### Session Management
- Session tokens stored in frontend localStorage
- Tokens verified on protected routes
- Auto-logout on invalid token

---

**Status:** ✅ Fully Functional  
**Compatibility:** ✅ 100% Backward Compatible  
**Testing:** ✅ Build passes, endpoints responsive
