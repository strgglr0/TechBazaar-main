#!/bin/bash
# Quick fix: Reset database with correct schema including refund columns

echo "=========================================="
echo "  DATABASE FIX - Adding Refund Columns"
echo "=========================================="
echo ""

cd flask-backend

echo "The database is missing the refund columns (refunded_at, refund_amount)."
echo "We need to either:"
echo "  1. Add the columns (migration)"
echo "  2. Reset the database (recreates everything)"
echo ""

read -p "Choose option (1=migrate, 2=reset): " choice

if [ "$choice" == "1" ]; then
    echo ""
    echo "Running migration to add columns..."
    python migrate_add_refund_columns.py
elif [ "$choice" == "2" ]; then
    echo ""
    echo "Resetting database..."
    python reset_database.py
else
    echo "Invalid choice. Exiting."
    exit 1
fi

echo ""
echo "=========================================="
echo "Next steps:"
echo "  1. Restart Flask: python app.py"
echo "  2. Test checkout: bash ../verify_checkout.sh"
echo "=========================================="
