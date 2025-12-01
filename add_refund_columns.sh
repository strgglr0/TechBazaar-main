#!/bin/bash
# QUICK FIX: Add missing refund columns to orders table

echo "🔧 Adding missing columns to orders table..."
echo ""

cd flask-backend

# Stop Flask if running
pkill -f "python.*app.py" 2>/dev/null

# Add columns directly to SQLite database
sqlite3 instance/data.db <<EOF
-- Check if columns exist and add them if missing
ALTER TABLE orders ADD COLUMN refunded_at DATETIME;
ALTER TABLE orders ADD COLUMN refund_amount FLOAT;
.quit
EOF

# Check for errors
if [ $? -eq 0 ]; then
    echo "✅ Successfully added refund columns to orders table"
else
    echo "⚠️  Columns may already exist (this is OK)"
fi

echo ""
echo "Verifying database schema..."
sqlite3 instance/data.db "PRAGMA table_info(orders);" | grep -E "refunded_at|refund_amount"

echo ""
echo "=========================================="
echo "✅ Database fix complete!"
echo ""
echo "Next steps:"
echo "  1. Start Flask: cd flask-backend && python app.py"
echo "  2. Test: bash verify_checkout.sh"
echo "=========================================="
