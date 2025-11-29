#!/bin/bash
# Clean fix for search.tsx
cd /workspaces/TechBazaar-main/client/src/pages
rm -f search.tsx
cp search-new.tsx search.tsx
echo "✓ Fixed search.tsx"
wc -l search.tsx
