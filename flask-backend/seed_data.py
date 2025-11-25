"""
Seed script to populate the database with sample products
Run this with: python seed_data.py
"""
import json
from app import create_app
from extensions import db
from models import Product

def seed_products():
    """Add sample products to the database"""
    app = create_app()
    
    with app.app_context():
        # Check if products already exist
        if Product.query.count() > 0:
            print(f"Database already has {Product.query.count()} products. Skipping seed.")
            return
        
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
            }
        ]
        
        for product_data in sample_products:
            product = Product(**product_data)
            db.session.add(product)
        
        db.session.commit()
        print(f"✓ Successfully seeded {len(sample_products)} products!")

if __name__ == '__main__':
    seed_products()
