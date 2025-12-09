from flask import Blueprint, request, jsonify
from utils import token_required, get_current_user_id
from models import Order, CartItem, User, Product
from extensions import db
from order_queue import order_queue
from datetime import datetime

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
        payment_method = data.get('paymentMethod', 'cod')  # Default to COD
        
        # Validate stock availability and reduce stock for each product
        for item in items:
            product_id = item.get('productId')
            quantity = item.get('quantity', 0)
            
            if not product_id or quantity <= 0:
                return jsonify({'error': f'Invalid item: {item}'}), 400
            
            product = Product.query.get(product_id)
            if not product:
                return jsonify({'error': f'Product not found: {product_id}'}), 404
            
            # Check if enough stock is available
            if product.stock < quantity:
                return jsonify({
                    'error': f'Insufficient stock for {product.name}. Available: {product.stock}, Requested: {quantity}'
                }), 400
            
            # Reduce stock
            product.stock -= quantity
        
        order = Order(
            user_id=user_id,
            customer_name=data.get('customerName'),
            customer_email=data.get('customerEmail'),
            customer_phone=data.get('customerPhone'),
            shipping_address=data.get('shippingAddress'),
            items=items,
            total=float(total_value or 0),
            payment_method=payment_method,
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
        
        # Log online payment orders for manual processing
        if payment_method == 'online':
            print(f"[ORDER] Online payment order created: {order.id}")
            print(f"[ORDER] Customer: {order.customer_name} ({order.customer_email})")
            print(f"[ORDER] Total: ₱{order.total:,.2f}")
        
        return jsonify(order.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'checkout failed', 'details': str(e)}), 500


