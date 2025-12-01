#!/bin/bash
set -e

echo "=========================================="
echo "FIXING ORDER STATUS - COMPLETE RESET"
echo "=========================================="

cd /workspaces/TechBazaar-main

# Kill any existing processes
echo "1. Stopping all servers..."
pkill -f "npm.*dev" 2>/dev/null || true
pkill -f "flask run" 2>/dev/null || true
pkill -f "python.*app.py" 2>/dev/null || true
sleep 3

# Delete old database
echo "2. Deleting old database..."
rm -f flask-backend/instance/data.db
rm -f flask-backend/instance/data.db-journal
rm -f flask-backend/instance/*.db*

# Recreate database with correct schema
echo "3. Creating new database..."
cd flask-backend
python3 << 'PYTHON_SCRIPT'
from app import create_app
from extensions import db

app = create_app()
with app.app_context():
    db.create_all()
    print("✓ Database created successfully")
PYTHON_SCRIPT

# Seed products
echo "4. Seeding sample products..."
python3 seed_data.py

cd ..

echo ""
echo "=========================================="
echo "✓ DATABASE RESET COMPLETE!"
echo "=========================================="
echo ""
echo "Now restart your server:"
echo "  npm run dev:All"
echo ""
echo "Orders will now start with 'pending_payment' status!"
echo "=========================================="
