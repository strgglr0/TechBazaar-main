#!/usr/bin/env python3
"""
Reset all user passwords to 'techbazaar2025'
"""
import sys
import os

# Add flask-backend directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'flask-backend'))

from app import create_app
from extensions import db
from models import User
from werkzeug.security import generate_password_hash


def reset_all_passwords():
    """Reset all user passwords to 'techbazaar2025'"""
    app = create_app()
    with app.app_context():
        new_password = 'techbazaar2025'
        new_hash = generate_password_hash(new_password)
        
        users = User.query.all()
        
        if not users:
            print("No users found in database.")
            return
        
        print(f"Found {len(users)} users. Resetting passwords...")
        
        for user in users:
            user.password_hash = new_hash
            role = "Admin" if user.is_admin else "User"
            print(f"  ✓ {role}: {user.email} (ID: {user.id})")
        
        db.session.commit()
        print(f"\n✅ Successfully reset {len(users)} user passwords to: {new_password}")
        print("\nUser Credentials:")
        print("-" * 50)
        for user in users:
            role = "Admin" if user.is_admin else "User"
            print(f"  Email: {user.email}")
            print(f"  Password: {new_password}")
            print(f"  Role: {role}")
            print("-" * 50)


if __name__ == '__main__':
    try:
        reset_all_passwords()
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
