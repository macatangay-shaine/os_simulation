import sqlite3
import json

conn = sqlite3.connect('virt_os.db')
cursor = conn.cursor()

# Simulate what /fs/list returns for /home/user/notes
normalized_path = '/home/user/notes'

# First check the directory exists
cursor.execute("SELECT node_type FROM fs_nodes WHERE path = ?", (normalized_path,))
dir_row = cursor.fetchone()
if dir_row:
    print(f"✓ Directory {normalized_path} exists (type: {dir_row[0]})")
else:
    print(f"✗ Directory {normalized_path} does NOT exist")

# Now list children
cursor.execute("SELECT path, node_type FROM fs_nodes WHERE parent = ?", (normalized_path,))
nodes = cursor.fetchall()

print(f"\nChildren of {normalized_path} ({len(nodes)} total):")
for path, node_type in nodes:
    print(f"  - {path} (type: {node_type})")

# Show the response format
response = {
    "path": normalized_path,
    "nodes": [
        {"path": r[0], "type": r[1], "name": r[0].split("/")[-1]}
        for r in nodes
    ]
}

print(f"\nAPI Response would be:")
print(json.dumps(response, indent=2))

conn.close()
