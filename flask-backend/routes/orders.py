from flask import Blueprint, request, jsonify
from utils import token_required, get_current_user_id
from models import Order, CartItem, User
from extensions import db
from order_queue import order_queue
from datetime import datetime

orders_bp = Blueprint('orders', __name__)


@orders_bp.route('/checkout/test', methods=['GET'])
def test_checkout():
    """Test endpoint to verify the checkout route is working"""
    return jsonify({'status': 'ok', 'message': 'Checkout endpoint is working'}), 200


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


@orders_bp.route('/checkout', methods=['POST', 'OPTIONS'])
def checkout():
    """Create an order. If an Authorization token is present, the user is associated with the order.
    Request body should include customer details (customerName, customerEmail, customerPhone),
    shippingAddress (object), items (array) and total (number).
    After creating the order, clear the cart for the user (if logged in) or the session
    (if x-session-id header provided).
    """
    # Handle preflight OPTIONS request
    if request.method == 'OPTIONS':
        return jsonify({'status': 'ok'}), 200
    
    import traceback
    try:
        print("\n" + "="*60)
        print("[CHECKOUT] Endpoint called")
        print("="*60)
        
        # Get and validate request data
        data = request.get_json()
        if data is None:
            print("[ERROR] No JSON data received")
            print(f"[ERROR] Content-Type: {request.content_type}")
            print(f"[ERROR] Raw data: {request.get_data(as_text=True)[:500]}")
            return jsonify({'error': 'Invalid JSON data'}), 400
        
        print(f"[CHECKOUT] Request data keys: {list(data.keys())}")
        print(f"[CHECKOUT] Items count: {len(data.get('items', []))}")
        print(f"[CHECKOUT] Payment method: {data.get('paymentMethod')}")
        
        # Get user ID (may be None for guests)
        user_id = None
        try:
            user_id = get_current_user_id()
            print(f"[CHECKOUT] User ID: {user_id}")
        except Exception as auth_err:
            print(f"[CHECKOUT] No authenticated user (guest checkout): {auth_err}")
        
        # Validate items
        items = data.get('items', [])
        if not items or len(items) == 0:
            print("[ERROR] Cart is empty")
            return jsonify({'error': 'Cart is empty. Please add items before checking out.'}), 400
        
        print(f"[CHECKOUT] Processing {len(items)} items")
        for idx, item in enumerate(items):
            print(f"  Item {idx+1}: {item.get('productName')} x{item.get('quantity')} @ ${item.get('price')}")

        # Validate required customer fields
        required_fields = {
            'customerName': 'Customer name',
            'customerEmail': 'Customer email',
            'shippingAddress': 'Shipping address'
        }
        
        for field, label in required_fields.items():
            if not data.get(field):
                print(f"[ERROR] Missing required field: {field}")
                return jsonify({'error': f'{label} is required'}), 400
        
        # Validate email format
        import re
        email = data.get('customerEmail', '')
        if not re.match(r'^[\w\.-]+@[\w\.-]+\.\w+$', email):
            print(f"[ERROR] Invalid email format: {email}")
            return jsonify({'error': 'Valid email is required'}), 400

        # Get total amount - accept either 'total' or 'totalAmount'
        total_value = data.get('total')
        if total_value is None:
            total_value = data.get('totalAmount')
        
        if total_value is None or total_value <= 0:
            print(f"[ERROR] Invalid total value: {total_value}")
            return jsonify({'error': 'Valid order total is required'}), 400
        
        # Convert to float
        try:
            total_value = float(total_value)
        except (TypeError, ValueError) as conv_err:
            print(f"[ERROR] Cannot convert total to float: {total_value} - {conv_err}")
            return jsonify({'error': 'Invalid total amount format'}), 400
        
        payment_method = data.get('paymentMethod', 'cod')  # Default to COD
        
        print(f"[CHECKOUT] Creating order:")
        print(f"  - Customer: {data.get('customerName')} <{data.get('customerEmail')}>")
        print(f"  - Phone: {data.get('customerPhone')}")
        print(f"  - Total: ${total_value:.2f}")
        print(f"  - Payment: {payment_method}")
        print(f"  - User ID: {user_id or 'Guest'}")
        
        # Create order
        order = Order(
            user_id=user_id,
            customer_name=data.get('customerName'),
            customer_email=data.get('customerEmail'),
            customer_phone=data.get('customerPhone'),
            shipping_address=data.get('shippingAddress'),
            items=items,
            total=total_value,
            payment_method=payment_method,
            status='processing'
        )
        
        db.session.add(order)
        db.session.flush()  # Generate order ID
        
        order_id = order.id
        print(f"[CHECKOUT] ✓ Order created with ID: {order_id}")

        # Clear cart
        try:
            if user_id:
                deleted = CartItem.query.filter_by(user_id=user_id).delete()
                print(f"[CHECKOUT] Cleared {deleted} items from user cart")
            else:
                session_id = request.headers.get('x-session-id')
                if session_id:
                    deleted = CartItem.query.filter_by(session_id=session_id).delete()
                    print(f"[CHECKOUT] Cleared {deleted} items from session cart: {session_id}")
        except Exception as cart_err:
            print(f"[WARNING] Failed to clear cart: {cart_err}")
            traceback.print_exc()
            # Continue - cart clear failure shouldn't fail order

        db.session.commit()
        print(f"[CHECKOUT] ✓ Order committed to database")
        
        # Add order to processing queue
        try:
            order_queue.add_order(order_id)
            print(f"[CHECKOUT] ✓ Order added to processing queue")
        except Exception as queue_err:
            print(f"[WARNING] Failed to add order to queue: {queue_err}")
            traceback.print_exc()
            # Don't fail the order creation if queue fails
        
        # Log online payment orders
        if payment_method == 'online':
            print(f"\n[PAYMENT] Online payment order created: {order_id}")
            print(f"[PAYMENT] Customer: {order.customer_name} ({order.customer_email})")
            print(f"[PAYMENT] Total: ${order.total:,.2f}")
            print(f"[PAYMENT] Email instructions will be sent to customer\n")
        
        # Return order response
        response_data = order.to_dict()
        print(f"[CHECKOUT] ✓ Returning order: {order_id}")
        print("="*60 + "\n")
        return jsonify(response_data), 201
        
    except Exception as e:
        db.session.rollback()
        error_details = traceback.format_exc()
        print(f"\n[ERROR] " + "="*60)
        print(f"[ERROR] CHECKOUT FAILED")
        print(f"[ERROR] Exception: {type(e).__name__}: {str(e)}")
        print(f"[ERROR] Full traceback:")
        print(error_details)
        print("[ERROR] " + "="*60 + "\n")
        return jsonify({
            'error': 'Checkout failed',
            'details': str(e),
            'type': type(e).__name__
        }), 500


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
    
    # Default to full refund if no amount specified
    if refund_amount is None:
        refund_amount = order.total
    else:
        refund_amount = float(refund_amount)
        
    # Validate refund amount
    if refund_amount <= 0 or refund_amount > order.total:
        return jsonify({'error': 'Invalid refund amount'}), 400
    
    try:
        order.refunded_at = datetime.utcnow()
        order.refund_amount = refund_amount
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
        order.status = 'cancelled'
        db.session.commit()
        return jsonify({
            'message': 'Order cancelled successfully',
            'order': order.to_dict()
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to cancel order', 'details': str(e)}), 500

