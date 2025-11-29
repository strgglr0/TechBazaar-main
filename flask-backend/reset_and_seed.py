"""
Reset database and reseed with sample products
"""
from app import create_app
from extensions import db
from models import Product

def reset_products():
    """Delete all products and reseed"""
    app = create_app()
    
    with app.app_context():
        # Delete all products
        deleted = Product.query.delete()
        db.session.commit()
        print(f"✓ Deleted {deleted} existing products")
        
        # Import and run seed function
        from routes.products import seed_products
        seed_products()
        
        # Verify
        count = Product.query.count()
        print(f"✓ Database now has {count} products")
        
        # Show some examples
        products = Product.query.limit(5).all()
        print("\nSample products:")
        for p in products:
            print(f"  - {p.name} (${p.price}) - {p.brand}")

if __name__ == '__main__':
    reset_products()
