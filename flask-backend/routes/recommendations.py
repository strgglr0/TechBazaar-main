from flask import Blueprint, request, jsonify
from extensions import db
from models import Product
from utils import get_current_user_id
from datetime import datetime, timedelta
import json

recommendations_bp = Blueprint('recommendations', __name__)


# In-memory storage for browsing history (in production, use Redis or database)
# Format: {user_id or session_id: [(product_id, timestamp), ...]}
browsing_history = {}


@recommendations_bp.route('/browsing-history', methods=['POST'])
def add_to_browsing_history():
    """Track a product view"""
    data = request.get_json() or {}
    product_id = data.get('productId')
    
    if not product_id:
        return jsonify({'error': 'productId required'}), 400
    
    # Get user or session identifier
    user_id = get_current_user_id()
    key = f"user_{user_id}" if user_id else f"session_{request.headers.get('x-session-id', 'default')}"
    
    # Initialize history if not exists
    if key not in browsing_history:
        browsing_history[key] = []
    
    # Add to history (most recent first)
    timestamp = datetime.utcnow().isoformat()
    browsing_history[key] = [(product_id, timestamp)] + [
        (pid, ts) for pid, ts in browsing_history[key] if pid != product_id
    ]
    
    # Keep only last 50 items
    browsing_history[key] = browsing_history[key][:50]
    
    return jsonify({'ok': True})


@recommendations_bp.route('/browsing-history', methods=['GET'])
def get_browsing_history():
    """Get user's browsing history with product details"""
    user_id = get_current_user_id()
    key = f"user_{user_id}" if user_id else f"session_{request.headers.get('x-session-id', 'default')}"
    
    history = browsing_history.get(key, [])
    limit = int(request.args.get('limit', 10))
    
    # Get product details for history items
    product_ids = [pid for pid, _ in history[:limit]]
    products = Product.query.filter(Product.id.in_(product_ids)).all() if product_ids else []
    
    # Create dict for quick lookup
    products_dict = {p.id: p.to_dict() for p in products}
    
    # Return products in order of browsing history
    result = []
    for pid, timestamp in history[:limit]:
        if pid in products_dict:
            product = products_dict[pid]
            product['viewedAt'] = timestamp
            result.append(product)
    
    return jsonify(result)


@recommendations_bp.route('/recommendations', methods=['GET'])
def get_recommendations():
    """Get product recommendations based on browsing history and current context"""
    user_id = get_current_user_id()
    key = f"user_{user_id}" if user_id else f"session_{request.headers.get('x-session-id', 'default')}"
    
    # Get current product context (if viewing a product)
    current_product_id = request.args.get('productId')
    limit = int(request.args.get('limit', 6))
    
    recommendations = []
    
    # Strategy 1: If viewing a product, recommend similar products (same category)
    if current_product_id:
        current_product = Product.query.get(current_product_id)
        if current_product and current_product.category:
            similar = Product.query.filter(
                Product.category == current_product.category,
                Product.id != current_product_id,
                Product.stock > 0
            ).limit(limit).all()
            recommendations.extend(similar)
    
    # Strategy 2: Recommend from categories in browsing history
    if len(recommendations) < limit:
        history = browsing_history.get(key, [])
        if history:
            # Get categories from browsing history
            recent_product_ids = [pid for pid, _ in history[:10]]
            recent_products = Product.query.filter(Product.id.in_(recent_product_ids)).all()
            categories = list(set([p.category for p in recent_products if p.category]))
            
            if categories:
                # Get products from these categories (excluding already recommended)
                recommended_ids = [r.id for r in recommendations]
                more_products = Product.query.filter(
                    Product.category.in_(categories),
                    Product.id.notin_(recommended_ids + recent_product_ids) if recommended_ids else Product.id.notin_(recent_product_ids),
                    Product.stock > 0
                ).limit(limit - len(recommendations)).all()
                recommendations.extend(more_products)
    
    # Strategy 3: Popular products (highest rated with stock)
    if len(recommendations) < limit:
        recommended_ids = [r.id for r in recommendations]
        popular = Product.query.filter(
            Product.id.notin_(recommended_ids) if recommended_ids else True,
            Product.stock > 0
        ).order_by(
            db.desc(Product.rating)
        ).limit(limit - len(recommendations)).all()
        recommendations.extend(popular)
    
    # Convert to dict and shuffle slightly to avoid monotony
    result = [p.to_dict() for p in recommendations[:limit]]
    
    return jsonify(result)


@recommendations_bp.route('/frequently-bought-together', methods=['GET'])
def get_frequently_bought_together():
    """Get products frequently bought together (simplified version)"""
    product_id = request.args.get('productId')
    
    if not product_id:
        return jsonify({'error': 'productId required'}), 400
    
    # Get the current product to find similar category
    current_product = Product.query.get(product_id)
    
    if not current_product:
        return jsonify([])
    
    # For now, return products from the same category and complementary categories
    # In production, this would analyze actual order data
    complementary_categories = {
        'phones': ['accessories', 'cases'],
        'laptops': ['accessories', 'bags'],
        'desktops': ['accessories', 'monitors'],
        'accessories': ['phones', 'laptops']
    }
    
    target_categories = complementary_categories.get(current_product.category, [current_product.category])
    
    # Get products from complementary categories
    frequently_bought = Product.query.filter(
        Product.category.in_(target_categories),
        Product.id != product_id,
        Product.stock > 0
    ).limit(4).all()
    
    return jsonify([p.to_dict() for p in frequently_bought])
