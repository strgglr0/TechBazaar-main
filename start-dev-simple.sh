#!/bin/bash

echo "🚀 Starting TechBazaar Development Environment"
echo "============================================="

# Stop any existing processes
echo "Stopping existing processes..."
pkill -f "python.*app.py" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true

# Wait a moment for processes to stop
sleep 2

# Start Flask backend
echo "Starting Flask backend on port 5002..."
cd /workspaces/TechBazaar/flask-backend
source .venv/bin/activate
FLASK_RUN_PORT=5002 python app.py &
FLASK_PID=$!
echo "Flask PID: $FLASK_PID"

# Give Flask a moment to start
sleep 3

# Start Vite frontend
echo "Starting Vite frontend on port 3000..."
cd /workspaces/TechBazaar
npm run dev:frontend &
VITE_PID=$!
echo "Vite PID: $VITE_PID"

echo ""
echo "✅ Development servers started successfully!"
echo ""
echo "📱 Frontend: http://localhost:3000"
echo "🌐 Backend API: http://localhost:5002/api"
echo ""
echo "🔧 To stop servers: kill $FLASK_PID $VITE_PID"
echo "   Or press Ctrl+C and then run: pkill -f 'python.*app.py|vite'"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping development servers..."
    kill $FLASK_PID $VITE_PID 2>/dev/null || true
    pkill -f "python.*app.py" 2>/dev/null || true
    pkill -f "vite" 2>/dev/null || true
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup EXIT INT TERM

# Wait for either process to exit
wait