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
        
        # Get connection
        connection = db.engine.connect()
        trans = connection.begin()
        
        try:
            # Check if columns exist and add them if they don't
            columns_to_add = [
                ("rating", "VARCHAR(16) DEFAULT '0'"),
                ("reviewCount", "INTEGER DEFAULT 0"),
                ("createdAt", "DATETIME")
            ]
            
            for column_name, column_def in columns_to_add:
                try:
                    # Try to add the column
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

if __name__ == '__main__':
    migrate_database()
