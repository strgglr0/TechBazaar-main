#!/usr/bin/env python3
import os

# Delete the corrupted search.tsx
search_path = '/workspaces/TechBazaar-main/client/src/pages/search.tsx'
if os.path.exists(search_path):
    os.remove(search_path)
    print(f"✓ Deleted corrupted {search_path}")

# Copy search-new.tsx to search.tsx
search_new_path = '/workspaces/TechBazaar-main/client/src/pages/search-new.tsx'
with open(search_new_path, 'r') as f:
    content = f.read()

with open(search_path, 'w') as f:
    f.write(content)
    
print(f"✓ Created clean {search_path}")
print(f"✓ File has {len(content.splitlines())} lines")
