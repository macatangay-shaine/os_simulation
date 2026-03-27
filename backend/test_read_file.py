import sqlite3
import json

conn = sqlite3.connect('virt_os.db')
cursor = conn.cursor()

# Try to read the testing.txt file the way the API would
test_path = '/home/user/notes/testing.txt'

cursor.execute("SELECT node_type, content FROM fs_nodes WHERE path = ?", (test_path,))
row = cursor.fetchone()

if row:
    node_type, content = row
    print(f"✓ File found: {test_path}")
    print(f"  Type: {node_type}")
    print(f"  Content: {content}")
    print(f"  Content length: {len(content)}")
    
    # Simulate what the API returns
    response = {"path": test_path, "content": content}
    print(f"\n  API Response would be:")
    print(f"  {json.dumps(response)}")
else:
    print(f"✗ File NOT found: {test_path}")

conn.close()
