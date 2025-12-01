#!/usr/bin/env python3
"""
Migration script to add refund fields to orders table
"""
from app import create_app
from extensions import db
from sqlalchemy import text

def add_refund_fields():
    """Add refunded_at and refund_amount columns to orders table"""
    app = create_app()
    with app.app_context():
        try:
            # Check if columns already exist
            result = db.session.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='orders' AND column_name IN ('refunded_at', 'refund_amount')
            """))
            existing_columns = [row[0] for row in result]
            
            if 'refunded_at' not in existing_columns:
                print("Adding refunded_at column...")
                db.session.execute(text("""
                    ALTER TABLE orders 
                    ADD COLUMN refunded_at TIMESTAMP NULL
                """))
                db.session.commit()
                print("✓ Added refunded_at column")
            else:
                print("✓ refunded_at column already exists")
            
            if 'refund_amount' not in existing_columns:
                print("Adding refund_amount column...")
                db.session.execute(text("""
                    ALTER TABLE orders 
                    ADD COLUMN refund_amount FLOAT NULL
                """))
                db.session.commit()
                print("✓ Added refund_amount column")
            else:
                print("✓ refund_amount column already exists")
            
            print("\n✅ Migration completed successfully!")
            
        except Exception as e:
            db.session.rollback()
            print(f"❌ Error during migration: {e}")
            raise

if __name__ == '__main__':
    add_refund_fields()
