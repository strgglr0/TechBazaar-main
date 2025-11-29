#!/usr/bin/env python3
"""
Reset all sales data - delete all orders to reset category sales to 0
"""
from app import create_app
from extensions import db
from models import Order, Rating

def reset_sales():
    app = create_app()
    with app.app_context():
        print("🔄 Resetting all sales data...")
        
        # Delete all ratings first (foreign key constraint)
        ratings_count = Rating.query.count()
        if ratings_count > 0:
            Rating.query.delete()
            print(f"  ✓ Deleted {ratings_count} ratings")
        
        # Delete all orders
        orders_count = Order.query.count()
        if orders_count > 0:
            Order.query.delete()
            print(f"  ✓ Deleted {orders_count} orders")
        
        db.session.commit()
        
        print("\n✅ Sales data reset complete!")
        print("   All orders deleted - category sales are now 0")
        
        # Verify
        remaining_orders = Order.query.count()
        remaining_ratings = Rating.query.count()
        print(f"\n📊 Verification:")
        print(f"   Orders: {remaining_orders}")
        print(f"   Ratings: {remaining_ratings}")

if __name__ == '__main__':
    reset_sales()
