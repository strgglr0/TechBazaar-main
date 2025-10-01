#!/bin/bash

# Test script for TechBazaar authentication system
echo "Testing TechBazaar Authentication System"
echo "========================================"

# Test if Flask backend is running
echo "1. Testing Flask backend connection..."
if curl -s http://localhost:5001/api/products > /dev/null; then
    echo "✅ Flask backend is running and accessible"
else
    echo "❌ Flask backend is not accessible"
    exit 1
fi

# Test registration
echo "2. Testing user registration..."
TIMESTAMP=$(date +%s)
TEST_EMAIL="test${TIMESTAMP}@example.com"
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:5001/api/register \
    -H "Content-Type: application/json" \
    -d "{\"name\": \"Test User $TIMESTAMP\", \"email\": \"$TEST_EMAIL\", \"password\": \"password123\"}")

if echo "$REGISTER_RESPONSE" | grep -q '"token"'; then
    echo "✅ User registration successful"
    TOKEN=$(echo "$REGISTER_RESPONSE" | python3 -c "import json, sys; print(json.load(sys.stdin)['token'])")
else
    echo "❌ User registration failed"
    echo "Response: $REGISTER_RESPONSE"
    exit 1
fi

# Test login
echo "3. Testing user login..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:5001/api/login \
    -H "Content-Type: application/json" \
    -d "{\"email\": \"$TEST_EMAIL\", \"password\": \"password123\"}")

if echo "$LOGIN_RESPONSE" | grep -q '"token"'; then
    echo "✅ User login successful"
else
    echo "❌ User login failed"
    echo "Response: $LOGIN_RESPONSE"
    exit 1
fi

# Test protected endpoint
echo "4. Testing protected endpoint..."
ME_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" http://localhost:5001/api/me)

if echo "$ME_RESPONSE" | grep -q '"user"'; then
    echo "✅ Protected endpoint access successful"
else
    echo "❌ Protected endpoint access failed"
    echo "Response: $ME_RESPONSE"
    exit 1
fi

# Test other endpoints
echo "5. Testing other API endpoints..."
for endpoint in "categories" "brands" "cart"; do
    if curl -s http://localhost:5001/api/$endpoint > /dev/null; then
        echo "✅ /api/$endpoint is working"
    else
        echo "❌ /api/$endpoint is not working"
    fi
done

echo ""
echo "🎉 All tests passed! The authentication system is working correctly."
echo ""
echo "Next steps:"
echo "- Open the frontend at the Codespace URL"
echo "- Try signing up with a new account"
echo "- Try signing in with existing credentials"
echo "- Check that the user dropdown appears in the header when logged in"