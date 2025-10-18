#!/bin/bash
# Test script to verify brand and category filters work with case-insensitive matching

echo "Testing Product Filters - Case Insensitivity"
echo "============================================"
echo ""

BASE_URL="http://localhost:5001"

echo "1. Testing Brand Filter (lowercase 'apple'):"
curl -s "${BASE_URL}/api/products?brand=apple" | python -m json.tool | grep -E '"name"|"brand"' | head -4
echo ""

echo "2. Testing Brand Filter (uppercase 'APPLE'):"
curl -s "${BASE_URL}/api/products?brand=APPLE" | python -m json.tool | grep -E '"name"|"brand"' | head -4
echo ""

echo "3. Testing Brand Filter (mixed case 'Apple'):"
curl -s "${BASE_URL}/api/products?brand=Apple" | python -m json.tool | grep -E '"name"|"brand"' | head -4
echo ""

echo "4. Testing Category Filter (lowercase 'phones'):"
curl -s "${BASE_URL}/api/products?category=phones" | python -m json.tool | grep -E '"name"|"category"' | head -4
echo ""

echo "5. Testing Category Filter (uppercase 'PHONES'):"
curl -s "${BASE_URL}/api/products?category=PHONES" | python -m json.tool | grep -E '"name"|"category"' | head -4
echo ""

echo "6. Testing Combined Filters (category=laptops, brand=asus):"
curl -s "${BASE_URL}/api/products?category=laptops&brand=asus" | python -m json.tool | grep -E '"name"|"category"|"brand"' | head -6
echo ""

echo "7. Getting all available brands:"
curl -s "${BASE_URL}/api/brands" | python -m json.tool
echo ""

echo "✅ All tests completed!"
echo "If you see product data above, the filters are working correctly!"
