#!/bin/bash
# Merge all changes from current branch to main

echo "🔍 Current branch:"
git branch --show-current

echo ""
echo "📝 Staging all changes..."
git add -A

echo ""
echo "💾 Committing changes..."
git commit -m "Add cart transfer fix, product ratings, and admin improvements

- Fix checkout session ID bug for proper cart clearing
- Add cart/transfer endpoint to merge guest cart on login
- Implement product rating system (1-5 stars) for delivered orders
- Add rating endpoints and UI in user profile
- Remove admin rating manipulation - ratings now customer-only
- Add ratings column to product table for monitoring
- Fix admin_required decorator bug
- Clean up deprecated files"

echo ""
echo "🔄 Switching to main branch..."
git checkout main

echo ""
echo "📥 Pulling latest main..."
git pull origin main

echo ""
echo "🔀 Merging current branch into main..."
git merge - -m "Merge: Cart transfer fix, product ratings, and improvements"

echo ""
echo "🚀 Pushing to main..."
git push origin main

echo ""
echo "✅ Done! All changes merged to main."
echo ""
echo "Your team members can now:"
echo "  git checkout main"
echo "  git pull origin main"
