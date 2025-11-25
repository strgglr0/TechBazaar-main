"""
Add payment_method column to orders table
Run this script once to update the database schema
"""
from app import app
from extensions import db
from sqlalchemy import text

with app.app_context():
    try:
        # Check if column already exists
        result = db.session.execute(text("PRAGMA table_info(orders)"))
        columns = [row[1] for row in result.fetchall()]
        
        if 'payment_method' not in columns:
            # Add the column
            db.session.execute(text(
                "ALTER TABLE orders ADD COLUMN payment_method VARCHAR(32) DEFAULT 'cod'"
            ))
            db.session.commit()
            print("✓ Successfully added payment_method column to orders table")
        else:
            print("✓ payment_method column already exists")
            
    except Exception as e:
        print(f"✗ Error: {e}")
        db.session.rollback()
