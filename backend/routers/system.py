"""System resources and performance monitoring endpoints."""

from typing import Optional

from fastapi import APIRouter, Header, Query, HTTPException
from datetime import datetime, timedelta
import random
from pydantic import BaseModel, Field
import config
from database import (
    load_startup_processes,
    save_startup_process,
    remove_startup_process as db_remove_startup_process
)

router = APIRouter(prefix="/system", tags=["system"])


class GpuPerformanceModeRequest(BaseModel):
    mode: str = Field(..., pattern="^(standard|eco|optimized)$")


class GpuPerformanceNotificationRequest(BaseModel):
    enabled: bool


ARMOURY_CRATE_GPU_STATE = {
    "mode": "eco",
    "notifications_enabled": True
}

GIB = 1024 * 1024 * 1024
TOTAL_DISK_CAPACITY_BYTES = 512 * GIB

DISK_SCHEDULER_STATE = {
    "policy": "FCFS",
    "direction": "right",
    "head_track": 96
}

DISK_PARTITION_STATE = [
    {
        "drive": "C:",
        "label": "System",
        "file_system": "NTFS",
        "type": "Primary",
        "total_bytes": 360 * GIB,
        "usage_ratio": 0.0
    },
    {
        "drive": "D:",
        "label": "Data",
        "file_system": "NTFS",
        "type": "Primary",
        "total_bytes": 128 * GIB,
        "usage_ratio": 0.0
    },
    {
        "drive": "R:",
        "label": "Recovery",
        "file_system": "FAT32",
        "type": "Recovery",
        "total_bytes": 24 * GIB,
        "usage_ratio": 0.45
    }
]


class DiskSchedulerUpdateRequest(BaseModel):
    policy: str = Field(..., pattern="^(FCFS|SSTF|SCAN|C-SCAN)$")
    direction: str = Field("right", pattern="^(left|right)$")


class DiskPartitionCreateRequest(BaseModel):
    label: str = Field(..., min_length=1, max_length=24)
    size_gb: float = Field(..., gt=1.0, le=128.0)
    file_system: str = Field("NTFS", pattern="^(NTFS|exFAT|FAT32)$")


class DiskPartitionResizeRequest(BaseModel):
    size_gb: float = Field(..., gt=1.0, le=256.0)


class DiskPartitionFormatRequest(BaseModel):
    file_system: str = Field(..., pattern="^(NTFS|exFAT|FAT32)$")


def _clamp(value: float, lower: float, upper: float) -> float:
    return max(lower, min(upper, value))


def _next_drive_letter() -> str:
    used_letters = {partition["drive"][0].upper() for partition in DISK_PARTITION_STATE}
    for letter in "EFGHIJKLMNOPQSTUVWXYZ":
        if letter not in used_letters:
            return f"{letter}:"
    raise HTTPException(status_code=400, detail="No drive letters available for new partition")


def _find_partition_or_404(drive: str) -> dict:
    drive_key = drive.upper().replace("\\", "").replace("/", "")
    if not drive_key.endswith(":"):
        drive_key = f"{drive_key}:"

    for partition in DISK_PARTITION_STATE:
        if partition["drive"].upper() == drive_key:
            return partition

    raise HTTPException(status_code=404, detail=f"Partition {drive_key} not found")


def _is_protected_partition(partition: dict) -> bool:
    return partition["drive"].upper() == "C:" or partition.get("type") == "Recovery"


