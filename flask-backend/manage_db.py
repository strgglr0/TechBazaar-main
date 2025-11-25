#!/usr/bin/env python3
"""
Database Management Script for HMN Tech Store
Run this to view and manage users and products
"""

from app import create_app
from extensions import db
from models import User, Product
from utils import hash_password

def main():
    app = create_app()
    
    with app.app_context():
        while True:
            print("\n" + "="*50)
            print("HMN Tech Store - Database Manager")
            print("="*50)
            print("1. View all users")
            print("2. View all products")
            print("3. Create admin user")
            print("4. Create regular user")
            print("5. Delete user")
            print("6. Change user password")
            print("7. Make user admin")
            print("8. Exit")
            print("="*50)
            
            choice = input("\nEnter your choice (1-8): ").strip()
            
            if choice == "1":
                view_users()
            elif choice == "2":
                view_products()
            elif choice == "3":
                create_admin()
            elif choice == "4":
                create_user()
            elif choice == "5":
                delete_user()
            elif choice == "6":
                change_password()
            elif choice == "7":
                make_admin()
            elif choice == "8":
                print("Goodbye!")
                break
            else:
                print("Invalid choice!")

def view_users():
    print("\n" + "="*50)
    print("ALL USERS")
    print("="*50)
    users = User.query.all()
    if not users:
        print("No users found.")
    for user in users:
        print(f"ID: {user.id}")
        print(f"  Email: {user.email}")
        print(f"  Name: {user.name}")
        print(f"  Admin: {'YES' if user.is_admin else 'NO'}")
        print("-" * 40)

def view_products():
    print("\n" + "="*50)
    print("ALL PRODUCTS")
    print("="*50)
    products = Product.query.all()
    if not products:
        print("No products found.")
    for product in products:
        print(f"ID: {product.id}")
        print(f"  Name: {product.name}")
        print(f"  Price: ${product.price}")
        print(f"  Brand: {product.brand}")
        print(f"  Category: {product.category}")
        print(f"  Stock: {product.stock}")
        print("-" * 40)

def create_admin():
    print("\n=== CREATE ADMIN USER ===")
    email = input("Email: ").strip()
    name = input("Name: ").strip()
    password = input("Password: ").strip()
    
    if User.query.filter_by(email=email).first():
        print(f"❌ User with email {email} already exists!")
        return
    
    user = User(
        email=email,
        name=name,
        password_hash=hash_password(password),
        is_admin=True
    )
    db.session.add(user)
    db.session.commit()
    print(f"✓ Admin user created successfully!")
    print(f"  Email: {email}")
    print(f"  Password: {password}")

def create_user():
    print("\n=== CREATE REGULAR USER ===")
    email = input("Email: ").strip()
    name = input("Name: ").strip()
    password = input("Password: ").strip()
    
    if User.query.filter_by(email=email).first():
        print(f"❌ User with email {email} already exists!")
        return
    
    user = User(
        email=email,
        name=name,
        password_hash=hash_password(password),
        is_admin=False
    )
    db.session.add(user)
    db.session.commit()
    print(f"✓ User created successfully!")
    print(f"  Email: {email}")
    print(f"  Password: {password}")

def delete_user():
    print("\n=== DELETE USER ===")
    email = input("Enter user email to delete: ").strip()
    
    user = User.query.filter_by(email=email).first()
    if not user:
        print(f"❌ User with email {email} not found!")
        return
    
    confirm = input(f"Are you sure you want to delete {email}? (yes/no): ").strip().lower()
    if confirm == 'yes':
        db.session.delete(user)
        db.session.commit()
        print(f"✓ User {email} deleted successfully!")
    else:
        print("Deletion cancelled.")

def change_password():
    print("\n=== CHANGE USER PASSWORD ===")
    email = input("Enter user email: ").strip()
    new_password = input("Enter new password: ").strip()
    
    user = User.query.filter_by(email=email).first()
    if not user:
        print(f"❌ User with email {email} not found!")
        return
    
    user.password_hash = hash_password(new_password)
    db.session.commit()
    print(f"✓ Password changed successfully for {email}!")
    print(f"  New password: {new_password}")

def make_admin():
    print("\n=== MAKE USER ADMIN ===")
    email = input("Enter user email: ").strip()
    
    user = User.query.filter_by(email=email).first()
    if not user:
        print(f"❌ User with email {email} not found!")
        return
    
    if user.is_admin:
        print(f"ℹ️  User {email} is already an admin!")
        return
    
    user.is_admin = True
    db.session.commit()
    print(f"✓ User {email} is now an admin!")

if __name__ == '__main__':
    main()
