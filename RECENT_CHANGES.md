# Recent Code Changes and Fixes

## Date: November 29, 2025

### Critical Bug Fixes

#### 1. Added Missing Cart Transfer Endpoint ✅
**File:** `flask-backend/routes/cart.py`

**Problem:** Frontend was calling `POST /api/cart/transfer` on user login to merge guest cart items with user cart, but this endpoint didn't exist in the backend. This caused cart transfer to fail silently.

**Solution:** Added complete cart transfer endpoint that:
- Validates user authentication
- Accepts `guestSessionId` from request body or headers
- Queries guest cart items by session_id
- Merges quantities if user already has the same product
- Transfers guest items to user_id and clears session_id
- Returns success message

**Impact:** Users can now properly keep their cart items when logging in after browsing as a guest.

---

### New Features Added

#### 2. Product Rating System ✅
**Files:**
- `flask-backend/models.py` - Added `Rating` model
- `flask-backend/routes/orders.py` - Added rating endpoints
- `client/src/pages/profile.tsx` - Added rating UI

**Features:**
- Users can rate products (1-5 stars) after delivery
- Ratings are linked to specific orders
- Product aggregate ratings update automatically
- Users can edit existing ratings
- Review text is optional

**Endpoints:**
- `GET /api/orders/<order_id>/ratings` - Get user's ratings for an order
- `POST /api/orders/<order_id>/rating` - Create or update a rating

---

### Files to Delete (Deprecated/Temporary)

The following files should be removed as they are no longer needed:

1. **flask-backend/email_utils.py** - Contains deprecated automatic email functionality (switched to manual process)
2. **PAYMENT_FEATURE.md** - Outdated documentation about automatic emails (use PAYMENT_SIMPLE.md instead)
3. **check_payment_column.py** - Temporary migration script, no longer needed
4. **flask-backend/add_payment_method.py** - Migration script, models.py already has the column

---

### Previously Completed Features (From Earlier Sessions)

#### Payment Method Selection ✅
- Added COD (Cash on Delivery) and Online Payment options
- Payment method stored in database
- Online orders logged to console for manual processing
- Email references updated to ryannoche116@gmail.com

#### Receipt Confirmation ✅
- Users can confirm receipt for delivered orders
- Endpoint: `POST /api/orders/<order_id>/confirm-receipt`
- Status changes to 'received'

#### Admin Decorator Fix ✅
- Fixed `admin_required` decorator bug
- Removed redundant token validation

---

### Database Status

**Payment Method Column:**
- Already defined in `models.py` as: `payment_method = db.Column(db.String(32), nullable=True, default='cod')`
- Will be created automatically by `db.create_all()` on first run
- Migration scripts not needed if starting fresh

---

### Testing Recommendations

1. **Cart Transfer:**
   - Add items as guest
   - Login
   - Verify cart items persist

2. **Rating System:**
   - Place an order
   - Admin: Mark as delivered
   - User: Confirm receipt and rate products
   - Verify rating appears and product average updates

3. **Payment Methods:**
   - Checkout with COD
   - Checkout with Online Payment
   - Verify console logs for online orders

---

### Git Commit Summary

**Branch:** lynux

**Files Modified:**
- flask-backend/routes/cart.py (added cart/transfer endpoint)
- flask-backend/routes/orders.py (added rating endpoints)
- flask-backend/models.py (added Rating model)
- client/src/pages/profile.tsx (added rating UI)

**Files to Remove:**
- flask-backend/email_utils.py
- PAYMENT_FEATURE.md
- check_payment_column.py
- flask-backend/add_payment_method.py

**Commit Message:**
```
Fix cart transfer and add product rating system

- Add missing /api/cart/transfer endpoint to merge guest cart on login
- Implement product rating system (1-5 stars) for delivered orders
- Add rating endpoints and UI in user profile
- Update product aggregate ratings automatically
- Remove deprecated email utility files
- Remove temporary migration scripts

Fixes #cart-transfer-bug
```
