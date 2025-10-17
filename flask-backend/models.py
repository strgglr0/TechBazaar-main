from datetime import datetime
import uuid
from extensions import db


class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    name = db.Column(db.String(255), nullable=True)
    is_admin = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {'id': self.id, 'email': self.email, 'name': self.name, 'isAdmin': bool(self.is_admin)}


class Product(db.Model):
    __tablename__ = 'products'
    id = db.Column(db.String(64), primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    price = db.Column(db.String(64), nullable=False)
    category = db.Column(db.String(128), nullable=True)
    brand = db.Column(db.String(128), nullable=True)
    stock = db.Column(db.Integer, default=0)
    imageUrl = db.Column(db.String(1024), nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'price': self.price,
            'category': self.category,
            'brand': self.brand,
            'stock': self.stock,
            'imageUrl': self.imageUrl,
        }


class CartItem(db.Model):
    __tablename__ = 'cart_items'
    id = db.Column(db.String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    session_id = db.Column(db.String(128), nullable=True)
    product_id = db.Column(db.String(64), db.ForeignKey('products.id'), nullable=False)
    quantity = db.Column(db.Integer, default=1)

    def to_dict(self):
        return {
            'id': self.id,
            'userId': self.user_id,
            'sessionId': self.session_id,
            'productId': self.product_id,
            'quantity': self.quantity,
        }


class Order(db.Model):
    __tablename__ = 'orders'
    id = db.Column(db.String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    # store customer information (useful for guest checkout and record keeping)
    customer_name = db.Column(db.String(255), nullable=True)
    customer_email = db.Column(db.String(255), nullable=True)
    customer_phone = db.Column(db.String(64), nullable=True)
    shipping_address = db.Column(db.JSON, nullable=True)

    items = db.Column(db.JSON, nullable=False)
    total = db.Column(db.Float, default=0.0)
    status = db.Column(db.String(32), nullable=False, default='pending')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'userId': self.user_id,
            'customerName': self.customer_name,
            'customerEmail': self.customer_email,
            'customerPhone': self.customer_phone,
            'shippingAddress': self.shipping_address,
            'items': self.items,
            'total': self.total,
            # status is computed dynamically for demo: pending -> shipped -> complete
            'status': self.computed_status(),
            'createdAt': self.created_at.isoformat() if self.created_at else None,
        }

    def computed_status(self):
        """Compute demo status based on elapsed seconds since creation:
        <5s -> pending, 5-10s -> shipped, >=10s -> complete
        """
        try:
            if not self.created_at:
                return self.status or 'pending'
            from datetime import datetime
            elapsed = (datetime.utcnow() - self.created_at).total_seconds()
            if elapsed < 5:
                return 'pending'
            if elapsed < 10:
                return 'shipped'
            return 'complete'
        except Exception:
            return self.status or 'pending'
