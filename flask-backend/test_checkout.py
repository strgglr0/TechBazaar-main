#!/usr/bin/env python
"""
Test script to diagnose checkout endpoint issues
"""
import requests
import json

BASE_URL = "http://localhost:5001"

def test_health():
    """Test if Flask is running"""
    try:
        response = requests.get(f"{BASE_URL}/api/health")
        print(f"✓ Health check: {response.status_code} - {response.json()}")
        return True
    except Exception as e:
        print(f"✗ Health check failed: {e}")
        return False

def test_products():
    """Test if products endpoint works"""
    try:
        response = requests.get(f"{BASE_URL}/api/products")
        data = response.json()
        print(f"✓ Products: {response.status_code} - Found {len(data)} products")
        return True
    except Exception as e:
        print(f"✗ Products failed: {e}")
        return False

def test_checkout_minimal():
    """Test checkout with minimal valid data"""
    order_data = {
        "customerName": "Test User",
        "customerEmail": "test@example.com",
        "customerPhone": "1234567890",
        "shippingAddress": {
            "address": "123 Test St",
            "city": "Test City",
            "state": "Test State",
            "zipCode": "12345",
            "country": "Philippines"
        },
        "items": [
            {
                "productId": "1",
                "productName": "Test Product",
                "price": "10.00",
                "quantity": 1,
                "category": "test"
            }
        ],
        "total": 10.0,
        "totalAmount": 10.0,
        "paymentMethod": "cod"
    }
    
    headers = {
        "Content-Type": "application/json",
        "x-session-id": "test-session-123"
    }
    
    try:
        print("\n--- Sending checkout request ---")
        print(f"URL: {BASE_URL}/api/checkout")
        print(f"Headers: {headers}")
        print(f"Data: {json.dumps(order_data, indent=2)}")
        
        response = requests.post(
            f"{BASE_URL}/api/checkout",
            headers=headers,
            json=order_data,
            timeout=10
        )
        
        print(f"\n--- Response ---")
        print(f"Status Code: {response.status_code}")
        print(f"Headers: {dict(response.headers)}")
        
        try:
            response_data = response.json()
            print(f"Response JSON: {json.dumps(response_data, indent=2)}")
        except:
            print(f"Response Text: {response.text}")
        
        if response.status_code == 201:
            print("✓ Checkout succeeded!")
            return True
        else:
            print(f"✗ Checkout failed with status {response.status_code}")
            return False
            
    except Exception as e:
        print(f"✗ Checkout request failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("CHECKOUT DIAGNOSTIC TEST")
    print("=" * 60)
    
    print("\n1. Testing Flask health...")
    if not test_health():
        print("\n⚠️  Flask is not running. Start it with: python app.py")
        exit(1)
    
    print("\n2. Testing products endpoint...")
    test_products()
    
    print("\n3. Testing checkout endpoint...")
    test_checkout_minimal()
    
    print("\n" + "=" * 60)
