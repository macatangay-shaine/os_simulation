"""System resources and performance monitoring endpoints."""

from fastapi import APIRouter, Query
from datetime import datetime
import random
import config
from database import (
    load_startup_processes,
    save_startup_process,
    remove_startup_process as db_remove_startup_process
)

router = APIRouter(prefix="/system", tags=["system"])


def update_performance_history():
    """Internal helper to capture current system performance snapshot."""
    running_procs = [p for p in config.process_table if p.state == "running"]
    used_memory = sum(p.memory for p in running_procs)
    total_cpu = sum(p.cpu_usage for p in running_procs)
    
    snapshot = {
        "timestamp": datetime.utcnow().isoformat(),
        "cpu_usage": min(99.0, round(total_cpu / 3, 1)),
        "memory_used": used_memory,
        "memory_percent": round((used_memory / config.MAX_MEMORY) * 100, 1),
        "process_count": len(running_procs)
    }
    
    config.performance_history.append(snapshot)
    
    # Keep only recent history
    if len(config.performance_history) > config.MAX_HISTORY_SIZE:
        config.performance_history.pop(0)


@router.get("/resources")
def get_system_resources():
    """Get current system resource usage."""
    # Update CPU usage for running processes (simulate fluctuation)
    for index, record in enumerate(config.process_table):
        if record.state == "running":
            # Add random variation plus a tiny memory-weighted drift.
            # This keeps values moving while still correlating with process load.
            variation = random.uniform(-5, 5)
            memory_drift = (record.memory / config.MAX_MEMORY) * random.uniform(0, 2)
            new_cpu = max(0.1, min(99.0, record.cpu_usage + variation + memory_drift))
            config.process_table[index] = record.model_copy(update={"cpu_usage": round(new_cpu, 1)})

    # Recompute totals after updating process CPU values.
    running_procs = [p for p in config.process_table if p.state == "running"]
    used_memory = sum(p.memory for p in running_procs)
    total_cpu = sum(p.cpu_usage for p in running_procs)

    # Keep history fresh on each resource poll so performance charts evolve over time.
    update_performance_history()
    
    return {
        "maxMemory": config.MAX_MEMORY,
        "usedMemory": used_memory,
        "availableMemory": config.MAX_MEMORY - used_memory,
        "memoryUsagePercent": (used_memory / config.MAX_MEMORY) * 100,
        "processCount": len(running_procs),
        "cpuUsage": min(99.0, round(total_cpu / 3, 1)),  # Normalize CPU across cores
        "timestamp": datetime.utcnow().isoformat()
    }


@router.get("/performance-history")
def get_performance_history():
    """Get historical performance data for graphing."""
    return {
        "history": config.performance_history,
        "max_memory": config.MAX_MEMORY
    }


@router.get("/startup-processes")
def get_startup_processes():
    """Get list of processes configured to start on boot."""
    # Reload from database to ensure consistency
    config.startup_processes = load_startup_processes()
    return {
        "startup_processes": config.startup_processes
    }


@router.post("/startup-processes/add")
def add_startup_process(app_name: str = Query(..., min_length=1, max_length=64)):
    """Add an app to startup process list."""
    # Save to database
    save_startup_process(app_name, enabled=True)
    
    # Update in-memory config
    if app_name not in config.startup_processes:
        config.startup_processes.append(app_name)
    
    return {"status": "added", "app": app_name, "startup_processes": config.startup_processes}


@router.delete("/startup-processes/remove")
def remove_startup_process_endpoint(app_name: str = Query(..., min_length=1)):
    """Remove an app from startup process list."""
    # Save to database (sets enabled=0)
    db_remove_startup_process(app_name)
    
    # Update in-memory config
    if app_name in config.startup_processes:
        config.startup_processes.remove(app_name)
    
    return {"status": "removed", "app": app_name, "startup_processes": config.startup_processes}


