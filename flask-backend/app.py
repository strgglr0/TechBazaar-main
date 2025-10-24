import os
import re
from flask import Flask, send_from_directory
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
        allowed_origins = ["http://localhost:3000", re.compile(r"https://.*\.app\.github\.dev")]

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
        # seed admin user if environment variables provided
        try:
            from models import User
            from utils import hash_password
            admin_email = os.environ.get('FLASK_ADMIN_EMAIL')
            admin_pass = os.environ.get('FLASK_ADMIN_PASSWORD')
            if admin_email and admin_pass:
                existing = User.query.filter_by(email=admin_email).first()
                if not existing:
                    u = User(email=admin_email, password_hash=hash_password(admin_pass), name='Admin', is_admin=True)
                    db.session.add(u)
                    db.session.commit()
        except Exception:
            app.logger.exception('Failed to seed admin user')

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
