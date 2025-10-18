# Quick Testing Guide - Admin Features

## 🔐 Login as Admin

1. Go to http://localhost:3000/login
2. Use one of these admin accounts:
   - Email: `ryannoche116@gmail.com`
   - Password: `techbazaar2025`
   
   OR
   
   - Email: `admin@techbazaar.com`
   - Password: `techbazaar2025`

## 📝 Test Add Product

1. Navigate to http://localhost:3000/admin
2. Click **"Add Product"** button
3. Fill in the form:
   - **Product Name**: iPhone 16 Pro Max
   - **SKU**: SKU-IPHONE16PM
   - **Description**: Latest iPhone with A18 Pro chip
   - **Price**: 1299.00
   - **Category**: phones
   - **Brand**: Apple
   - **Image URL**: (optional) https://example.com/iphone16.jpg
   - **Stock**: 50
   - **Rating**: 4.8
   - **Review Count**: 150
   - **Specifications**: `{"processor": "A18 Pro", "ram": "8GB", "storage": "256GB"}`
4. Click **"Save Product"**
5. ✅ Product should appear in the table

## ✏️ Test Edit Product

1. In the product table, find any product
2. Click the **pencil/edit icon** on that product
3. Modify any field (e.g., change price to 1199.00)
4. Click **"Save Product"**
5. ✅ Changes should be reflected in the table

## 🗑️ Test Delete Product

1. In the product table, find any product
2. Click the **trash/delete icon** on that product
3. Confirm deletion in the dialog
4. ✅ Product should be removed from the table

## 🔍 Test Product Filters (as regular user)

1. Logout from admin (click logout button)
2. Go to http://localhost:3000 (home page)
3. Test each filter:
   - ✅ Click a **category** (phones, laptops, etc.)
   - ✅ Check a **brand** checkbox
   - ✅ Select a **price range**
   - ✅ Filter by **rating**
   - ✅ Use the **search bar**
4. ✅ Products should filter correctly

## 🛒 Test Shopping Cart

1. On home page, click **"Add to Cart"** on any product
2. Click the **shopping cart icon** in header
3. ✅ Cart should open with the product
4. ✅ Adjust quantity with +/- buttons
5. ✅ Remove item with trash icon
6. ✅ Click "Checkout" to proceed to checkout page

## 📊 Verify Admin Stats

1. Login as admin
2. Go to http://localhost:3000/admin
3. ✅ Check dashboard cards show:
   - Total Products count
   - Orders Today count
   - Revenue amount
   - Low Stock count

## 🚫 Test Non-Admin Access

1. Login as regular user:
   - Email: `lyxnuxmaldia@gmail.com`
   - Password: `techbazaar2025`
2. Try to access http://localhost:3000/admin
3. ✅ Should redirect to /login (access denied)

## 🐛 If Something Doesn't Work

1. **Check servers are running**:
   ```bash
   ps aux | grep -E "(flask|vite)" | grep -v grep
   ```

2. **Check Flask logs**:
   ```bash
   tail -f flask-backend/flask.log
   ```

3. **Restart servers**:
   ```bash
   lsof -ti:3000,5000,5001 | xargs -r kill -9
   npm run dev:all
   ```

4. **Check browser console** (F12) for JavaScript errors

## ✅ Expected Results

All the following should work without errors:

- ✅ Admin can view product table
- ✅ Admin can add new products
- ✅ Admin can edit existing products
- ✅ Admin can delete products
- ✅ Product filters work (case-insensitive)
- ✅ Shopping cart works
- ✅ Checkout works
- ✅ Non-admin users blocked from /admin
- ✅ All product fields saved correctly (sku, specs, rating, etc.)

---

**Servers**: http://localhost:3000 (Frontend) | http://localhost:5001 (Backend)  
**Admin Password**: `techbazaar2025` (all accounts)
