"""Process management endpoints."""

from typing import Optional

from fastapi import APIRouter, Header, HTTPException, Query
from datetime import datetime
import random
from models import ProcessStartRequest, ProcessRecord
from event_logger import (
    log_event, LEVEL_INFORMATION, LEVEL_WARNING, LEVEL_ERROR,
    CATEGORY_SYSTEM, EVENT_PROCESS_START, EVENT_PROCESS_KILL, EVENT_MEMORY_WARNING
)
import config

router = APIRouter(prefix="/process", tags=["processes"])


def resolve_device_id(device_id: Optional[str], x_jezos_device_id: Optional[str]) -> Optional[str]:
    return device_id or x_jezos_device_id


def _terminate_pid_in_state(state: dict, pid: int) -> Optional[ProcessRecord]:
    process_table = list(state["process_table"])
    for index, record in enumerate(process_table):
        if record.pid == pid and record.state == "running":
            updated = record.model_copy(update={"state": "terminated"})
            process_table[index] = updated
            state["process_table"] = process_table
            return updated
    return None


@router.get("/list", response_model=list[ProcessRecord])
def list_processes(
    session_token: Optional[str] = Header(None),
    x_jezos_device_id: Optional[str] = Header(None),
    device_id: Optional[str] = Query(None)
):
    """Get list of all processes."""
    runtime_device_id = resolve_device_id(device_id, x_jezos_device_id)
    state = config.get_runtime_state(session_token=session_token, device_id=runtime_device_id)
    return state["process_table"]


@router.post("/start")
def start_process(
    payload: ProcessStartRequest,
    session_token: Optional[str] = Header(None),
    x_jezos_device_id: Optional[str] = Header(None),
    device_id: Optional[str] = Query(None)
):
    """Start a new process."""
    runtime_device_id = resolve_device_id(device_id, x_jezos_device_id)
    state = config.get_runtime_state(session_token=session_token, device_id=runtime_device_id)
    process_table = list(state["process_table"])

    # Calculate current memory usage
    used_memory = sum(p.memory for p in process_table if p.state == "running")
    
    # Reject the launch instead of silently terminating other apps.
    if used_memory + payload.memory > config.MAX_MEMORY:
        raise HTTPException(
            status_code=507,
            detail=f"Insufficient memory: {used_memory + payload.memory}/{config.MAX_MEMORY} MB"
        )
    
    # Simulate CPU usage per process (memory-based + random)
    base_cpu = (payload.memory / config.MAX_MEMORY) * 30  # 0-30% based on memory
    cpu_usage = round(base_cpu + random.uniform(0, 15), 1)  # Add 0-15% random variation
    
    # Check if this is a startup process
    is_startup = payload.app in config.startup_processes
    
    record = ProcessRecord(
        pid=state["next_pid"],
        app=payload.app,
        memory=payload.memory,
        state="running",
        cpu_usage=cpu_usage,
        start_time=datetime.utcnow().isoformat(),
        is_startup=is_startup
    )
    state["next_pid"] += 1
    process_table.append(record)
    state["process_table"] = process_table
    
    # Log process start event
    log_event(
        level=LEVEL_INFORMATION,
        category=CATEGORY_SYSTEM,
        source="ProcessManager",
        event_id=EVENT_PROCESS_START,
        message=f"Process started: {payload.app} (PID: {record.pid})",
        details={
            "pid": record.pid,
            "app": payload.app,
            "memory": payload.memory,
            "is_startup": is_startup
        }
    )
    
    # Log memory warning if killed processes
    # Capture performance snapshot
    from routers.system import update_performance_history
    update_performance_history(session_token=session_token, device_id=runtime_device_id)

    config.commit_runtime_state(state, session_token=session_token, device_id=runtime_device_id)
    
    response_data = record.model_dump()
    return response_data


