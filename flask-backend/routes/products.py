from flask import Blueprint, jsonify, request, current_app
from models import Product
from extensions import db
from sqlalchemy import cast, Float
import json

products_bp = Blueprint('products', __name__)


def seed_products():
    current_count = Product.query.count()
    if current_count == 0:
        sample_products = [
            Product(id='1', name='iPhone 15 Pro', description='Latest iPhone with advanced camera system and A17 Pro chip', price='999.00', category='phones', brand='Apple', sku='IPH15P-128', stock=25, rating='4.5', reviewCount=128, isActive=True),
            Product(id='2', name='ASUS ROG Strix G15', description='Gaming laptop with RTX 4070 and Ryzen 7 processor', price='1299.00', category='laptops', brand='ASUS', sku='ASU-ROG-G15', stock=8, rating='4.5', reviewCount=64, isActive=True),
            Product(id='3', name='Dell XPS Desktop', description='Powerful desktop for creative professionals and gaming', price='1599.00', category='desktops', brand='Dell', sku='DELL-XPS-DT', stock=12, rating='4.7', reviewCount=89, isActive=True),
            Product(id='4', name='Sony WH-1000XM5', description='Industry-leading noise canceling headphones', price='399.00', category='accessories', brand='Sony', sku='SONY-WH1000XM5', stock=45, rating='4.9', reviewCount=256, isActive=True),
            Product(id='5', name='Samsung Galaxy S24 Ultra', description='Flagship Android phone with S Pen and advanced cameras', price='1199.00', category='phones', brand='Samsung', sku='SAM-S24U-256', stock=18, rating='4.6', reviewCount=142, isActive=True),
            Product(id='6', name='Samsung Galaxy A23', description='Budget-friendly Samsung phone with great battery life', price='299.00', category='phones', brand='Samsung', sku='SAM-A23-64', stock=35, rating='4.2', reviewCount=87, isActive=True),
            Product(id='7', name='MacBook Air M3', description='Ultra-thin laptop with M3 chip and all-day battery', price='1099.00', category='laptops', brand='Apple', sku='MBA-M3-256', stock=32, rating='4.8', reviewCount=201, isActive=True),
        ]
        db.session.add_all(sample_products)
        db.session.commit()
        print(f"✓ Seeded {len(sample_products)} products successfully!")
        for p in sample_products:
            print(f"  - {p.name} (${p.price})")
    else:
        print(f"ℹ️  Database already has {current_count} products. Skipping seed.")



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
            with app.app_context():
                ensure_seeded()
    except Exception:
        # as a last resort call ensure_seeded
        try:
            with app.app_context():
                ensure_seeded()
        except Exception:
            app.logger.exception('Failed to ensure seeded products')


@products_bp.route('/products', methods=['GET'])
def list_products():
    query = Product.query
    
    total_count = Product.query.count()
    print(f"[API /products] Total products in DB: {total_count}")
    
    category = request.args.get('category')
    if category:
        query = query.filter(Product.category.ilike(category))
        print(f"[API /products] Filter category: {category}")
    
    brand = request.args.get('brand')
    if brand:
        query = query.filter(Product.brand.ilike(brand))
        print(f"[API /products] Filter brand: {brand}")
    
    min_price = request.args.get('minPrice')
    if min_price is not None:
        try:
            min_val = float(min_price)
            query = query.filter(cast(Product.price, Float) >= min_val)
            print(f"[API /products] Filter minPrice >= {min_val}")
        except ValueError:
            pass
    
    max_price = request.args.get('maxPrice')
    if max_price is not None:
        try:
            max_val = float(max_price)
            query = query.filter(cast(Product.price, Float) <= max_val)
            print(f"[API /products] Filter maxPrice <= {max_val}")
        except ValueError:
            pass
    
    rating = request.args.get('rating')
    if rating:
        try:
            query = query.filter(cast(Product.rating, Float) >= float(rating))
        except ValueError:
            pass
    
    search = request.args.get('search')
    if search:
        search_term = search.strip()
        search_pattern = f'%{search_term}%'
        print(f"[API /products] SEARCH: '{search_term}' pattern: '{search_pattern}'")
        
        query = query.filter(
            db.or_(
                Product.name.ilike(search_pattern),
                Product.description.ilike(search_pattern),
                Product.brand.ilike(search_pattern),
                Product.category.ilike(search_pattern)
            )
        )
    
    items = query.all()
    print(f"[API /products] Returning {len(items)} products")
    
    if search and items:
        print(f"[API /products] Sample results:")
        for p in items[:3]:
            print(f"  - {p.name} (${p.price}) - {p.brand}")
    
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


@products_bp.route('/products-debug', methods=['GET'])
def debug_products():
    """Debug endpoint to see all products in database"""
    all_products = Product.query.all()
    return jsonify({
        'total_count': len(all_products),
        'products': [{
            'id': p.id,
            'name': p.name,
            'price': p.price,
            'brand': p.brand,
            'category': p.category
        } for p in all_products]
    })


@products_bp.route('/reseed-products', methods=['POST'])
def reseed_products():
    """Force reseed the database with sample products (deletes existing)"""
    try:
        # Delete all existing products
        deleted_count = Product.query.delete()
        db.session.commit()
        print(f"[RESEED] Deleted {deleted_count} existing products")
        
        # Seed new products
        seed_products()
        
        # Count and return results
        new_count = Product.query.count()
        products = Product.query.all()
        
        return jsonify({
            'success': True,
            'message': f'Database reseeded successfully',
            'deleted': deleted_count,
            'created': new_count,
            'products': [{'name': p.name, 'price': p.price} for p in products]
        })
    except Exception as e:
        db.session.rollback()
        print(f"[RESEED ERROR] {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Failed to reseed database', 'details': str(e)}), 500
