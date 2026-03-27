from database import list_update_history

history = list_update_history()
print(f'Total history entries: {len(history)}')
print()
for entry in history:
    print(f"ID: {entry['id']}")
    print(f"Version: {entry['version']}")
    print(f"Status: {entry['status']}")
    print(f"Applied at: {entry['applied_at']}")
    print('-' * 40)
