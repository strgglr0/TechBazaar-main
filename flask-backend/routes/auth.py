from flask import Blueprint, request, jsonify
from extensions import db
from models import User
from utils import hash_password, verify_password, generate_token, token_required

def admin_required(f):
    from functools import wraps
    from flask import request, jsonify

    @wraps(f)
    @token_required
    def decorated(*args, **kwargs):
        # token_required decorator has already set request.user_id
        user = User.query.get(request.user_id)
        if not user or not getattr(user, 'is_admin', False):
            return jsonify({'error': 'forbidden'}), 403
        return f(*args, **kwargs)
    return decorated

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    name = data.get('name', '').strip()
    
    # Validation
    if not email:
        return jsonify({'error': 'Email is required'}), 400
    if not password:
        return jsonify({'error': 'Password is required'}), 400
    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400
    if not name:
        return jsonify({'error': 'Name is required'}), 400
    
    # Check if user already exists
    existing = User.query.filter_by(email=email).first()
    if existing:
        return jsonify({'error': 'User with this email already exists'}), 400
    
    try:
        user = User(email=email, password_hash=hash_password(password), name=name)
        db.session.add(user)
        db.session.commit()
        token = generate_token(user.id)
        return jsonify({'token': token, 'user': user.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Registration failed. Please try again.'}), 500


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    
    # Validation
    if not email:
        return jsonify({'error': 'Email is required'}), 400
    if not password:
        return jsonify({'error': 'Password is required'}), 400
    
    try:
        user = User.query.filter_by(email=email).first()
        if not user or not verify_password(user.password_hash, password):
            return jsonify({'error': 'Invalid email or password'}), 401
        
        token = generate_token(user.id)
        return jsonify({'token': token, 'user': user.to_dict()}), 200
    except Exception as e:
        return jsonify({'error': 'Login failed. Please try again.'}), 500


@auth_bp.route('/me', methods=['GET'])
@token_required
def get_current_user():
    try:
        user = User.query.get(request.user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        return jsonify({'user': user.to_dict()}), 200
    except Exception as e:
        return jsonify({'error': 'Failed to get user info'}), 500


@auth_bp.route('/logout', methods=['POST'])
def logout():
    # JWT tokens are stateless; the client should remove the token. Implement blacklist if needed.
    return jsonify({'ok': True})
