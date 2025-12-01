"""
Reset and seed script to restore products and admin account
Run this with: python reset_and_seed.py
"""
import json
from app import create_app
from extensions import db
from models import Product, User
from utils import hash_password

def reset_and_seed():
    """Reset database and add sample products and admin account"""
    app = create_app()
    
    with app.app_context():
        print("Starting database reset and seed...")
        
        # Clear existing data
        print("Clearing existing products...")
        Product.query.delete()
        
        # Seed products
        sample_products = [
            {
                'id': '1',
                'name': 'iPhone 15 Pro',
                'description': 'Latest iPhone with advanced camera system and A17 Pro chip',
                'price': '999.00',
                'category': 'phones',
                'brand': 'Apple',
                'sku': 'IPH15P-128',
                'imageUrl': 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300',
                'specifications': json.dumps({
                    'storage': '128GB',
                    'display': '6.1-inch Super Retina XDR',
                    'processor': 'A17 Pro chip',
                    'camera': '48MP Main camera'
                }),
                'stock': 25,
                'rating': '4.5',
                'reviewCount': 128,
                'isActive': True
            },
            {
                'id': '2',
                'name': 'ASUS ROG Strix G15',
                'description': 'Gaming laptop with RTX 4070 and Ryzen 7 processor',
                'price': '1299.00',
                'category': 'laptops',
                'brand': 'ASUS',
                'sku': 'ASU-ROG-G15',
                'imageUrl': 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300',
                'specifications': json.dumps({
                    'processor': 'AMD Ryzen 7 7735HS',
                    'graphics': 'NVIDIA RTX 4070',
                    'ram': '16GB DDR5',
                    'storage': '512GB SSD'
                }),
                'stock': 8,
                'rating': '4.5',
                'reviewCount': 64,
                'isActive': True
            },
            {
                'id': '3',
                'name': 'Dell XPS Desktop',
                'description': 'Powerful desktop for creative professionals and gaming',
                'price': '1599.00',
                'category': 'desktops',
                'brand': 'Dell',
                'sku': 'DELL-XPS-DT',
                'imageUrl': 'https://images.unsplash.com/photo-1547082299-de196ea013d6?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300',
                'specifications': json.dumps({
                    'processor': 'Intel Core i7-13700',
                    'graphics': 'NVIDIA RTX 4060',
                    'ram': '32GB DDR5',
                    'storage': '1TB SSD'
                }),
                'stock': 12,
                'rating': '4.7',
                'reviewCount': 89,
                'isActive': True
            },
            {
                'id': '4',
                'name': 'Sony WH-1000XM5',
                'description': 'Industry-leading noise canceling headphones',
                'price': '399.00',
                'category': 'accessories',
                'brand': 'Sony',
                'sku': 'SONY-WH1000XM5',
                'imageUrl': 'https://images.unsplash.com/photo-1484704849700-f032a568e944?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300',
                'specifications': json.dumps({
                    'type': 'Over-ear wireless',
                    'battery': '30 hours',
                    'features': 'Active noise canceling',
                    'connectivity': 'Bluetooth 5.2'
                }),
                'stock': 45,
                'rating': '4.9',
                'reviewCount': 256,
                'isActive': True
            },
            {
                'id': '5',
                'name': 'Samsung Galaxy S24 Ultra',
                'description': 'Flagship Android phone with S Pen and advanced cameras',
                'price': '1199.00',
                'category': 'phones',
                'brand': 'Samsung',
                'sku': 'SAM-S24U-256',
                'imageUrl': 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300',
                'specifications': json.dumps({
                    'storage': '256GB',
                    'display': '6.8-inch Dynamic AMOLED 2X',
                    'processor': 'Snapdragon 8 Gen 3',
                    'camera': '200MP Main camera'
                }),
                'stock': 18,
                'rating': '4.6',
                'reviewCount': 142,
                'isActive': True
            },
            {
                'id': '6',
                'name': 'MacBook Air M3',
                'description': 'Ultra-thin laptop with M3 chip and all-day battery',
                'price': '1099.00',
                'category': 'laptops',
                'brand': 'Apple',
                'sku': 'MBA-M3-256',
                'imageUrl': 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300',
                'specifications': json.dumps({
                    'processor': 'Apple M3 chip',
                    'ram': '8GB unified memory',
                    'storage': '256GB SSD',
                    'display': '13.6-inch Liquid Retina'
                }),
                'stock': 32,
                'rating': '4.8',
                'reviewCount': 201,
                'isActive': True
            },
            {
                'id': '7',
                'name': 'Logitech MX Master 3S',
                'description': 'Premium wireless mouse with ultra-fast scrolling',
                'price': '99.00',
                'category': 'accessories',
                'brand': 'Logitech',
                'sku': 'LOG-MXM3S',
                'imageUrl': 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300',
                'specifications': json.dumps({
                    'type': 'Wireless mouse',
                    'battery': '70 days',
                    'connectivity': 'Bluetooth and USB-C',
                    'buttons': '7 programmable buttons'
                }),
                'stock': 60,
                'rating': '4.8',
                'reviewCount': 312,
                'isActive': True
            },
            {
                'id': '8',
                'name': 'HP EliteDesk 800 G9',
                'description': 'Business desktop with security features',
                'price': '899.00',
                'category': 'desktops',
                'brand': 'HP',
                'sku': 'HP-ED800-G9',
                'imageUrl': 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300',
                'specifications': json.dumps({
                    'processor': 'Intel Core i5-12500',
                    'ram': '16GB DDR4',
                    'storage': '512GB SSD',
                    'security': 'TPM 2.0, Secure Boot'
                }),
                'stock': 15,
                'rating': '4.4',
                'reviewCount': 78,
                'isActive': True
            },
            {
                'id': '9',
                'name': 'Google Pixel 8 Pro',
                'description': 'AI-powered Android phone with amazing camera',
                'price': '899.00',
                'category': 'phones',
                'brand': 'Google',
                'sku': 'GOO-PIX8P-128',
                'imageUrl': 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300',
                'specifications': json.dumps({
                    'storage': '128GB',
                    'display': '6.7-inch LTPO OLED',
                    'processor': 'Google Tensor G3',
                    'camera': '50MP Main with AI features'
                }),
                'stock': 22,
                'rating': '4.7',
                'reviewCount': 165,
                'isActive': True
            },
            {
                'id': '10',
                'name': 'Lenovo ThinkPad X1 Carbon',
                'description': 'Premium business ultrabook with legendary keyboard',
                'price': '1499.00',
                'category': 'laptops',
                'brand': 'Lenovo',
                'sku': 'LEN-X1C-G11',
                'imageUrl': 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300',
                'specifications': json.dumps({
                    'processor': 'Intel Core i7-1365U',
                    'ram': '16GB LPDDR5',
                    'storage': '512GB SSD',
                    'display': '14-inch WUXGA'
                }),
                'stock': 10,
                'rating': '4.6',
                'reviewCount': 98,
                'isActive': True
            },
            {
                'id': '11',
                'name': 'Samsung Odyssey G7',
                'description': '32-inch curved gaming monitor with 240Hz',
                'price': '699.00',
                'category': 'accessories',
                'brand': 'Samsung',
                'sku': 'SAM-ODY-G7',
                'imageUrl': 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300',
                'specifications': json.dumps({
                    'size': '32 inches',
                    'resolution': '2560x1440 (QHD)',
                    'refresh_rate': '240Hz',
                    'panel': 'VA with 1000R curve'
                }),
                'stock': 14,
                'rating': '4.7',
                'reviewCount': 187,
                'isActive': True
            }
        ]
        
        for product_data in sample_products:
            product = Product(**product_data)
            db.session.add(product)
        
        print(f"✓ Added {len(sample_products)} products")
        
        # Create/Update admin account
        admin_email = 'admin@techbazaar.com'
        admin_password = 'admin123'
        
        admin = User.query.filter_by(email=admin_email).first()
        if admin:
            print(f"✓ Admin account already exists: {admin_email}")
        else:
            admin = User(
                email=admin_email,
                password_hash=hash_password(admin_password),
                name='Admin',
                is_admin=True
            )
            db.session.add(admin)
            print(f"✓ Created admin account: {admin_email}")
        
        # Create test user account
        test_email = 'user@test.com'
        test_password = 'password123'
        
        test_user = User.query.filter_by(email=test_email).first()
        if not test_user:
            test_user = User(
                email=test_email,
                password_hash=hash_password(test_password),
                name='Test User',
                is_admin=False
            )
            db.session.add(test_user)
            print(f"✓ Created test user account: {test_email}")
        
        db.session.commit()
        
        print("\n" + "="*50)
        print("✓ Database reset and seed completed successfully!")
        print("="*50)
        print(f"\nAdmin Account:")
        print(f"  Email: {admin_email}")
        print(f"  Password: {admin_password}")
        print(f"\nTest User Account:")
        print(f"  Email: {test_email}")
        print(f"  Password: {test_password}")
        print(f"\nTotal Products: {Product.query.count()}")
        print(f"Total Users: {User.query.count()}")
        print("="*50)

if __name__ == '__main__':
    reset_and_seed()
