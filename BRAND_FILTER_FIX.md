# Brand Filtering Fix - Case Sensitivity Issue

## Problem
Brand filtering wasn't working correctly. When users selected a brand filter (e.g., "Apple"), no products were returned even though products with that brand existed in the database.

## Root Cause

The issue was a **case-sensitivity mismatch** between the frontend and backend:

### What Was Happening:

1. **Database** stores brands with proper capitalization:
   - `brand = 'Apple'`
   - `brand = 'ASUS'`
   - `brand = 'Samsung'`

2. **Brands API** (`/api/brands`) returns lowercase IDs:
   ```python
   {'id': 'apple', 'name': 'Apple'}  # ID is lowercased!
   ```

3. **Frontend** sends the lowercase ID as filter:
   ```
   GET /api/products?brand=apple
   ```

4. **Backend** tried exact case-sensitive match:
   ```python
   query.filter_by(brand='apple')  # Fails! Database has 'Apple'
   ```

5. **Result**: No products matched because `'apple' ≠ 'Apple'` in SQL

## Solution

Changed both **brand** and **category** filters to use **case-insensitive** matching with SQLAlchemy's `ilike()` method.

### Before (Case-Sensitive):
```python
# Apply category filter
category = request.args.get('category')
if category:
    query = query.filter_by(category=category)

# Apply brand filter
brand = request.args.get('brand')
if brand:
    query = query.filter_by(brand=brand)
```

### After (Case-Insensitive):
```python
# Apply category filter (case-insensitive)
category = request.args.get('category')
if category:
    query = query.filter(Product.category.ilike(category))

# Apply brand filter (case-insensitive)
brand = request.args.get('brand')
if brand:
    query = query.filter(Product.brand.ilike(brand))
```

## Technical Details

### `ilike()` vs `filter_by()`

- **`filter_by(brand=brand)`**: Exact case-sensitive match
  - `'apple'` will NOT match `'Apple'`
  
- **`Product.brand.ilike(brand)`**: Case-insensitive match (SQL `ILIKE`)
  - `'apple'` WILL match `'Apple'`, `'APPLE'`, `'aPpLe'`

### Why This Matters

The `/api/brands` endpoint intentionally lowercases the IDs for consistent URL formatting:

```python
@products_bp.route('/brands', methods=['GET'])
def list_brands():
    brands = db.session.query(Product.brand).distinct().all()
    return jsonify([{'id': b[0].lower() if b[0] else '', 'name': b[0]} for b in brands if b[0]])
    #                    ^^^^^^^^ ID is lowercase for URLs
```

This is good practice for URLs (e.g., `/products?brand=apple` looks cleaner than `/products?brand=Apple`), but requires case-insensitive database matching.

## Files Modified

### `/workspaces/TechBazaar-main/flask-backend/routes/products.py`

**Changed Lines 45-52:**
- Category filter: `filter_by()` → `ilike()`
- Brand filter: `filter_by()` → `ilike()`

## Testing

After the fix, all these filter combinations work correctly:

✅ **Brand Filters:**
- `GET /api/products?brand=apple` → Returns iPhone products
- `GET /api/products?brand=APPLE` → Returns iPhone products
- `GET /api/products?brand=Apple` → Returns iPhone products
- `GET /api/products?brand=asus` → Returns ASUS products

✅ **Category Filters:**
- `GET /api/products?category=phones` → Returns phone products
- `GET /api/products?category=PHONES` → Returns phone products
- `GET /api/products?category=Phones` → Returns phone products

✅ **Combined Filters:**
- `GET /api/products?category=phones&brand=apple` → Returns iPhones
- `GET /api/products?category=laptops&brand=asus&minPrice=1000` → Returns ASUS laptops over ₱1000

## Other Filters (Still Working)

The following filters continue to work as before:

✅ **Price Range Filter** - Numeric comparison (not affected by case)
✅ **Rating Filter** - Numeric comparison (not affected by case)
✅ **Search Filter** - Already case-insensitive (`ilike()` was already used)

## Why Categories Were Also Fixed

Categories had the same potential issue. While they're typically lowercase in the database (`'phones'`, `'laptops'`), making them case-insensitive ensures consistency and prevents future bugs if category names are ever capitalized.

## Best Practices Applied

✅ **Case-Insensitive String Filters**: Use `ilike()` for user-facing string filters  
✅ **Lowercase URL Parameters**: Keep URLs clean with lowercase IDs  
✅ **Database Flexibility**: Allow any capitalization in stored data  
✅ **User Experience**: Filters work regardless of text casing  

## Server Restart

After applying the fix, the Flask backend was restarted to apply changes:

```bash
npm run dev:all
```

**Servers Running:**
- Flask Backend: http://localhost:5001
- Vite Frontend: http://localhost:3000

## Impact

**Before Fix:**
- Brand filtering: ❌ Broken
- Category filtering: ⚠️ Potentially fragile

**After Fix:**
- Brand filtering: ✅ Working perfectly
- Category filtering: ✅ Robust and case-insensitive
- User experience: ✅ Filters work as expected

---

**Status**: ✅ Fixed and Tested  
**Issue**: Brand filter case-sensitivity mismatch  
**Resolution**: Changed to case-insensitive `ilike()` matching  
**Date**: October 17, 2025
