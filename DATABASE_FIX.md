# 🔥 URGENT FIX - Database Schema Issue

## The Problem

The error is:
```
sqlite3.OperationalError: table orders has no column named refunded_at
```

The `orders` table is **missing two columns** that were added to the model:
- `refunded_at` 
- `refund_amount`

## ⚡ QUICK FIX (30 seconds)

Run this ONE command:

```bash
bash fix_checkout_now.sh
```

This will:
1. Stop Flask
2. Add the missing columns to the database
3. Show you the next steps

## 📋 Manual Fix (if script doesn't work)

### Option 1: Run Migration Script
```bash
cd flask-backend
python add_refund_fields.py
```

### Option 2: Add Columns Manually
```bash
cd flask-backend
sqlite3 instance/data.db "ALTER TABLE orders ADD COLUMN refunded_at DATETIME;"
sqlite3 instance/data.db "ALTER TABLE orders ADD COLUMN refund_amount FLOAT;"
```

### Option 3: Reset Database (loses data)
```bash
cd flask-backend
rm instance/data.db
python app.py  # Will recreate with correct schema
```

## ✅ After Fixing

1. **Start Flask:**
   ```bash
   cd flask-backend
   python app.py
   ```

2. **Test:**
   ```bash
   bash verify_checkout.sh
   ```

   Should show:
   ```
   ✓ Flask health check passed
   ✓ Products endpoint working
   ✓ Checkout endpoint working (HTTP 201)  ← This should now work!
   ```

3. **Test in browser:**
   - Go to http://localhost:3001
   - Add items to cart
   - Checkout
   - Should succeed! 🎉

## Why This Happened

The Order model has these fields:
```python
refunded_at = db.Column(db.DateTime, nullable=True)
refund_amount = db.Column(db.Float, nullable=True)
```

But the database table wasn't updated. The migration script fixes this.

## Summary

**Run:** `bash fix_checkout_now.sh`

Then restart Flask and test! The checkout will work! ✅
