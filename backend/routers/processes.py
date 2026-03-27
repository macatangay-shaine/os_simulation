"""Process management endpoints."""

from fastapi import APIRouter, HTTPException, Query
from datetime import datetime
import random
from models import ProcessStartRequest, ProcessRecord
from event_logger import (
    log_event, LEVEL_INFORMATION, LEVEL_WARNING, LEVEL_ERROR,
    CATEGORY_SYSTEM, EVENT_PROCESS_START, EVENT_PROCESS_KILL, EVENT_MEMORY_WARNING
)
import config

router = APIRouter(prefix="/process", tags=["processes"])


@router.get("/list", response_model=list[ProcessRecord])
def list_processes():
    """Get list of all processes."""
    return config.process_table


@router.post("/start")
def start_process(payload: ProcessStartRequest):
    """Start a new process."""
    # Calculate current memory usage
    used_memory = sum(p.memory for p in config.process_table if p.state == "running")
    killed_pids = []
    
    # Check if adding this process would exceed limit
    if used_memory + payload.memory > config.MAX_MEMORY:
        # Try to kill oldest background processes to make room
        background_procs = [p for p in config.process_table if p.state == "running" and p.app not in ["System Monitor", "Terminal"]]
        background_procs.sort(key=lambda x: x.pid)  # Sort by age (oldest first)
        
        for proc in background_procs:
            if used_memory + payload.memory <= config.MAX_MEMORY:
                break
            # Kill this process
            for index, record in enumerate(config.process_table):
                if record.pid == proc.pid:
                    config.process_table[index] = record.model_copy(update={"state": "terminated"})
                    used_memory -= proc.memory
                    killed_pids.append(proc.pid)
                    break
        
        # Check again after killing background processes
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
        pid=config.next_pid,
        app=payload.app,
        memory=payload.memory,
        state="running",
        cpu_usage=cpu_usage,
        start_time=datetime.utcnow().isoformat(),
        is_startup=is_startup
    )
    config.next_pid += 1
    config.process_table.append(record)
    
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
                "memory_max": config.MAX_MEMORY
            }
        )
    
    # Capture performance snapshot
    from routers.system import update_performance_history
    update_performance_history()
    
    response_data = record.model_dump()
    if killed_pids:
        response_data["killed_processes"] = killed_pids
    
    return response_data


@router.post("/kill", response_model=ProcessRecord)
def kill_process(pid: int = Query(..., ge=1)):
    """Kill a process by PID."""
    for index, record in enumerate(config.process_table):
        if record.pid == pid:
            updated = record.model_copy(update={"state": "terminated"})
            config.process_table[index] = updated
            
            # Log process kill event
            log_event(
                level=LEVEL_INFORMATION,
                category=CATEGORY_SYSTEM,
                source="ProcessManager",
                event_id=EVENT_PROCESS_KILL,
                message=f"Process terminated: {record.app} (PID: {pid})",
                details={
                    "pid": pid,
                    "app": record.app,
                    "memory_freed": record.memory
                }
            )
            
            # Update performance history
            from routers.system import update_performance_history
            update_performance_history()
            
            return updated
    raise HTTPException(status_code=404, detail="Process not found")


@router.post("/force-kill")
def force_kill_process(pid: int = Query(..., ge=1)):
    """Force kill a process, even if it's protected (startup process)."""
    for index, record in enumerate(config.process_table):
        if record.pid == pid:
            updated = record.model_copy(update={"state": "terminated"})
            config.process_table[index] = updated
            
            # Update performance history
            from routers.system import update_performance_history
            update_performance_history()
            
            return {"status": "terminated", "pid": pid, "forced": True}
    raise HTTPException(status_code=404, detail="Process not found")
