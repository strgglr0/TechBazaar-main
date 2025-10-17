# Database Information & Admin Account Details

## 📊 Database System

**Database Type:** SQLite  
**Location:** `flask-backend/instance/data.db`  
**ORM:** SQLAlchemy (Flask-SQLAlchemy)  
**Migrations:** Flask-Migrate  

### Configuration (from `app.py`)
```python
SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', 'sqlite:///data.db')
```

- Default: SQLite database file at `flask-backend/instance/data.db`
- Can be overridden with `DATABASE_URL` environment variable
- Supports PostgreSQL, MySQL, etc. by changing the URI

---

## 🔐 Admin Account Details

### Current Admin Account:

```
┌─────────────────────────────────────────┐
│         ADMIN ACCOUNT                   │
├─────────────────────────────────────────┤
│  ID:       1                            │
│  Email:    ryannoche116@gmail.com       │
│  Name:     marc ryan noche              │
│  Is Admin: True ✓                       │
│  Created:  2025-10-17 14:05:48          │
└─────────────────────────────────────────┘
```

**⚠️ Important Notes:**
- Password is **hashed** using Werkzeug's `security` module
- The actual password is **NOT** stored in the database
- Only you know the password you created
- To reset password, you'll need to update the hash in the database or create a new admin

### How to Login as Admin:
1. Go to: `http://localhost:3000/login` (or your app URL)
2. Email: `ryannoche116@gmail.com`
3. Password: (the password you set when you created this account)

### Creating Additional Admin Accounts:

**Method 1: Using Environment Variables**
```bash
export FLASK_ADMIN_EMAIL="newadmin@example.com"
export FLASK_ADMIN_PASSWORD="your-secure-password"
# Restart Flask - it will auto-create the admin user
```

**Method 2: Using Python Script**
```python
cd flask-backend
python3 <<EOF
from app import create_app
from models import User
from utils import hash_password
from extensions import db

app = create_app()
with app.app_context():
    new_admin = User(
        email='newadmin@example.com',
        password_hash=hash_password('your-password'),
        name='New Admin Name',
        is_admin=True
    )
    db.session.add(new_admin)
    db.session.commit()
    print(f"✅ Admin created: {new_admin.email}")
EOF
```

**Method 3: Promote Existing User**
```python
cd flask-backend
python3 <<EOF
from app import create_app
from models import User
from extensions import db

app = create_app()
with app.app_context():
    user = User.query.filter_by(email='user@example.com').first()
    if user:
        user.is_admin = True
        db.session.commit()
        print(f"✅ User promoted to admin: {user.email}")
    else:
        print("❌ User not found")
EOF
```

---

## 📋 Database Tables

### 1. **users** Table
```
Columns:
  • id               INTEGER         (PRIMARY KEY)
  • email            VARCHAR(255)    (NOT NULL, UNIQUE)
  • password_hash    VARCHAR(255)    (NOT NULL)
  • name             VARCHAR(255)    
  • is_admin         BOOLEAN         (default: False)
  • created_at       DATETIME        

Current Rows: 2
```

**Current Users:**
| ID | Email | Name | Admin | Created |
|----|-------|------|-------|---------|
| 1 | ryannoche116@gmail.com | marc ryan noche | ✓ | 2025-10-17 |
| 2 | lyxnuxmaldia@gmail.com | lynux | ✗ | 2025-10-17 |

### 2. **products** Table
```
Columns:
  • id               VARCHAR(64)     (PRIMARY KEY)
  • name             VARCHAR(255)    (NOT NULL)
  • description      TEXT            
  • price            VARCHAR(64)     (NOT NULL)
  • category         VARCHAR(128)    
  • brand            VARCHAR(128)    
  • stock            INTEGER         
  • imageUrl         VARCHAR(1024)   

Current Rows: 1
```

**Current Products:**
| ID | Name | Price | Category | Stock |
|----|------|-------|----------|-------|
| 1 | Samsung A23 | ₱10 | phones | 10 |

