from flask import Blueprint, request, jsonify
from uuid import uuid4
from utils import get_current_user_id

cart_bp = Blueprint('cart', __name__)

# In-memory cart: mapping sessionId -> list of items
CARTS = {}


@cart_bp.route('/cart', methods=['GET'])
def get_cart():
    user_id = get_current_user_id()
    if user_id:
        key = f'user-{user_id}'
    else:
        key = request.headers.get('x-session-id', 'default-session')
    items = CARTS.get(key, [])
    return jsonify(items)


@cart_bp.route('/cart/add', methods=['POST'])
def add_to_cart():
    data = request.get_json() or {}
    user_id = get_current_user_id()
    session_id = request.headers.get('x-session-id', 'default-session')
    key = f'user-{user_id}' if user_id else session_id
    product_id = data.get('productId')
    quantity = int(data.get('quantity', 1))
    if not product_id:
        return jsonify({'error': 'productId required'}), 400

    items = CARTS.setdefault(key, [])
    existing = next((i for i in items if i['productId'] == product_id), None)
    if existing:
        existing['quantity'] += quantity
        return jsonify(existing)

    item = {
        'id': str(uuid4()),
        'productId': product_id,
        'quantity': quantity,
    }
    items.append(item)
    return jsonify(item), 201


@cart_bp.route('/cart', methods=['POST'])
def add_to_cart_alt():
    # Support client POST /api/cart with body { productId, quantity }
    data = request.get_json() or {}
    user_id = get_current_user_id()
    session_id = request.headers.get('x-session-id', 'default-session')
    key = f'user-{user_id}' if user_id else session_id
    product_id = data.get('productId')
    quantity = int(data.get('quantity', 1))
    if not product_id:
        return jsonify({'error': 'productId required'}), 400

    items = CARTS.setdefault(key, [])
    existing = next((i for i in items if i['productId'] == product_id), None)
    if existing:
        existing['quantity'] += quantity
        return jsonify(existing)

    item = {
        'id': str(uuid4()),
        'productId': product_id,
        'quantity': quantity,
    }
    items.append(item)
    return jsonify(item), 201


@cart_bp.route('/cart/remove', methods=['POST'])
def remove_from_cart():
    data = request.get_json() or {}
    user_id = get_current_user_id()
    session_id = request.headers.get('x-session-id', 'default-session')
    key = f'user-{user_id}' if user_id else session_id
    item_id = data.get('id')
    if not item_id:
        return jsonify({'error': 'id required'}), 400
    items = CARTS.get(key, [])
    CARTS[key] = [i for i in items if i['id'] != item_id]
    return jsonify({'ok': True})


@cart_bp.route('/cart', methods=['DELETE'])
def clear_cart():
    user_id = get_current_user_id()
    session_id = request.headers.get('x-session-id', 'default-session')
    key = f'user-{user_id}' if user_id else session_id
    CARTS[key] = []
    return jsonify({'ok': True})