@router.post("/kill", response_model=ProcessRecord)
def kill_process(
    pid: int = Query(..., ge=1),
    session_token: Optional[str] = Header(None),
    x_jezos_device_id: Optional[str] = Header(None),
    device_id: Optional[str] = Query(None)
):
    """Kill a process by PID."""
    runtime_device_id = resolve_device_id(device_id, x_jezos_device_id)
    state = config.get_runtime_state(session_token=session_token, device_id=runtime_device_id)

    updated = _terminate_pid_in_state(state, pid)
    if updated is not None:
        log_event(
            level=LEVEL_INFORMATION,
            category=CATEGORY_SYSTEM,
            source="ProcessManager",
            event_id=EVENT_PROCESS_KILL,
            message=f"Process terminated: {updated.app} (PID: {pid})",
            details={
                "pid": pid,
                "app": updated.app,
                "memory_freed": updated.memory
            }
        )

        from routers.system import update_performance_history
        update_performance_history(session_token=session_token, device_id=runtime_device_id)
        config.commit_runtime_state(state, session_token=session_token, device_id=runtime_device_id)
        return updated
    raise HTTPException(status_code=404, detail="Process not found")


@router.post("/force-kill")
def force_kill_process(
    pid: int = Query(..., ge=1),
    session_token: Optional[str] = Header(None),
    x_jezos_device_id: Optional[str] = Header(None),
    device_id: Optional[str] = Query(None)
):
    """Force kill a process, even if it's protected (startup process)."""
    runtime_device_id = resolve_device_id(device_id, x_jezos_device_id)
    state = config.get_runtime_state(session_token=session_token, device_id=runtime_device_id)

    updated = _terminate_pid_in_state(state, pid)
    if updated is not None:
        from routers.system import update_performance_history
        update_performance_history(session_token=session_token, device_id=runtime_device_id)
        config.commit_runtime_state(state, session_token=session_token, device_id=runtime_device_id)
        return {"status": "terminated", "pid": pid, "forced": True}
    raise HTTPException(status_code=404, detail="Process not found")


@router.post("/kill-by-app")
def kill_processes_by_app(
    app_name: str = Query(..., min_length=1, max_length=128),
    session_token: Optional[str] = Header(None),
    x_jezos_device_id: Optional[str] = Header(None),
    device_id: Optional[str] = Query(None)
):
    """Kill all running processes for a given app name."""
    runtime_device_id = resolve_device_id(device_id, x_jezos_device_id)
    state = config.get_runtime_state(session_token=session_token, device_id=runtime_device_id)
    normalized_app_name = app_name.strip().lower()

    terminated = []
    for record in list(state["process_table"]):
        if record.state != "running":
            continue
        if record.app.strip().lower() != normalized_app_name:
            continue

        updated = _terminate_pid_in_state(state, record.pid)
        if updated is not None:
            terminated.append(updated)

    if not terminated:
        raise HTTPException(status_code=404, detail="No running process found for app")

    from routers.system import update_performance_history
    update_performance_history(session_token=session_token, device_id=runtime_device_id)
    config.commit_runtime_state(state, session_token=session_token, device_id=runtime_device_id)

    return {
        "status": "terminated",
        "app": app_name,
        "terminated_pids": [record.pid for record in terminated],
        "count": len(terminated)
    }


@router.post("/force-kill-by-app")
def force_kill_processes_by_app(
    app_name: str = Query(..., min_length=1, max_length=128),
    session_token: Optional[str] = Header(None),
    x_jezos_device_id: Optional[str] = Header(None),
    device_id: Optional[str] = Query(None)
):
    """Force kill all running processes for a given app name."""
    runtime_device_id = resolve_device_id(device_id, x_jezos_device_id)
    state = config.get_runtime_state(session_token=session_token, device_id=runtime_device_id)
    normalized_app_name = app_name.strip().lower()

    terminated_pids = []
    for record in list(state["process_table"]):
        if record.state != "running":
            continue
        if record.app.strip().lower() != normalized_app_name:
            continue

        updated = _terminate_pid_in_state(state, record.pid)
        if updated is not None:
            terminated_pids.append(updated.pid)

    if not terminated_pids:
        raise HTTPException(status_code=404, detail="No running process found for app")

    from routers.system import update_performance_history
    update_performance_history(session_token=session_token, device_id=runtime_device_id)
    config.commit_runtime_state(state, session_token=session_token, device_id=runtime_device_id)

    return {
        "status": "terminated",
        "forced": True,
        "app": app_name,
        "terminated_pids": terminated_pids,
        "count": len(terminated_pids)
    }
