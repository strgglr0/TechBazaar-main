#!/usr/bin/env python
"""
EMERGENCY FIX: Add missing refund columns to orders table
Run this with: python emergency_db_fix.py
"""
import sqlite3
import os

def fix_database():
    db_path = 'flask-backend/instance/data.db'
    
    if not os.path.exists(db_path):
        print(f"❌ Database not found at: {db_path}")
        print("Make sure you're running this from the TechBazaar-main directory")
        return False
    
    print("="*60)
    print("EMERGENCY DATABASE FIX")
    print("="*60)
    print(f"\nDatabase: {db_path}\n")
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Get current schema
        cursor.execute("PRAGMA table_info(orders)")
        columns = cursor.fetchall()
        column_names = [col[1] for col in columns]
        
        print("Current columns in orders table:")
        for name in column_names:
            print(f"  - {name}")
        
        # Check if refund columns exist
        needs_refunded_at = 'refunded_at' not in column_names
        needs_refund_amount = 'refund_amount' not in column_names
        
        if not needs_refunded_at and not needs_refund_amount:
            print("\n✅ Both refund columns already exist!")
            print("The database schema is correct.")
            conn.close()
            return True
        
        print("\nAdding missing columns...")
        
        # Add refunded_at column
        if needs_refunded_at:
            print("  Adding refunded_at column...")
            cursor.execute("ALTER TABLE orders ADD COLUMN refunded_at DATETIME")
            print("  ✓ Added refunded_at")
        else:
            print("  ✓ refunded_at already exists")
        
        # Add refund_amount column
        if needs_refund_amount:
            print("  Adding refund_amount column...")
            cursor.execute("ALTER TABLE orders ADD COLUMN refund_amount FLOAT")
            print("  ✓ Added refund_amount")
        else:
            print("  ✓ refund_amount already exists")
        
        conn.commit()
        
        # Verify
        cursor.execute("PRAGMA table_info(orders)")
        columns = cursor.fetchall()
        column_names = [col[1] for col in columns]
        
        print("\nFinal columns in orders table:")
        for name in column_names:
            print(f"  - {name}")
        
        conn.close()
        
        print("\n" + "="*60)
        print("✅ DATABASE FIX COMPLETE!")
        print("="*60)
        print("\nNext steps:")
        print("  1. Restart Flask: cd flask-backend && python app.py")
        print("  2. Test checkout in browser")
        print("\nCheckout should now work! 🎉")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = fix_database()
    exit(0 if success else 1)