def _compute_storage_snapshot(file_storage_bytes: int, app_storage_bytes: int, file_count: int, directory_count: int):
    """Build a realistic storage profile so the simulated OS reports GB-scale usage."""
    simulated_os_bytes = 68 * GIB
    simulated_swap_bytes = 16 * GIB
    simulated_recovery_bytes = 14 * GIB
    simulated_update_cache_bytes = int(_clamp((file_count * 85 + directory_count * 32) * 1024 * 1024, 6 * GIB, 28 * GIB))
    simulated_logs_bytes = int(_clamp((file_count * 2.5) * 1024 * 1024, 1 * GIB, 8 * GIB))

    effective_user_bytes = max(file_storage_bytes, 3 * GIB)
    effective_apps_bytes = max(app_storage_bytes, 10 * GIB)

    category_totals = {
        "System": simulated_os_bytes + simulated_swap_bytes,
        "Recovery": simulated_recovery_bytes,
        "Updates": simulated_update_cache_bytes,
        "Logs": simulated_logs_bytes,
        "User Data": effective_user_bytes,
        "Apps": effective_apps_bytes
    }

    total_used_bytes = sum(category_totals.values())
    if total_used_bytes > TOTAL_DISK_CAPACITY_BYTES:
        overflow = total_used_bytes - TOTAL_DISK_CAPACITY_BYTES
        category_totals["Updates"] = max(2 * GIB, category_totals["Updates"] - overflow)
        total_used_bytes = sum(category_totals.values())

    free_bytes = max(0, TOTAL_DISK_CAPACITY_BYTES - total_used_bytes)
    usage_percent = round((total_used_bytes / TOTAL_DISK_CAPACITY_BYTES) * 100, 2)

    return {
        "total_capacity_bytes": TOTAL_DISK_CAPACITY_BYTES,
        "total_used_bytes": total_used_bytes,
        "free_bytes": free_bytes,
        "usage_percent": usage_percent,
        "category_totals": category_totals
    }


def _build_partition_view(total_used_bytes: int):
    partition_capacity_total = sum(partition["total_bytes"] for partition in DISK_PARTITION_STATE)
    if partition_capacity_total <= 0:
        return []

    partitions = []
    for partition in DISK_PARTITION_STATE:
        baseline_ratio = partition.get("usage_ratio", 0.0)
        weighted_used_bytes = int(total_used_bytes * (partition["total_bytes"] / partition_capacity_total))
        baseline_used_bytes = int(partition["total_bytes"] * baseline_ratio)
        used_bytes = int(_clamp(max(weighted_used_bytes, baseline_used_bytes), 0, partition["total_bytes"]))
        free_bytes = partition["total_bytes"] - used_bytes
        usage_percent = round((used_bytes / partition["total_bytes"]) * 100, 2) if partition["total_bytes"] else 0.0

        partitions.append(
            {
                "drive": partition["drive"],
                "label": partition["label"],
                "file_system": partition["file_system"],
                "type": partition["type"],
                "total_bytes": partition["total_bytes"],
                "used_bytes": used_bytes,
                "free_bytes": free_bytes,
                "usage_percent": usage_percent,
                "is_protected": _is_protected_partition(partition),
                "health": "Healthy" if free_bytes > (0.08 * partition["total_bytes"]) else "Warning"
            }
        )

    return partitions


def _track_for_path(path: str, max_track: int = 199) -> int:
    """Map a path to a deterministic disk track for scheduler simulation."""
    rolling = 0
    for idx, ch in enumerate(path):
        rolling += (idx + 1) * ord(ch)
    return rolling % (max_track + 1)


def _build_disk_request_queue(disk_items, max_track: int = 199):
    requests = []
    for item in disk_items[:16]:
        requests.append(
            {
                "path": item["path"],
                "track": _track_for_path(item["path"], max_track=max_track),
                "size_bytes": item["size_bytes"],
                "type": item["type"]
            }
        )

    if requests:
        return requests

    return [
        {"path": "/system", "track": 12, "size_bytes": 6 * 1024 * 1024, "type": "dir"},
        {"path": "/users", "track": 38, "size_bytes": 12 * 1024 * 1024, "type": "dir"},
        {"path": "/apps", "track": 74, "size_bytes": 8 * 1024 * 1024, "type": "dir"},
        {"path": "/var/log", "track": 116, "size_bytes": 3 * 1024 * 1024, "type": "dir"},
        {"path": "/backup", "track": 149, "size_bytes": 18 * 1024 * 1024, "type": "dir"},
        {"path": "/recovery", "track": 182, "size_bytes": 5 * 1024 * 1024, "type": "dir"}
    ]


