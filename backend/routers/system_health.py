"""System health and diagnostics API endpoints."""

from typing import Optional

from fastapi import APIRouter, Header, Query
from system_health import health_monitor
from event_logger import log_event, LEVEL_INFORMATION, CATEGORY_SYSTEM

router = APIRouter(prefix="/system/health", tags=["system-health"])


def resolve_device_id(device_id: Optional[str], x_jezos_device_id: Optional[str]) -> Optional[str]:
    return device_id or x_jezos_device_id


@router.get("/status")
def get_health_status(
    session_token: Optional[str] = Header(None),
    x_jezos_device_id: Optional[str] = Header(None),
    device_id: Optional[str] = Query(None)
):
    """Get current system health status."""
    runtime_device_id = resolve_device_id(device_id, x_jezos_device_id)
    memory_health = health_monitor.check_memory_health(session_token=session_token, device_id=runtime_device_id)
    system_stats = health_monitor.get_system_stats(session_token=session_token, device_id=runtime_device_id)
    integrity = health_monitor.validate_system_integrity(session_token=session_token, device_id=runtime_device_id)
    
    return {
        "memory": memory_health,
        "stats": system_stats,
        "integrity": integrity,
        "overall_healthy": memory_health["healthy"] and integrity["healthy"]
    }


@router.post("/cleanup")
def trigger_cleanup(
    session_token: Optional[str] = Header(None),
    x_jezos_device_id: Optional[str] = Header(None),
    device_id: Optional[str] = Query(None)
):
    """Manually trigger system cleanup and maintenance."""
    runtime_device_id = resolve_device_id(device_id, x_jezos_device_id)
    result = health_monitor.periodic_maintenance(session_token=session_token, device_id=runtime_device_id)
    
    log_event(
        level=LEVEL_INFORMATION,
        category=CATEGORY_SYSTEM,
        source="SystemHealth",
        event_id=5000,
        message="Manual system cleanup triggered",
        details=result
    )
    
    return result


@router.get("/orphaned")
def get_orphaned_processes(
    session_token: Optional[str] = Header(None),
    x_jezos_device_id: Optional[str] = Header(None),
    device_id: Optional[str] = Query(None)
):
    """Get list of orphaned processes."""
    runtime_device_id = resolve_device_id(device_id, x_jezos_device_id)
    orphaned_pids = health_monitor.find_orphaned_processes(session_token=session_token, device_id=runtime_device_id)
    return {
        "orphaned_pids": orphaned_pids,
        "count": len(orphaned_pids)
    }


@router.post("/orphaned/cleanup")
def cleanup_orphaned(
    session_token: Optional[str] = Header(None),
    x_jezos_device_id: Optional[str] = Header(None),
    device_id: Optional[str] = Query(None)
):
    """Clean up orphaned processes."""
    runtime_device_id = resolve_device_id(device_id, x_jezos_device_id)
    count = health_monitor.cleanup_orphaned_processes(session_token=session_token, device_id=runtime_device_id)
    return {
        "cleaned": count,
        "status": "success"
    }


@router.post("/memory/enforce")
def enforce_memory(
    session_token: Optional[str] = Header(None),
    x_jezos_device_id: Optional[str] = Header(None),
    device_id: Optional[str] = Query(None)
):
    """Manually enforce memory limits."""
    runtime_device_id = resolve_device_id(device_id, x_jezos_device_id)
    result = health_monitor.enforce_memory_limits(session_token=session_token, device_id=runtime_device_id)
    return result


@router.get("/stats")
def get_system_stats(
    session_token: Optional[str] = Header(None),
    x_jezos_device_id: Optional[str] = Header(None),
    device_id: Optional[str] = Query(None)
):
    """Get detailed system statistics."""
    runtime_device_id = resolve_device_id(device_id, x_jezos_device_id)
    return health_monitor.get_system_stats(session_token=session_token, device_id=runtime_device_id)


@router.get("/integrity")
def validate_integrity(
    session_token: Optional[str] = Header(None),
    x_jezos_device_id: Optional[str] = Header(None),
    device_id: Optional[str] = Query(None)
):
    """Validate system integrity and return any issues."""
    runtime_device_id = resolve_device_id(device_id, x_jezos_device_id)
    return health_monitor.validate_system_integrity(session_token=session_token, device_id=runtime_device_id)


@router.post("/stress-test")
def run_stress_test(
    session_token: Optional[str] = Header(None),
    x_jezos_device_id: Optional[str] = Header(None),
    device_id: Optional[str] = Query(None)
):
    """Run a stress test on the system."""
    runtime_device_id = resolve_device_id(device_id, x_jezos_device_id)
    return health_monitor.run_stress_test(session_token=session_token, device_id=runtime_device_id)
