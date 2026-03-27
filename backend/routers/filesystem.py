"""Filesystem management endpoints."""

from datetime import datetime
from pathlib import PurePosixPath

from fastapi import APIRouter, HTTPException, Query

from database import get_db_connection, normalize_path
from models import FsCreateRequest, FsReadRequest, FsRenameRequest, FsWriteRequest

router = APIRouter(prefix="/fs", tags=["filesystem"])

RECYCLE_BIN_PATH = "/home/user/.recycle_bin"


def ensure_support_tables_and_recycle_bin(cursor) -> None:
    """Ensure auxiliary tables and recycle bin directory exist."""
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS recycle_bin_meta (
            recycle_path TEXT PRIMARY KEY,
            original_path TEXT NOT NULL,
            deleted_at TEXT NOT NULL,
            node_type TEXT NOT NULL
        )
        """
    )
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS note_versions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            path TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
        """
    )

    cursor.execute("SELECT 1 FROM fs_nodes WHERE path = ?", (RECYCLE_BIN_PATH,))
    if cursor.fetchone() is None:
        now = datetime.utcnow().isoformat()
        cursor.execute(
            """
            INSERT INTO fs_nodes (path, parent, node_type, content, created_at, modified_at, size, owner)
            VALUES (?, ?, 'dir', '', ?, ?, 0, 'user')
            """,
            (RECYCLE_BIN_PATH, "/home/user", now, now),
        )


def is_recycle_path(path: str) -> bool:
    """Return True if path points to recycle bin or a child item."""
    return path == RECYCLE_BIN_PATH or path.startswith(f"{RECYCLE_BIN_PATH}/")


def move_tree(cursor, old_root: str, new_root: str) -> None:
    """Move a path subtree by replacing path and parent prefixes."""
    cursor.execute(
        """
        UPDATE fs_nodes
        SET path = REPLACE(path, ?, ?)
        WHERE path = ? OR path LIKE ?
        """,
        (old_root, new_root, old_root, f"{old_root}/%"),
    )
    cursor.execute(
        """
        UPDATE fs_nodes
        SET parent = REPLACE(parent, ?, ?)
        WHERE parent = ? OR parent LIKE ?
        """,
        (old_root, new_root, old_root, f"{old_root}/%"),
    )


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
    cursor.execute("SELECT node_type, content FROM fs_nodes WHERE path = ?", (path,))
    row = cursor.fetchone()
    if row is None:
        conn.close()
        raise HTTPException(status_code=404, detail="Path not found")
    if row["node_type"] != "file":
        conn.close()
        raise HTTPException(status_code=400, detail="Path is not a file")

    # Keep snapshots for text notes before content changes.
    if path.endswith(".txt") and (row["content"] or "") != payload.content:
        ensure_support_tables_and_recycle_bin(cursor)
        cursor.execute(
            """
            INSERT INTO note_versions (path, content, created_at)
            VALUES (?, ?, ?)
            """,
            (path, row["content"] or "", datetime.utcnow().isoformat()),
        )

    size = len(payload.content.encode())
    modified_at = datetime.utcnow().isoformat()
    cursor.execute(
        "UPDATE fs_nodes SET content = ?, size = ?, modified_at = ? WHERE path = ?",
        (payload.content, size, modified_at, path),
    )
    conn.commit()
    conn.close()
    return {"path": path, "status": "updated"}


@router.delete("/delete")
def delete_node(path: str = Query(..., min_length=1), permanent: bool = Query(default=False)):
    """Delete a file or directory (soft-delete by default)."""
    normalized = normalize_path(path)
    if normalized == "/":
        raise HTTPException(status_code=400, detail="Cannot delete root directory")

    conn = get_db_connection()
    cursor = conn.cursor()
    ensure_support_tables_and_recycle_bin(cursor)

    cursor.execute("SELECT node_type FROM fs_nodes WHERE path = ?", (normalized,))
    row = cursor.fetchone()
    if row is None:
        conn.close()
        raise HTTPException(status_code=404, detail="Path not found")

    # Permanent delete for recycle bin items or explicit permanent deletion.
    if permanent or is_recycle_path(normalized):
        if row["node_type"] == "dir":
            cursor.execute("DELETE FROM fs_nodes WHERE path = ? OR path LIKE ?", (normalized, f"{normalized}/%"))
        else:
            cursor.execute("DELETE FROM fs_nodes WHERE path = ?", (normalized,))
        cursor.execute("DELETE FROM recycle_bin_meta WHERE recycle_path = ?", (normalized,))
        conn.commit()
        conn.close()
        return {"path": normalized, "status": "deleted_permanently"}

    # Soft delete to recycle bin.
    base_name = normalized.split("/")[-1] or "item"
    stamp = datetime.utcnow().strftime("%Y%m%d%H%M%S%f")
    recycle_path = f"{RECYCLE_BIN_PATH}/{stamp}_{base_name}"

    move_tree(cursor, normalized, recycle_path)
    cursor.execute("UPDATE fs_nodes SET parent = ? WHERE path = ?", (RECYCLE_BIN_PATH, recycle_path))
    cursor.execute(
        """
        INSERT INTO recycle_bin_meta (recycle_path, original_path, deleted_at, node_type)
        VALUES (?, ?, ?, ?)
        """,
        (recycle_path, normalized, datetime.utcnow().isoformat(), row["node_type"]),
    )

    conn.commit()
    conn.close()
    return {"path": normalized, "status": "moved_to_recycle_bin", "recycle_path": recycle_path}


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


