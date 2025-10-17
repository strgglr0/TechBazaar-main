import json
from app import create_app


def pretty(resp):
    try:
        body = resp.get_json()
    except Exception:
        body = None
    return f"status={resp.status_code}, body={json.dumps(body)}"


def run_tests():
    app = create_app()
    with app.app_context():
        client = app.test_client()

        print('Testing GET /api/products')
        r = client.get('/api/products')
        print(pretty(r))

        print('\nTesting POST /api/register')
        payload = {'name': 'Test Script', 'email': 'script.user@example.com', 'password': 'password123'}
        r = client.post('/api/register', json=payload)
        print(pretty(r))

        # If registration returned a token, try login
        print('\nTesting POST /api/login')
        r = client.post('/api/login', json={'email': payload['email'], 'password': payload['password']})
        print(pretty(r))

        print('\nTesting GET /api/me with token (if provided)')
        token = None
        try:
            token = r.get_json().get('token')
        except Exception:
            token = None

        if token:
            r = client.get('/api/me', headers={'Authorization': f'Bearer {token}'})
            print(pretty(r))
        else:
            print('No token returned from login; skipping /api/me')


if __name__ == '__main__':
    run_tests()
