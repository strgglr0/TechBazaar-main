# Payment Method Feature

## What was added:
- **Cash on Delivery (COD)** - Pay when you receive your order
- **Online Payment** - GCash, PayMaya, or Bank Transfer

## How it works:
1. **Checkout page** shows two payment options with icons
2. **COD**: Customer pays on delivery (default)
3. **Online Payment**: Customer selects this and you'll manually contact them with payment details
4. When an order with "Online Payment" is created, it's logged in the console with customer email

## For you to do:
1. Run database migration (adds payment_method column):
   ```bash
   cd flask-backend
   python add_payment_method.py
   ```

2. When customer selects "Online Payment":
   - Check Flask console logs for order details
   - Manually email them at the customer's email address
   - Provide your GCash/PayMaya/Bank details
   - Ask them to send proof of payment

3. Order details now show payment method in:
   - Admin panel
   - User profile orders page

## Files changed:
- Database: Added `payment_method` column to orders table
- Frontend: Payment selection UI in checkout
- Backend: Saves payment method, logs online orders
- UI: Shows payment method badge in order details

Simple and manual - you have full control over the payment process!
