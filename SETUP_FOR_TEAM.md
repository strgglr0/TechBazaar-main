# Setup Instructions for Team Members

## Initial Setup (One Time Only)

### Step 1: Clone the Repository
```bash
cd /workspaces
git clone https://github.com/strgglr0/TechBazaar-main
cd TechBazaar-main
```

### Step 2: Install Node Dependencies
```bash
npm install
```

### Step 3: Setup Flask Backend
```bash
cd flask-backend

# Create virtual environment
python3 -m venv .venv

# Activate virtual environment
source .venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Go back to root directory
cd ..
```

### Step 4: Check if Database Exists
```bash
# Check if database file exists
ls -la flask-backend/instance/data.db
```

If the file exists, you're good! If not, run:
```bash
cd flask-backend
source .venv/bin/activate
python seed_data.py
cd ..
```

## Running the Application

**IMPORTANT:** Always use this command:
```bash
npm run dev:all
```

**DO NOT use** `npm run dev` or `npm start`

### What You Should See:
```
Starting development environment...
Starting Flask backend... (logs -> flask-backend/flask.log)
Flask PID: 12345
Starting React dev server...
Frontend PID: 67890
```

### Access the Application:
- Frontend: http://localhost:5000 (or whatever port it shows)
- Backend API: http://localhost:5001

## Default Admin Account

If the database has the admin account, use:
- **Email:** admin@hmntech.com
- **Password:** admin123

(If this doesn't work, the database might not have been seeded)

## Troubleshooting

### Issue 1: "No products showing"
**Cause:** Using Node.js backend instead of Flask
**Solution:**
```bash
# Kill all processes
pkill -f python
pkill -f node
pkill -f vite

# Start again
npm run dev:all
```

Check browser Network tab - API calls should go to `localhost:5001`

### Issue 2: "No accounts showing"
**Cause:** Database file is empty or missing
**Solution:**
```bash
cd flask-backend
source .venv/bin/activate

# Check database
python3 << EOF
from app import create_app
from extensions import db
from models import User, Product

app = create_app()
with app.app_context():
    print(f"Users: {User.query.count()}")
    print(f"Products: {Product.query.count()}")
EOF

cd ..
```

If counts are 0, run:
```bash
cd flask-backend
python seed_data.py
cd ..
```

### Issue 3: "Database file doesn't exist"
**Solution:**
```bash
# Pull latest changes
git pull origin main

# Check again
ls -la flask-backend/instance/data.db
```

If still missing, create and seed:
```bash
cd flask-backend
source .venv/bin/activate
python seed_data.py
cd ..
```

### Issue 4: "Module not found" errors
**Solution:**
```bash
cd flask-backend
source .venv/bin/activate
pip install -r requirements.txt
cd ..
```

## Creating Your Own Account

1. Start the application: `npm run dev:all`
2. Open browser: http://localhost:5000
3. Click "Sign up"
4. Create your account

## For Pulling Updates

When the main developer pushes changes:
```bash
git pull origin main
npm install  # In case dependencies changed
npm run dev:all
```

## Quick Reference

| Command | Purpose |
|---------|---------|
| `npm run dev:all` | Start Flask + React (USE THIS) |
| `npm install` | Install Node dependencies |
| `git pull origin main` | Get latest changes |
| `cd flask-backend && source .venv/bin/activate` | Activate Python env |
| `python seed_data.py` | Seed database with products |

## Need Help?

Contact: ryannoche116@gmail.com
