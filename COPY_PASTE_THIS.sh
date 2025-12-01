#!/bin/bash
# COPY AND PASTE THIS ENTIRE COMMAND INTO YOUR TERMINAL

echo "🔧 FIXING DATABASE SCHEMA..."
echo ""

# Run the Python fix directly
python3 << 'PYTHON_EOF'
import sqlite3
import os

db_path = 'flask-backend/instance/data.db'

if not os.path.exists(db_path):
    print("❌ Database not found. Make sure Flask ran at least once.")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Check current columns
cursor.execute("PRAGMA table_info(orders)")
columns = [col[1] for col in cursor.fetchall()]

print("Current columns:", columns)

# Add missing columns
if 'refunded_at' not in columns:
    print("Adding refunded_at...")
    cursor.execute("ALTER TABLE orders ADD COLUMN refunded_at DATETIME")
    print("✓ Added refunded_at")
else:
    print("✓ refunded_at exists")

if 'refund_amount' not in columns:
    print("Adding refund_amount...")
    cursor.execute("ALTER TABLE orders ADD COLUMN refund_amount FLOAT")
    print("✓ Added refund_amount")
else:
    print("✓ refund_amount exists")

conn.commit()
conn.close()

print("\n✅ DATABASE FIXED!")
print("\nNow restart Flask: cd flask-backend && python app.py")
PYTHON_EOF
