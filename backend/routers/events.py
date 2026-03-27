"""Event logging router for JezOS."""

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import PlainTextResponse
from typing import Optional
from models import SystemEvent, EventLogRequest
from event_logger import (
    get_system_events,
    get_event_count,
    log_event,
    clear_old_events,
    clear_all_events,
    export_events_csv,
    LEVEL_CRITICAL,
    LEVEL_ERROR,
    LEVEL_WARNING,
    LEVEL_INFORMATION,
    LEVEL_VERBOSE,
    CATEGORY_SYSTEM,
    CATEGORY_APPLICATION,
    CATEGORY_SECURITY,
    CATEGORY_HARDWARE,
    CATEGORY_NETWORK
)

router = APIRouter(prefix="/events", tags=["events"])


@router.get("/", response_model=dict)
def get_events(
    level: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    source: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0)
):
    """
    Retrieve system events with optional filtering.
    
    Query Parameters:
        - level: Filter by event level (Critical, Error, Warning, Information, Verbose)
        - category: Filter by category (System, Application, Security, Hardware, Network)
        - source: Filter by source component
        - limit: Maximum number of events to return (1-1000)
        - offset: Number of events to skip
    """
    try:
        events = get_system_events(level, category, source, limit, offset)
        total = get_event_count(level, category, source)
        
        return {
            "events": events,
            "total": total,
            "limit": limit,
            "offset": offset
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve events: {str(e)}")


@router.post("/log")
def create_event(event: EventLogRequest):
    """
    Manually log a system event.
    
    Body:
        - level: Event level
        - category: Event category
        - source: Source component
        - event_id: Numeric event ID
        - message: Event message
        - username: Optional username
        - details: Optional additional context
        - stack_trace: Optional error stack trace
    """
    try:
        log_event(
            level=event.level or LEVEL_INFORMATION,
            category=event.category or CATEGORY_APPLICATION,
            source=event.source or "API",
            event_id=event.event_id,
            message=event.message,
            username=event.username,
            details=event.details,
            stack_trace=event.stack_trace
        )
        return {"status": "logged"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to log event: {str(e)}")


@router.get("/count")
def get_count(
    level: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    source: Optional[str] = Query(None)
):
    """Get the total count of events matching the filters."""
    try:
        count = get_event_count(level, category, source)
        return {"count": count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get count: {str(e)}")


@router.delete("/clear")
def clear_events():
    """Delete old events to maintain database size."""
    try:
        deleted = clear_old_events(days_to_keep=30)
        return {"deleted": deleted, "status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to clear events: {str(e)}")


@router.delete("/clear-all")
def clear_all():
    """Delete all events from the database."""
    try:
        deleted = clear_all_events()
        return {"deleted": deleted, "status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to clear all events: {str(e)}")


@router.get("/export", response_class=PlainTextResponse)
def export_events(
    level: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    source: Optional[str] = Query(None)
):
    """
    Export events to CSV format.
    
    Query Parameters:
        - level: Filter by event level
        - category: Filter by category
        - source: Filter by source component
    
    Returns:
        CSV file content as plain text
    """
    try:
        csv_content = export_events_csv(level, category, source)
        return csv_content
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to export events: {str(e)}")


@router.get("/levels")
def get_event_levels():
    """Get available event levels."""
    return {
        "levels": [
            LEVEL_CRITICAL,
            LEVEL_ERROR,
            LEVEL_WARNING,
            LEVEL_INFORMATION,
            LEVEL_VERBOSE
        ]
    }


@router.get("/categories")
def get_event_categories():
    """Get available event categories."""
    return {
        "categories": [
            CATEGORY_SYSTEM,
            CATEGORY_APPLICATION,
            CATEGORY_SECURITY,
            CATEGORY_HARDWARE,
            CATEGORY_NETWORK
        ]
    }


@router.get("/sources")
def get_event_sources():
    """Get list of event sources from existing events."""
    try:
        from database import get_db_connection
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT DISTINCT source FROM system_events ORDER BY source")
        sources = [row["source"] for row in cursor.fetchall()]
        conn.close()
        return {"sources": sources}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get sources: {str(e)}")
