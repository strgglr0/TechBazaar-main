#!/usr/bin/env python3
"""
Reset all user passwords to a default password
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent / 'flask-backend'))

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
    print(f"Setting password for all users to: {DEFAULT_PASSWORD}")
    print("\n⚠️  IMPORTANT: Save these credentials!\n")
    
    # Update passwords
    for user in users:
        user.password_hash = hash_password(DEFAULT_PASSWORD)
    
    db.session.commit()
    print("✅ Successfully updated all passwords\n")
    
    print("=" * 80)
    print("USER CREDENTIALS")
    print("=" * 80 + "\n")
    
    for user in users:
        print(f"{'ADMIN' if user.is_admin else 'USER'} ACCOUNT:")
        print(f"  Email:    {user.email}")
        print(f"  Password: {DEFAULT_PASSWORD}")
        print(f"  Name:     {user.name}")
        print()
    
    print("=" * 80)
    print("\n💡 You can now login with these credentials")
    print("   Users should change their password after first login\n")
