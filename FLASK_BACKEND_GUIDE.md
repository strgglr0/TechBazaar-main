# Using Flask Backend with Persistent Database

## Why Flask Backend?

The Flask backend uses **SQLite database** which means:
✅ All products are saved permanently
✅ All user accounts persist across restarts
✅ Cart data is preserved
✅ Everyone using the same database file sees the same data

## Quick Start

### Option 1: Use the script (Recommended)
```bash
npm run dev:all
```

This automatically starts both Flask backend (port 5001) and React frontend (port 5000).

### Option 2: Manual start
```bash
# Terminal 1 - Start Flask backend
cd flask-backend
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
python app.py

# Terminal 2 - Start React frontend
npm install
npm run dev:frontend
```

## Initial Setup

### 1. Seed the Database (First time only)
```bash
cd flask-backend
source .venv/bin/activate
python seed_data.py
```

This adds 6 sample products to your database.

### 2. Create Admin Account
Set environment variables:
```bash
export FLASK_ADMIN_EMAIL="admin@hmntech.com"
export FLASK_ADMIN_PASSWORD="admin123"
```

Then restart the Flask app. The admin account will be created automatically.

## Database Location

The SQLite database is stored at:
```
flask-backend/instance/data.db
```

**Important:** If you want others to have your products/accounts:
1. Commit the `instance/data.db` file to git
2. Others pull your code and get the database

## Sharing Data with Team

### To share your database:
```bash
git add flask-backend/instance/data.db
git commit -m "Update database with products and accounts"
git push
```

### For others to get your data:
```bash
git pull
npm run dev:all
```

They'll have all your products and accounts!

## Common Issues

### "Module not found" error
```bash
cd flask-backend
source .venv/bin/activate
pip install -r requirements.txt
```

### Database is empty after restart
- Make sure you're using Flask backend (not Node.js server)
- Check if `flask-backend/instance/data.db` exists
- Run `python seed_data.py` to add products

### Port already in use
Flask uses port 5001, React uses port 5000. Change in:
- Flask: `export FLASK_RUN_PORT=5002`
- React: Edit `scripts/start-dev.sh`

## API Endpoints

Flask backend runs on `http://localhost:5001`

- `GET /api/products` - List all products
- `POST /api/products` - Create product (admin)
- `GET /api/products/:id` - Get product details
- `PUT /api/products/:id` - Update product (admin)
- `DELETE /api/products/:id` - Delete product (admin)
- `POST /api/signup` - Register new user
- `POST /api/login` - Login user
- `GET /api/cart` - Get cart items
- `POST /api/cart` - Add to cart
- More endpoints in `flask-backend/routes/`

## VS Node.js Backend

| Feature | Flask (SQLite) | Node.js (In-memory) |
|---------|---------------|---------------------|
| Data persistence | ✅ Yes | ❌ No (lost on restart) |
| Shared data | ✅ Yes (via data.db) | ❌ Each instance isolated |
| Setup | Medium | Easy |
| Production ready | ✅ Yes | ⚠️ Needs real DB |

**Recommendation:** Use Flask backend for your project!
