# User Profile Feature - Complete Documentation

## Overview
A comprehensive user profile page has been implemented, allowing users to:
- View and edit their personal information (name, phone)
- Manage their shipping address
- View and track their order history
- Access order details

## Files Created/Modified

### Frontend Files

#### 1. `/client/src/pages/profile.tsx` (NEW - 600+ lines)
Complete profile page with:
- **Personal Information Section**
  - Email display (read-only)
  - Editable name field
  - Editable phone field
  - Edit/Save/Cancel buttons
  
- **Shipping Address Section**
  - Street address
  - City, state, ZIP code
  - Country
  - Edit/Save/Cancel buttons

- **Order History Section**
  - Table view of all user orders
  - Columns: Order ID, Date, Items count, Total, Status, Actions
  - Status badges with color coding
  - "View Details" button for each order

- **Order Details Modal**
  - Order information (ID, date, status)
  - Contact information
  - Shipping address
  - Order items table with prices
  - Order total

**Key Features:**
- Real-time updates using React Query
- Form validation
- Inline editing with cancel functionality
- Responsive design for mobile/desktop
- Authentication protection (redirects to login if not authenticated)
- Toast notifications for success/error states

#### 2. `/client/src/components/header.tsx` (MODIFIED)
Added profile page access:
- Desktop: Dropdown menu under user name
  - "My Profile" option added
  - Links to `/profile`
  
- Mobile: Sheet menu
  - "My Profile" button added
  - Accessible when logged in

### Backend Files

#### 3. `/flask-backend/routes/profile.py` (NEW)
Complete profile management endpoints:

**GET /api/profile**
- Requires authentication (@token_required)
- Returns current user's profile data
- Response includes: id, email, name, phone, shippingAddress, isAdmin

**PUT /api/profile**
- Requires authentication (@token_required)
- Updates user's personal information
- Accepts: name, phone
- Returns updated user profile

**PUT /api/profile/address**
- Requires authentication (@token_required)
- Updates user's shipping address
- Accepts: address, city, state, zipCode, country
- Stores as JSON in database
- Returns updated user profile

**GET /api/user/orders**
- Requires authentication (@token_required)
- Returns all orders for the current user
- Orders sorted by creation date (newest first)
- Returns array of order objects

#### 4. `/flask-backend/app.py` (MODIFIED)
Registered new profile blueprint:
```python
from routes.profile import profile_bp
app.register_blueprint(profile_bp, url_prefix='/api')
```

#### 5. `/client/src/App.tsx` (MODIFIED)
Added profile route:
```tsx
<Route path="/profile" component={Profile} />
```

## Database Schema

The profile feature uses existing User model fields:
```python
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False)
    name = db.Column(db.String(255), nullable=True)
    phone = db.Column(db.String(64), nullable=True)
    shipping_address = db.Column(db.JSON, nullable=True)
    is_admin = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
```

Shipping address JSON structure:
```json
{
  "address": "123 Main St",
  "city": "Manila",
  "state": "Metro Manila",
  "zipCode": "1000",
  "country": "Philippines"
}
```

## API Endpoints Summary

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | /api/profile | Yes | Get current user profile |
| PUT | /api/profile | Yes | Update personal info (name, phone) |
| PUT | /api/profile/address | Yes | Update shipping address |
| GET | /api/user/orders | Yes | Get user's order history |

## Authentication Flow

1. User must be logged in to access profile
2. Token stored in localStorage
3. Token passed in Authorization header: `Bearer {token}`
4. Backend validates token using @token_required decorator
5. If token invalid/missing, user redirected to login page

## User Experience Flow

### Viewing Profile
1. User clicks on their name in header dropdown
2. Selects "My Profile"
3. Navigates to `/profile`
4. Profile page loads with two tabs:
   - Profile Information (default)
   - My Orders

### Editing Personal Information
1. User clicks "Edit" button on Personal Information card
2. Name and phone fields become editable
3. User makes changes
4. Clicks "Save Changes" or "Cancel"
5. If saved: API call to PUT /api/profile
6. Success toast notification shown
7. Fields return to read-only state

### Editing Shipping Address
1. User clicks "Edit" button on Shipping Address card
2. All address fields become editable
3. User makes changes
4. Clicks "Save Address" or "Cancel"
5. If saved: API call to PUT /api/profile/address
6. Success toast notification shown
7. Fields return to read-only state

### Viewing Orders
1. User clicks "My Orders" tab
2. Table displays all orders
3. Each row shows: Order ID, Date, Item count, Total, Status
4. Status displayed with color-coded badge:
   - Pending/Processing: Gray (secondary)
   - Confirmed/Shipped/Delivered: Green (default)
   - Cancelled: Red (destructive)

