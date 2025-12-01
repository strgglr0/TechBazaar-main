"""
Migration script to add rating and refund_reason fields to the orders table.
Run this script once to update your database schema.
"""

from extensions import db
from app import app
from sqlalchemy import text, inspect

def add_rating_and_refund_reason_fields():
    """Add rating and refund_reason columns to orders table if they don't exist"""
    
    with app.app_context():
        inspector = inspect(db.engine)
        columns = [col['name'] for col in inspector.get_columns('orders')]
        
        try:
            # Add refund_reason column if it doesn't exist
            if 'refund_reason' not in columns:
                print("Adding refund_reason column...")
                with db.engine.connect() as conn:
                    conn.execute(text('ALTER TABLE orders ADD COLUMN refund_reason TEXT'))
                    conn.commit()
                print("✓ refund_reason column added successfully")
            else:
                print("✓ refund_reason column already exists")
            
            # Add rating column if it doesn't exist
            if 'rating' not in columns:
                print("Adding rating column...")
                with db.engine.connect() as conn:
                    conn.execute(text('ALTER TABLE orders ADD COLUMN rating INTEGER'))
                    conn.commit()
                print("✓ rating column added successfully")
            else:
                print("✓ rating column already exists")
            
            print("\n✓ Migration completed successfully!")
            
        except Exception as e:
            print(f"✗ Error during migration: {e}")
            raise

if __name__ == '__main__':
    print("Starting migration: Adding rating and refund_reason fields to orders table...")
    add_rating_and_refund_reason_fields()
