#!/bin/bash
# Quick Start Script for Testing Email Features

echo "=================================="
echo "TechBazaar Email Features Test"
echo "=================================="
echo ""

# Step 1: Check if dev server is running
echo "Step 1: Checking dev server..."
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Dev server is running at http://localhost:3000"
else
    echo "⚠️  Dev server not running. Start it with: npm run dev"
    exit 1
fi

# Step 2: Check Flask backend
echo ""
echo "Step 2: Checking Flask backend..."
if curl -s http://localhost:5001/api/products > /dev/null 2>&1; then
    echo "✅ Flask backend is running at http://localhost:5001"
else
    echo "⚠️  Flask backend not responding"
fi

# Step 3: Display user credentials
echo ""
echo "Step 3: Current User Credentials"
echo "=================================="
echo ""
echo "ADMIN ACCOUNT:"
echo "  Email:    ryannoche116@gmail.com"
echo "  Password: TechBazaar2025!"
echo ""
echo "USER ACCOUNT:"
echo "  Email:    lyxnuxmaldia@gmail.com"
echo "  Password: TechBazaar2025!"
echo ""

# Step 4: Email configuration
echo "Step 4: Email Configuration"
echo "=================================="
echo ""
echo "Current setup: Local SMTP for testing"
echo ""
echo "To test forgot password:"
echo "  1. Open new terminal"
echo "  2. Run: python -m smtpd -n -c DebuggingServer localhost:1025"
echo "  3. Go to http://localhost:3000/login"
echo "  4. Click 'Forgot password?'"
echo "  5. Enter: ryannoche116@gmail.com"
echo "  6. Check SMTP terminal for code"
echo ""

# Step 5: Quick test links
echo "Step 5: Quick Test Links"
echo "=================================="
echo ""
echo "Login Page:          http://localhost:3000/login"
echo "Forgot Password:     http://localhost:3000/forgot-password"
echo "Home Page:           http://localhost:3000/"
echo ""

# Step 6: API test
echo "Step 6: Test Password Reset API"
echo "=================================="
echo ""
read -p "Test forgot password API? (y/n): " test_api

if [ "$test_api" = "y" ]; then
    echo ""
    echo "Sending reset code to ryannoche116@gmail.com..."
    response=$(curl -s -X POST http://localhost:5001/api/forgot-password \
        -H "Content-Type: application/json" \
        -d '{"email":"ryannoche116@gmail.com"}')
    
    echo "Response: $response"
    echo ""
    echo "✅ Check SMTP server console for the 6-digit code"
fi

echo ""
echo "=================================="
echo "All set! Ready for testing 🚀"
echo "=================================="
echo ""
echo "See FEATURES_COMPLETE.md for full testing guide"
echo ""