def _simulate_disk_schedule(policy: str, requests, head_track: int, direction: str = "right", max_track: int = 199):
    """Simulate disk-head movement for common scheduling algorithms."""
    queue = list(requests)
    if not queue:
        return {
            "head_start_track": head_track,
            "head_end_track": head_track,
            "service_order": [],
            "head_path": [head_track],
            "total_seek_tracks": 0,
            "average_seek_tracks": 0.0,
            "request_count": 0
        }

    if policy == "FCFS":
        service_order = queue
        head_path = [head_track] + [item["track"] for item in service_order]
    elif policy == "SSTF":
        pending = list(queue)
        service_order = []
        current = head_track
        while pending:
            nearest = min(pending, key=lambda item: (abs(item["track"] - current), item["track"]))
            service_order.append(nearest)
            current = nearest["track"]
            pending.remove(nearest)
        head_path = [head_track] + [item["track"] for item in service_order]
    else:
        left = sorted([item for item in queue if item["track"] < head_track], key=lambda item: item["track"])
        right = sorted([item for item in queue if item["track"] >= head_track], key=lambda item: item["track"])
        moving_right = direction == "right"
        head_path = [head_track]

        if policy == "SCAN":
            if moving_right:
                service_order = right + list(reversed(left))
                if right:
                    head_path.extend([item["track"] for item in right])
                if left:
                    if head_path[-1] != max_track:
                        head_path.append(max_track)
                    head_path.extend([item["track"] for item in reversed(left)])
            else:
                service_order = list(reversed(left)) + right
                if left:
                    head_path.extend([item["track"] for item in reversed(left)])
                if right:
                    if head_path[-1] != 0:
                        head_path.append(0)
                    head_path.extend([item["track"] for item in right])
        else:  # C-SCAN
            if moving_right:
                service_order = right + left
                if right:
                    head_path.extend([item["track"] for item in right])
                if left:
                    if head_path[-1] != max_track:
                        head_path.append(max_track)
                    head_path.append(0)
                    head_path.extend([item["track"] for item in left])
            else:
                descending_right = list(reversed(right))
                descending_left = list(reversed(left))
                service_order = descending_left + descending_right
                if descending_left:
                    head_path.extend([item["track"] for item in descending_left])
                if descending_right:
                    if head_path[-1] != 0:
                        head_path.append(0)
                    head_path.append(max_track)
                    head_path.extend([item["track"] for item in descending_right])

    total_seek = 0
    for index in range(1, len(head_path)):
        total_seek += abs(head_path[index] - head_path[index - 1])

    return {
        "head_start_track": head_track,
        "head_end_track": head_path[-1] if head_path else head_track,
        "service_order": service_order,
        "head_path": head_path,
        "total_seek_tracks": total_seek,
        "average_seek_tracks": round(total_seek / max(1, len(service_order)), 2),
        "request_count": len(service_order)
    }

GPU_MODE_DEFINITIONS = {
    "standard": {
        "id": "standard",
        "title": "Standard",
        "summary": "[Windows Default] Also known as MSHybrid. Automatically switches to the discrete GPU for demanding applications, and the integrated graphics for everyday tasks."
    },
    "eco": {
        "id": "eco",
        "title": "Eco Mode",
        "summary": "The discrete GPU is completely disabled for maximum energy savings, lower temperatures, and less noise. You can still use essential apps through the integrated graphics simulation."
    },
    "optimized": {
        "id": "optimized",
        "title": "Optimized",
        "summary": "[Recommended] Automatically switches to the discrete GPU for demanding applications, and the integrated graphics for lighter workloads."
    }
}

GPU_VISIBLE_APP_WEIGHTS = {
    "Web Browser": 1.0,
    "Camera": 0.95,
    "Files": 0.42,
    "Local Files": 0.48,
    "App Store": 0.36,
    "System Monitor": 0.54,
    "Event Viewer": 0.18,
    "Armoury Crate": 0.2,
    "Settings": 0.16,
    "Notes": 0.14,
    "Clock": 0.1,
    "Calendar": 0.12,
    "Calculator": 0.08,
    "Tips": 0.1
}

GPU_HIDDEN_APPS = {"System", "Kernel Services", "Terminal"}


def resolve_device_id(device_id: Optional[str], x_jezos_device_id: Optional[str]) -> Optional[str]:
    return device_id or x_jezos_device_id


