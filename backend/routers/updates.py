"""System update endpoints."""

from datetime import datetime
from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from database import get_update_state, save_update_state, add_update_history, list_update_history

router = APIRouter(prefix="/update", tags=["updates"])


AVAILABLE_UPDATES = [
    {
        "version": "1.1.0",
        "channel": "stable",
        "notes": "- New update system UI\n- Performance improvements\n- Security patches",
        "requires_restart": True
    },
    {
        "version": "1.1.1",
        "channel": "stable",
        "notes": "- Minor bug fixes\n- Stability improvements",
        "requires_restart": True
    }
]


def parse_version(version: str) -> tuple:
    """Parse semantic version into tuple of ints."""
    return tuple(int(part) for part in version.split("."))


def get_latest_update(current_version: str, channel: str) -> Optional[dict]:
    """Get the latest update greater than current_version for a channel."""
    current = parse_version(current_version)
    candidates = [u for u in AVAILABLE_UPDATES if u["channel"] == channel and parse_version(u["version"]) > current]
    if not candidates:
        return None
    return max(candidates, key=lambda item: parse_version(item["version"]))


@router.get("/status")
def get_update_status():
    """Get current update status and history."""
    state = get_update_state()
    history = list_update_history()

    response = {
        "state": {
            **state,
            "update_available": bool(state.get("update_available")),
            "restart_required": bool(state.get("restart_required"))
        },
        "history": history
    }
    return response


@router.post("/check")
def check_for_updates(channel: str = Query("stable")):
    """Check for available updates."""
    state = get_update_state()
    current_version = state["current_version"]
    latest = get_latest_update(current_version, channel)
    last_checked = datetime.utcnow().isoformat() + 'Z'

    if latest:
        state.update(
            {
                "latest_version": latest["version"],
                "update_available": True,
                "last_checked": last_checked,
                "channel": channel,
                "status": "available",
                "progress": 0,
                "patch_notes": latest["notes"]
            }
        )
    else:
        state.update(
            {
                "latest_version": current_version,
                "update_available": False,
                "last_checked": last_checked,
                "channel": channel,
                "status": "up_to_date",
                "progress": 0,
                "patch_notes": ""
            }
        )

    save_update_state(state)
    return {
        "state": {
            **state,
            "update_available": bool(state.get("update_available")),
            "restart_required": bool(state.get("restart_required"))
        }
    }


@router.post("/install")
def install_update():
    """Install the latest available update."""
    state = get_update_state()

    if not state.get("update_available"):
        raise HTTPException(status_code=409, detail="No update available")

    state.update({"status": "downloading", "progress": 25})
    save_update_state(state)

    state.update({"status": "applying", "progress": 75})
    save_update_state(state)

    state.update(
        {
            "status": "installed",
            "progress": 100,
            "current_version": state["latest_version"],
            "update_available": False,
            "restart_required": True
        }
    )
    save_update_state(state)

    add_update_history(state["current_version"], "installed", state.get("patch_notes", ""), True)

    return {
        "state": {
            **state,
            "update_available": bool(state.get("update_available")),
            "restart_required": bool(state.get("restart_required"))
        }
    }


@router.post("/uninstall")
def uninstall_update():
    """Rollback to the previously installed update version."""
    history = list_update_history(limit=10)
    if len(history) < 2:
        raise HTTPException(status_code=409, detail="No previous update available to uninstall")

    current_entry = history[0]
    previous_entry = history[1]

    state = get_update_state()
    state.update(
        {
            "status": "rollback_ready",
            "progress": 0,
            "current_version": previous_entry["version"],
            "latest_version": previous_entry["version"],
            "update_available": False,
            "restart_required": True,
            "patch_notes": current_entry.get("notes", "")
        }
    )
    save_update_state(state)

    add_update_history(previous_entry["version"], "rollback", current_entry.get("notes", ""), True)

    return {
        "state": {
            **state,
            "update_available": bool(state.get("update_available")),
            "restart_required": bool(state.get("restart_required"))
        }
    }


@router.post("/restart")
def complete_restart():
    """Mark restart as completed after update installation."""
    import config
    
    state = get_update_state()
    
    # Update the in-memory OS version to match the database
    config.OS_VERSION = state["current_version"]
    
    state.update({"restart_required": False, "status": "idle", "progress": 0})
    save_update_state(state)

    return {
        "state": {
            **state,
            "update_available": bool(state.get("update_available")),
            "restart_required": bool(state.get("restart_required"))
        }
    }


@router.get("/history")
def get_update_history(limit: int = Query(10, ge=1, le=50)):
    """Get update history entries."""
    return {"history": list_update_history(limit=limit)}
