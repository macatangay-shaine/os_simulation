"""Permission validation and enforcement utilities."""

from typing import Optional, List
from database import get_db_connection
from security import check_admin_permission, is_system_path
from event_logger import (
    log_event, LEVEL_WARNING, LEVEL_ERROR,
    CATEGORY_SECURITY, EVENT_PERMISSION_DENIED
)


class PermissionValidator:
    """Validate and enforce permissions across the system."""
    
    # System-protected paths that require admin access
    PROTECTED_PATHS = [
        "/system",
        "/bin",
        "/boot",
        "/etc"
    ]
    
    # Actions that require admin privileges
    ADMIN_ACTIONS = [
        "delete_system_file",
        "modify_system_file",
        "install_app",
        "uninstall_app",
        "modify_user",
        "view_security_logs",
        "force_kill_process"
    ]
    
    def validate_file_access(self, path: str, action: str, username: str, user_role: str) -> dict:
        """
        Validate if user can perform action on file path.
        
        Args:
            path: File path to access
            action: Action to perform (read, write, delete)
            username: Username requesting access
            user_role: User's role (admin/user)
        
        Returns:
            dict with 'allowed' bool and optional 'reason' for denial
        """
        # Check if path is system-protected
        if any(path.startswith(protected) for protected in self.PROTECTED_PATHS):
            if user_role != "admin":
                log_event(
                    level=LEVEL_WARNING,
                    category=CATEGORY_SECURITY,
                    source="PermissionValidator",
                    event_id=EVENT_PERMISSION_DENIED,
                    message=f"User '{username}' denied access to protected path: {path}",
                    username=username,
                    details={"path": path, "action": action, "role": user_role}
                )
                return {
                    "allowed": False,
                    "reason": "System path requires administrator privileges"
                }
        
        # Check write/delete actions on user directories
        if action in ["write", "delete"]:
            # Users can only write/delete in their home directory
            if not path.startswith(f"/home/{username}") and user_role != "admin":
                log_event(
                    level=LEVEL_WARNING,
                    category=CATEGORY_SECURITY,
                    source="PermissionValidator",
                    event_id=EVENT_PERMISSION_DENIED,
                    message=f"User '{username}' denied {action} access to: {path}",
                    username=username,
                    details={"path": path, "action": action}
                )
                return {
                    "allowed": False,
                    "reason": f"Cannot {action} files outside your home directory"
                }
        
        return {"allowed": True}
    
    def validate_action(self, action: str, username: str, user_role: str) -> dict:
        """
        Validate if user can perform a specific action.
        
        Args:
            action: Action identifier
            username: Username requesting action
            user_role: User's role
        
        Returns:
            dict with 'allowed' bool and optional 'reason'
        """
        if action in self.ADMIN_ACTIONS and user_role != "admin":
            log_event(
                level=LEVEL_WARNING,
                category=CATEGORY_SECURITY,
                source="PermissionValidator",
                event_id=EVENT_PERMISSION_DENIED,
                message=f"User '{username}' denied admin action: {action}",
                username=username,
                details={"action": action, "role": user_role}
            )
            return {
                "allowed": False,
                "reason": "This action requires administrator privileges"
            }
        
        return {"allowed": True}
    
    def validate_process_action(self, pid: int, action: str, username: str, user_role: str) -> dict:
        """
        Validate if user can perform action on a process.
        
        Args:
            pid: Process ID
            action: Action to perform (kill, force_kill)
            username: Username
            user_role: User's role
        
        Returns:
            dict with validation result
        """
        import config
        
        # Find the process
        process = next((p for p in config.process_table if p.pid == pid), None)
        
        if not process:
            return {"allowed": False, "reason": "Process not found"}
        
        # Check if it's a startup process (protected)
        if process.is_startup and action == "kill" and user_role != "admin":
            log_event(
                level=LEVEL_WARNING,
                category=CATEGORY_SECURITY,
                source="PermissionValidator",
                event_id=EVENT_PERMISSION_DENIED,
                message=f"User '{username}' denied killing startup process: {process.app} (PID {pid})",
                username=username,
                details={"pid": pid, "app": process.app, "action": action}
            )
            return {
                "allowed": False,
                "reason": "Cannot kill startup processes without admin privileges"
            }
        
        return {"allowed": True}
    
    def audit_permissions(self) -> dict:
        """
        Audit current permission configuration and identify issues.
        
        Returns:
            dict with audit results
        """
        issues = []
        
        # Check if admin user exists
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) as count FROM users WHERE role = 'admin'")
        admin_count = cursor.fetchone()["count"]
        
        if admin_count == 0:
            issues.append({
                "severity": "critical",
                "issue": "No admin users exist",
                "recommendation": "Create at least one admin user"
            })
        
        # Check if default user has proper home directory
        cursor.execute("SELECT username, home_dir FROM users WHERE role = 'user'")
        users = cursor.fetchall()
        
        for user in users:
            if not user["home_dir"].startswith("/home/"):
                issues.append({
                    "severity": "medium",
                    "issue": f"User '{user['username']}' has invalid home directory",
                    "home_dir": user["home_dir"]
                })
        
        conn.close()
        
        # Check for processes with excessive privileges
        import config
        startup_count = len([p for p in config.process_table if p.is_startup and p.state == "running"])
        if startup_count > 10:
            issues.append({
                "severity": "low",
                "issue": "Too many startup processes",
                "count": startup_count,
                "recommendation": "Review startup process list"
            })
        
        return {
            "healthy": len(issues) == 0,
            "issues": issues,
            "admin_count": admin_count,
            "protected_paths": len(self.PROTECTED_PATHS),
            "admin_actions": len(self.ADMIN_ACTIONS)
        }


# Global permission validator instance
permission_validator = PermissionValidator()
