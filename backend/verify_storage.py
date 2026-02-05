import sqlite3

conn = sqlite3.connect('virt_os.db')
cursor = conn.cursor()

# Check total app storage
cursor.execute('SELECT SUM(storage_size_mb) FROM apps WHERE installed = 1')
total_app_storage = cursor.fetchone()[0] or 0
print(f'Total app storage: {total_app_storage} MB')

# Check file storage
cursor.execute("SELECT SUM(size) FROM fs_nodes WHERE node_type = 'file'")
total_file_storage = cursor.fetchone()[0] or 0
print(f'Total file storage: {total_file_storage} bytes ({total_file_storage / 1024 / 1024:.2f} MB)')

conn.close()