def build_gpu_candidate_processes(session_token: Optional[str] = None, device_id: Optional[str] = None):
    """Build a simulated list of applications that can engage the dGPU."""
    if ARMOURY_CRATE_GPU_STATE["mode"] == "eco":
        return []

    state = config.get_runtime_state(session_token=session_token, device_id=device_id)
    candidates = []
    for record in state["process_table"]:
        if record.state != "running" or record.app in GPU_HIDDEN_APPS or record.is_startup:
            continue

        weight = GPU_VISIBLE_APP_WEIGHTS.get(record.app)
        demand_score = (
            (weight if weight is not None else 0.0)
            + min(record.cpu_usage / 100.0, 0.55)
            + min(record.memory / config.MAX_MEMORY, 0.45)
        )

        if demand_score < 0.38:
            continue

        candidates.append(
            {
                "pid": record.pid,
                "app": record.app,
                "cpu_usage": round(record.cpu_usage, 1),
                "memory": record.memory,
                "gpu_score": round(min(demand_score, 1.95), 2)
            }
        )

    return sorted(candidates, key=lambda item: (item["memory"], item["cpu_usage"]), reverse=True)


def build_gpu_performance_state(session_token: Optional[str] = None, device_id: Optional[str] = None):
    """Return the current Armoury Crate GPU performance simulation state."""
    processes = build_gpu_candidate_processes(session_token=session_token, device_id=device_id)
    mode = ARMOURY_CRATE_GPU_STATE["mode"]

    if mode == "eco":
        status_message = "The system is currently running in GPU-Eco mode."
    elif processes:
        status_message = f"{len(processes)} application(s) can still engage the discrete GPU in {GPU_MODE_DEFINITIONS[mode]['title']}."
    else:
        status_message = f"No active applications are currently engaging the discrete GPU in {GPU_MODE_DEFINITIONS[mode]['title']}."

    return {
        "mode": mode,
        "reminderNotificationsEnabled": ARMOURY_CRATE_GPU_STATE["notifications_enabled"],
        "statusMessage": status_message,
        "modes": list(GPU_MODE_DEFINITIONS.values()),
        "processes": processes,
        "updatedAt": datetime.utcnow().isoformat() + "Z"
    }


def update_performance_history(session_token: Optional[str] = None, device_id: Optional[str] = None):
    """Internal helper to capture current system performance snapshot."""
    state = config.get_runtime_state(session_token=session_token, device_id=device_id)
    running_procs = [p for p in state["process_table"] if p.state == "running"]
    used_memory = sum(p.memory for p in running_procs)
    total_cpu = sum(p.cpu_usage for p in running_procs)
    process_pressure = min(24.0, len(running_procs) * 2.8)
    aggregate_cpu = min(99.0, total_cpu * 0.8 + process_pressure)
    
    snapshot = {
        "timestamp": datetime.utcnow().isoformat(),
        "cpu_usage": round(aggregate_cpu, 1),
        "memory_used": used_memory,
        "memory_percent": round((used_memory / config.MAX_MEMORY) * 100, 1),
        "process_count": len(running_procs)
    }
    
    history = list(state["performance_history"])
    history.append(snapshot)
    
    # Keep only recent history
    if len(history) > config.MAX_HISTORY_SIZE:
        history.pop(0)

    state["performance_history"] = history
    config.commit_runtime_state(state, session_token=session_token, device_id=device_id)