### Viewing Order Details
1. User clicks "View Details" on an order
2. Modal opens with full order information:
   - Order ID and date
   - Status badge
   - Customer contact information
   - Full shipping address
   - Item-by-item breakdown with prices
   - Order total
3. User clicks outside or close button to dismiss

## UI Components Used

- **Card**: Main containers for sections
- **Tabs**: Switch between Profile Info and Orders
- **Input**: Form fields for editing
- **Label**: Field labels
- **Button**: Actions (Edit, Save, Cancel, View Details)
- **Table**: Orders list display
- **Dialog**: Order details modal
- **Badge**: Status indicators
- **Toast**: Success/error notifications
- **Icons**: User, Mail, Phone, MapPin, Package, Edit2, Save, X

## Responsive Design

### Desktop (md and above)
- Two-column grid for form fields
- Full table view for orders
- Dropdown menu in header

### Mobile
- Single column layout
- Stacked form fields
- Responsive table (scrollable)
- Sheet menu for navigation

## Error Handling

- Network errors: Toast notification shown
- Authentication errors: Redirect to login
- Loading states: "Loading profile..." message
- Empty states: "No orders yet" with "Start Shopping" button
- Failed updates: Error toast with "Failed to update" message

## Security Features

- All endpoints require authentication
- Token validation on every request
- Email field is read-only (cannot be changed)
- User can only see/edit their own data
- No admin privileges required (user-facing only)

## Testing Checklist

### Profile Information
- [ ] Navigate to /profile when logged in
- [ ] Verify email is displayed and read-only
- [ ] Click Edit button
- [ ] Change name and phone
- [ ] Click Save Changes
- [ ] Verify success toast appears
- [ ] Verify data persists after page refresh
- [ ] Click Edit, change data, click Cancel
- [ ] Verify changes are discarded

### Shipping Address
- [ ] Click Edit button on address section
- [ ] Fill in all address fields
- [ ] Click Save Address
- [ ] Verify success toast appears
- [ ] Verify address persists after page refresh
- [ ] Click Edit, change data, click Cancel
- [ ] Verify changes are discarded

### Order History
- [ ] Click "My Orders" tab
- [ ] Verify orders are displayed
- [ ] Check status badges show correct colors
- [ ] Click "View Details" on an order
- [ ] Verify modal shows complete order info
- [ ] Verify order items and total are correct
- [ ] Close modal and verify it dismisses

### Authentication
- [ ] Log out and try to access /profile
- [ ] Verify redirect to /login
- [ ] Log in and verify redirect back works
- [ ] Verify header shows "My Profile" option when logged in
- [ ] Verify "My Profile" not shown when logged out

### Mobile Responsiveness
- [ ] Test on mobile viewport
- [ ] Verify form fields stack vertically
- [ ] Verify table is scrollable
- [ ] Verify sheet menu works
- [ ] Verify "My Profile" button in mobile menu

## Integration Points

### With Authentication System
- Uses `useAuth()` hook
- Checks `isAuthenticated` state
- Accesses `user` object for display
- Uses `token` for API requests

### With Orders System
- Fetches user orders from `/api/user/orders`
- Displays order status from order processing queue
- Shows order items and totals
- Links to order tracking (status field)

### With Checkout System
- Pre-fills checkout form with saved address
- Can be updated independently
- Stored in user profile database

## Future Enhancements

1. **Password Change**
   - Add section to change password
   - Require current password verification
   - Password strength indicator

2. **Profile Picture**
   - Upload and display user avatar
   - Store in cloud storage or as base64

3. **Order Filtering**
   - Filter by status
   - Date range filter
   - Search by order ID

4. **Order Tracking**
   - Live tracking updates
   - Shipping carrier integration
   - Estimated delivery date

5. **Multiple Addresses**
   - Save multiple shipping addresses
   - Set default address
   - Quick address selection at checkout

6. **Wishlist Integration**
   - Save favorite products
   - Move to cart quickly
   - Price drop notifications

7. **Email Preferences**
   - Opt in/out of marketing emails
   - Order notification preferences
   - Newsletter subscription

## Access URLs

- **Profile Page**: http://localhost:3000/profile
- **Backend API**: http://localhost:5001/api/profile

## Test Account

Use existing user credentials or create a new account:
- Sign up at: http://localhost:3000/signup
- Then access profile at: http://localhost:3000/profile

## Notes

- Profile data auto-saves on successful API response
- All form fields validate before submission
- Shipping address is optional (can be added later)
- Phone number format is flexible (no strict validation)
- Orders are fetched fresh on each tab switch
- Real-time updates via React Query cache invalidation
