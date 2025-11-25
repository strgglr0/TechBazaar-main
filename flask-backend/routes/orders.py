from flask import Blueprint, request, jsonify
from utils import token_required, get_current_user_id
from models import Order, CartItem
from extensions import db
from order_queue import order_queue

orders_bp = Blueprint('orders', __name__)


@orders_bp.route('/orders', methods=['GET'])
def list_orders():
    items = Order.query.all()
    return jsonify([o.to_dict() for o in items])


@orders_bp.route('/orders/<order_id>', methods=['GET'])
def get_order(order_id):
    order = Order.query.get(order_id)
    if not order:
        return jsonify({'error': 'not found'}), 404
    
    # Update order status from queue if available
    try:
        queue_status = order_queue.get_order_status(order_id)
        if queue_status and queue_status != order.status:
            order.status = queue_status
            db.session.commit()
    except Exception:
        pass  # Use DB status if queue check fails
    
    return jsonify(order.to_dict())


@orders_bp.route('/orders/<order_id>/status', methods=['PUT'])
def update_order_status(order_id):
    """Update order status"""
    order = Order.query.get(order_id)
    if not order:
        return jsonify({'error': 'Order not found'}), 404
    
    data = request.get_json() or {}
    new_status = data.get('status')
    
    if not new_status:
        return jsonify({'error': 'Status is required'}), 400
    
    try:
        order.status = new_status
        db.session.commit()
        return jsonify(order.to_dict())
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update order status', 'details': str(e)}), 500


@orders_bp.route('/orders/<order_id>/confirm-receipt', methods=['POST'])
@token_required
def confirm_receipt(order_id):
    """Confirm receipt of an order (user only)"""
    user_id = get_current_user_id()
    order = Order.query.get(order_id)
    
    if not order:
        return jsonify({'error': 'Order not found'}), 404
    
    # Verify this order belongs to the current user
    if order.user_id != user_id:
        return jsonify({'error': 'Unauthorized - This order does not belong to you'}), 403
    
    # Only allow confirming receipt for delivered orders
    if order.status != 'delivered':
        return jsonify({'error': 'Can only confirm receipt for delivered orders'}), 400
    
    try:
        order.status = 'received'
        db.session.commit()
        return jsonify(order.to_dict())
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to confirm receipt', 'details': str(e)}), 500


@orders_bp.route('/orders/<order_id>', methods=['DELETE'])
def delete_order(order_id):
    """Delete an order"""
    order = Order.query.get(order_id)
    if not order:
        return jsonify({'error': 'Order not found'}), 404
    
    try:
        db.session.delete(order)
        db.session.commit()
        return jsonify({'message': 'Order deleted successfully', 'id': order_id})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to delete order', 'details': str(e)}), 500


@orders_bp.route('/checkout', methods=['POST'])
def checkout():
    """Create an order. If an Authorization token is present, the user is associated with the order.
    Request body should include customer details (customerName, customerEmail, customerPhone),
    shippingAddress (object), items (array) and total (number).
    After creating the order, clear the cart for the user (if logged in) or the session
    (if x-session-id header provided).
    """
    data = request.get_json() or {}
    user_id = get_current_user_id()
    items = data.get('items', [])
    if not items:
        return jsonify({'error': 'cart empty'}), 400

    try:
        # accept either `total` or `totalAmount` from the client
        total_value = data.get('total') if data.get('total') is not None else data.get('totalAmount')
        order = Order(
            user_id=user_id,
            customer_name=data.get('customerName'),
            customer_email=data.get('customerEmail'),
            customer_phone=data.get('customerPhone'),
            shipping_address=data.get('shippingAddress'),
            items=items,
            total=float(total_value or 0),
            status='processing'  # Initial status
        )
        db.session.add(order)

        # clear cart: prefer user cart if user is authenticated, else use x-session-id
        if user_id:
            CartItem.query.filter_by(user_id=user_id).delete()
        else:
            session_id = request.headers.get('x-session-id')
            if session_id:
                CartItem.query.filter_by(session_id=session_id).delete()

        db.session.commit()
        
        # Add order to processing queue
        order_queue.add_order(order.id)
        
        return jsonify(order.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'checkout failed', 'details': str(e)}), 500
