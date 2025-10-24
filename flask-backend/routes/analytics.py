from flask import Blueprint, jsonify
from sqlalchemy import func, extract
from datetime import datetime, timedelta
from models import Order, Product, User
from extensions import db

analytics_bp = Blueprint('analytics', __name__)


@analytics_bp.route('/admin/analytics', methods=['GET'])
def get_analytics():
    """Get analytics data for admin dashboard"""
    try:
        # Get total revenue from all orders
        total_revenue = db.session.query(func.sum(Order.total)).scalar() or 0
        
        # Get total orders count
        total_orders = Order.query.count()
        
        # Get total customers (users count)
        total_customers = User.query.count()
        
        # Get total products count
        total_products = Product.query.count()
        
        # Calculate trends (compare last 30 days vs previous 30 days)
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        sixty_days_ago = datetime.utcnow() - timedelta(days=60)
        
        # Revenue trend
        recent_revenue = db.session.query(func.sum(Order.total)).filter(
            Order.created_at >= thirty_days_ago
        ).scalar() or 0
        previous_revenue = db.session.query(func.sum(Order.total)).filter(
            Order.created_at >= sixty_days_ago,
            Order.created_at < thirty_days_ago
        ).scalar() or 0
        revenue_change = ((recent_revenue - previous_revenue) / previous_revenue * 100) if previous_revenue > 0 else 0
        
        # Orders trend
        recent_orders = Order.query.filter(Order.created_at >= thirty_days_ago).count()
        previous_orders = Order.query.filter(
            Order.created_at >= sixty_days_ago,
            Order.created_at < thirty_days_ago
        ).count()
        orders_change = ((recent_orders - previous_orders) / previous_orders * 100) if previous_orders > 0 else 0
        
        # Get last 6 months of revenue data
        revenue_data = []
        for i in range(5, -1, -1):
            month_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0) - timedelta(days=30*i)
            month_end = month_start + timedelta(days=30)
            
            month_revenue = db.session.query(func.sum(Order.total)).filter(
                Order.created_at >= month_start,
                Order.created_at < month_end
            ).scalar() or 0
            
            month_orders = Order.query.filter(
                Order.created_at >= month_start,
                Order.created_at < month_end
            ).count()
            
            revenue_data.append({
                'month': month_start.strftime('%b'),
                'revenue': float(month_revenue),
                'orders': month_orders
            })
        
        # Get top products (from order items)
        # Aggregate all items from all orders
        all_orders = Order.query.all()
        product_sales = {}
        
        for order in all_orders:
            if order.items:
                for item in order.items:
                    product_name = item.get('productName') or item.get('name', 'Unknown')
                    price = float(item.get('price', 0))
                    quantity = int(item.get('quantity', 0))
                    
                    if product_name not in product_sales:
                        product_sales[product_name] = {'sales': 0, 'revenue': 0}
                    
                    product_sales[product_name]['sales'] += quantity
                    product_sales[product_name]['revenue'] += price * quantity
        
        # Sort by sales and get top 5
        top_products = [
            {'name': name, 'sales': data['sales'], 'revenue': data['revenue']}
            for name, data in sorted(product_sales.items(), key=lambda x: x[1]['sales'], reverse=True)[:5]
        ]
        
        # Get category data (from order items)
        category_sales = {}
        
        for order in all_orders:
            if order.items:
                for item in order.items:
                    category = item.get('category', 'Other')
                    price = float(item.get('price', 0))
                    quantity = int(item.get('quantity', 0))
                    
                    if category not in category_sales:
                        category_sales[category] = {'sales': 0, 'revenue': 0}
                    
                    category_sales[category]['sales'] += quantity
                    category_sales[category]['revenue'] += price * quantity
        
        # Format category data
        category_data = [
            {'category': category.capitalize(), 'sales': data['sales'], 'revenue': data['revenue']}
            for category, data in category_sales.items()
        ]
        
        return jsonify({
            'revenue': {
                'total': float(total_revenue),
                'change': round(revenue_change, 1),
                'trend': 'up' if revenue_change >= 0 else 'down'
            },
            'orders': {
                'total': total_orders,
                'change': round(orders_change, 1),
                'trend': 'up' if orders_change >= 0 else 'down'
            },
            'customers': {
                'total': total_customers,
                'change': 0,  # Can be calculated if needed
                'trend': 'up'
            },
            'products': {
                'total': total_products,
                'change': 0,  # Can be calculated if needed
                'trend': 'up'
            },
            'revenueData': revenue_data,
            'topProducts': top_products,
            'categoryData': category_data
        })
        
    except Exception as e:
        return jsonify({'error': 'Failed to fetch analytics', 'details': str(e)}), 500