@router.get("/resources")
def get_system_resources(
    session_token: Optional[str] = Header(None),
    x_jezos_device_id: Optional[str] = Header(None),
    device_id: Optional[str] = Query(None)
):
    """Get current system resource usage."""
    runtime_device_id = resolve_device_id(device_id, x_jezos_device_id)
    state = config.get_runtime_state(session_token=session_token, device_id=runtime_device_id)
    process_table = list(state["process_table"])

    # Update CPU usage for running processes with smoothing to avoid visual flicker.
    for index, record in enumerate(process_table):
        if record.state == "running":
            process_load_factor = min(1.0, len(process_table) / 10)
            memory_weight = (record.memory / config.MAX_MEMORY) * 58
            target_cpu = max(1.5, min(95.0, memory_weight + process_load_factor * 18 + random.uniform(3.0, 12.0)))
            smooth_cpu = (record.cpu_usage * 0.68) + (target_cpu * 0.32)
            new_cpu = max(0.8, min(99.0, smooth_cpu + random.uniform(-1.5, 2.5)))
            process_table[index] = record.model_copy(update={"cpu_usage": round(new_cpu, 1)})

    # Recompute totals after updating process CPU values.
    state["process_table"] = process_table
    running_procs = [p for p in process_table if p.state == "running"]
    used_memory = sum(p.memory for p in running_procs)
    total_cpu = sum(p.cpu_usage for p in running_procs)
    process_pressure = min(24.0, len(running_procs) * 2.8)
    aggregate_cpu = min(99.0, total_cpu * 0.8 + process_pressure)

    # Keep history fresh on each resource poll so performance charts evolve over time.
    update_performance_history(session_token=session_token, device_id=runtime_device_id)
    config.commit_runtime_state(state, session_token=session_token, device_id=runtime_device_id)
    
    return {
        "maxMemory": config.MAX_MEMORY,
        "usedMemory": used_memory,
        "availableMemory": config.MAX_MEMORY - used_memory,
        "memoryUsagePercent": (used_memory / config.MAX_MEMORY) * 100,
        "processCount": len(running_procs),
        "cpuUsage": round(aggregate_cpu, 1),
        "timestamp": datetime.utcnow().isoformat()
    }


