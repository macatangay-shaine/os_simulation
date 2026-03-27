"""
JezOS Kernel - Main Application Entry Point

A modular FastAPI application providing OS-like functionality including:
- Process management
- Virtual filesystem
- Terminal emulation
- User authentication
- Notifications
- System resource monitoring
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from database import init_database, load_startup_processes, migrate_apps_storage
from security import init_security_logs
from event_logger import init_event_logs, log_event, LEVEL_INFORMATION, CATEGORY_SYSTEM, EVENT_BOOT_START
from datetime import datetime
from pathlib import PurePosixPath
import config

# Import routers
from routers import processes, filesystem, terminal, users, notifications, system, apps, updates, security, events, system_health

# Create FastAPI app
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan hook for startup and shutdown."""
    on_startup()
    yield


app = FastAPI(
    title="JezOS Kernel",
    description="Simulated operating system kernel with process, filesystem, and user management",
    version=config.OS_VERSION,
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(processes.router)
app.include_router(filesystem.router)
app.include_router(terminal.router)
app.include_router(users.router)
app.include_router(notifications.router)
app.include_router(system.router)
app.include_router(apps.router)
app.include_router(updates.router)
app.include_router(security.router)
app.include_router(events.router)
app.include_router(system_health.router)



@app.middleware("http")
async def maintenance_middleware(request, call_next):
    """Run periodic maintenance on each request."""
    from system_health import health_monitor
    import random
    
    # Run maintenance on ~10% of requests to avoid overhead
    if random.random() < 0.1:
        health_monitor.periodic_maintenance()
    
    response = await call_next(request)
    return response


@app.get("/boot")
def boot():
    """Boot the system - initializes kernel services."""
    # Run initial system health check
    from system_health import health_monitor
    health_monitor.periodic_maintenance()
    
    return {
        "kernel": "loaded",
        "filesystem": "mounted",
        "services": ["process_manager", "fs_manager", "terminal", "auth", "notifications", "health_monitor"]
    }


@app.get("/")
def root():
    """Root endpoint - system information."""
    from system_health import health_monitor
    stats = health_monitor.get_system_stats()
    
    return {
        "name": "JezOS Kernel",
        "version": config.OS_VERSION,
        "status": "running",
        "health": stats
    }


def on_startup():
    """Initialize database tables on startup."""
    init_database()
    apps.init_apps_table()
    migrate_apps_storage()
    init_security_logs()
    init_event_logs()
    
    # Initialize standard directories
    init_standard_directories()
    
    # Load startup processes from database into config
    config.startup_processes = load_startup_processes()
    
    # Log boot event
    log_event(
        level=LEVEL_INFORMATION,
        category=CATEGORY_SYSTEM,
        source="Kernel",
        event_id=EVENT_BOOT_START,
        message="JezOS Kernel started successfully",
        details={"version": config.OS_VERSION}
    )
    
    print("✓ JezOS Kernel initialized")
    print("✓ Database tables created")
    print("✓ Security logging enabled")
    print("✓ Standard directories initialized")
    print(f"✓ Loaded {len(config.startup_processes)} startup processes")
    print("✓ All services ready")


def init_standard_directories():
    """Initialize standard user directories."""
    from database import get_db_connection
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Ensure root directory exists first
    cursor.execute("SELECT 1 FROM fs_nodes WHERE path = '/'")
    if cursor.fetchone() is None:
        now = datetime.utcnow().isoformat()
        cursor.execute(
            """
            INSERT INTO fs_nodes (path, parent, node_type, content, created_at, modified_at, size, owner)
            VALUES ('/', '', 'dir', '', ?, ?, 0, 'user')
            """,
            (now, now)
        )
        conn.commit()
    
    standard_dirs = [
        "/home",
        "/home/user",
        "/home/user/Desktop",
        "/home/user/Downloads",
        "/home/user/Documents",
        "/home/user/Pictures",
        "/home/user/Music",
        "/home/user/Videos",
        "/home/user/notes",
        "/network"
    ]
    
    now = datetime.utcnow().isoformat()
    for dir_path in standard_dirs:
        # Check if directory exists
        cursor.execute("SELECT 1 FROM fs_nodes WHERE path = ?", (dir_path,))
        if cursor.fetchone() is None:
            # Create directory
            parent = str(PurePosixPath(dir_path).parent) if dir_path != "/" else ""
            cursor.execute(
                """
                INSERT INTO fs_nodes (path, parent, node_type, content, created_at, modified_at, size, owner)
                VALUES (?, ?, 'dir', '', ?, ?, 0, 'user')
                """,
                (dir_path, parent, now, now)
            )
    
    conn.commit()
    conn.close()
    print(f"✓ Initialized root and {len(standard_dirs)} standard directories")
