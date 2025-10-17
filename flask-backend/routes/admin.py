from flask import Blueprint, jsonify, request
from models import User, Order, Product
from extensions import db
from utils import token_required, get_current_user_id

admin_bp = Blueprint('admin', __name__)


@admin_bp.route('/admin/stats', methods=['GET'])
def stats():
    try:
        total_products = Product.query.count()
    except Exception:
        total_products = 0

    try:
        # count orders where created_at is today (best-effort)
        orders_today = Order.query.filter(db.func.date(Order.created_at) == db.func.date(db.func.current_timestamp())).count()
    except Exception:
        orders_today = 0

    try:
        revenue = float(db.session.query(db.func.coalesce(db.func.sum(Order.total), 0)).scalar() or 0)
    except Exception:
        revenue = 0

    try:
        low_stock = Product.query.filter(Product.stock < 10).count()
    except Exception:
        low_stock = 0

    return jsonify({'totalProducts': total_products, 'ordersToday': orders_today, 'revenue': revenue, 'lowStock': low_stock})


@admin_bp.route('/admin/users', methods=['GET'])
@token_required
def list_users():
    # only return users if the caller is an admin
    uid = get_current_user_id()
    caller = User.query.get(uid)
    if not caller or not caller.is_admin:
        return jsonify({'error': 'forbidden'}), 403
    users = User.query.all()
    return jsonify([u.to_dict() for u in users])
