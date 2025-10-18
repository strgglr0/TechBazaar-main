#!/usr/bin/env python3
"""
Add sku, specifications, and isActive columns to products table
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
                ("sku", "VARCHAR(128)"),
                ("specifications", "TEXT"),
                ("isActive", "BOOLEAN DEFAULT 1")
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
            
            # Set default SKU for existing products
            try:
                sql = "UPDATE products SET sku = 'SKU-' || id WHERE sku IS NULL"
                result = connection.execute(text(sql))
                print(f"  ✓ Set default SKU for {result.rowcount} existing products")
            except Exception as e:
                print(f"  ✗ Error setting default SKUs: {e}")
            
            # Set default specifications for existing products
            try:
                sql = "UPDATE products SET specifications = '{}' WHERE specifications IS NULL"
                result = connection.execute(text(sql))
                print(f"  ✓ Set default specifications for {result.rowcount} existing products")
            except Exception as e:
                print(f"  ✗ Error setting default specifications: {e}")
            
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
