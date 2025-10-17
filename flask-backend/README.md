Flask backend for TechBazaar

Quickstart

1. Create and activate a virtual environment:

```bash
python3 -m venv .venv
source .venv/bin/activate
```

2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Initialize and run database migrations (uses SQLite `instance/data.db` by default):

```bash
flask db init    # only the first time
flask db migrate -m "initial"
flask db upgrade
```

Alternatively, the app will call `db.create_all()` on startup if migrations are not used.

Run the app:

```bash
# recommended for development (binds to 0.0.0.0 so Codespaces/containers can forward the port)
export FLASK_APP=app.py
flask run --host=0.0.0.0 --port=5001
```
Flask backend for TechBazaar
===========================

This is a minimal Flask backend designed to demonstrate connecting the existing React frontend to a Flask API.

Quick start (development):

1. Create a virtual environment and install requirements:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

2. Run the Flask app (development):

Option A — run with Flask CLI (recommended in devcontainers/Codespaces):

```bash
export FLASK_APP=app.py
export FLASK_ENV=development
flask run --host=0.0.0.0 --port=5001
```

Option B — run directly with Python (app binds to 0.0.0.0 by default in __main__):

```bash
python app.py
```

By default the app listens on port 5001. The frontend (React/Vite) should proxy API requests to this port (see project `vite.config.ts`).

Database setup
--------------
This backend uses SQLite by default for simplicity. The app will create `data.db` automatically on first run.

If you want to reset the DB during development, remove `data.db` and restart the app.


Production
----------
Build the React app using `npm run build` inside the `client` directory. Then copy the build output into `flask-backend/static/` (or configure your deployment to place the build there). The Flask app will serve static files and `index.html` to support client-side routing.

React example requests (client-side):

```js
// Login
fetch('http://localhost:5000/api/login', {
	method: 'POST',
	headers: { 'Content-Type': 'application/json' },
	body: JSON.stringify({ email: 'you@example.com', password: 'pass' }),
})
.then(r => r.json())
.then(console.log)

// Get products
fetch('http://localhost:5000/api/products')
	.then(r => r.json())
	.then(data => console.log(data));

// Add to cart (include session header if needed)
fetch('http://localhost:5000/api/cart/add', {
	method: 'POST',
	headers: { 'Content-Type': 'application/json', 'x-session-id': 'default-session' },
	body: JSON.stringify({ productId: '1', quantity: 1 }),
})
	.then(r => r.json()).then(console.log);
```