@orders_bp.route('/orders/<order_id>/refund', methods=['POST'])
@token_required
def refund_order(order_id):
    """Process a refund for a received order (admin only)"""
    user_id = get_current_user_id()
    user = User.query.get(user_id)
    
    if not user or not user.is_admin:
        return jsonify({'error': 'Unauthorized - Admin access required'}), 403
    
    order = Order.query.get(order_id)
    if not order:
        return jsonify({'error': 'Order not found'}), 404
    
    # Only allow refunding received orders
    if order.status != 'received':
        return jsonify({'error': 'Can only refund orders that have been received'}), 400
    
    # Check if already refunded
    if order.refunded_at:
        return jsonify({'error': 'Order has already been refunded'}), 400
    
    data = request.get_json() or {}
    refund_amount = data.get('refundAmount')
    refund_reason = data.get('refundReason', '')
    rating = data.get('rating')
    
    # Default to full refund if no amount specified
    if refund_amount is None:
        refund_amount = order.total
    else:
        refund_amount = float(refund_amount)
        
    # Validate refund amount
    if refund_amount <= 0 or refund_amount > order.total:
        return jsonify({'error': 'Invalid refund amount'}), 400
    
    # Validate rating if provided
    if rating is not None:
        rating = int(rating)
        if rating < 1 or rating > 5:
            return jsonify({'error': 'Rating must be between 1 and 5'}), 400
    
    try:
        # Restore stock for refunded order
        for item in order.items:
            product_id = item.get('productId')
            quantity = item.get('quantity', 0)
            
            if product_id and quantity > 0:
                product = Product.query.get(product_id)
                if product:
                    product.stock += quantity
        
        order.refunded_at = datetime.utcnow()
        order.refund_amount = refund_amount
        order.refund_reason = refund_reason
        order.rating = rating
        order.status = 'refunded'
        db.session.commit()
        
        return jsonify({
            'message': 'Refund processed successfully',
            'order': order.to_dict()
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to process refund', 'details': str(e)}), 500


@orders_bp.route('/orders/<order_id>/receipt', methods=['GET'])
def get_receipt(order_id):
    """Get receipt data for an order"""
    order = Order.query.get(order_id)
    if not order:
        return jsonify({'error': 'Order not found'}), 404
    
    # Build receipt data
    receipt = {
        'orderId': order.id,
        'orderDate': order.created_at.isoformat() if order.created_at else None,
        'customer': {
            'name': order.customer_name,
            'email': order.customer_email,
            'phone': order.customer_phone,
        },
        'shippingAddress': order.shipping_address,
        'items': order.items,
        'total': order.total,
        'paymentMethod': order.payment_method,
        'status': order.status,
        'refunded': bool(order.refunded_at),
        'refundedAt': order.refunded_at.isoformat() if order.refunded_at else None,
        'refundAmount': order.refund_amount,
    }
    
    return jsonify(receipt)


@orders_bp.route('/orders/<order_id>/cancel', methods=['POST'])
@token_required
def cancel_order(order_id):
    """Cancel an order (customer only, for pending/processing orders)"""
    user_id = get_current_user_id()
    order = Order.query.get(order_id)
    
    if not order:
        return jsonify({'error': 'Order not found'}), 404
    
    # Verify this order belongs to the current user
    if order.user_id != user_id:
        return jsonify({'error': 'Unauthorized - This order does not belong to you'}), 403
    
    # Only allow canceling pending or processing orders
    if order.status not in ['pending', 'processing']:
        return jsonify({'error': f'Cannot cancel order with status: {order.status}. Only pending or processing orders can be cancelled.'}), 400
    
    try:
        # Restore stock for cancelled order
        for item in order.items:
            product_id = item.get('productId')
            quantity = item.get('quantity', 0)
            
            if product_id and quantity > 0:
                product = Product.query.get(product_id)
                if product:
                    product.stock += quantity
        
        order.status = 'cancelled'
        db.session.commit()
        return jsonify({
            'message': 'Order cancelled successfully',
            'order': order.to_dict()
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to cancel order', 'details': str(e)}), 500


@orders_bp.route('/orders/<order_id>/request-refund', methods=['POST'])
@token_required
def request_refund(order_id):
    """Request a refund for a received order (customer only)"""
    user_id = get_current_user_id()
    order = Order.query.get(order_id)
    
    if not order:
        return jsonify({'error': 'Order not found'}), 404
    
    # Verify this order belongs to the current user
    if order.user_id != user_id:
        return jsonify({'error': 'Unauthorized - This order does not belong to you'}), 403
    
    # Only allow requesting refund for received orders
    if order.status != 'received':
        return jsonify({'error': 'Can only request refund for received orders'}), 400
    
    # Check if already requested or refunded
    if order.status == 'refund_requested':
        return jsonify({'error': 'Refund has already been requested for this order'}), 400
    
    if order.refunded_at:
        return jsonify({'error': 'Order has already been refunded'}), 400
    
    data = request.get_json() or {}
    refund_reason = data.get('reason', '').strip()
    
    if not refund_reason:
        return jsonify({'error': 'Please provide a reason for the refund request'}), 400
    
    try:
        order.status = 'refund_requested'
        order.refund_reason = refund_reason
        db.session.commit()
        
        return jsonify({
            'message': 'Refund request submitted successfully. Our team will review your request.',
            'order': order.to_dict()
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to submit refund request', 'details': str(e)}), 500

@orders_bp.route('/orders/<order_id>/rate', methods=['POST'])
@token_required
def rate_product(order_id):
    """Rate a product from a received order (customer only)"""
    user_id = get_current_user_id()
    order = Order.query.get(order_id)
    
    if not order:
        return jsonify({'error': 'Order not found'}), 404
    
    # Verify this order belongs to the current user
    if order.user_id != user_id:
        return jsonify({'error': 'Unauthorized - This order does not belong to you'}), 403
    
    # Only allow rating for received orders
    if order.status != 'received':
        return jsonify({'error': 'Can only rate products from received orders'}), 400
    
    data = request.get_json() or {}
    product_id = data.get('productId')
    rating = data.get('rating')
    
    if not product_id or not rating:
        return jsonify({'error': 'Product ID and rating are required'}), 400
    
    rating = int(rating)
    if rating < 1 or rating > 5:
        return jsonify({'error': 'Rating must be between 1 and 5'}), 400
    
    # Find the product
    product = Product.query.get(product_id)
    if not product:
        return jsonify({'error': 'Product not found'}), 404
    
    # Verify product is in the order
    product_in_order = False
    for item in order.items:
        if item.get('productId') == product_id or item.get('id') == product_id:
            product_in_order = True
            break
    
    if not product_in_order:
        return jsonify({'error': 'Product not found in this order'}), 400
    
    try:
        # Update product rating using weighted average
        current_rating = float(product.rating or 0)
        current_count = product.reviewCount or 0
        new_count = current_count + 1
        new_rating = ((current_rating * current_count) + rating) / new_count
        
        product.rating = str(round(new_rating, 1))
        product.reviewCount = new_count
        db.session.commit()
        
        return jsonify({
            'message': 'Rating submitted successfully',
            'product': product.to_dict()
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to submit rating', 'details': str(e)}), 500
