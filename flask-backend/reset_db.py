"""
Reset the database - drop all tables and recreate them
"""
from app import create_app
from extensions import db
from models import User, Product, CartItem, Order

def reset_database():
    """Drop all tables and recreate them"""
    app = create_app()
    
    with app.app_context():
        print("Dropping all tables...")
        db.drop_all()
        
        print("Creating all tables...")
        db.create_all()
        
        print("Database reset complete!")
        print("Run seed_data.py to add sample products.")

if __name__ == '__main__':
    reset_database()
