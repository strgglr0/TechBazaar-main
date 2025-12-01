#!/bin/bash

echo "=========================================="
echo "Resetting TechBazaar Database"
echo "=========================================="

cd /workspaces/TechBazaar-main/flask-backend

# Stop any running Flask processes
echo "Stopping Flask backend..."
pkill -f "flask run" 2>/dev/null || true
pkill -f "python.*app.py" 2>/dev/null || true
sleep 2

# Remove the existing database
echo "Removing old database..."
rm -f instance/data.db
rm -f instance/data.db-journal

# Reset the database with new schema
echo "Creating fresh database..."
python3 reset_db.py

# Seed with sample data
echo "Seeding sample products..."
python3 seed_data.py

echo ""
echo "=========================================="
echo "Database reset complete!"
echo "Please restart your development server:"
echo "  npm run dev:All"
echo "=========================================="
