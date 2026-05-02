"""System health and diagnostics API endpoints."""

from fastapi import APIRouter
from system_health import health_monitor
from event_logger import log_event, LEVEL_INFORMATION, CATEGORY_SYSTEM

router = APIRouter(prefix="/system/health", tags=["system-health"])


@router.get("/status")
def get_health_status():
    """Get current system health status."""
    memory_health = health_monitor.check_memory_health()
    system_stats = health_monitor.get_system_stats()
    integrity = health_monitor.validate_system_integrity()
    
    return {
        "memory": memory_health,
        "stats": system_stats,
        "integrity": integrity,
        "overall_healthy": memory_health["healthy"] and integrity["healthy"]
    }


@router.post("/cleanup")
def trigger_cleanup():
    """Manually trigger system cleanup and maintenance."""
    result = health_monitor.periodic_maintenance()
    
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
def get_orphaned_processes():
    """Get list of orphaned processes."""
    orphaned_pids = health_monitor.find_orphaned_processes()
    return {
        "orphaned_pids": orphaned_pids,
        "count": len(orphaned_pids)
    }


@router.post("/orphaned/cleanup")
def cleanup_orphaned():
    """Clean up orphaned processes."""
    count = health_monitor.cleanup_orphaned_processes()
    return {
        "cleaned": count,
        "status": "success"
    }


@router.post("/memory/enforce")
def enforce_memory():
    """Manually enforce memory limits."""
    result = health_monitor.enforce_memory_limits()
    return result


@router.get("/stats")
def get_system_stats():
    """Get detailed system statistics."""
    return health_monitor.get_system_stats()


@router.get("/integrity")
def validate_integrity():
    """Validate system integrity and return any issues."""
    return health_monitor.validate_system_integrity()


@router.post("/stress-test")
def run_stress_test():
    """Run a stress test on the system."""
    from models import ProcessRecord
    from datetime import datetime
    import config
    
    # Create multiple test processes
    test_processes = []
    for i in range(5):
        record = ProcessRecord(
            pid=config.next_pid,
            app=f"StressTest_{i}",
            memory=20,
            state="running",
            cpu_usage=15.0,
            start_time=datetime.utcnow().isoformat(),
            is_startup=False
        )
        config.next_pid += 1
        config.process_table.append(record)
        test_processes.append(record.pid)
    
    # Check health after stress
    memory_health = health_monitor.check_memory_health()
    
    # Clean up test processes
    config.process_table = [
        p for p in config.process_table 
        if p.pid not in test_processes
    ]
    
    return {
        "test": "completed",
        "test_processes_created": len(test_processes),
        "memory_impact": memory_health,
        "cleanup": "automatic"
    }
