from datetime import datetime
import uuid
from extensions import db


class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    name = db.Column(db.String(255), nullable=True)
    phone = db.Column(db.String(64), nullable=True)
    shipping_address = db.Column(db.JSON, nullable=True)
    is_admin = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'name': self.name,
            'phone': self.phone,
            'shippingAddress': self.shipping_address,
            'isAdmin': bool(self.is_admin)
        }


class Product(db.Model):
    __tablename__ = 'products'
    id = db.Column(db.String(64), primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    price = db.Column(db.String(64), nullable=False)
    category = db.Column(db.String(128), nullable=True)
    brand = db.Column(db.String(128), nullable=True)
    sku = db.Column(db.String(128), nullable=True, unique=True)
    stock = db.Column(db.Integer, default=0)
    imageUrl = db.Column(db.String(1024), nullable=True)
    specifications = db.Column(db.Text, nullable=True)  # JSON as text
    rating = db.Column(db.String(16), nullable=True, default='0')
    reviewCount = db.Column(db.Integer, default=0)
    isActive = db.Column(db.Boolean, default=True)
    createdAt = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        import json
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'price': self.price,
            'category': self.category,
            'brand': self.brand,
            'sku': self.sku,
            'stock': self.stock,
            'imageUrl': self.imageUrl,
            'specifications': json.loads(self.specifications) if self.specifications else {},
            'rating': self.rating,
            'reviewCount': self.reviewCount,
            'isActive': self.isActive,
            'createdAt': self.createdAt.isoformat() if self.createdAt else None,
        }


class CartItem(db.Model):
    __tablename__ = 'cart_items'
    id = db.Column(db.String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    session_id = db.Column(db.String(128), nullable=True)
    product_id = db.Column(db.String(64), db.ForeignKey('products.id'), nullable=False)
    quantity = db.Column(db.Integer, default=1)
    
    # Relationship to Product
    product = db.relationship('Product', backref='cart_items', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'userId': self.user_id,
            'sessionId': self.session_id,
            'productId': self.product_id,
            'quantity': self.quantity,
            'product': self.product.to_dict() if self.product else None,
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
    payment_method = db.Column(db.String(32), nullable=True, default='cod')  # 'cod' or 'online'
    status = db.Column(db.String(32), nullable=False, default='processing')
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
            'paymentMethod': self.payment_method,
            'status': self.status,  # Now uses actual DB status managed by queue
            'createdAt': self.created_at.isoformat() if self.created_at else None,
        }


class Rating(db.Model):
    __tablename__ = 'ratings'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    product_id = db.Column(db.String(64), db.ForeignKey('products.id'), nullable=False)
    order_id = db.Column(db.String(64), db.ForeignKey('orders.id'), nullable=True)
    rating = db.Column(db.Integer, nullable=False)
    review = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'userId': self.user_id,
            'productId': self.product_id,
            'orderId': self.order_id,
            'rating': self.rating,
            'review': self.review,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'updatedAt': self.updated_at.isoformat() if self.updated_at else None,
        }
