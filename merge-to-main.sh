#!/bin/bash
# Merge lynux branch changes into main

echo "🔄 Switching to main branch..."
git checkout main

echo "📥 Pulling latest main..."
git pull origin main

echo "🔀 Merging lynux into main..."
git merge lynux -m "Merge lynux: Add cart transfer fix and product rating system"

echo "🚀 Pushing to main..."
git push origin main

echo "✅ Done! Your team can now pull from main branch."
echo ""
echo "Tell your team member to run:"
echo "  git checkout main"
echo "  git pull origin main"
