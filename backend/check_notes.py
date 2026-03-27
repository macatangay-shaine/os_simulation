import sqlite3

conn = sqlite3.connect('virt_os.db')
cursor = conn.cursor()

# Show all files in notes directory
cursor.execute("SELECT path, node_type, content, size FROM fs_nodes WHERE path LIKE '/home/user/notes%' ORDER BY path")
rows = cursor.fetchall()

print(f"Files in /home/user/notes directory ({len(rows)} total):")
for row in rows:
    path, node_type, content, size = row
    print(f"  Path: {path}")
    print(f"    Type: {node_type}, Size: {size} bytes")
    if node_type == 'file' and content:
        print(f"    Content preview: {content[:50]}...")
    print()

conn.close()
