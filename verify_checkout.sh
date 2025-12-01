#!/bin/bash
# Quick verification script - run this after restarting Flask

echo "🔍 TechBazaar Checkout Verification"
echo "===================================="
echo ""

# Check if Flask is running
if pgrep -f "python.*app.py" > /dev/null; then
    echo "✓ Flask process is running"
else
    echo "✗ Flask is NOT running"
    echo "  Start it with: cd flask-backend && python app.py"
    exit 1
fi

# Wait a moment for Flask to be ready
sleep 2

# Test health endpoint
echo ""
echo "Testing Flask health..."
if curl -s http://localhost:5001/api/health | grep -q "ok"; then
    echo "✓ Flask health check passed"
else
    echo "✗ Flask health check failed"
    exit 1
fi

# Test products endpoint
echo ""
echo "Testing products endpoint..."
PRODUCT_COUNT=$(curl -s http://localhost:5001/api/products | python3 -c "import sys, json; print(len(json.load(sys.stdin)))" 2>/dev/null)
if [ "$PRODUCT_COUNT" -gt 0 ]; then
    echo "✓ Products endpoint working: $PRODUCT_COUNT products found"
else
    echo "✗ Products endpoint failed"
    exit 1
fi

# Test checkout endpoint with a simple request
echo ""
echo "Testing checkout endpoint..."
CHECKOUT_RESPONSE=$(curl -s -w "%{http_code}" -X POST http://localhost:5001/api/checkout \
    -H "Content-Type: application/json" \
    -H "x-session-id: verify-test" \
    -d '{
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
        "items": [{
            "productId": "1",
            "productName": "Test Product",
            "price": "10.00",
            "quantity": 1,
            "category": "test"
        }],
        "total": 10.0,
        "paymentMethod": "cod"
    }' -o /tmp/checkout_test.json)

HTTP_CODE="${CHECKOUT_RESPONSE: -3}"

if [ "$HTTP_CODE" = "201" ]; then
    echo "✓ Checkout endpoint working (HTTP 201)"
    ORDER_ID=$(python3 -c "import json; print(json.load(open('/tmp/checkout_test.json')).get('id', 'unknown'))" 2>/dev/null)
    echo "  Order created: $ORDER_ID"
elif [ "$HTTP_CODE" = "400" ]; then
    echo "⚠ Checkout returned 400 (validation error - check logs)"
    cat /tmp/checkout_test.json
elif [ "$HTTP_CODE" = "500" ]; then
    echo "✗ Checkout FAILED with 500 error"
    echo "  Check Flask console for detailed error logs"
    cat /tmp/checkout_test.json
    exit 1
else
    echo "⚠ Checkout returned unexpected code: $HTTP_CODE"
    cat /tmp/checkout_test.json
fi

echo ""
echo "===================================="
echo "✅ Basic verification complete!"
echo ""
echo "Next steps:"
echo "  1. Check Flask console for detailed logs"
echo "  2. Test in browser: http://localhost:3001"
echo "  3. Run full test: python flask-backend/test_checkout_full.py"
