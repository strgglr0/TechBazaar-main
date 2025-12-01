#!/usr/bin/env python
"""
Comprehensive test suite for checkout system
Tests all endpoints involved in the checkout flow
"""
import requests
import json
import time
import sys

BASE_URL = "http://localhost:5001"
TEST_USER_EMAIL = "user@test.com"
TEST_USER_PASSWORD = "password123"

class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

def print_success(msg):
    print(f"{Colors.OKGREEN}✓ {msg}{Colors.ENDC}")

def print_error(msg):
    print(f"{Colors.FAIL}✗ {msg}{Colors.ENDC}")

def print_warning(msg):
    print(f"{Colors.WARNING}⚠ {msg}{Colors.ENDC}")

def print_info(msg):
    print(f"{Colors.OKCYAN}ℹ {msg}{Colors.ENDC}")

def print_section(title):
    print(f"\n{Colors.BOLD}{Colors.HEADER}{'='*60}{Colors.ENDC}")
    print(f"{Colors.BOLD}{Colors.HEADER}{title}{Colors.ENDC}")
    print(f"{Colors.BOLD}{Colors.HEADER}{'='*60}{Colors.ENDC}\n")

def test_health():
    """Test if Flask is running"""
    try:
        response = requests.get(f"{BASE_URL}/api/health", timeout=5)
        if response.status_code == 200:
            print_success(f"Flask is running: {response.json()}")
            return True
        else:
            print_error(f"Flask health check failed: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print_error("Cannot connect to Flask backend. Is it running on port 5001?")
        return False
    except Exception as e:
        print_error(f"Health check failed: {e}")
        return False

def test_products():
    """Test if products endpoint works"""
    try:
        response = requests.get(f"{BASE_URL}/api/products", timeout=5)
        if response.status_code == 200:
            products = response.json()
            print_success(f"Products endpoint working: {len(products)} products found")
            if len(products) > 0:
                print_info(f"  Sample: {products[0].get('name', 'N/A')}")
            return True, products
        else:
            print_error(f"Products endpoint failed: {response.status_code}")
            return False, []
    except Exception as e:
        print_error(f"Products test failed: {e}")
        return False, []

def test_login():
    """Test login and get auth token"""
    try:
        login_data = {
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        }
        response = requests.post(
            f"{BASE_URL}/api/login",
            json=login_data,
            headers={"Content-Type": "application/json"},
            timeout=5
        )
        
        if response.status_code == 200:
            data = response.json()
            token = data.get('token')
            if token:
                print_success(f"Login successful: {data.get('user', {}).get('name', 'User')}")
                return True, token
            else:
                print_error("Login succeeded but no token returned")
                return False, None
        else:
            print_warning(f"Login failed: {response.status_code} - {response.text[:200]}")
            return False, None
    except Exception as e:
        print_error(f"Login test failed: {e}")
        return False, None

def test_add_to_cart(token, product_id):
    """Test adding a product to cart"""
    try:
        cart_data = {
            "productId": product_id,
            "quantity": 1
        }
        headers = {
            "Content-Type": "application/json"
        }
        if token:
            headers["Authorization"] = f"Bearer {token}"
        else:
            headers["x-session-id"] = "test-session-123"
        
        response = requests.post(
            f"{BASE_URL}/api/cart",
            json=cart_data,
            headers=headers,
            timeout=5
        )
        
        if response.status_code in [200, 201]:
            print_success(f"Added product {product_id} to cart")
            return True
        else:
            print_error(f"Add to cart failed: {response.status_code} - {response.text[:200]}")
            return False
    except Exception as e:
        print_error(f"Add to cart test failed: {e}")
        return False

def test_checkout(token, product):
    """Test checkout with actual order"""
    try:
        order_data = {
            "customerName": "Test User",
            "customerEmail": TEST_USER_EMAIL,
            "customerPhone": "09171234567",
            "shippingAddress": {
                "address": "123 Test Street, Unit 456",
                "city": "Manila",
                "state": "Metro Manila",
                "zipCode": "1000",
                "country": "Philippines"
            },
            "items": [
                {
                    "productId": product.get('id'),
                    "productName": product.get('name', 'Test Product'),
                    "price": product.get('price', '10.00'),
                    "quantity": 1,
                    "category": product.get('category', 'test')
                }
            ],
            "total": float(product.get('price', '10.00')),
            "totalAmount": float(product.get('price', '10.00')),
            "paymentMethod": "cod"
        }
        
        headers = {
            "Content-Type": "application/json"
        }
        if token:
            headers["Authorization"] = f"Bearer {token}"
        else:
            headers["x-session-id"] = "test-session-123"
        
        print_info(f"Sending checkout request...")
        print_info(f"  Customer: {order_data['customerName']}")
        print_info(f"  Total: ₱{order_data['total']:.2f}")
        print_info(f"  Items: {len(order_data['items'])}")
        
        response = requests.post(
            f"{BASE_URL}/api/checkout",
            json=order_data,
            headers=headers,
            timeout=10
        )
        
        print_info(f"Response status: {response.status_code}")
        
        if response.status_code == 201:
            order = response.json()
            print_success(f"Checkout successful!")
            print_info(f"  Order ID: {order.get('id')}")
            print_info(f"  Status: {order.get('status')}")
            print_info(f"  Total: ₱{order.get('total', 0):.2f}")
            return True, order.get('id')
        else:
            print_error(f"Checkout failed: {response.status_code}")
            try:
                error_data = response.json()
                print_error(f"  Error: {error_data.get('error', 'Unknown')}")
                if 'details' in error_data:
                    print_error(f"  Details: {error_data['details']}")
            except:
                print_error(f"  Response: {response.text[:500]}")
            return False, None
    except Exception as e:
        print_error(f"Checkout test failed: {e}")
        import traceback
        traceback.print_exc()
        return False, None

def test_get_orders(token):
    """Test fetching user orders"""
    try:
        headers = {}
        if token:
            headers["Authorization"] = f"Bearer {token}"
        
        response = requests.get(
            f"{BASE_URL}/api/user/orders",
            headers=headers,
            timeout=5
        )
        
        if response.status_code == 200:
            orders = response.json()
            print_success(f"Retrieved {len(orders)} orders")
            if len(orders) > 0:
                print_info(f"  Latest order: {orders[0].get('id')} - Status: {orders[0].get('status')}")
            return True
        else:
            print_error(f"Get orders failed: {response.status_code} - {response.text[:200]}")
            return False
    except Exception as e:
        print_error(f"Get orders test failed: {e}")
        return False

def run_full_test_suite():
    """Run complete checkout flow test"""
    print_section("CHECKOUT SYSTEM TEST SUITE")
    
    results = {
        'health': False,
        'products': False,
        'login': False,
        'add_to_cart': False,
        'checkout': False,
        'get_orders': False
    }
    
    # Test 1: Health check
    print_section("Test 1: Flask Health Check")
    results['health'] = test_health()
    if not results['health']:
        print_error("Flask is not running. Please start it with: python app.py")
        return results
    
    # Test 2: Products
    print_section("Test 2: Products Endpoint")
    results['products'], products = test_products()
    if not results['products'] or len(products) == 0:
        print_error("No products available. Cannot continue tests.")
        return results
    
    # Test 3: Login
    print_section("Test 3: User Login")
    results['login'], token = test_login()
    if not results['login']:
        print_warning("Login failed. Will test as guest.")
        token = None
    
    # Test 4: Add to cart
    print_section("Test 4: Add Product to Cart")
    test_product = products[0]
    results['add_to_cart'] = test_add_to_cart(token, test_product.get('id'))
    
    # Test 5: Checkout
    print_section("Test 5: Checkout Process")
    results['checkout'], order_id = test_checkout(token, test_product)
    
    # Test 6: Get orders
    if token:
        print_section("Test 6: Retrieve User Orders")
        results['get_orders'] = test_get_orders(token)
    else:
        print_warning("Skipping order retrieval test (no auth token)")
    
    # Summary
    print_section("TEST SUMMARY")
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for test_name, passed_test in results.items():
        status = "PASS" if passed_test else "FAIL"
        color = Colors.OKGREEN if passed_test else Colors.FAIL
        print(f"  {color}{status:<6}{Colors.ENDC} {test_name.replace('_', ' ').title()}")
    
    print(f"\n{Colors.BOLD}Results: {passed}/{total} tests passed{Colors.ENDC}")
    
    if results['checkout']:
        print(f"\n{Colors.OKGREEN}{Colors.BOLD}✓ CHECKOUT SYSTEM IS WORKING!{Colors.ENDC}")
    else:
        print(f"\n{Colors.FAIL}{Colors.BOLD}✗ CHECKOUT SYSTEM HAS ISSUES{Colors.ENDC}")
    
    return results

if __name__ == "__main__":
    try:
        results = run_full_test_suite()
        # Exit with error code if checkout failed
        if not results.get('checkout', False):
            sys.exit(1)
    except KeyboardInterrupt:
        print(f"\n\n{Colors.WARNING}Tests interrupted by user{Colors.ENDC}")
        sys.exit(130)
    except Exception as e:
        print_error(f"Test suite crashed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