@router.get("/performance-history")
def get_performance_history(
    session_token: Optional[str] = Header(None),
    x_jezos_device_id: Optional[str] = Header(None),
    device_id: Optional[str] = Query(None)
):
    """Get historical performance data for graphing."""
    runtime_device_id = resolve_device_id(device_id, x_jezos_device_id)
    state = config.get_runtime_state(session_token=session_token, device_id=runtime_device_id)
    return {
        "history": state["performance_history"],
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


@router.get("/gpu-performance")
def get_gpu_performance(
    session_token: Optional[str] = Header(None),
    x_jezos_device_id: Optional[str] = Header(None),
    device_id: Optional[str] = Query(None)
):
    """Get the simulated Armoury Crate GPU performance state."""
    runtime_device_id = resolve_device_id(device_id, x_jezos_device_id)
    return build_gpu_performance_state(session_token=session_token, device_id=runtime_device_id)


@router.post("/gpu-performance/mode")
def set_gpu_performance_mode(
    payload: GpuPerformanceModeRequest,
    session_token: Optional[str] = Header(None),
    x_jezos_device_id: Optional[str] = Header(None),
    device_id: Optional[str] = Query(None)
):
    """Update the active simulated GPU performance mode."""
    ARMOURY_CRATE_GPU_STATE["mode"] = payload.mode
    runtime_device_id = resolve_device_id(device_id, x_jezos_device_id)
    return build_gpu_performance_state(session_token=session_token, device_id=runtime_device_id)


@router.post("/gpu-performance/reminder")
def set_gpu_performance_reminder(
    payload: GpuPerformanceNotificationRequest,
    session_token: Optional[str] = Header(None),
    x_jezos_device_id: Optional[str] = Header(None),
    device_id: Optional[str] = Query(None)
):
    """Update Armoury Crate GPU reminder notifications."""
    ARMOURY_CRATE_GPU_STATE["notifications_enabled"] = payload.enabled
    runtime_device_id = resolve_device_id(device_id, x_jezos_device_id)
    return build_gpu_performance_state(session_token=session_token, device_id=runtime_device_id)


@router.post("/gpu-performance/stop-all")
def stop_all_gpu_processes(
    session_token: Optional[str] = Header(None),
    x_jezos_device_id: Optional[str] = Header(None),
    device_id: Optional[str] = Query(None)
):
    """Terminate all simulated processes currently eligible for dGPU use."""
    runtime_device_id = resolve_device_id(device_id, x_jezos_device_id)
    state = config.get_runtime_state(session_token=session_token, device_id=runtime_device_id)
    process_table = list(state["process_table"])
    gpu_process_ids = {
        process["pid"]
        for process in build_gpu_candidate_processes(session_token=session_token, device_id=runtime_device_id)
    }
    stopped_pids = []

    if gpu_process_ids:
        for index, record in enumerate(process_table):
            if record.pid in gpu_process_ids and record.state == "running":
                process_table[index] = record.model_copy(update={"state": "terminated"})
                stopped_pids.append(record.pid)

        state["process_table"] = process_table
        update_performance_history(session_token=session_token, device_id=runtime_device_id)
        config.commit_runtime_state(state, session_token=session_token, device_id=runtime_device_id)

    return {
        "stoppedPids": stopped_pids,
        "state": build_gpu_performance_state(session_token=session_token, device_id=runtime_device_id)
    }


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
    
    storage_snapshot = _compute_storage_snapshot(
        file_storage_bytes=file_storage_bytes,
        app_storage_bytes=app_storage_bytes,
        file_count=counts.get("file", 0),
        directory_count=counts.get("dir", 0)
    )

    category_totals = storage_snapshot["category_totals"]

    # Merge real folder breakdown into User Data to keep category details realistic.
    for key, value in storage_by_category.items():
        if key == "Apps":
            continue
        category_totals["User Data"] += value.get("bytes", 0)

    storage_by_category = {
        "System": {
            "bytes": category_totals["System"],
            "files": 12483
        },
        "Recovery": {
            "bytes": category_totals["Recovery"],
            "files": 132
        },
        "Updates": {
            "bytes": category_totals["Updates"],
            "files": 947
        },
        "Logs": {
            "bytes": category_totals["Logs"],
            "files": 1840
        },
        "User Data": {
            "bytes": category_totals["User Data"],
            "files": counts.get("file", 0)
        },
        "Apps": {
            "bytes": category_totals["Apps"],
            "files": app_count
        }
    }
    
    return {
        "total_capacity_bytes": storage_snapshot["total_capacity_bytes"],
        "used_bytes": storage_snapshot["total_used_bytes"],
        "free_bytes": storage_snapshot["free_bytes"],
        "usage_percent": storage_snapshot["usage_percent"],
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
    
    cursor.execute("SELECT SUM(size) as total FROM fs_nodes WHERE node_type = 'file'")
    result = cursor.fetchone()
    file_storage_bytes = result["total"] or 0

    app_storage_bytes = 0
    try:
        cursor.execute("SELECT SUM(storage_size_mb) as total_app_size FROM apps WHERE installed = 1")
        app_result = cursor.fetchone()
        app_storage_bytes = (app_result["total_app_size"] or 0) * 1024 * 1024
    except Exception:
        app_storage_bytes = 0

    storage_snapshot = _compute_storage_snapshot(
        file_storage_bytes=file_storage_bytes,
        app_storage_bytes=app_storage_bytes,
        file_count=0,
        directory_count=0
    )
    used_bytes = storage_snapshot["total_used_bytes"]
    free_bytes = storage_snapshot["free_bytes"]
    partitions = _build_partition_view(used_bytes)
    request_queue = _build_disk_request_queue(disk_items)
    schedule_summary = _simulate_disk_schedule(
        policy=DISK_SCHEDULER_STATE["policy"],
        requests=request_queue,
        head_track=DISK_SCHEDULER_STATE["head_track"],
        direction=DISK_SCHEDULER_STATE["direction"]
    )
    DISK_SCHEDULER_STATE["head_track"] = schedule_summary["head_end_track"]
    
    conn.close()

    return {
        "volumes": [
            {
                "drive": "C:",
                "total_bytes": storage_snapshot["total_capacity_bytes"],
                "used_bytes": used_bytes,
                "free_bytes": free_bytes,
                "usage_percent": storage_snapshot["usage_percent"],
                "type": "SSD"
            }
        ],
        "scheduler": {
            "policy": DISK_SCHEDULER_STATE["policy"],
            "direction": DISK_SCHEDULER_STATE["direction"],
            "head_track": DISK_SCHEDULER_STATE["head_track"],
            "supported_policies": ["FCFS", "SSTF", "SCAN", "C-SCAN"]
        },
        "schedule": schedule_summary,
        "request_queue": request_queue,
        "partitions": partitions,
        "unallocated_bytes": max(
            0,
            storage_snapshot["total_capacity_bytes"] - sum(partition["total_bytes"] for partition in DISK_PARTITION_STATE)
        ),
        "disk_items": disk_items
    }


@router.post("/disk-management/scheduler")
def update_disk_scheduler(payload: DiskSchedulerUpdateRequest):
    """Update the active disk scheduling mode used by the simulator."""
    DISK_SCHEDULER_STATE["policy"] = payload.policy
    DISK_SCHEDULER_STATE["direction"] = payload.direction

    return {
        "status": "updated",
        "scheduler": {
            "policy": DISK_SCHEDULER_STATE["policy"],
            "direction": DISK_SCHEDULER_STATE["direction"],
            "head_track": DISK_SCHEDULER_STATE["head_track"],
            "supported_policies": ["FCFS", "SSTF", "SCAN", "C-SCAN"]
        }
    }


@router.post("/disk-management/partitions")
def create_disk_partition(payload: DiskPartitionCreateRequest):
    """Create a simulated disk partition from remaining unallocated space."""
    requested_bytes = int(payload.size_gb * GIB)
    allocated_bytes = sum(partition["total_bytes"] for partition in DISK_PARTITION_STATE)
    unallocated_bytes = TOTAL_DISK_CAPACITY_BYTES - allocated_bytes

    if requested_bytes > unallocated_bytes:
        raise HTTPException(
            status_code=400,
            detail=f"Not enough unallocated space. Available: {round(unallocated_bytes / GIB, 2)} GB"
        )

    DISK_PARTITION_STATE.append(
        {
            "drive": _next_drive_letter(),
            "label": payload.label.strip(),
            "file_system": payload.file_system,
            "type": "Primary",
            "total_bytes": requested_bytes,
            "usage_ratio": 0.03
        }
    )

    return {
        "status": "created",
        "partition": DISK_PARTITION_STATE[-1],
        "unallocated_bytes": TOTAL_DISK_CAPACITY_BYTES - sum(partition["total_bytes"] for partition in DISK_PARTITION_STATE)
    }


@router.patch("/disk-management/partitions/{drive}/resize")
def resize_disk_partition(drive: str, payload: DiskPartitionResizeRequest):
    """Resize an existing simulated partition while respecting unallocated space."""
    partition = _find_partition_or_404(drive)
    if _is_protected_partition(partition):
        raise HTTPException(status_code=400, detail="System and recovery partitions cannot be resized.")

    requested_bytes = int(payload.size_gb * GIB)
    current_bytes = partition["total_bytes"]
    total_allocated = sum(item["total_bytes"] for item in DISK_PARTITION_STATE)
    unallocated = TOTAL_DISK_CAPACITY_BYTES - total_allocated

    if requested_bytes < int(current_bytes * partition.get("usage_ratio", 0.0)):
        raise HTTPException(status_code=400, detail="Requested size is smaller than current partition usage.")

    growth_bytes = requested_bytes - current_bytes
    if growth_bytes > unallocated:
        raise HTTPException(
            status_code=400,
            detail=f"Not enough unallocated space. Available: {round(unallocated / GIB, 2)} GB"
        )

    partition["total_bytes"] = requested_bytes

    return {
        "status": "resized",
        "partition": partition,
        "unallocated_bytes": TOTAL_DISK_CAPACITY_BYTES - sum(item["total_bytes"] for item in DISK_PARTITION_STATE)
    }


@router.post("/disk-management/partitions/{drive}/format")
def format_disk_partition(drive: str, payload: DiskPartitionFormatRequest):
    """Format a simulated partition by resetting file system and usage ratio."""
    partition = _find_partition_or_404(drive)
    if _is_protected_partition(partition):
        raise HTTPException(status_code=400, detail="System and recovery partitions cannot be formatted.")

    partition["file_system"] = payload.file_system
    partition["usage_ratio"] = 0.02

    return {
        "status": "formatted",
        "partition": partition
    }


@router.delete("/disk-management/partitions/{drive}")
def delete_disk_partition(drive: str):
    """Delete a simulated partition and return capacity back to unallocated space."""
    partition = _find_partition_or_404(drive)
    if _is_protected_partition(partition):
        raise HTTPException(status_code=400, detail="System and recovery partitions cannot be deleted.")

    DISK_PARTITION_STATE.remove(partition)

    return {
        "status": "deleted",
        "drive": partition["drive"],
        "unallocated_bytes": TOTAL_DISK_CAPACITY_BYTES - sum(item["total_bytes"] for item in DISK_PARTITION_STATE)
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
