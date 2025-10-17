#!/usr/bin/env python3
"""
Script to fix existing user passwords in the database
Sets a default password for all users and displays it
"""

import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from app import create_app
from models import User
from utils import hash_password
from extensions import db

# Default password for all users
DEFAULT_PASSWORD = "TechBazaar2025!"

app = create_app()

with app.app_context():
    print("\n" + "=" * 80)
    print("PASSWORD RESET UTILITY")
    print("=" * 80)
    
    users = User.query.all()
    
    if not users:
        print("\n❌ No users found in database")
        sys.exit(1)
    
    print(f"\nFound {len(users)} user(s) in database")
    print(f"\nSetting password for all users to: {DEFAULT_PASSWORD}")
    print("\n⚠️  IMPORTANT: Save this password and share it with users!")
    
    updated_count = 0
    
    for user in users:
        try:
            # Set new password
            user.password_hash = hash_password(DEFAULT_PASSWORD)
            updated_count += 1
            print(f"  ✓ Updated password for: {user.email}")
        except Exception as e:
            print(f"  ✗ Failed to update {user.email}: {e}")
    
    # Commit all changes
    try:
        db.session.commit()
        print(f"\n✅ Successfully updated {updated_count} user password(s)")
    except Exception as e:
        db.session.rollback()
        print(f"\n❌ Failed to save changes: {e}")
        sys.exit(1)
    
    print("\n" + "=" * 80)
    print("USER ACCOUNTS - LOGIN CREDENTIALS")
    print("=" * 80 + "\n")
    
    for user in users:
        print(f"{'ADMIN ACCOUNT' if user.is_admin else 'USER ACCOUNT'}:")
        print(f"  Email:    {user.email}")
        print(f"  Password: {DEFAULT_PASSWORD}")
        print(f"  Name:     {user.name}")
        print(f"  Admin:    {'Yes ✓' if user.is_admin else 'No'}")
        print()
    
    print("=" * 80)
    print("\n💡 Users can now login with the credentials above")
    print("   They should change their password after logging in")
    print("\n" + "=" * 80 + "\n")
