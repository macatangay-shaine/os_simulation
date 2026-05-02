"""System health monitoring and stability management for JezOS."""

from datetime import datetime, timedelta
from typing import Dict, List, Optional
import config
from event_logger import (
    log_event, LEVEL_WARNING, LEVEL_CRITICAL, LEVEL_INFORMATION,
    CATEGORY_SYSTEM, EVENT_MEMORY_CRITICAL, EVENT_PROCESS_KILL
)


class SystemHealthMonitor:
    """Monitor and maintain system health."""
    
    def __init__(self):
        self.last_cleanup = datetime.utcnow()
        self.cleanup_interval = timedelta(minutes=5)
        self.max_process_age = timedelta(hours=2)
        self.orphaned_process_threshold = timedelta(minutes=30)
        
    def check_memory_health(self) -> Dict:
        """Check memory usage and return health status."""
        running_processes = [p for p in config.process_table if p.state == "running"]
        total_memory = sum(p.memory for p in running_processes)
        memory_percent = (total_memory / config.MAX_MEMORY) * 100
        
        status = {
            "healthy": True,
            "memory_used": total_memory,
            "memory_max": config.MAX_MEMORY,
            "memory_percent": round(memory_percent, 2),
            "process_count": len(running_processes),
            "warning": None
        }
        
        if memory_percent >= 95:
            status["healthy"] = False
            status["warning"] = "Critical memory usage"
            log_event(
                level=LEVEL_CRITICAL,
                category=CATEGORY_SYSTEM,
                source="SystemHealth",
                event_id=EVENT_MEMORY_CRITICAL,
                message=f"Critical memory usage: {memory_percent:.1f}%",
                details={
                    "memory_used": total_memory,
                    "memory_max": config.MAX_MEMORY,
                    "process_count": len(running_processes)
                }
            )
        elif memory_percent >= 85:
            status["warning"] = "High memory usage"
            log_event(
                level=LEVEL_WARNING,
                category=CATEGORY_SYSTEM,
                source="SystemHealth",
                event_id=EVENT_MEMORY_CRITICAL,
                message=f"High memory usage: {memory_percent:.1f}%",
                details={
                    "memory_used": total_memory,
                    "memory_max": config.MAX_MEMORY
                }
            )
        
        return status
    
    def find_orphaned_processes(self) -> List[int]:
        """
        Find processes that should be cleaned up.
        Orphaned processes are:
        - Terminated processes still in the table
        - Very old running processes (potential leaks)
        """
        orphaned_pids = []
        now = datetime.utcnow()
        
        for process in config.process_table:
            # Remove terminated processes that are old
            if process.state == "terminated":
                try:
                    start_time = datetime.fromisoformat(process.start_time)
                    age = now - start_time
                    if age > self.orphaned_process_threshold:
                        orphaned_pids.append(process.pid)
                except:
                    # If can't parse time, remove it
                    orphaned_pids.append(process.pid)
        
        return orphaned_pids
    
    def cleanup_orphaned_processes(self) -> int:
        """Remove orphaned processes from process table."""
        orphaned_pids = self.find_orphaned_processes()
        
        if not orphaned_pids:
            return 0
        
        # Remove from process table
        config.process_table = [
            p for p in config.process_table if p.pid not in orphaned_pids
        ]
        
        if orphaned_pids:
            log_event(
                level=LEVEL_INFORMATION,
                category=CATEGORY_SYSTEM,
                source="SystemHealth",
                event_id=EVENT_PROCESS_KILL,
                message=f"Cleaned up {len(orphaned_pids)} orphaned processes",
                details={"pids": orphaned_pids}
            )
        
        return len(orphaned_pids)
    
    def enforce_memory_limits(self) -> Dict:
        """
        Enforce strict memory limits by killing non-essential processes.
        Returns info about actions taken.
        """
        memory_check = self.check_memory_health()
        
        if memory_check["memory_percent"] < 90:
            return {"action": "none", "killed_processes": []}
        
        # Get killable processes (not startup processes)
        running_processes = [p for p in config.process_table if p.state == "running"]
        killable = [p for p in running_processes if not p.is_startup]
        
        # Sort by memory usage (kill largest first)
        killable.sort(key=lambda x: x.memory, reverse=True)
        
        killed_pids = []
        current_memory = memory_check["memory_used"]
        target_memory = config.MAX_MEMORY * 0.7  # Bring down to 70%
        
        for process in killable:
            if current_memory <= target_memory:
                break
            
            # Kill this process
            for index, record in enumerate(config.process_table):
                if record.pid == process.pid:
                    config.process_table[index] = record.model_copy(update={"state": "terminated"})
                    current_memory -= process.memory
                    killed_pids.append({
                        "pid": process.pid,
                        "app": process.app,
                        "memory": process.memory
                    })
                    break
        
        if killed_pids:
            log_event(
                level=LEVEL_WARNING,
                category=CATEGORY_SYSTEM,
                source="SystemHealth",
                event_id=EVENT_PROCESS_KILL,
                message=f"Enforced memory limits: killed {len(killed_pids)} processes",
                details={
                    "killed_processes": killed_pids,
                    "memory_before": memory_check["memory_used"],
                    "memory_after": current_memory
                }
            )
        
        return {
            "action": "kill_processes",
            "killed_processes": killed_pids,
            "memory_freed": memory_check["memory_used"] - current_memory
        }
    
    def periodic_maintenance(self) -> Dict:
        """
        Perform periodic system maintenance.
        Should be called regularly (e.g., every request or on a timer).
        """
        now = datetime.utcnow()
        
        # Only run maintenance if interval has passed
        if now - self.last_cleanup < self.cleanup_interval:
            return {"maintenance": "skipped", "reason": "interval_not_reached"}
        
        self.last_cleanup = now
        
        # Run cleanup tasks
        orphaned_count = self.cleanup_orphaned_processes()
        memory_status = self.check_memory_health()
        enforcement = {"action": "none", "killed_processes": []}
        
        # Enforce memory if needed
        if memory_status["memory_percent"] >= 90:
            enforcement = self.enforce_memory_limits()
        
        return {
            "maintenance": "completed",
            "timestamp": now.isoformat(),
            "orphaned_cleaned": orphaned_count,
            "memory_status": memory_status,
            "enforcement": enforcement
        }
    
    def get_system_stats(self) -> Dict:
        """Get comprehensive system statistics."""
        running_processes = [p for p in config.process_table if p.state == "running"]
        terminated_processes = [p for p in config.process_table if p.state == "terminated"]
        
        total_memory = sum(p.memory for p in running_processes)
        avg_cpu = sum(p.cpu_usage for p in running_processes) / len(running_processes) if running_processes else 0
        
        return {
            "process_count": {
                "running": len(running_processes),
                "terminated": len(terminated_processes),
                "total": len(config.process_table)
            },
            "memory": {
                "used": total_memory,
                "max": config.MAX_MEMORY,
                "percent": round((total_memory / config.MAX_MEMORY) * 100, 2),
                "available": config.MAX_MEMORY - total_memory
            },
            "cpu": {
                "average": round(avg_cpu, 2)
            },
            "startup_processes": len([p for p in running_processes if p.is_startup]),
            "next_pid": config.next_pid
        }
    
    def validate_system_integrity(self) -> Dict:
        """Validate system state and return any issues found."""
        issues = []
        
        # Check for duplicate PIDs
        pids = [p.pid for p in config.process_table]
        if len(pids) != len(set(pids)):
            issues.append({
                "severity": "critical",
                "issue": "Duplicate PIDs detected",
                "pids": [pid for pid in pids if pids.count(pid) > 1]
            })
        
        # Check for negative memory
        negative_memory = [p for p in config.process_table if p.memory < 0]
        if negative_memory:
            issues.append({
                "severity": "critical",
                "issue": "Processes with negative memory",
                "processes": [p.pid for p in negative_memory]
            })
        
        # Check for memory overflow
        running_memory = sum(p.memory for p in config.process_table if p.state == "running")
        if running_memory > config.MAX_MEMORY * 1.1:  # Allow 10% overflow buffer
            issues.append({
                "severity": "high",
                "issue": "Memory usage exceeds maximum",
                "memory_used": running_memory,
                "memory_max": config.MAX_MEMORY
            })
        
        # Check for orphaned terminated processes
        orphaned = self.find_orphaned_processes()
        if len(orphaned) > 10:
            issues.append({
                "severity": "medium",
                "issue": "Too many orphaned processes",
                "count": len(orphaned)
            })
        
        return {
            "healthy": len(issues) == 0,
            "issues": issues,
            "timestamp": datetime.utcnow().isoformat()
        }


# Global health monitor instance
health_monitor = SystemHealthMonitor()
