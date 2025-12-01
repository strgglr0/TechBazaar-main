#!/bin/bash
set -e

echo "=========================================="
echo "NUCLEAR OPTION: COMPLETE DATABASE RESET"
echo "=========================================="
echo ""
echo "This will:"
echo "  1. Delete ALL existing data"
echo "  2. Recreate database with correct schema"
echo "  3. Seed sample products"
echo ""
read -p "Press ENTER to continue or Ctrl+C to cancel..."

cd /workspaces/TechBazaar-main/flask-backend

# Delete everything
echo ""
echo "Step 1: Removing old database files..."
rm -rf instance/
mkdir -p instance
echo "✓ Database deleted"

# Create fresh database
echo ""
echo "Step 2: Creating new database with correct schema..."
python3 -c "
from app import create_app
from extensions import db

app = create_app()
with app.app_context():
    db.create_all()
    print('✓ Database created')
"

# Seed products
echo ""
echo "Step 3: Seeding sample products..."
python3 seed_data.py

# Verify the schema
echo ""
echo "Step 4: Verifying database schema..."
python3 -c "
from app import create_app
from extensions import db
from sqlalchemy import text

app = create_app()
with app.app_context():
    result = db.session.execute(text('SELECT sql FROM sqlite_master WHERE type=\"table\" AND name=\"orders\"'))
    sql = result.fetchone()[0]
    print('Orders table schema:')
    print(sql)
    if 'DEFAULT' in sql.upper() and 'status' in sql.lower():
        print('⚠️  WARNING: Default value found in status column!')
        exit(1)
    else:
        print('✓ No default value in status column')
"

echo ""
echo "=========================================="
echo "✓ DATABASE RESET COMPLETE!"
echo "=========================================="
echo ""
echo "Now restart your server:"
echo "  cd /workspaces/TechBazaar-main"
echo "  npm run dev:All"
echo ""
echo "Orders will now start with 'pending_payment' status!"
echo "=========================================="
