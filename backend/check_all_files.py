import sqlite3

conn = sqlite3.connect('virt_os.db')
cursor = conn.cursor()

# Check if fs_nodes table has the right data
cursor.execute("SELECT COUNT(*) as total FROM fs_nodes")
total = cursor.fetchone()[0]
print(f"Total nodes in database: {total}")

# Show file entries (not directories)
cursor.execute("""
    SELECT path, node_type, size, 
           SUBSTR(content, 1, 30) as content_preview 
    FROM fs_nodes 
    WHERE node_type = 'file'
    ORDER BY path
""")

print("\nAll files in the database:")
for row in cursor.fetchall():
    path, node_type, size, preview = row
    print(f"  {path}")
    print(f"    Size: {size} bytes | Preview: {preview}")

# Verify notes directory structure
print("\n\nNotes directory contents:")
cursor.execute("""
    SELECT path, node_type, size, created_at, modified_at
    FROM fs_nodes 
    WHERE path LIKE '/home/user/notes%'
    ORDER BY path
""")

for row in cursor.fetchall():
    path, node_type, size, created, modified = row
    print(f"  {path}")
    print(f"    Type: {node_type}, Size: {size}")
    print(f"    Created: {created}, Modified: {modified}")

conn.close()
