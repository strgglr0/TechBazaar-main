#!/usr/bin/env python3
"""
Check and fix database schema for payment_method column
"""
import sqlite3
import os

db_path = 'flask-backend/instance/data.db'

if not os.path.exists(db_path):
    print(f"❌ Database not found at {db_path}")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Check if payment_method column exists
cursor.execute("PRAGMA table_info(orders)")
columns = cursor.fetchall()
column_names = [col[1] for col in columns]

print("📋 Current orders table columns:")
for col in columns:
    print(f"  - {col[1]} ({col[2]})")

if 'payment_method' not in column_names:
    print("\n⚠️  payment_method column is MISSING!")
    print("🔧 Adding payment_method column...")
    
    try:
        cursor.execute("ALTER TABLE orders ADD COLUMN payment_method VARCHAR(32) DEFAULT 'cod'")
        conn.commit()
        print("✅ Successfully added payment_method column")
    except Exception as e:
        print(f"❌ Error adding column: {e}")
        conn.rollback()
else:
    print("\n✅ payment_method column exists")

# Verify the fix
cursor.execute("PRAGMA table_info(orders)")
columns = cursor.fetchall()
column_names = [col[1] for col in columns]

if 'payment_method' in column_names:
    print("\n✅ Database schema is now correct")
else:
    print("\n❌ payment_method column still missing")

conn.close()
