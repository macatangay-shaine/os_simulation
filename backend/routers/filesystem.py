"""Filesystem management endpoints."""

from fastapi import APIRouter, HTTPException, Query
from datetime import datetime
from pathlib import PurePosixPath
from models import FsCreateRequest, FsReadRequest, FsWriteRequest, FsRenameRequest
from database import get_db_connection, normalize_path

router = APIRouter(prefix="/fs", tags=["filesystem"])


@router.post("/create")
def create_node(payload: FsCreateRequest):
    """Create a new file or directory."""
    path = normalize_path(payload.path)
    parent = str(PurePosixPath(path).parent)

    conn = get_db_connection()
    cursor = conn.cursor()

    # Check if path already exists
    cursor.execute("SELECT node_type FROM fs_nodes WHERE path = ?", (path,))
    existing = cursor.fetchone()
    if existing is not None:
        conn.close()
        # If it's a directory and we're trying to create a directory, just return success
        if existing["node_type"] == "dir" and payload.node_type == "dir":
            return {"path": path, "type": payload.node_type, "existed": True}
        raise HTTPException(status_code=409, detail="Path already exists")

    # Check parent exists
    cursor.execute("SELECT node_type FROM fs_nodes WHERE path = ?", (parent,))
    parent_row = cursor.fetchone()
    if parent_row is None or parent_row["node_type"] != "dir":
        conn.close()
        raise HTTPException(status_code=400, detail="Parent directory not found")

    now = datetime.utcnow().isoformat()
    content = payload.content if payload.node_type == "file" else ""
    size = len(content.encode()) if payload.node_type == "file" else 0
    
    cursor.execute(
        """
        INSERT INTO fs_nodes (path, parent, node_type, content, created_at, modified_at, size, owner)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            path,
            parent,
            payload.node_type,
            content,
            now,
            now,
            size,
            "user",
        ),
    )
    conn.commit()
    conn.close()
    return {"path": path, "type": payload.node_type}


@router.post("/read")
def read_node(payload: FsReadRequest):
    """Read the contents of a file."""
    path = normalize_path(payload.path)
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT node_type, content FROM fs_nodes WHERE path = ?", (path,))
    row = cursor.fetchone()
    conn.close()
    if row is None:
        raise HTTPException(status_code=404, detail="Path not found")
    if row["node_type"] != "file":
        raise HTTPException(status_code=400, detail="Path is not a file")
    return {"path": path, "content": row["content"]}


@router.post("/write")
def write_node(payload: FsWriteRequest):
    """Write content to a file."""
    path = normalize_path(payload.path)
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT node_type FROM fs_nodes WHERE path = ?", (path,))
    row = cursor.fetchone()
    if row is None:
        conn.close()
        raise HTTPException(status_code=404, detail="Path not found")
    if row["node_type"] != "file":
        conn.close()
        raise HTTPException(status_code=400, detail="Path is not a file")
    
    size = len(payload.content.encode())
    modified_at = datetime.utcnow().isoformat()
    cursor.execute("UPDATE fs_nodes SET content = ?, size = ?, modified_at = ? WHERE path = ?", (payload.content, size, modified_at, path))
    conn.commit()
    conn.close()
    return {"path": path, "status": "updated"}


@router.delete("/delete")
def delete_node(path: str = Query(..., min_length=1)):
    """Delete a file or directory."""
    normalized = normalize_path(path)
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT node_type FROM fs_nodes WHERE path = ?", (normalized,))
    row = cursor.fetchone()
    if row is None:
        conn.close()
        raise HTTPException(status_code=404, detail="Path not found")

    if row["node_type"] == "dir":
        cursor.execute("DELETE FROM fs_nodes WHERE path = ? OR path LIKE ?", (normalized, f"{normalized}/%"))
    else:
        cursor.execute("DELETE FROM fs_nodes WHERE path = ?", (normalized,))
    conn.commit()
    conn.close()
    return {"path": normalized, "status": "deleted"}


@router.post("/rename")
def rename_node(payload: FsRenameRequest):
    """Rename a file or directory."""
    old_path = normalize_path(payload.old_path)
    new_path = normalize_path(payload.new_path)
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Check if old path exists
    cursor.execute("SELECT node_type FROM fs_nodes WHERE path = ?", (old_path,))
    row = cursor.fetchone()
    if row is None:
        conn.close()
        raise HTTPException(status_code=404, detail="Path not found")
    
    # Check if new path already exists
    cursor.execute("SELECT node_type FROM fs_nodes WHERE path = ?", (new_path,))
    existing = cursor.fetchone()
    if existing is not None:
        conn.close()
        raise HTTPException(status_code=409, detail="Destination path already exists")
    
    node_type = row["node_type"]
    
    # Update the node with new path
    cursor.execute("UPDATE fs_nodes SET path = ? WHERE path = ?", (new_path, old_path))
    
    # Update all children if it's a directory
    if node_type == "dir":
        cursor.execute("SELECT path FROM fs_nodes WHERE path LIKE ?", (f"{old_path}/%",))
        children = cursor.fetchall()
        for child in children:
            child_path = child["path"]
            new_child_path = child_path.replace(old_path, new_path, 1)
            cursor.execute("UPDATE fs_nodes SET path = ? WHERE path = ?", (new_child_path, child_path))
    
    # Update parent reference
    cursor.execute("UPDATE fs_nodes SET parent = ? WHERE path = ?", (str(PurePosixPath(new_path).parent), new_path))
    
    conn.commit()
    conn.close()
    return {"old_path": old_path, "new_path": new_path, "status": "renamed"}


@router.get("/list")
def list_nodes(path: str = Query(default="/", min_length=1)):
    """List all nodes in a directory."""
    normalized = normalize_path(path)
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT node_type FROM fs_nodes WHERE path = ?", (normalized,))
    row = cursor.fetchone()
    if row is None:
        conn.close()
        raise HTTPException(status_code=404, detail="Directory not found")
    if row["node_type"] != "dir":
        conn.close()
        raise HTTPException(status_code=400, detail="Path is not a directory")

    cursor.execute("SELECT path, node_type FROM fs_nodes WHERE parent = ?", (normalized,))
    nodes = [
        {"path": r["path"], "type": r["node_type"], "name": r["path"].split("/")[-1]}
        for r in cursor.fetchall()
    ]
    conn.close()
    return {"path": normalized, "nodes": nodes}

@router.get("/properties")
def get_file_properties(path: str = Query(..., min_length=1)):
    """Get detailed properties of a file or directory."""
    normalized = normalize_path(path)
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute(
        """
        SELECT path, node_type, size, owner, created_at, modified_at, attributes
        FROM fs_nodes WHERE path = ?
        """,
        (normalized,)
    )
    row = cursor.fetchone()
    conn.close()
    
    if row is None:
        raise HTTPException(status_code=404, detail="Path not found")
    
    name = row["path"].split("/")[-1] or "/"
    file_type = "Directory" if row["node_type"] == "dir" else "File"
    size_bytes = row["size"] or 0
    
    # Format size for display
    if size_bytes < 1024:
        size_display = f"{size_bytes} B"
    elif size_bytes < 1024 * 1024:
        size_display = f"{size_bytes / 1024:.2f} KB"
    elif size_bytes < 1024 * 1024 * 1024:
        size_display = f"{size_bytes / (1024 * 1024):.2f} MB"
    else:
        size_display = f"{size_bytes / (1024 * 1024 * 1024):.2f} GB"
    
    return {
        "name": name,
        "path": row["path"],
        "type": file_type,
        "size_bytes": size_bytes,
        "size_display": size_display,
        "owner": row["owner"] or "user",
        "computer": "JezOS",
        "created": row["created_at"],
        "modified": row["modified_at"],
        "attributes": row["attributes"] or "normal"
    }