#!/usr/bin/env python
"""Test script to verify file reading works"""
import sqlite3
import json

print("=" * 50)
print("FILE READING TEST")
print("=" * 50)

conn = sqlite3.connect('virt_os.db')
conn.row_factory = sqlite3.Row
cursor = conn.cursor()

# Test path
test_path = '/home/user/notes/testing.txt'
print(f"\nAttempting to read: {test_path}")

# Query the database
cursor.execute("SELECT node_type, content FROM fs_nodes WHERE path = ?", (test_path,))
row = cursor.fetchone()

if row is None:
    print("✗ FAILED: File not found in database")
else:
    node_type = row['node_type']
    content = row['content']
    
    print(f"✓ SUCCESS: File found!")
    print(f"  Node Type: {node_type}")
    print(f"  Content: '{content}'")
    print(f"  Content Length: {len(content)} chars")
    
    # Simulate API response
    api_response = {
        "path": test_path,
        "content": content
    }
    print(f"\n  What the API returns:")
    print(f"  {json.dumps(api_response, indent=2)}")

conn.close()
print("\n" + "=" * 50)
