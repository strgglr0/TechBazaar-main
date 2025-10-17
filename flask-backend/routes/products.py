from flask import Blueprint, jsonify, request, current_app
from models import Product
from extensions import db

products_bp = Blueprint('products', __name__)


def seed_products():
    if Product.query.count() == 0:
        p1 = Product(id='1', name='iPhone 15 Pro', description='Latest iPhone with advanced camera system', price='999.00', category='phones', brand='Apple', stock=25)
        p2 = Product(id='2', name='ASUS ROG Strix G15', description='Gaming laptop with RTX', price='1299.00', category='laptops', brand='ASUS', stock=8)
        db.session.add_all([p1, p2])
        db.session.commit()


def ensure_seeded():
    try:
        seed_products()
    except Exception:
        current_app.logger.exception('Failed to seed products')


def register_products(app):
    # register a startup hook so seeding runs once
    try:
        # Flask 2.3+ provides before_serving
        if hasattr(app, 'before_serving'):
            app.before_serving(ensure_seeded)
        else:
            # older fallback: run immediately (safe during create_app)
            ensure_seeded()
    except Exception:
        # as a last resort call ensure_seeded
        try:
            ensure_seeded()
        except Exception:
            app.logger.exception('Failed to ensure seeded products')


@products_bp.route('/products', methods=['GET'])
def list_products():
    category = request.args.get('category')
    if category:
        items = Product.query.filter_by(category=category).all()
    else:
        items = Product.query.all()
    return jsonify([p.to_dict() for p in items])


@products_bp.route('/products/<id>', methods=['GET'])
def get_product(id):
    product = Product.query.get(id)
    if not product:
        return jsonify({'error': 'not found'}), 404
    return jsonify(product.to_dict())


@products_bp.route('/categories', methods=['GET'])
def list_categories():
    # derive from products
    cats = db.session.query(Product.category).distinct().all()
    return jsonify([{'id': c[0], 'name': c[0].capitalize()} for c in cats if c[0]])


@products_bp.route('/brands', methods=['GET'])
def list_brands():
    brands = db.session.query(Product.brand).distinct().all()
    return jsonify([{'id': b[0].lower() if b[0] else '', 'name': b[0]} for b in brands if b[0]])
