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



@orders_bp.route('/orders/<order_id>/ratings', methods=['GET'])
@token_required
def get_order_ratings(order_id):
    """Return ratings made by the current user for items in this order"""
    user_id = get_current_user_id()
    order = Order.query.get(order_id)
    if not order:
        return jsonify({'error': 'Order not found'}), 404

    if order.user_id != user_id:
        return jsonify({'error': 'Unauthorized - This order does not belong to you'}), 403

    # Find ratings for this order by this user
    from models import Rating
    ratings = Rating.query.filter_by(order_id=order_id, user_id=user_id).all()
    return jsonify([r.to_dict() for r in ratings])


@orders_bp.route('/orders/<order_id>/rating', methods=['POST'])
@token_required
def rate_order_item(order_id):
    """Create or update a rating for an item in an order. Body: { productId, rating (1-5), review? }"""
    user_id = get_current_user_id()
    order = Order.query.get(order_id)
    if not order:
        return jsonify({'error': 'Order not found'}), 404

    if order.user_id != user_id:
        return jsonify({'error': 'Unauthorized - This order does not belong to you'}), 403

    # Only allow rating after delivery/receipt
    if order.status not in ('delivered', 'received'):
        return jsonify({'error': 'Can only rate items after order is delivered/received'}), 400

    data = request.get_json() or {}
    product_id = data.get('productId')
    rating_value = data.get('rating')
    review_text = data.get('review')

    if not product_id or rating_value is None:
        return jsonify({'error': 'productId and rating are required'}), 400

    try:
        rating_value = int(rating_value)
        if rating_value < 1 or rating_value > 5:
            return jsonify({'error': 'rating must be 1-5'}), 400
    except ValueError:
        return jsonify({'error': 'rating must be an integer'}), 400

    # Ensure the product is part of the order
    item_match = None
    for it in order.items:
        if str(it.get('productId')) == str(product_id):
            item_match = it
            break

    if not item_match:
        return jsonify({'error': 'Product not found in order'}), 400

    from models import Rating, Product

    existing = Rating.query.filter_by(order_id=order_id, user_id=user_id, product_id=product_id).first()

    try:
        product = Product.query.get(product_id)
        if not product:
            return jsonify({'error': 'Product not found'}), 404

        # Create or update rating
        if existing:
            old_value = existing.rating
            existing.rating = rating_value
            existing.review = review_text
            db.session.commit()

            # adjust product aggregate (average)
            try:
                count = product.reviewCount or 0
                avg = float(product.rating or '0') if product.rating else 0.0
                # replace old with new in average
                if count > 0:
                    new_avg = ((avg * count) - int(old_value) + int(rating_value)) / count
                else:
                    new_avg = float(rating_value)
                product.rating = f"{new_avg:.2f}"
                db.session.commit()
            except Exception:
                db.session.rollback()

            return jsonify(existing.to_dict())
        else:
            new_rating = Rating(user_id=user_id, product_id=product_id, order_id=order_id, rating=rating_value, review=review_text)
            db.session.add(new_rating)

            # update product aggregates
            try:
                count = product.reviewCount or 0
                avg = float(product.rating or '0') if product.rating else 0.0
                new_count = count + 1
                new_avg = ((avg * count) + float(rating_value)) / new_count
                product.reviewCount = new_count
                product.rating = f"{new_avg:.2f}"
            except Exception:
                db.session.rollback()

            db.session.commit()
            return jsonify(new_rating.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to save rating', 'details': str(e)}), 500


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