### 3. **cart_items** Table
```
Columns:
  • id               VARCHAR(64)     (PRIMARY KEY)
  • user_id          INTEGER         (Foreign Key -> users.id)
  • session_id       VARCHAR(128)    (for guest carts)
  • product_id       VARCHAR(64)     (Foreign Key -> products.id)
  • quantity         INTEGER         

Current Rows: 1
```

### 4. **orders** Table
```
Columns:
  • id               VARCHAR(64)     (PRIMARY KEY)
  • user_id          INTEGER         (Foreign Key -> users.id)
  • customer_name    VARCHAR(255)    
  • customer_email   VARCHAR(255)    
  • customer_phone   VARCHAR(64)     
  • shipping_address JSON            
  • items            JSON            (NOT NULL)
  • total            FLOAT           
  • status           VARCHAR(32)     (NOT NULL, default: 'processing')
  • created_at       DATETIME        

Current Rows: 0
```

**Status Flow:** `processing → delivered → received`

---

## ⚠️ Database Schema Updates Needed

The code has been updated to include new columns, but the database hasn't been migrated yet.

### Missing Columns:
**users table:**
- `phone` (VARCHAR(64)) - for contact number
- `shipping_address` (JSON) - for default shipping address

### To Apply Schema Changes:

**Option 1: Reset Database (Development Only)**
```bash
cd flask-backend
rm instance/data.db
# Restart Flask - it will recreate tables with new schema
python app.py
```
⚠️ **This deletes all data including users and products!**

**Option 2: Run Migrations (Recommended)**
```bash
cd flask-backend

# Initialize migrations (if not done yet)
flask db init

# Create migration
flask db migrate -m "Add phone and shipping_address to users"

# Apply migration
flask db upgrade
```

---

## 🔧 Database Management Tools

### View Database:
```bash
cd flask-backend
sqlite3 instance/data.db

# SQLite commands:
.tables                    # Show all tables
.schema users              # Show users table schema
SELECT * FROM users;       # Query users
.quit                      # Exit
```

### Backup Database:
```bash
cp flask-backend/instance/data.db flask-backend/instance/data.db.backup
```

### Restore Database:
```bash
cp flask-backend/instance/data.db.backup flask-backend/instance/data.db
```

---

## 🚀 Quick Commands

### Start Flask Backend:
```bash
cd flask-backend
flask run --host=0.0.0.0 --port=5001
```

### Check Admin Account in Database:
```bash
cd flask-backend
python3 -c "
from app import create_app
from models import User
app = create_app()
with app.app_context():
    admins = User.query.filter_by(is_admin=True).all()
    for a in admins:
        print(f'Email: {a.email}, Name: {a.name}')
"
```

### Reset Admin Password:
```bash
cd flask-backend
python3 <<EOF
from app import create_app
from models import User
from utils import hash_password
from extensions import db

app = create_app()
with app.app_context():
    user = User.query.filter_by(email='ryannoche116@gmail.com').first()
    if user:
        user.password_hash = hash_password('new-password-here')
        db.session.commit()
        print('✅ Password updated!')
EOF
```

---

## 📊 Database Statistics

- **Total Users:** 2
- **Admin Users:** 1
- **Products:** 1
- **Active Carts:** 1
- **Total Orders:** 0

---

## 🔒 Security Notes

1. **Password Hashing:** Uses Werkzeug's `security.generate_password_hash()`
2. **JWT Tokens:** Used for authentication (stored in localStorage on frontend)
3. **CORS:** Configured to only allow requests from frontend origins
4. **Admin Routes:** Protected with `@admin_required` decorator
5. **Database:** SQLite is suitable for development but consider PostgreSQL for production

---

## 📚 Related Files

- **Database Models:** `flask-backend/models.py`
- **Database Config:** `flask-backend/app.py`
- **Extensions:** `flask-backend/extensions.py`
- **Auth Utils:** `flask-backend/utils.py`
- **Migrations:** `flask-backend/migrations/` (if using Flask-Migrate)
