#!/bin/bash
# Script to commit and push all recent changes to GitHub

echo "🔍 Checking current status..."
git status

echo ""
echo "🗑️  Removing deprecated files..."
rm -f flask-backend/email_utils.py
rm -f PAYMENT_FEATURE.md
rm -f check_payment_column.py
rm -f flask-backend/add_payment_method.py

echo ""
echo "📝 Staging all changes..."
git add -A

echo ""
echo "📊 Changes to be committed:"
git status

echo ""
echo "💾 Creating commit..."
git commit -m "Fix cart transfer and add product rating system

- Add missing /api/cart/transfer endpoint to merge guest cart on login
- Implement product rating system (1-5 stars) for delivered orders  
- Add rating endpoints and UI in user profile
- Update product aggregate ratings automatically
- Remove deprecated email utility files
- Clean up temporary migration scripts and documentation"

echo ""
echo "🚀 Pushing to lynux branch..."
git push origin lynux

echo ""
echo "✅ Done! Your team members can now pull these changes."
