from flask import Blueprint, request, jsonify
from uuid import uuid4
from utils import token_required, get_current_user_id

orders_bp = Blueprint('orders', __name__)

ORDERS = []


@orders_bp.route('/orders', methods=['GET'])
def list_orders():
    return jsonify(ORDERS)


@orders_bp.route('/checkout', methods=['POST'])
@token_required
def checkout():
    data = request.get_json() or {}
    user_id = get_current_user_id()
    items = data.get('items', [])
    if not items:
        return jsonify({'error': 'cart empty'}), 400
    order = {
        'id': str(uuid4()),
        'userId': user_id,
        'items': items,
        'total': data.get('total', 0),
        'createdAt': None,
    }
    ORDERS.append(order)
    # In a real app you'd clear the cart for the session
    return jsonify(order), 201
