from flask import Blueprint, jsonify, request
from uuid import uuid4

products_bp = Blueprint('products', __name__)

# Sample products (mirrors client sample data)
PRODUCTS = [
    {
        'id': '1',
        'name': 'iPhone 15 Pro',
        'description': 'Latest iPhone with advanced camera system',
        'price': '999.00',
        'category': 'phones',
        'brand': 'Apple',
        'stock': 25,
        'imageUrl': None,
    },
    {
        'id': '2',
        'name': 'ASUS ROG Strix G15',
        'description': 'Gaming laptop with RTX',
        'price': '1299.00',
        'category': 'laptops',
        'brand': 'ASUS',
        'stock': 8,
        'imageUrl': None,
    },
]

CATEGORIES = [
    {'id': 'phones', 'name': 'Phones'},
    {'id': 'laptops', 'name': 'Laptops'},
    {'id': 'desktops', 'name': 'Desktops'},
    {'id': 'accessories', 'name': 'Accessories'},
]

BRANDS = [
    {'id': 'apple', 'name': 'Apple'},
    {'id': 'asus', 'name': 'ASUS'},
    {'id': 'dell', 'name': 'Dell'},
    {'id': 'hp', 'name': 'HP'},
    {'id': 'samsung', 'name': 'Samsung'},
]


@products_bp.route('/products', methods=['GET'])
def list_products():
    # support simple category filter
    category = request.args.get('category')
    if category:
        filtered = [p for p in PRODUCTS if p.get('category') == category]
        return jsonify(filtered)
    return jsonify(PRODUCTS)


@products_bp.route('/products/<id>', methods=['GET'])
def get_product(id):
    product = next((p for p in PRODUCTS if p['id'] == id), None)
    if not product:
        return jsonify({'error': 'not found'}), 404
    return jsonify(product)


@products_bp.route('/categories', methods=['GET'])
def list_categories():
    return jsonify(CATEGORIES)


@products_bp.route('/brands', methods=['GET'])
def list_brands():
    return jsonify(BRANDS)
