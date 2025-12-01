#!/bin/bash
# Complete fix for checkout 500 error - Database schema issue

echo "=============================================="
echo "  FIX CHECKOUT ERROR - Add Refund Columns"
echo "=============================================="
echo ""
echo "Error: table orders has no column named refunded_at"
echo "Solution: Run database migration"
echo ""

cd flask-backend

# Stop Flask
echo "1. Stopping Flask..."
pkill -f "python.*app.py" 2>/dev/null
sleep 1

# Run migration
echo ""
echo "2. Running database migration..."
python add_refund_fields.py

# Check result
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Database migration successful!"
    echo ""
    echo "=============================================="
    echo "  NEXT STEPS"
    echo "=============================================="
    echo ""
    echo "1. Start Flask:"
    echo "   cd flask-backend"
    echo "   python app.py"
    echo ""
    echo "2. Test checkout:"
    echo "   bash verify_checkout.sh"
    echo ""
    echo "The checkout should now work! 🎉"
else
    echo ""
    echo "❌ Migration failed. See error above."
    exit 1
fi
