#!/usr/bin/env python3
"""
Add payment_method column to orders table
"""
from app import create_app
from extensions import db
from sqlalchemy import text

def migrate_orders_table():
    app = create_app()
    with app.app_context():
        print("Adding payment_method column to orders table...")
        
        # Get connection
        connection = db.engine.connect()
        trans = connection.begin()
        
        try:
            # Try to add the payment_method column
            sql = "ALTER TABLE orders ADD COLUMN payment_method VARCHAR(32) DEFAULT 'cod'"
            connection.execute(text(sql))
            print("  ✓ Added column: payment_method")
            
            trans.commit()
            print("\n✅ Database migration completed successfully!")
            
        except Exception as e:
            if "duplicate column name" in str(e).lower():
                print("  ⊙ Column already exists: payment_method")
                print("\n✅ Database already up to date!")
                trans.rollback()
            else:
                print(f"\n❌ Migration failed: {e}")
                trans.rollback()
                raise
        finally:
            connection.close()

if __name__ == '__main__':
    migrate_orders_table()
