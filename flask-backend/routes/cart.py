from flask import Blueprint, request, jsonify
from utils import get_current_user_id
from models import CartItem
from extensions import db

cart_bp = Blueprint('cart', __name__)


def _key_for_request():
    user_id = get_current_user_id()
    if user_id:
        return {'user_id': user_id}
    session_id = request.headers.get('x-session-id', 'default-session')
    return {'session_id': session_id}


@cart_bp.route('/cart', methods=['GET'])
def get_cart():
    key = _key_for_request()
    if 'user_id' in key:
        items = CartItem.query.filter_by(user_id=key['user_id']).all()
    else:
        items = CartItem.query.filter_by(session_id=key['session_id']).all()
    return jsonify([i.to_dict() for i in items])


@cart_bp.route('/cart/add', methods=['POST'])
def add_to_cart():
    data = request.get_json() or {}
    key = _key_for_request()
    product_id = data.get('productId')
    quantity = int(data.get('quantity', 1))
    if not product_id:
        return jsonify({'error': 'productId required'}), 400

    if 'user_id' in key:
        existing = CartItem.query.filter_by(user_id=key['user_id'], product_id=product_id).first()
    else:
        existing = CartItem.query.filter_by(session_id=key['session_id'], product_id=product_id).first()

    if existing:
        existing.quantity += quantity
        db.session.commit()
        return jsonify(existing.to_dict())

    item = CartItem(
        user_id=key.get('user_id'),
        session_id=key.get('session_id'),
        product_id=product_id,
        quantity=quantity,
    )
    db.session.add(item)
    db.session.commit()
    return jsonify(item.to_dict()), 201


@cart_bp.route('/cart', methods=['POST'])
def add_to_cart_alt():
    return add_to_cart()


@cart_bp.route('/cart/remove', methods=['POST'])
def remove_from_cart():
    data = request.get_json() or {}
    item_id = data.get('id')
    if not item_id:
        return jsonify({'error': 'id required'}), 400
    item = CartItem.query.get(item_id)
    if not item:
        return jsonify({'error': 'not found'}), 404
    db.session.delete(item)
    db.session.commit()
    return jsonify({'ok': True})


@cart_bp.route('/cart/<item_id>', methods=['PUT'])
def update_cart_item(item_id):
    """Update quantity of a cart item"""
    data = request.get_json() or {}
    quantity = data.get('quantity')
    
    if quantity is None or quantity < 0:
        return jsonify({'error': 'Valid quantity required'}), 400
    
    item = CartItem.query.get(item_id)
    if not item:
        return jsonify({'error': 'Cart item not found'}), 404
    
    if quantity == 0:
        # Remove item if quantity is 0
        db.session.delete(item)
    else:
        item.quantity = int(quantity)
    
    db.session.commit()
    return jsonify(item.to_dict() if quantity > 0 else {'ok': True})


@cart_bp.route('/cart/<item_id>', methods=['DELETE'])
def delete_cart_item(item_id):
    """Remove a specific cart item"""
    item = CartItem.query.get(item_id)
    if not item:
        return jsonify({'error': 'Cart item not found'}), 404
    
    db.session.delete(item)
    db.session.commit()
    return jsonify({'ok': True})


@cart_bp.route('/cart/transfer', methods=['POST'])
def transfer_cart():
    """Transfer guest cart items to authenticated user cart."""
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'error': 'Authentication required'}), 401
    
    data = request.get_json() or {}
    guest_session_id = data.get('guestSessionId') or request.headers.get('x-session-id')
    
    if not guest_session_id:
        return jsonify({'message': 'No guest cart to transfer'}), 200
    
    # Get guest cart items
    guest_items = CartItem.query.filter_by(session_id=guest_session_id).all()
    
    if not guest_items:
        return jsonify({'message': 'Guest cart is empty'}), 200
    
    # Transfer items to user cart
    for guest_item in guest_items:
        # Check if user already has this product
        existing = CartItem.query.filter_by(user_id=user_id, product_id=guest_item.product_id).first()
        if existing:
            # Merge quantities
            existing.quantity += guest_item.quantity
            db.session.delete(guest_item)
        else:
            # Transfer item to user
            guest_item.user_id = user_id
            guest_item.session_id = None
    
    db.session.commit()
    return jsonify({'message': 'Cart transferred successfully'})


@cart_bp.route('/cart', methods=['DELETE'])
def clear_cart():
    key = _key_for_request()
    if 'user_id' in key:
        CartItem.query.filter_by(user_id=key['user_id']).delete()
    else:
        CartItem.query.filter_by(session_id=key['session_id']).delete()
    db.session.commit()
    return jsonify({'ok': True})
