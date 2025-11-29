from flask import Blueprint, jsonify, request, current_app
from models import Product
from extensions import db
from sqlalchemy import cast, Float

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
    # Start with base query
    query = Product.query
    
    # Apply category filter (case-insensitive)
    category = request.args.get('category')
    if category:
        query = query.filter(Product.category.ilike(category))
    
    # Apply brand filter (case-insensitive)
    brand = request.args.get('brand')
    if brand:
        query = query.filter(Product.brand.ilike(brand))
    
    # Apply price range filter
    min_price = request.args.get('minPrice')
    if min_price:
        try:
            min_val = float(min_price)
            query = query.filter(cast(Product.price, Float) >= min_val)
            print(f"[DEBUG] Filtering by minPrice: {min_val}")
        except ValueError:
            print(f"[DEBUG] Invalid minPrice value: {min_price}")
            pass
    
    max_price = request.args.get('maxPrice')
    if max_price:
        try:
            max_val = float(max_price)
            query = query.filter(cast(Product.price, Float) <= max_val)
            print(f"[DEBUG] Filtering by maxPrice: {max_val}")
        except ValueError:
            print(f"[DEBUG] Invalid maxPrice value: {max_price}")
            pass
    
    # Apply rating filter
    rating = request.args.get('rating')
    if rating:
        try:
            query = query.filter(db.cast(Product.rating, db.Float) >= float(rating))
        except ValueError:
            pass
    
    # Apply search filter
    search = request.args.get('search')
    if search:
        search_pattern = f'%{search}%'
        query = query.filter(
            db.or_(
                Product.name.ilike(search_pattern),
                Product.description.ilike(search_pattern)
            )
        )
    
    items = query.all()
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


@products_bp.route('/products', methods=['POST'])
def create_product():
    data = request.get_json() or {}
    try:
        import json
        
        # Generate a simple ID if not provided
        if not data.get('id'):
            max_id = db.session.query(db.func.max(db.cast(Product.id, db.Integer))).scalar() or 0
            data['id'] = str(max_id + 1)
        
        # Generate SKU if not provided
        if not data.get('sku'):
            data['sku'] = f"SKU-{data['id']}"
        
        product = Product(
            id=data.get('id'),
            name=data.get('name', ''),
            description=data.get('description', ''),
            price=str(data.get('price', '0.00')),
            category=data.get('category', 'phones'),
            brand=data.get('brand', ''),
            sku=data.get('sku'),
            stock=int(data.get('stock', 0)),
            imageUrl=data.get('imageUrl'),
            specifications=json.dumps(data.get('specifications', {})),
            rating=str(data.get('rating', '0')),
            reviewCount=int(data.get('reviewCount', 0)),
            isActive=data.get('isActive', True)
        )
        db.session.add(product)
        db.session.commit()
        return jsonify(product.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to create product', 'details': str(e)}), 500


@products_bp.route('/products/<id>', methods=['PUT'])
def update_product(id):
    product = Product.query.get(id)
    if not product:
        return jsonify({'error': 'Product not found'}), 404
    
    data = request.get_json() or {}
    try:
        import json
        
        if 'name' in data:
            product.name = data['name']
        if 'description' in data:
            product.description = data['description']
        if 'price' in data:
            product.price = str(data['price'])
        if 'category' in data:
            product.category = data['category']
        if 'brand' in data:
            product.brand = data['brand']
        if 'sku' in data:
            product.sku = data['sku']
        if 'stock' in data:
            product.stock = int(data['stock'])
        if 'imageUrl' in data:
            product.imageUrl = data['imageUrl']
        if 'specifications' in data:
            product.specifications = json.dumps(data['specifications'])
        if 'rating' in data:
            product.rating = str(data['rating'])
        if 'reviewCount' in data:
            product.reviewCount = int(data['reviewCount'])
        if 'isActive' in data:
            product.isActive = data['isActive']
        
        db.session.commit()
        return jsonify(product.to_dict())
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update product', 'details': str(e)}), 500


@products_bp.route('/products/<id>', methods=['DELETE'])
def delete_product(id):
    product = Product.query.get(id)
    if not product:
        return jsonify({'error': 'Product not found'}), 404
    
    try:
        db.session.delete(product)
        db.session.commit()
        return '', 204
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to delete product', 'details': str(e)}), 500
