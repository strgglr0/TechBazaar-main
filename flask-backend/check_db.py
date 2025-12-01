"""
Check the actual database schema and status values
"""
from app import create_app
from extensions import db
from sqlalchemy import text

def check_database():
    app = create_app()
    
    with app.app_context():
        print("="*60)
        print("DATABASE DIAGNOSIS")
        print("="*60)
        
        # Check table schema
        print("\n1. Checking Orders table schema:")
        result = db.session.execute(text("PRAGMA table_info(orders)"))
        for row in result:
            print(f"   {row}")
            if 'status' in str(row):
                print(f"   >>> STATUS COLUMN: {row}")
        
        # Check if there are any orders
        print("\n2. Checking existing orders:")
        result = db.session.execute(text("SELECT id, status, payment_method, created_at FROM orders ORDER BY created_at DESC LIMIT 5"))
        rows = result.fetchall()
        if rows:
            print(f"   Found {len(rows)} recent orders:")
            for row in rows:
                print(f"   - ID: {row[0]}, Status: {row[1]}, Payment: {row[2]}, Created: {row[3]}")
        else:
            print("   No orders found")
        
        # Check table creation SQL
        print("\n3. Checking table creation SQL:")
        result = db.session.execute(text("SELECT sql FROM sqlite_master WHERE type='table' AND name='orders'"))
        row = result.fetchone()
        if row:
            print("   Table SQL:")
            print(row[0])
            if 'DEFAULT' in row[0].upper():
                print("\n   ⚠️  WARNING: Found DEFAULT in schema!")
        
        print("\n" + "="*60)

if __name__ == '__main__':
    check_database()
