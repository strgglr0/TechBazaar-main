#!/usr/bin/env python
"""
Database migration script to add refund columns to orders table
"""
from app import create_app
from extensions import db

def migrate_database():
    app = create_app()
    with app.app_context():
        # Add missing columns using raw SQL
        try:
            # Check if columns already exist
            inspector = db.inspect(db.engine)
            columns = [col['name'] for col in inspector.get_columns('orders')]
            
            print("Current orders table columns:", columns)
            
            if 'refunded_at' not in columns:
                print("Adding refunded_at column...")
                db.engine.execute('ALTER TABLE orders ADD COLUMN refunded_at DATETIME')
                print("✓ Added refunded_at column")
            else:
                print("✓ refunded_at column already exists")
            
            if 'refund_amount' not in columns:
                print("Adding refund_amount column...")
                db.engine.execute('ALTER TABLE orders ADD COLUMN refund_amount FLOAT')
                print("✓ Added refund_amount column")
            else:
                print("✓ refund_amount column already exists")
            
            print("\n✅ Database migration complete!")
            print("You can now restart Flask and test checkout.")
            
        except Exception as e:
            print(f"\n❌ Migration failed: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    print("="*60)
    print("DATABASE MIGRATION: Adding refund columns to orders table")
    print("="*60)
    print()
    migrate_database()
