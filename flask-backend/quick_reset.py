#!/usr/bin/env python3
import sqlite3
import os

db_path = 'instance/data.db'

if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Delete all ratings first
    cursor.execute("DELETE FROM ratings")
    ratings_deleted = cursor.rowcount
    print(f"✓ Deleted {ratings_deleted} ratings")
    
    # Delete all orders
    cursor.execute("DELETE FROM orders")
    orders_deleted = cursor.rowcount
    print(f"✓ Deleted {orders_deleted} orders")
    
    conn.commit()
    
    # Verify
    cursor.execute("SELECT COUNT(*) FROM orders")
    remaining = cursor.fetchone()[0]
    print(f"\n✅ Sales reset complete! Remaining orders: {remaining}")
    
    conn.close()
else:
    print(f"❌ Database not found at {db_path}")
