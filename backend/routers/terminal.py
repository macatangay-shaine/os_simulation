"""Terminal command execution endpoints."""

from fastapi import APIRouter
from datetime import datetime
from pathlib import PurePosixPath
from models import TerminalCommandRequest, TerminalCommandResponse
from database import get_db_connection, normalize_path
import config

router = APIRouter(prefix="/terminal", tags=["terminal"])


@router.post("/execute", response_model=TerminalCommandResponse)
def execute_terminal_command(payload: TerminalCommandRequest):
    """Execute a terminal command."""
    cmd_line = payload.command.strip()
    current_dir = payload.cwd
    
    if not cmd_line:
        return TerminalCommandResponse(output="", cwd=current_dir)
    
    parts = cmd_line.split()
    command = parts[0]
    args = parts[1:]
    output = ""
    
    try:
        if command == "help":
            output = (
                "Available commands:\n"
                "  ls [path]        - list directory contents\n"
                "  cd <path>        - change directory\n"
                "  cat <file>       - display file contents\n"
                "  ps               - list running processes\n"
                "  kill <pid>       - terminate process\n"
                "  clear            - clear terminal screen\n"
                "  pwd              - print working directory\n"
                "  mkdir <path>     - create directory\n"
                "  touch <file>     - create empty file\n"
                "  rm <path>        - remove file or directory"
            )
        
        elif command == "clear":
            output = "\x1b[2J"  # Special clear signal
        
        elif command == "pwd":
            output = current_dir
        
        elif command == "ls":
            target = args[0] if args else current_dir
            if not target.startswith('/'):
                target = f"{current_dir}/{target}".replace('//', '/')
            target = normalize_path(target)
            
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT node_type FROM fs_nodes WHERE path = ?", (target,))
            row = cursor.fetchone()
            
            if row is None:
                output = f"ls: cannot access '{target}': No such file or directory"
            elif row["node_type"] != "dir":
                output = f"ls: {target}: Not a directory"
            else:
                cursor.execute(
                    "SELECT path, node_type FROM fs_nodes WHERE parent = ? ORDER BY node_type DESC, path ASC",
                    (target,)
                )
                rows = cursor.fetchall()
                if not rows:
                    output = ""
                else:
                    entries = []
                    for r in rows:
                        name = r["path"].split('/')[-1]
                        prefix = "[DIR] " if r["node_type"] == "dir" else "[FILE]"
                        entries.append(f"{prefix} {name}")
                    output = "\n".join(entries)
            conn.close()
        
        elif command == "cd":
            if not args:
                output = "cd: missing operand"
            else:
                target = args[0]
                if target.startswith('/'):
                    new_dir = normalize_path(target)
                else:
                    new_dir = normalize_path(f"{current_dir}/{target}")
                
                conn = get_db_connection()
                cursor = conn.cursor()
                cursor.execute("SELECT node_type FROM fs_nodes WHERE path = ?", (new_dir,))
                row = cursor.fetchone()
                conn.close()
                
                if row is None:
                    output = f"cd: {target}: No such file or directory"
                elif row["node_type"] != "dir":
                    output = f"cd: {target}: Not a directory"
                else:
                    current_dir = new_dir
                    output = ""
        
        elif command == "cat":
            if not args:
                output = "cat: missing file operand"
            else:
                target = args[0]
                if not target.startswith('/'):
                    target = f"{current_dir}/{target}".replace('//', '/')
                target = normalize_path(target)
                
                conn = get_db_connection()
                cursor = conn.cursor()
                cursor.execute("SELECT node_type, content FROM fs_nodes WHERE path = ?", (target,))
                row = cursor.fetchone()
                conn.close()
                
                if row is None:
                    output = f"cat: {target}: No such file or directory"
                elif row["node_type"] != "file":
                    output = f"cat: {target}: Is a directory"
                else:
                    output = row["content"] or ""
        
        elif command == "ps":
            if not config.process_table:
                output = "No running processes"
            else:
                lines = ["PID    APP                MEMORY    STATE"]
                lines.append("-" * 45)
                for proc in config.process_table:
                    lines.append(f"{proc.pid:<6} {proc.app:<18} {proc.memory:<9} {proc.state}")
                output = "\n".join(lines)
        
        elif command == "kill":
            if not args:
                output = "kill: missing process ID"
            else:
                try:
                    pid = int(args[0])
                    found = False
                    for index, proc in enumerate(config.process_table):
                        if proc.pid == pid:
                            config.process_table[index] = proc.model_copy(update={"state": "terminated"})
                            output = f"Process {pid} terminated"
                            found = True
                            break
                    if not found:
                        output = f"kill: ({pid}) - No such process"
                except ValueError:
                    output = f"kill: {args[0]}: invalid process ID"
        
        elif command == "mkdir":
            if not args:
                output = "mkdir: missing operand"
            else:
                target = args[0]
                if not target.startswith('/'):
                    target = f"{current_dir}/{target}".replace('//', '/')
                target = normalize_path(target)
                parent = str(PurePosixPath(target).parent)
                
                conn = get_db_connection()
                cursor = conn.cursor()
                cursor.execute("SELECT 1 FROM fs_nodes WHERE path = ?", (target,))
                if cursor.fetchone():
                    output = f"mkdir: cannot create directory '{target}': File exists"
                else:
                    cursor.execute("SELECT node_type FROM fs_nodes WHERE path = ?", (parent,))
                    parent_row = cursor.fetchone()
                    if not parent_row or parent_row["node_type"] != "dir":
                        output = f"mkdir: cannot create directory '{target}': No such file or directory"
                    else:
                        cursor.execute(
                            "INSERT INTO fs_nodes (path, parent, node_type, content, created_at) VALUES (?, ?, 'dir', '', ?)",
                            (target, parent, datetime.utcnow().isoformat())
                        )
                        conn.commit()
                        output = ""
                conn.close()
        
        elif command == "touch":
            if not args:
                output = "touch: missing file operand"
            else:
                target = args[0]
                if not target.startswith('/'):
                    target = f"{current_dir}/{target}".replace('//', '/')
                target = normalize_path(target)
                parent = str(PurePosixPath(target).parent)
                
                conn = get_db_connection()
                cursor = conn.cursor()
                cursor.execute("SELECT 1 FROM fs_nodes WHERE path = ?", (target,))
                if cursor.fetchone():
                    output = ""  # File exists, touch just updates timestamp (we'll skip that)
                else:
                    cursor.execute("SELECT node_type FROM fs_nodes WHERE path = ?", (parent,))
                    parent_row = cursor.fetchone()
                    if not parent_row or parent_row["node_type"] != "dir":
                        output = f"touch: cannot touch '{target}': No such file or directory"
                    else:
                        cursor.execute(
                            "INSERT INTO fs_nodes (path, parent, node_type, content, created_at) VALUES (?, ?, 'file', '', ?)",
                            (target, parent, datetime.utcnow().isoformat())
                        )
                        conn.commit()
                        output = ""
                conn.close()
        
        elif command == "rm":
            if not args:
                output = "rm: missing operand"
            else:
                target = args[0]
                if not target.startswith('/'):
                    target = f"{current_dir}/{target}".replace('//', '/')
                target = normalize_path(target)
                
                conn = get_db_connection()
                cursor = conn.cursor()
                cursor.execute("SELECT node_type FROM fs_nodes WHERE path = ?", (target,))
                row = cursor.fetchone()
                
                if row is None:
                    output = f"rm: cannot remove '{target}': No such file or directory"
                else:
                    if row["node_type"] == "dir":
                        cursor.execute("DELETE FROM fs_nodes WHERE path = ? OR path LIKE ?", (target, f"{target}/%"))
                    else:
                        cursor.execute("DELETE FROM fs_nodes WHERE path = ?", (target,))
                    conn.commit()
                    output = ""
                conn.close()
        
        else:
            output = f"{command}: command not found"
    
    except Exception as e:
        output = f"Error: {str(e)}"
    
    return TerminalCommandResponse(output=output, cwd=current_dir)
