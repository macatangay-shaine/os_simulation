"""Process management endpoints."""

from datetime import datetime
import random
from typing import Optional

from fastapi import APIRouter, Header, HTTPException, Query

import config
from event_logger import (
    CATEGORY_SYSTEM,
    EVENT_MEMORY_WARNING,
    EVENT_PROCESS_KILL,
    EVENT_PROCESS_START,
    LEVEL_INFORMATION,
    LEVEL_WARNING,
    log_event,
)
from models import ProcessRecord, ProcessStartRequest

router = APIRouter(prefix="/process", tags=["processes"])


def resolve_device_id(device_id: Optional[str], x_jezos_device_id: Optional[str]) -> Optional[str]:
    return device_id or x_jezos_device_id


@router.get("/list", response_model=list[ProcessRecord])
def list_processes(
    session_token: Optional[str] = Header(None),
    x_jezos_device_id: Optional[str] = Header(None),
    device_id: Optional[str] = Query(None),
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
    device_id: Optional[str] = Query(None),
):
    """Start a new process."""
    runtime_device_id = resolve_device_id(device_id, x_jezos_device_id)
    state = config.get_runtime_state(session_token=session_token, device_id=runtime_device_id)
    process_table = list(state["process_table"])

    used_memory = sum(proc.memory for proc in process_table if proc.state == "running")
    killed_pids = []

    if used_memory + payload.memory > config.MAX_MEMORY:
        background_procs = [
            proc
            for proc in process_table
            if proc.state == "running" and proc.app not in ["System Monitor", "Terminal"]
        ]
        background_procs.sort(key=lambda proc: proc.pid)

        for proc in background_procs:
            if used_memory + payload.memory <= config.MAX_MEMORY:
                break

            for index, record in enumerate(process_table):
                if record.pid == proc.pid:
                    process_table[index] = record.model_copy(update={"state": "terminated"})
                    used_memory -= proc.memory
                    killed_pids.append(proc.pid)
                    break

        if used_memory + payload.memory > config.MAX_MEMORY:
            raise HTTPException(
                status_code=507,
                detail=f"Insufficient memory: {used_memory + payload.memory}/{config.MAX_MEMORY} MB",
            )

    base_cpu = (payload.memory / config.MAX_MEMORY) * 30
    cpu_usage = round(base_cpu + random.uniform(0, 15), 1)
    is_startup = payload.app in config.startup_processes

    record = ProcessRecord(
        pid=state["next_pid"],
        app=payload.app,
        memory=payload.memory,
        state="running",
        cpu_usage=cpu_usage,
        start_time=datetime.utcnow().isoformat(),
        is_startup=is_startup,
    )

    state["next_pid"] += 1
    process_table.append(record)
    state["process_table"] = process_table

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
            "is_startup": is_startup,
        },
    )

    if killed_pids:
        log_event(
            level=LEVEL_WARNING,
            category=CATEGORY_SYSTEM,
            source="ProcessManager",
            event_id=EVENT_MEMORY_WARNING,
            message=f"Processes terminated due to memory constraints: {killed_pids}",
            details={
                "killed_pids": killed_pids,
                "new_process": payload.app,
                "memory_used": used_memory,
                "memory_max": config.MAX_MEMORY,
            },
        )

    from routers.system import update_performance_history

    update_performance_history(session_token=session_token, device_id=runtime_device_id)
    config.commit_runtime_state(state, session_token=session_token, device_id=runtime_device_id)

    response_data = record.model_dump()
    if killed_pids:
        response_data["killed_processes"] = killed_pids

    return response_data


@router.post("/kill", response_model=ProcessRecord)
def kill_process(
    pid: int = Query(..., ge=1),
    session_token: Optional[str] = Header(None),
    x_jezos_device_id: Optional[str] = Header(None),
    device_id: Optional[str] = Query(None),
):
    """Kill a process by PID."""
    runtime_device_id = resolve_device_id(device_id, x_jezos_device_id)
    state = config.get_runtime_state(session_token=session_token, device_id=runtime_device_id)
    process_table = list(state["process_table"])

    for index, record in enumerate(process_table):
        if record.pid == pid:
            updated = record.model_copy(update={"state": "terminated"})
            process_table[index] = updated
            state["process_table"] = process_table

            log_event(
                level=LEVEL_INFORMATION,
                category=CATEGORY_SYSTEM,
                source="ProcessManager",
                event_id=EVENT_PROCESS_KILL,
                message=f"Process terminated: {record.app} (PID: {pid})",
                details={
                    "pid": pid,
                    "app": record.app,
                    "memory_freed": record.memory,
                },
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
    device_id: Optional[str] = Query(None),
):
    """Force kill a process, even if it's protected."""
    runtime_device_id = resolve_device_id(device_id, x_jezos_device_id)
    state = config.get_runtime_state(session_token=session_token, device_id=runtime_device_id)
    process_table = list(state["process_table"])

    for index, record in enumerate(process_table):
        if record.pid == pid:
            process_table[index] = record.model_copy(update={"state": "terminated"})
            state["process_table"] = process_table

            from routers.system import update_performance_history

            update_performance_history(session_token=session_token, device_id=runtime_device_id)
            config.commit_runtime_state(state, session_token=session_token, device_id=runtime_device_id)
            return {"status": "terminated", "pid": pid, "forced": True}

    raise HTTPException(status_code=404, detail="Process not found")
