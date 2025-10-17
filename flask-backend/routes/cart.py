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


@cart_bp.route('/cart', methods=['DELETE'])
def clear_cart():
    key = _key_for_request()
    if 'user_id' in key:
        CartItem.query.filter_by(user_id=key['user_id']).delete()
    else:
        CartItem.query.filter_by(session_id=key['session_id']).delete()
    db.session.commit()
    return jsonify({'ok': True})
