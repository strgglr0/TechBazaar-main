import os
import re
from flask import Flask, send_from_directory, jsonify
from flask_cors import CORS

def create_app():
    app = Flask(__name__, static_folder='static', template_folder='templates')
    app.config.from_mapping(
        SECRET_KEY=os.environ.get('FLASK_SECRET', 'dev-secret'),
        SQLALCHEMY_DATABASE_URI=os.environ.get('DATABASE_URL', 'sqlite:///data.db'),
        SQLALCHEMY_TRACK_MODIFICATIONS=False,
    )

    # Enable CORS for development (React default at http://localhost:3000)
    frontend_origins = os.environ.get("FRONTEND_ORIGINS")
    if frontend_origins:
        allowed_origins = [origin.strip() for origin in frontend_origins.split(",") if origin.strip()]
    else:
        # Allow common development ports
        allowed_origins = [
            "http://localhost:3000",
            "http://localhost:3001", 
            "http://localhost:5000",
            "http://localhost:5173",
            re.compile(r"https://.*\.app\.github\.dev")
        ]

    CORS(
        app,
        resources={r"/api/*": {"origins": allowed_origins}},
        supports_credentials=True,
    )

    # Initialize DB and migrations
    from extensions import db, migrate
    from models import User  # ensure models are imported so migrations detect them

    db.init_app(app)
    migrate.init_app(app, db)
    
    # Initialize and start order processing queue
    from order_queue import order_queue
    order_queue.init_app(app)
    order_queue.start()

    # Create tables if they don't exist (simple convenience for demo/prod)
    with app.app_context():
        db.create_all()
        
        # Auto-seed database with products and admin if empty
        from models import User, Product
        from utils import hash_password
        import json
        
        # Seed admin user
        admin_email = os.environ.get('FLASK_ADMIN_EMAIL', 'admin@techbazaar.com')
        admin_pass = os.environ.get('FLASK_ADMIN_PASSWORD', 'admin123')
        
        existing_admin = User.query.filter_by(email=admin_email).first()
        if not existing_admin:
            admin_user = User(
                email=admin_email, 
                password_hash=hash_password(admin_pass), 
                name='Admin', 
                is_admin=True
            )
            db.session.add(admin_user)
            print(f"✓ Created admin user: {admin_email}")
        
        # Seed test user
        test_email = 'user@test.com'
        test_pass = 'password123'
        existing_test = User.query.filter_by(email=test_email).first()
        if not existing_test:
            test_user = User(
                email=test_email,
                password_hash=hash_password(test_pass),
                name='Test User',
                is_admin=False
            )
            db.session.add(test_user)
            print(f"✓ Created test user: {test_email}")
        
        # Seed products if database is empty
        if Product.query.count() == 0:
            print("Seeding products...")
            sample_products = [
                {
                    'id': '1',
                    'name': 'iPhone 15 Pro',
                    'description': 'Latest iPhone with advanced camera system and A17 Pro chip',
                    'price': '999.00',
                    'category': 'phones',
                    'brand': 'Apple',
                    'sku': 'IPH15P-128',
                    'imageUrl': 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9',
                    'specifications': json.dumps({'storage': '128GB', 'display': '6.1-inch Super Retina XDR'}),
                    'stock': 25,
                    'rating': '4.5',
                    'reviewCount': 128,
                    'isActive': True
                },
                {
                    'id': '2',
                    'name': 'ASUS ROG Strix G15',
                    'description': 'Gaming laptop with RTX 4070 and Ryzen 7 processor',
                    'price': '1299.00',
                    'category': 'laptops',
                    'brand': 'ASUS',
                    'sku': 'ASU-ROG-G15',
                    'imageUrl': 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853',
                    'specifications': json.dumps({'processor': 'AMD Ryzen 7', 'graphics': 'NVIDIA RTX 4070'}),
                    'stock': 8,
                    'rating': '4.5',
                    'reviewCount': 64,
                    'isActive': True
                },
                {
                    'id': '3',
                    'name': 'Dell XPS Desktop',
                    'description': 'Powerful desktop for creative professionals and gaming',
                    'price': '1599.00',
                    'category': 'desktops',
                    'brand': 'Dell',
                    'sku': 'DELL-XPS-DT',
                    'imageUrl': 'https://images.unsplash.com/photo-1547082299-de196ea013d6',
                    'specifications': json.dumps({'processor': 'Intel Core i7', 'graphics': 'NVIDIA RTX 4060'}),
                    'stock': 12,
                    'rating': '4.7',
                    'reviewCount': 89,
                    'isActive': True
                },
                {
                    'id': '4',
                    'name': 'Sony WH-1000XM5',
                    'description': 'Industry-leading noise canceling headphones',
                    'price': '399.00',
                    'category': 'accessories',
                    'brand': 'Sony',
                    'sku': 'SONY-WH1000XM5',
                    'imageUrl': 'https://images.unsplash.com/photo-1484704849700-f032a568e944',
                    'specifications': json.dumps({'type': 'Over-ear wireless', 'battery': '30 hours'}),
                    'stock': 45,
                    'rating': '4.9',
                    'reviewCount': 256,
                    'isActive': True
                },
                {
                    'id': '5',
                    'name': 'Samsung Galaxy S24 Ultra',
                    'description': 'Flagship Android phone with S Pen and advanced cameras',
                    'price': '1199.00',
                    'category': 'phones',
                    'brand': 'Samsung',
                    'sku': 'SAM-S24U-256',
                    'imageUrl': 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb',
                    'specifications': json.dumps({'storage': '256GB', 'camera': '200MP Main camera'}),
                    'stock': 18,
                    'rating': '4.6',
                    'reviewCount': 142,
                    'isActive': True
                },
                {
                    'id': '6',
                    'name': 'MacBook Air M3',
                    'description': 'Ultra-thin laptop with M3 chip and all-day battery',
                    'price': '1099.00',
                    'category': 'laptops',
                    'brand': 'Apple',
                    'sku': 'MBA-M3-256',
                    'imageUrl': 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef',
                    'specifications': json.dumps({'processor': 'Apple M3 chip', 'storage': '256GB SSD'}),
                    'stock': 32,
                    'rating': '4.8',
                    'reviewCount': 201,
                    'isActive': True
                },
                {
                    'id': '7',
                    'name': 'Logitech MX Master 3S',
                    'description': 'Premium wireless mouse with ultra-fast scrolling',
                    'price': '99.00',
                    'category': 'accessories',
                    'brand': 'Logitech',
                    'sku': 'LOG-MXM3S',
                    'imageUrl': 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46',
                    'specifications': json.dumps({'type': 'Wireless mouse', 'battery': '70 days'}),
                    'stock': 60,
                    'rating': '4.8',
                    'reviewCount': 312,
                    'isActive': True
                },
                {
                    'id': '8',
                    'name': 'HP EliteDesk 800 G9',
                    'description': 'Business desktop with security features',
                    'price': '899.00',
                    'category': 'desktops',
                    'brand': 'HP',
                    'sku': 'HP-ED800-G9',
                    'imageUrl': 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5',
                    'specifications': json.dumps({'processor': 'Intel Core i5', 'security': 'TPM 2.0'}),
                    'stock': 15,
                    'rating': '4.4',
                    'reviewCount': 78,
                    'isActive': True
                },
                {
                    'id': '9',
                    'name': 'Google Pixel 8 Pro',
                    'description': 'AI-powered Android phone with amazing camera',
                    'price': '899.00',
                    'category': 'phones',
                    'brand': 'Google',
                    'sku': 'GOO-PIX8P-128',
                    'imageUrl': 'https://images.unsplash.com/photo-1598327105666-5b89351aff97',
                    'specifications': json.dumps({'storage': '128GB', 'processor': 'Google Tensor G3'}),
                    'stock': 22,
                    'rating': '4.7',
                    'reviewCount': 165,
                    'isActive': True
                },
                {
                    'id': '10',
                    'name': 'Lenovo ThinkPad X1 Carbon',
                    'description': 'Premium business ultrabook with legendary keyboard',
                    'price': '1499.00',
                    'category': 'laptops',
                    'brand': 'Lenovo',
                    'sku': 'LEN-X1C-G11',
                    'imageUrl': 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed',
                    'specifications': json.dumps({'processor': 'Intel Core i7', 'storage': '512GB SSD'}),
                    'stock': 10,
                    'rating': '4.6',
                    'reviewCount': 98,
                    'isActive': True
                },
                {
                    'id': '11',
                    'name': 'Samsung Odyssey G7',
                    'description': '32-inch curved gaming monitor with 240Hz',
                    'price': '699.00',
                    'category': 'accessories',
                    'brand': 'Samsung',
                    'sku': 'SAM-ODY-G7',
                    'imageUrl': 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf',
                    'specifications': json.dumps({'size': '32 inches', 'refresh_rate': '240Hz'}),
                    'stock': 14,
                    'rating': '4.7',
                    'reviewCount': 187,
                    'isActive': True
                }
            ]
            
            for product_data in sample_products:
                product = Product(**product_data)
                db.session.add(product)
            
            print(f"✓ Seeded {len(sample_products)} products")
        
        try:
            db.session.commit()
            print(f"Database ready: {Product.query.count()} products, {User.query.count()} users")
        except Exception as e:
            db.session.rollback()
            print(f"Error seeding database: {e}")
            app.logger.exception('Failed to seed database')

    # Register blueprints
    from routes.auth import auth_bp
    from routes.products import products_bp
    from routes.cart import cart_bp
    from routes.orders import orders_bp
    from routes.admin import admin_bp
    from routes.recommendations import recommendations_bp
    from routes.analytics import analytics_bp
    from routes.profile import profile_bp

    app.register_blueprint(auth_bp, url_prefix='/api')
    app.register_blueprint(products_bp, url_prefix='/api')
    app.register_blueprint(cart_bp, url_prefix='/api')
    app.register_blueprint(orders_bp, url_prefix='/api')
    app.register_blueprint(admin_bp, url_prefix='/api')
    app.register_blueprint(recommendations_bp, url_prefix='/api')
    app.register_blueprint(analytics_bp, url_prefix='/api')
    app.register_blueprint(profile_bp, url_prefix='/api')

    # Health check endpoint
    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({'status': 'ok', 'message': 'Flask backend is running'}), 200
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'error': 'Not found'}), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        import traceback
        app.logger.error(f"Internal error: {str(error)}")
        app.logger.error(traceback.format_exc())
        return jsonify({'error': 'Internal server error', 'details': str(error)}), 500

    # Install any blueprint-specific app-level hooks (e.g. seeding)
    try:
        from routes.products import register_products
        register_products(app)
    except Exception:
        # If import/registration fails, log but continue — seed is optional
        app.logger.exception('Failed to register products hooks')

    # Serve React build in production
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve(path):
        if path != '' and os.path.exists(os.path.join(app.static_folder, path)):
            return send_from_directory(app.static_folder, path)
        else:
            return send_from_directory(app.static_folder, 'index.html')

    return app

if __name__ == '__main__':
    app = create_app()
    port = int(os.environ.get('FLASK_RUN_PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=True)
