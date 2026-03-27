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
    running_procs = [p for p in config.process_table if p.state == "running"]
    used_memory = sum(p.memory for p in running_procs)
    total_cpu = sum(p.cpu_usage for p in running_procs)
    
    # Update CPU usage for running processes (simulate fluctuation)
    for index, record in enumerate(config.process_table):
        if record.state == "running":
            # Add small random variation to CPU
            variation = random.uniform(-5, 5)
            new_cpu = max(0.1, min(99.0, record.cpu_usage + variation))
            config.process_table[index] = record.model_copy(update={"cpu_usage": round(new_cpu, 1)})
    
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

