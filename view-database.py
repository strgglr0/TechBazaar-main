#!/usr/bin/env python3
"""
Database Viewer Script
Run this to see current database contents
"""

import sqlite3
import sys
from pathlib import Path

# Find database file
db_path = Path(__file__).parent / 'flask-backend' / 'instance' / 'data.db'

if not db_path.exists():
    print(f"❌ Database not found at: {db_path}")
    print("Run the Flask app first to create the database.")
    sys.exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print("\n" + "=" * 80)
print("DATABASE VIEWER - TechBazaar")
print("=" * 80)

# Admin accounts
print("\n🔐 ADMIN ACCOUNTS:")
print("-" * 80)
cursor.execute("SELECT id, email, name, created_at FROM users WHERE is_admin = 1")
admins = cursor.fetchall()
if admins:
    for admin in admins:
        print(f"\n  ID:      {admin[0]}")
        print(f"  Email:   {admin[1]}")
        print(f"  Name:    {admin[2]}")
        print(f"  Created: {admin[3]}")
else:
    print("  No admin accounts found")

# All users
print("\n\n👥 ALL USERS:")
print("-" * 80)
cursor.execute("SELECT id, email, name, is_admin FROM users")
users = cursor.fetchall()
print(f"\n{'ID':<5} {'Email':<40} {'Name':<25} {'Admin'}")
print("-" * 80)
for user in users:
    print(f"{user[0]:<5} {user[1]:<40} {(user[2] or 'N/A'):<25} {'✓ Yes' if user[3] else '✗ No'}")

# Products
print("\n\n📦 PRODUCTS:")
print("-" * 80)
cursor.execute("SELECT id, name, price, category, stock FROM products")
products = cursor.fetchall()
print(f"\n{'ID':<6} {'Name':<45} {'Price':<12} {'Category':<15} {'Stock'}")
print("-" * 80)
for prod in products:
    print(f"{prod[0]:<6} {prod[1][:43]:<45} ₱{prod[2]:<11} {(prod[3] or 'N/A'):<15} {prod[4]}")

# Orders
print("\n\n📝 ORDERS:")
print("-" * 80)
cursor.execute("SELECT id, customer_name, customer_email, total, status, created_at FROM orders")
orders = cursor.fetchall()
if orders:
    print(f"\n{'Order ID':<15} {'Customer':<35} {'Total':<12} {'Status':<15} {'Created'}")
    print("-" * 80)
    for order in orders:
        order_id = order[0][:12] + '...'
        customer = order[1] or order[2] or 'N/A'
        print(f"{order_id:<15} {customer[:33]:<35} ₱{order[3]:<11.2f} {order[4]:<15} {order[5][:19]}")
else:
    print("  No orders yet")

# Cart statistics
print("\n\n🛒 CART STATISTICS:")
print("-" * 80)
cursor.execute("SELECT COUNT(*) FROM cart_items")
cart_count = cursor.fetchone()[0]
cursor.execute("SELECT COUNT(DISTINCT user_id) FROM cart_items WHERE user_id IS NOT NULL")
user_carts = cursor.fetchone()[0]
print(f"\n  Total items in carts: {cart_count}")
print(f"  User carts: {user_carts}")

conn.close()
print("\n" + "=" * 80 + "\n")
