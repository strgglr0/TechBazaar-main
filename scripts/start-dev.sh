#!/usr/bin/env bash
set -euo pipefail

# start-dev.sh - starts Flask backend (with venv) and React dev server, cleans up on exit

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FLASK_DIR="$ROOT/flask-backend"
CLIENT_DIR="$ROOT/client"
VENV="$FLASK_DIR/.venv"

echo "Starting development environment..."

# Create venv and install requirements if missing
if [ ! -d "$VENV" ]; then
  echo "Creating Python virtualenv in $VENV"
  python -m venv "$VENV"
  # shellcheck source=/dev/null
  source "$VENV/bin/activate"
  pip install --upgrade pip
  pip install -r "$FLASK_DIR/requirements.txt"
else
  # shellcheck source=/dev/null
  source "$VENV/bin/activate"
fi

export FLASK_APP="$FLASK_DIR/app.py"
export FLASK_ENV=development
export FLASK_SECRET="${FLASK_SECRET:-dev-secret}"
export FLASK_RUN_PORT=5002

cd "$FLASK_DIR"
echo "Starting Flask backend... (logs -> $FLASK_DIR/flask.log)"
python app.py > "$FLASK_DIR/flask.log" 2>&1 &
FLASK_PID=$!
echo "Flask PID: $FLASK_PID"

cd "$CLIENT_DIR"
echo "Starting React dev server..."
# install client deps only if node_modules missing
if [ ! -d "$CLIENT_DIR/node_modules" ]; then
  cd "$ROOT"
  npm install
  cd "$CLIENT_DIR"
fi
# Set environment variables for better Codespaces compatibility
export VITE_DEV_SERVER_PORT="${VITE_DEV_SERVER_PORT:-3000}"
export HMR_HOST="${CODESPACE_NAME:-localhost}"
# Use the shared vite config from the root directory
cd "$ROOT"
npx vite --port "$VITE_DEV_SERVER_PORT" --host &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

cleanup() {
  echo "Stopping dev servers..."
  kill "$FRONTEND_PID" 2>/dev/null || true
  kill "$FLASK_PID" 2>/dev/null || true
}

trap cleanup EXIT

wait "$FRONTEND_PID"
