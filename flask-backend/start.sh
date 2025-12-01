#!/bin/bash
# Startup script for Flask backend with proper error handling

echo "=========================================="
echo "  TechBazaar Flask Backend Startup"
echo "=========================================="
echo ""

# Kill any existing Flask processes
echo "1. Stopping existing Flask processes..."
pkill -9 -f "python.*app.py" 2>/dev/null
sleep 2
echo "   ✓ Stopped"
echo ""

# Check Python version
echo "2. Checking Python environment..."
python --version
echo ""

# Navigate to flask-backend directory
cd "$(dirname "$0")"
echo "3. Working directory: $(pwd)"
echo ""

# Check if required files exist
echo "4. Checking required files..."
if [ ! -f "app.py" ]; then
    echo "   ✗ ERROR: app.py not found!"
    exit 1
fi
if [ ! -f "requirements.txt" ]; then
    echo "   ⚠ WARNING: requirements.txt not found!"
fi
echo "   ✓ Files exist"
echo ""

# Check if database exists
echo "5. Checking database..."
if [ -f "instance/data.db" ]; then
    echo "   ✓ Database exists"
else
    echo "   ℹ Database will be created on first run"
fi
echo ""

# Start Flask
echo "6. Starting Flask backend..."
echo "   Port: 5001"
echo "   Mode: Development (Debug ON)"
echo "   Press Ctrl+C to stop"
echo ""
echo "=========================================="
echo ""

# Run Flask with unbuffered output
export PYTHONUNBUFFERED=1
python app.py

