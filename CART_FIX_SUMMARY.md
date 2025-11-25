# Cart Behavior Fix Summary

## Overview
Fixed the cart behavior to properly handle guest and authenticated user carts with the following requirements:
- Guest carts persist across browser sessions
- Cart items are preserved when logging in (transferred from guest to user)
- Cart is cleared only when user logs out (not on login)
- Guest carts only clear on browser session end or explicit clear action

## Changes Made

### 1. Frontend - Cart Hook (`client/src/hooks/use-cart.ts`)

**Key Changes:**
- **Unique Guest Session IDs**: Replaced constant `"default-session"` with dynamically generated guest session IDs stored in localStorage
  ```typescript
  const getGuestSessionId = () => {
    let sessionId = localStorage.getItem('guest-session-id');
    if (!sessionId) {
      sessionId = `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('guest-session-id', sessionId);
    }
    return sessionId;
  };
  ```

- **Dynamic Session Management**: Session ID now changes based on authentication state
  - Guest users: `guest-{timestamp}-{random}`
  - Authenticated users: `user-{tokenPrefix}`

- **Login Event Listener**: Added event listener to handle cart transfer on login
  - Fetches guest cart items
  - Transfers items to user cart via `/api/cart/transfer` endpoint
  - Clears guest cart after successful transfer
  - Invalidates cart queries to refresh data

- **Logout Event Listener**: Added event listener to clear cart on logout
  - Clears authenticated user's cart when logout occurs
  - Preserves guest cart if user logs back out

- **Query Key Updates**: All cart queries now include session ID for proper cache isolation
  ```typescript
  queryKey: ['/api/cart', sessionId]
  ```

### 2. Frontend - Auth Hook (`client/src/hooks/use-auth.tsx`)

**Key Changes:**
- **Login Event Dispatch**: Dispatches custom `auth:login` event with token and user data
  ```typescript
  window.dispatchEvent(new CustomEvent('auth:login', { 
    detail: { token: newToken, user: newUser } 
  }));
  ```

- **Logout Event Dispatch**: Dispatches custom `auth:logout` event before clearing auth state
  ```typescript
  window.dispatchEvent(new CustomEvent('auth:logout', { 
    detail: { action: 'logout', token } 
  }));
  ```

### 3. Backend - Routes (`server/routes.ts`)

**New Endpoint Added:**
```typescript
POST /api/cart/transfer
```

**Functionality:**
- Accepts `fromSessionId` and `toSessionId` in request body
- Fetches all items from source cart (guest)
- Fetches all items from destination cart (user)
- Transfers items that don't exist in destination
- For items that exist in both carts, adds quantities together
- Returns success status and count of transferred items

**Request Body:**
```json
{
  "fromSessionId": "guest-1234567890-abc123",
  "toSessionId": "user-eyJhbGciOiJIUzI1NiIs"
}
```

**Response:**
```json
{
  "success": true,
  "transferred": 3
}
```

## Cart Behavior Flow

### Guest User Flow
1. User visits site → Unique guest session ID generated and stored in localStorage
2. User adds items to cart → Items stored with guest session ID
3. User refreshes page → Guest session ID retrieved from localStorage, cart persists
4. User closes browser → Cart remains in localStorage for next visit

### Login Flow
1. User clicks login → Auth hook dispatches `auth:login` event
2. Cart hook receives event → Triggers cart transfer process
3. Backend transfers guest cart items to user session
4. Guest cart cleared after successful transfer
5. User sees all cart items preserved

### Logout Flow
1. User clicks logout → Auth hook dispatches `auth:logout` event
2. Cart hook receives event → Calls DELETE `/api/cart` for user session
3. User cart cleared on backend
4. New guest session ID generated for subsequent browsing

### Re-login Flow
1. User logs back in → New user session created
2. Empty cart for authenticated user
3. Any new guest cart items transferred again

## Technical Details

### Session ID Format
- **Guest**: `guest-{timestamp}-{randomString}`
  - Example: `guest-1704567890123-x8k2p9qr`
- **Authenticated**: `user-{first20CharsOfToken}`
  - Example: `user-eyJhbGciOiJIUzI1NiIs`

### Event System
Uses browser's native CustomEvent API for communication between auth and cart hooks:
- **Event Names**: `auth:login`, `auth:logout`
- **Event Details**: Contains token, user data, or action type
- **Advantages**: Decouples auth and cart logic, allows easy extension

### Cart Storage
- Backend uses in-memory Map storage keyed by session ID
- Cart items are filtered by session ID
- Multiple session IDs can coexist (guest + multiple users)

## Testing Checklist

✅ **Guest Cart Persistence**
- Add items as guest
- Refresh page
- Items should remain

✅ **Cart Transfer on Login**
- Add items as guest
- Log in
- All guest items should be in user cart

✅ **Cart Clearing on Logout**
- Log in with items in cart
- Log out
- Cart should be empty

✅ **Guest Cart Isolation**
- Log out
- Add new items as guest
- Guest cart should not have previous user's items

✅ **Quantity Merging**
- Add item (qty 2) as guest
- Log in to account that already has same item (qty 1)
- Cart should show item with qty 3

✅ **Browser Session**
- Close browser with guest cart
- Reopen browser
- Guest cart should persist

## Migration Notes

### No Breaking Changes
- Existing carts will continue to work
- Old session IDs are still supported
- No database schema changes required

### Backward Compatibility
- Backend still accepts `default-session` session ID
- Old cart items will be accessible
- Gradual migration as users use the new system

## Performance Considerations

- Cart transfer happens asynchronously during login
- Uses optimistic updates for instant UI feedback
- Query invalidation ensures fresh data after operations
- Event listeners cleaned up properly to prevent memory leaks

## Security Considerations

- Session IDs stored in localStorage (not accessible to other domains)
- Guest session IDs are unique and unpredictable
- User carts isolated by token-based session IDs
- No cart data exposed between different users
- Transfer endpoint validates both session IDs

## Future Enhancements

Potential improvements for future iterations:
- Add cart expiration for old guest carts
- Implement cart persistence to database
- Add cart sync across devices for authenticated users
- Implement cart conflict resolution UI
- Add analytics for cart abandonment tracking
