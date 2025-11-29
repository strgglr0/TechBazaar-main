#!/usr/bin/env python3
"""
Fix order items to include correct product categories
"""
from app import create_app
from extensions import db
from models import Order, Product

def fix_order_categories():
    app = create_app()
    with app.app_context():
        print("Fixing order item categories...")
        
        orders = Order.query.all()
        updated_count = 0
        
        for order in orders:
            if order.items:
                items_updated = False
                for item in order.items:
                    # If item doesn't have category or has 'Other', look up the product
                    if 'category' not in item or item.get('category') == 'Other':
                        product_id = item.get('productId')
                        if product_id:
                            product = Product.query.get(product_id)
                            if product and product.category:
                                item['category'] = product.category
                                items_updated = True
                                print(f"  Updated item {item.get('productName')} -> {product.category}")
                
                if items_updated:
                    # Mark the items as modified so SQLAlchemy knows to update
                    db.session.add(order)
                    updated_count += 1
        
        if updated_count > 0:
            db.session.commit()
            print(f"\n✅ Updated {updated_count} orders with correct categories")
        else:
            print("\n✅ All orders already have correct categories")

if __name__ == '__main__':
    fix_order_categories()
