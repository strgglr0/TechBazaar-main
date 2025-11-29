#!/bin/bash

echo "🔄 Resetting and reseeding database..."
echo ""

# Call the reseed API endpoint
curl -X POST http://localhost:5001/api/reseed-products -H "Content-Type: application/json"

echo ""
echo ""
echo "✅ Database reset complete!"
echo ""
echo "Testing API endpoints..."
echo ""

# Test 1: Get all products
echo "📦 All products:"
curl -s http://localhost:5001/api/products | python3 -m json.tool | grep -E '"name"|"price"|"brand"' | head -20

echo ""
echo ""

# Test 2: Search for Samsung
echo "🔍 Searching for 'samsung':"
curl -s "http://localhost:5001/api/products?search=samsung" | python3 -m json.tool | grep -E '"name"|"price"'

echo ""
echo ""

# Test 3: Search for iPhone
echo "🔍 Searching for 'iphone':"
curl -s "http://localhost:5001/api/products?search=iphone" | python3 -m json.tool | grep -E '"name"|"price"'

echo ""
echo ""

# Test 4: Price filter 0-0
echo "💰 Price range 0-0 (should be empty):"
curl -s "http://localhost:5001/api/products?minPrice=0&maxPrice=0" | python3 -m json.tool | grep -c '"id"'
echo "products found"

echo ""
echo ""

# Test 5: Price filter 0-500
echo "💰 Price range 0-500:"
curl -s "http://localhost:5001/api/products?minPrice=0&maxPrice=500" | python3 -m json.tool | grep -E '"name"|"price"'

echo ""
echo "✨ All tests complete!"