@router.get("/storage")
def get_storage_info():
    """Get filesystem storage usage information."""
    from database import get_db_connection
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Count total files and directories
    cursor.execute("SELECT COUNT(*) as count, node_type FROM fs_nodes GROUP BY node_type")
    counts = {row["node_type"]: row["count"] for row in cursor.fetchall()}
    
    # Calculate total storage used (sum of file sizes from new size column)
    cursor.execute("SELECT SUM(size) as total_size FROM fs_nodes WHERE node_type = 'file'")
    result = cursor.fetchone()
    file_storage_bytes = result["total_size"] or 0
    
    # Calculate app storage - handle if column doesn't exist
    app_storage_bytes = 0
    app_count = 0
    try:
        cursor.execute("SELECT SUM(storage_size_mb) as total_app_size, COUNT(*) as app_count FROM apps WHERE installed = 1")
        result = cursor.fetchone()
        app_storage_mb = result["total_app_size"] or 0
        app_count = result["app_count"] or 0
        app_storage_bytes = app_storage_mb * 1024 * 1024
    except:
        # If storage_size_mb column doesn't exist yet, skip app storage calculation
        app_storage_bytes = 0
        app_count = 0
    
    # Get storage by directory
    cursor.execute("""
        SELECT 
            CASE 
                WHEN path LIKE '/home/user/Desktop/%' OR path = '/home/user/Desktop' THEN 'Desktop'
                WHEN path LIKE '/home/user/Downloads/%' OR path = '/home/user/Downloads' THEN 'Downloads'
                WHEN path LIKE '/home/user/Documents/%' OR path = '/home/user/Documents' THEN 'Documents'
                WHEN path LIKE '/home/user/Pictures/%' OR path = '/home/user/Pictures' THEN 'Pictures'
                WHEN path LIKE '/home/user/Music/%' OR path = '/home/user/Music' THEN 'Music'
                WHEN path LIKE '/home/user/Videos/%' OR path = '/home/user/Videos' THEN 'Videos'
                WHEN path LIKE '/home/user/notes/%' OR path = '/home/user/notes' THEN 'Notes'
                ELSE 'Other'
            END as category,
            SUM(size) as size,
            COUNT(*) as file_count
        FROM fs_nodes 
        WHERE node_type = 'file'
        GROUP BY category
    """)
    
    storage_by_category = {}
    for row in cursor.fetchall():
        storage_by_category[row["category"]] = {
            "bytes": row["size"] or 0,
            "files": row["file_count"]
        }
    
    # Add Apps category to storage breakdown
    if app_storage_bytes > 0:
        storage_by_category["Apps"] = {
            "bytes": app_storage_bytes,
            "files": app_count  # Show number of installed apps
        }
    
    conn.close()
    
    # Set total disk capacity to 256 GB
    total_capacity = 256 * 1024 * 1024 * 1024  # 256 GB in bytes
    total_used_bytes = file_storage_bytes + app_storage_bytes
    free_bytes = total_capacity - total_used_bytes
    
    return {
        "total_capacity_bytes": total_capacity,
        "used_bytes": total_used_bytes,
        "free_bytes": free_bytes,
        "usage_percent": round((total_used_bytes / total_capacity) * 100, 2),
        "file_count": counts.get("file", 0),
        "directory_count": counts.get("dir", 0),
        "storage_by_category": storage_by_category
    }


@router.get("/disk-management")
def get_disk_management():
    """Get detailed disk management information."""
    from database import get_db_connection
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Get all directories and their sizes
    cursor.execute("""
        SELECT 
            path,
            node_type,
            COUNT(*) as count,
            SUM(size) as total_size
        FROM fs_nodes
        GROUP BY path, node_type
        ORDER BY total_size DESC
        LIMIT 50
    """)
    
    disk_items = []
    for row in cursor.fetchall():
        disk_items.append({
            "path": row["path"],
            "type": row["node_type"],
            "count": row["count"],
            "size_bytes": row["total_size"] or 0,
            "size_mb": round((row["total_size"] or 0) / (1024 * 1024), 2)
        })
    
    # Get volume information
    total_capacity = 256 * 1024 * 1024 * 1024  # 256 GB
    
    cursor.execute("SELECT SUM(size) as total FROM fs_nodes WHERE node_type = 'file'")
    result = cursor.fetchone()
    used_bytes = result["total"] or 0
    
    free_bytes = total_capacity - used_bytes
    
    conn.close()
    
    return {
        "volumes": [
            {
                "drive": "C:",
                "total_bytes": total_capacity,
                "used_bytes": used_bytes,
                "free_bytes": free_bytes,
                "usage_percent": round((used_bytes / total_capacity) * 100, 2),
                "type": "SSD"
            }
        ],
        "disk_items": disk_items
    }


