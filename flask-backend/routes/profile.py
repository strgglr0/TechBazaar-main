from flask import Blueprint, request, jsonify
from utils import token_required, get_current_user_id
from models import User, Order
from extensions import db

profile_bp = Blueprint('profile', __name__)


@profile_bp.route('/profile', methods=['GET'])
@token_required
def get_profile():
    """Get current user's profile"""
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify(user.to_dict())


@profile_bp.route('/profile', methods=['PUT'])
@token_required
def update_profile():
    """Update current user's profile"""
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.get_json() or {}
    
    try:
        # Update only allowed fields
        if 'name' in data:
            user.name = data['name']
        if 'phone' in data:
            user.phone = data['phone']
        
        db.session.commit()
        return jsonify(user.to_dict())
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update profile', 'details': str(e)}), 500


@profile_bp.route('/profile/address', methods=['PUT'])
@token_required
def update_address():
    """Update current user's shipping address"""
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.get_json() or {}
    
    try:
        # Update shipping address
        user.shipping_address = {
            'address': data.get('address', ''),
            'city': data.get('city', ''),
            'state': data.get('state', ''),
            'zipCode': data.get('zipCode', ''),
            'country': data.get('country', 'Philippines'),
        }
        
        db.session.commit()
        return jsonify(user.to_dict())
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update address', 'details': str(e)}), 500


@profile_bp.route('/user/orders', methods=['GET'])
@token_required
def get_user_orders():
    """Get current user's orders"""
    import traceback
    try:
        user_id = get_current_user_id()
        if not user_id:
            print("[ERROR] get_user_orders: No user_id found")
            return jsonify({'error': 'Unauthorized'}), 401
        
        print(f"[API] Fetching orders for user_id: {user_id}")
        
        # Get all orders for the current user
        orders = Order.query.filter_by(user_id=user_id).order_by(Order.created_at.desc()).all()
        
        print(f"[API] Found {len(orders)} orders for user {user_id}")
        
        # Convert to dict with error handling
        order_list = []
        for order in orders:
            try:
                order_list.append(order.to_dict())
            except Exception as e:
                print(f"[ERROR] Failed to serialize order {order.id}: {e}")
                traceback.print_exc()
                # Skip problematic order but continue
                continue
        
        return jsonify(order_list)
        
    except Exception as e:
        print(f"[ERROR] get_user_orders failed: {e}")
        traceback.print_exc()
        return jsonify({'error': 'Failed to fetch orders', 'details': str(e)}), 500
