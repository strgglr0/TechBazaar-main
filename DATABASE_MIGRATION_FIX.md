origin# Database Migration & 500 Error Fix

## Problem
The `/api/products` endpoint was returning 500 errors with the following error:
```
sqlalchemy.exc.OperationalError: (sqlite3.OperationalError) no such column: products.rating
```

## Root Cause
When we updated the `Product` model in `flask-backend/models.py` to include new fields (`rating`, `reviewCount`, `createdAt`), the existing SQLite database didn't have these columns. SQLAlchemy tried to query these non-existent columns, causing the 500 errors.

## Solution

### 1. Created Database Migration Script
**File**: `flask-backend/migrate_database.py`

This script adds the missing columns to the existing products table:

```python
#!/usr/bin/env python3
"""
Add missing columns to products table
"""
from app import create_app
from extensions import db
from sqlalchemy import text

def migrate_database():
    app = create_app()
    with app.app_context():
        print("Adding missing columns to products table...")
        
        connection = db.engine.connect()
        trans = connection.begin()
        
        try:
            columns_to_add = [
                ("rating", "VARCHAR(16) DEFAULT '0'"),
                ("reviewCount", "INTEGER DEFAULT 0"),
                ("createdAt", "DATETIME")
            ]
            
            for column_name, column_def in columns_to_add:
                try:
                    sql = f'ALTER TABLE products ADD COLUMN {column_name} {column_def}'
                    connection.execute(text(sql))
                    print(f"  ✓ Added column: {column_name}")
                except Exception as e:
                    if "duplicate column name" in str(e).lower():
                        print(f"  ⊙ Column already exists: {column_name}")
                    else:
                        print(f"  ✗ Error adding {column_name}: {e}")
            
            trans.commit()
            print("\n✅ Database migration completed successfully!")
            
        except Exception as e:
            trans.rollback()
            print(f"\n❌ Migration failed: {e}")
            raise
        finally:
            connection.close()
```

### 2. Executed Migration
Ran the migration script to add the columns:
```bash
python flask-backend/migrate_database.py
```

**Result:**
```
✓ Added column: rating
✓ Added column: reviewCount
✓ Added column: createdAt

✅ Database migration completed successfully!
```

### 3. Restarted Servers
After migration, restarted both development servers:
```bash
npm run dev:all
```

## Added Database Columns

The products table now has these additional columns:

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `rating` | VARCHAR(16) | '0' | Product rating (0-5) |
| `reviewCount` | INTEGER | 0 | Number of reviews |
| `createdAt` | DATETIME | NULL | Product creation timestamp |

## Product Model (Updated)
**File**: `flask-backend/models.py`

```python
class Product(db.Model):
    __tablename__ = 'products'
    id = db.Column(db.String(64), primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    price = db.Column(db.String(64), nullable=False)
    category = db.Column(db.String(128), nullable=True)
    brand = db.Column(db.String(128), nullable=True)
    stock = db.Column(db.Integer, default=0)
    imageUrl = db.Column(db.String(1024), nullable=True)
    rating = db.Column(db.String(16), nullable=True, default='0')
    reviewCount = db.Column(db.Integer, default=0)
    createdAt = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'price': self.price,
            'category': self.category,
            'brand': self.brand,
            'stock': self.stock,
            'imageUrl': self.imageUrl,
            'rating': self.rating,
            'reviewCount': self.reviewCount,
            'createdAt': self.createdAt.isoformat() if self.createdAt else None,
        }
```

## How to Use Migration in Future

If you need to add more columns or make database changes in the future:

1. **Create a migration script** (similar to `migrate_database.py`)
2. **Test it on a copy** of the database first (if production)
3. **Run the migration**: `python flask-backend/migrate_database.py`
4. **Restart servers**: `npm run dev:all`

## Important Notes

- ⚠️ SQLite doesn't support all ALTER TABLE operations (e.g., dropping columns, modifying column types)
- ✓ For complex migrations, consider using Flask-Migrate (Alembic)
- ✓ Always backup your database before running migrations in production
- ✓ All existing products now have default values:
  - `rating = '0'`
  - `reviewCount = 0`
  - `createdAt = NULL` (for existing products)

## Verification

After the migration, the API endpoints work correctly:

✅ `GET /api/products` - Returns all products with new fields  
✅ `GET /api/products?category=phones` - Category filtering works  
✅ `GET /api/products?brand=Apple` - Brand filtering works  
✅ `GET /api/products?rating=4` - Rating filtering works  
✅ `GET /api/products?minPrice=500&maxPrice=1000` - Price filtering works  

## Status
✅ **Fixed** - Database migrated successfully, all 500 errors resolved  
🚀 **Servers Running**:
- Flask Backend: http://localhost:5001
- Vite Frontend: http://localhost:3000

---

**Date**: October 17, 2025  
**Issue**: Database schema mismatch causing 500 errors  
**Resolution**: Added missing columns via migration script