@router.get("/users")
def get_system_users():
    """Get system users list."""
    from database import get_db_connection
    
    users = [
        {
            "id": 1,
            "username": "user",
            "full_name": "System User",
            "status": "logged_in",
            "type": "Standard"
        },
        {
            "id": 2,
            "username": "admin",
            "full_name": "Administrator",
            "status": "logged_out",
            "type": "Administrator"
        },
        {
            "id": 3,
            "username": "guest",
            "full_name": "Guest User",
            "status": "logged_out",
            "type": "Guest"
        }
    ]
    
    return {"users": users}


@router.get("/services")
def get_system_services():
    """Get system services list."""
    services = [
        {
            "name": "System Scheduler",
            "description": "Manages CPU scheduling and process execution",
            "status": "running",
            "startup_type": "automatic",
            "pid": 1
        },
        {
            "name": "Filesystem Service",
            "description": "Manages file system operations and storage",
            "status": "running",
            "startup_type": "automatic",
            "pid": 2
        },
        {
            "name": "Memory Manager",
            "description": "Handles memory allocation and management",
            "status": "running",
            "startup_type": "automatic",
            "pid": 3
        },
        {
            "name": "I/O Manager",
            "description": "Manages input/output operations and devices",
            "status": "running",
            "startup_type": "automatic",
            "pid": 4
        },
        {
            "name": "Network Service",
            "description": "Handles network communications",
            "status": "running",
            "startup_type": "automatic",
            "pid": 5
        },
        {
            "name": "Event Logger",
            "description": "Records system events and logs",
            "status": "running",
            "startup_type": "automatic",
            "pid": 6
        },
        {
            "name": "Security Service",
            "description": "Manages security and permissions",
            "status": "running",
            "startup_type": "automatic",
            "pid": 7
        },
        {
            "name": "Update Service",
            "description": "Checks for system updates",
            "status": "running",
            "startup_type": "automatic",
            "pid": 8
        }
    ]
    
    return {"services": services}


@router.get("/app-history")
def get_app_history():
    """Get application usage history."""
    from database import get_db_connection
    from datetime import datetime, timedelta
    
    # Generate mock app history data
    app_history = [
        {
            "app_name": "File Explorer",
            "last_opened": (datetime.now() - timedelta(hours=1)).isoformat(),
            "total_runtime_hours": 12.5,
            "open_count": 45,
            "status": "running"
        },
        {
            "app_name": "Terminal",
            "last_opened": (datetime.now() - timedelta(hours=2)).isoformat(),
            "total_runtime_hours": 8.3,
            "open_count": 28,
            "status": "closed"
        },
        {
            "app_name": "Calculator",
            "last_opened": (datetime.now() - timedelta(hours=3)).isoformat(),
            "total_runtime_hours": 2.1,
            "open_count": 12,
            "status": "closed"
        },
        {
            "app_name": "Notes",
            "last_opened": (datetime.now() - timedelta(hours=0, minutes=30)).isoformat(),
            "total_runtime_hours": 15.7,
            "open_count": 67,
            "status": "running"
        },
        {
            "app_name": "System Monitor",
            "last_opened": (datetime.now() - timedelta(hours=0, minutes=5)).isoformat(),
            "total_runtime_hours": 3.2,
            "open_count": 18,
            "status": "running"
        }
    ]
    
    return {"app_history": app_history}


@router.get("/details")
def get_system_details():
    """Get detailed system information."""
    import platform
    from datetime import datetime
    
    return {
        "device_name": "JezOS-System",
        "os_name": "JezOS",
        "os_version": "1.0.0",
        "build": "Build 24621",
        "platform": platform.system(),
        "processor": "Virtual Processor",
        "ram": {
            "total_gb": 0.5,
            "installed_gb": 0.5
        },
        "system_type": "64-bit",
        "boot_time": (datetime.now() - timedelta(hours=8)).isoformat(),
        "uptime_hours": 8,
        "registered_user": "User",
        "organization": "JezOS"
    }