@router.get("/recycle/list")
def list_recycle_bin_items():
    """List recycle bin items with original path metadata."""
    conn = get_db_connection()
    cursor = conn.cursor()
    ensure_support_tables_and_recycle_bin(cursor)

    cursor.execute(
        """
        SELECT recycle_path, original_path, deleted_at, node_type
        FROM recycle_bin_meta
        ORDER BY deleted_at DESC
        """
    )
    rows = cursor.fetchall()
    conn.close()

    nodes = []
    for row in rows:
        original_name = row["original_path"].split("/")[-1] or row["original_path"]
        nodes.append(
            {
                "path": row["recycle_path"],
                "recycle_path": row["recycle_path"],
                "original_path": row["original_path"],
                "deleted_at": row["deleted_at"],
                "type": row["node_type"],
                "name": original_name,
            }
        )

    return {"path": RECYCLE_BIN_PATH, "nodes": nodes}


@router.post("/recycle/restore")
def restore_recycle_item(recycle_path: str = Query(..., min_length=1)):
    """Restore an item from recycle bin to its original location."""
    normalized_recycle = normalize_path(recycle_path)

    conn = get_db_connection()
    cursor = conn.cursor()
    ensure_support_tables_and_recycle_bin(cursor)

    cursor.execute("SELECT original_path FROM recycle_bin_meta WHERE recycle_path = ?", (normalized_recycle,))
    meta = cursor.fetchone()
    if meta is None:
        conn.close()
        raise HTTPException(status_code=404, detail="Recycle item not found")

    original_path = normalize_path(meta["original_path"])
    original_parent = str(PurePosixPath(original_path).parent)

    cursor.execute("SELECT 1 FROM fs_nodes WHERE path = ?", (original_path,))
    if cursor.fetchone() is not None:
        conn.close()
        raise HTTPException(status_code=409, detail="Original path already exists")

    cursor.execute("SELECT node_type FROM fs_nodes WHERE path = ?", (original_parent,))
    parent_row = cursor.fetchone()
    if parent_row is None or parent_row["node_type"] != "dir":
        conn.close()
        raise HTTPException(status_code=400, detail="Original parent directory missing")

    move_tree(cursor, normalized_recycle, original_path)
    cursor.execute("UPDATE fs_nodes SET parent = ? WHERE path = ?", (original_parent, original_path))
    cursor.execute("DELETE FROM recycle_bin_meta WHERE recycle_path = ?", (normalized_recycle,))

    conn.commit()
    conn.close()
    return {"path": original_path, "status": "restored"}


@router.delete("/recycle/empty")
def empty_recycle_bin():
    """Permanently remove all items in recycle bin."""
    conn = get_db_connection()
    cursor = conn.cursor()
    ensure_support_tables_and_recycle_bin(cursor)

    cursor.execute("DELETE FROM fs_nodes WHERE path LIKE ?", (f"{RECYCLE_BIN_PATH}/%",))
    cursor.execute("DELETE FROM recycle_bin_meta")

    conn.commit()
    conn.close()
    return {"status": "recycle_bin_emptied"}


@router.get("/history")
def list_note_history(path: str = Query(..., min_length=1), limit: int = Query(default=20, ge=1, le=100)):
    """List note content history snapshots for a file path."""
    normalized = normalize_path(path)

    conn = get_db_connection()
    cursor = conn.cursor()
    ensure_support_tables_and_recycle_bin(cursor)

    cursor.execute("SELECT node_type FROM fs_nodes WHERE path = ?", (normalized,))
    node = cursor.fetchone()
    if node is None:
        conn.close()
        raise HTTPException(status_code=404, detail="Path not found")
    if node["node_type"] != "file":
        conn.close()
        raise HTTPException(status_code=400, detail="Path is not a file")

    cursor.execute(
        """
        SELECT id, created_at, content
        FROM note_versions
        WHERE path = ?
        ORDER BY id DESC
        LIMIT ?
        """,
        (normalized, limit),
    )
    rows = cursor.fetchall()
    conn.close()

    versions = []
    for row in rows:
        content = row["content"] or ""
        preview = content.strip().split("\n")[0][:80] if content else "(empty)"
        versions.append(
            {
                "id": row["id"],
                "created_at": row["created_at"],
                "preview": preview,
            }
        )

    return {"path": normalized, "versions": versions}


@router.post("/history/restore")
def restore_note_history(path: str = Query(..., min_length=1), version_id: int = Query(..., ge=1)):
    """Restore a note from a selected history snapshot."""
    normalized = normalize_path(path)

    conn = get_db_connection()
    cursor = conn.cursor()
    ensure_support_tables_and_recycle_bin(cursor)

    cursor.execute("SELECT node_type, content FROM fs_nodes WHERE path = ?", (normalized,))
    node = cursor.fetchone()
    if node is None:
        conn.close()
        raise HTTPException(status_code=404, detail="Path not found")
    if node["node_type"] != "file":
        conn.close()
        raise HTTPException(status_code=400, detail="Path is not a file")

    cursor.execute("SELECT content FROM note_versions WHERE id = ? AND path = ?", (version_id, normalized))
    version = cursor.fetchone()
    if version is None:
        conn.close()
        raise HTTPException(status_code=404, detail="Version not found")

    # Save current state before restoring selected version.
    cursor.execute(
        """
        INSERT INTO note_versions (path, content, created_at)
        VALUES (?, ?, ?)
        """,
        (normalized, node["content"] or "", datetime.utcnow().isoformat()),
    )

    restored_content = version["content"] or ""
    cursor.execute(
        "UPDATE fs_nodes SET content = ?, size = ?, modified_at = ? WHERE path = ?",
        (
            restored_content,
            len(restored_content.encode()),
            datetime.utcnow().isoformat(),
            normalized,
        ),
    )

    conn.commit()
    conn.close()
    return {"path": normalized, "status": "history_restored", "version_id": version_id}


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
        (normalized,),
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
        "attributes": row["attributes"] or "normal",
    }
