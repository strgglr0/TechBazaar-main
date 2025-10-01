from werkzeug.security import generate_password_hash, check_password_hash
import jwt
from flask import current_app, request, jsonify
from functools import wraps


def hash_password(password: str) -> str:
    return generate_password_hash(password)


def verify_password(hash: str, password: str) -> bool:
    return check_password_hash(hash, password)


def generate_token(user_id: int) -> str:
    import datetime
    payload = {
        'sub': user_id,
        'iat': datetime.datetime.utcnow(),
        'exp': datetime.datetime.utcnow() + datetime.timedelta(days=7),
    }
    token = jwt.encode(payload, current_app.config['SECRET_KEY'], algorithm='HS256')
    return token


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        # Try headers
        if 'Authorization' in request.headers:
            auth = request.headers.get('Authorization')
            if auth.startswith('Bearer '):
                token = auth.split(' ')[1]
        if not token:
            return jsonify({'error': 'token missing'}), 401
        try:
            data = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
            request.user_id = data.get('sub')
        except Exception as e:
            return jsonify({'error': 'token invalid', 'details': str(e)}), 401
        return f(*args, **kwargs)
    return decorated


def get_current_user_id():
    """Return user id from Authorization Bearer token if present, else None."""
    try:
        auth = request.headers.get('Authorization')
        if not auth:
            return None
        if not auth.startswith('Bearer '):
            return None
        token = auth.split(' ')[1]
        data = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
        return data.get('sub')
    except Exception:
        return None
