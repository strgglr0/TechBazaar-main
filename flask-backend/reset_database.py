#!/usr/bin/env python
"""
Reset database and recreate all tables with correct schema
This will delete all existing data and recreate with seed data
"""
import os
from app import create_app
from extensions import db

def reset_database():
    app = create_app()
    with app.app_context():
        db_path = 'instance/data.db'
        
        # Check if database exists
        if os.path.exists(db_path):
            print(f"Found existing database: {db_path}")
            response = input("⚠️  WARNING: This will DELETE all data and recreate the database. Continue? (yes/no): ")
            if response.lower() != 'yes':
                print("Aborted.")
                return
            
            # Delete the database file
            os.remove(db_path)
            print(f"✓ Deleted {db_path}")
        
        # Recreate all tables
        print("Creating fresh database with correct schema...")
        db.create_all()
        print("✓ Created all tables")
        
        # Seed data will be added automatically when Flask starts
        print("\n✅ Database reset complete!")
        print("Restart Flask - it will automatically seed products and users.")

if __name__ == "__main__":
    print("="*60)
    print("DATABASE RESET TOOL")
    print("="*60)
    print()
    reset_database()
