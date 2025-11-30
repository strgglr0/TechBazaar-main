# TechBazaar Data Structures Documentation

## Table of Contents
1. [Overview](#overview)
2. [Database Schema (Backend)](#database-schema-backend)
3. [Frontend Data Structures](#frontend-data-structures)
4. [In-Memory Data Structures](#in-memory-data-structures)
5. [Browser Storage Structures](#browser-storage-structures)
6. [Why These Structures Were Chosen](#why-these-structures-were-chosen)
7. [Code Reference Index](#code-reference-index)

---

## Overview

TechBazaar uses a hybrid data storage approach combining:
- **Relational Database (SQLite)**: Persistent data storage
- **In-Memory Dictionaries**: Fast access for temporary data
- **Browser Storage (localStorage/sessionStorage)**: Client-side persistence
- **React Query Cache**: Optimistic UI updates and caching

---

## Database Schema (Backend)

### 1. User Table
**File**: `flask-backend/models.py` (Lines 6-26)

```python
class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    name = db.Column(db.String(255), nullable=True)
    phone = db.Column(db.String(64), nullable=True)
    shipping_address = db.Column(db.JSON, nullable=True)
    is_admin = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
```

**Data Structure**: Relational Table (SQL)

**Fields**:
- `id`: Integer (Primary Key, Auto-increment)
- `email`: String (Unique Index)
- `password_hash`: String (Hashed password)
- `name`: String
- `phone`: String
- `shipping_address`: **JSON Object** (Complex nested data)
- `is_admin`: Boolean
- `created_at`: DateTime

**Why This Structure**:
- ✅ **Primary Key (Integer)**: Fast indexing and foreign key references
- ✅ **Unique Email**: Ensures no duplicate accounts, enables email-based login
- ✅ **JSON for shipping_address**: Flexible structure for address data
  - Can store: street, city, state, zip, country
  - No need for separate address table for simple use case
  - Easy to update without schema migrations
- ✅ **Boolean for is_admin**: Simple role-based access control
- ✅ **DateTime for created_at**: Track account creation, user analytics

**Trade-offs**:
- ❌ JSON fields are harder to query efficiently (can't index nested fields)
- ✅ But we rarely query by address components, only retrieve full address
- ✅ Simplicity wins over premature optimization

---

### 2. Product Table
**File**: `flask-backend/models.py` (Lines 29-61)

```python
class Product(db.Model):
    __tablename__ = 'products'
    id = db.Column(db.String(64), primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    price = db.Column(db.String(64), nullable=False)  # String to avoid float precision
    category = db.Column(db.String(128), nullable=True)
    brand = db.Column(db.String(128), nullable=True)
    sku = db.Column(db.String(128), nullable=True, unique=True)
    stock = db.Column(db.Integer, default=0)
    imageUrl = db.Column(db.String(1024), nullable=True)
    specifications = db.Column(db.Text, nullable=True)  # JSON as text
    rating = db.Column(db.String(16), nullable=True, default='0')
    reviewCount = db.Column(db.Integer, default=0)
    isActive = db.Column(db.Boolean, default=True)
    createdAt = db.Column(db.DateTime, default=datetime.utcnow)
```

**Data Structure**: Relational Table with String-based Primary Key

**Why This Structure**:

#### String ID (Primary Key)
```python
id = db.Column(db.String(64), primary_key=True)
```
- ✅ **Human-readable IDs**: Can use meaningful IDs like "product-1", "iphone-15-pro"
- ✅ **External system integration**: Easy to sync with external catalogs
- ✅ **URL-friendly**: Direct use in routes `/product/:id`
- ❌ **Trade-off**: Slightly slower joins than integer keys
- ✅ **But**: For small-medium catalogs (<100k products), negligible impact

#### Price as String
```python
price = db.Column(db.String(64), nullable=False)
```
- ✅ **Avoids float precision errors**: No rounding issues (999.99 stays 999.99)
- ✅ **Currency agnostic**: Can store "999.99 USD" or just "999.99"
- ✅ **Formatting preserved**: "1,299.00" keeps formatting
- ✅ **Convert to float only for calculations**: Done in application layer
- ❌ **Trade-off**: Can't use SQL for price calculations directly
- ✅ **But**: We filter in application layer anyway (see products.py lines 70-77)

#### Text for Specifications
```python
specifications = db.Column(db.Text, nullable=True)  # JSON as text
```
- ✅ **Flexible schema**: Each product can have different specs
- ✅ **No migrations needed**: Add new spec fields without schema changes
- ✅ **Stores JSON string**: Parsed to dict in `to_dict()` method
- ❌ **Can't query spec fields**: But we don't need to filter by RAM or CPU
- ✅ **Display only**: Specs are for showing to users, not querying

#### Unique SKU
```python
sku = db.Column(db.String(128), nullable=True, unique=True)
```
- ✅ **Business identifier**: Real-world product codes
- ✅ **Unique constraint**: Prevents duplicate products
- ✅ **Inventory tracking**: SKU-based stock management

---

### 3. CartItem Table
**File**: `flask-backend/models.py` (Lines 64-79)

```python
class CartItem(db.Model):
    __tablename__ = 'cart_items'
    id = db.Column(db.String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    session_id = db.Column(db.String(128), nullable=True)
    product_id = db.Column(db.String(64), db.ForeignKey('products.id'), nullable=False)
    quantity = db.Column(db.Integer, default=1)
    
    # Relationship to Product
    product = db.relationship('Product', backref='cart_items', lazy=True)
```

**Data Structure**: Junction Table with Dual Identifier System

**Why This Structure**:

#### Dual Identifier (user_id OR session_id)
```python
user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
session_id = db.Column(db.String(128), nullable=True)
```
- ✅ **Guest cart support**: session_id for non-logged-in users
- ✅ **User cart persistence**: user_id for logged-in users
- ✅ **Seamless transition**: Transfer from session to user on login
- ✅ **Both nullable**: One or the other must be set, enforced in application

**Cart Transfer Logic** (`client/src/hooks/use-cart.ts` lines 62-120):
```typescript
// On login: Transfer guest cart to user cart
if (guestCartItems.length > 0) {
  await fetch('/api/cart/transfer', {
    method: 'POST',
    body: JSON.stringify({
      fromSessionId: guestSessionId,
      toSessionId: userSessionId
    })
  });
}
```

#### Foreign Key to Product
```python
product_id = db.Column(db.String(64), db.ForeignKey('products.id'), nullable=False)
product = db.relationship('Product', backref='cart_items', lazy=True)
```
- ✅ **Referential integrity**: Cart can't have non-existent products
- ✅ **Lazy loading**: Product data loaded only when accessed
- ✅ **Backref**: Can access `product.cart_items` from product side
- ✅ **Cascade delete**: When product deleted, cart items can be handled

#### UUID for Primary Key
```python
id = db.Column(db.String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
```
- ✅ **Globally unique**: No collisions across users/sessions
- ✅ **Client-side generation possible**: Could generate on frontend
- ✅ **Distributed systems**: Safe for multi-server deployments
- ❌ **Larger index size**: UUIDs take more space than integers
- ✅ **But**: Cart items table stays small (cleared after checkout)

---

### 4. Order Table
**File**: `flask-backend/models.py` (Lines 82-113)

```python
class Order(db.Model):
    __tablename__ = 'orders'
    id = db.Column(db.String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    customer_name = db.Column(db.String(255), nullable=True)
    customer_email = db.Column(db.String(255), nullable=True)
    customer_phone = db.Column(db.String(64), nullable=True)
    shipping_address = db.Column(db.JSON, nullable=True)
    items = db.Column(db.JSON, nullable=False)  # Array of cart items
    total = db.Column(db.Float, default=0.0)
    payment_method = db.Column(db.String(32), nullable=True, default='cod')
    status = db.Column(db.String(32), nullable=False, default='processing')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
```

**Data Structure**: Denormalized Table with JSON Arrays

**Why This Structure**:

#### JSON for Order Items
```python
items = db.Column(db.JSON, nullable=False)  # Array of cart items
```
**Stored as**:
```json
[
  {
    "productId": "1",
    "productName": "iPhone 15 Pro",
    "price": "999.00",
    "quantity": 2
  },
  {
    "productId": "4",
    "productName": "Sony WH-1000XM5",
    "price": "399.00",
    "quantity": 1
  }
]
```

- ✅ **Snapshot of order**: Preserves exact state at purchase time
- ✅ **Historical accuracy**: Even if product deleted, order stays intact
- ✅ **Price locked**: Records price paid, not current price
- ✅ **Single query**: No joins needed to get full order details
- ❌ **Denormalized**: Data duplicated from products table
- ✅ **But**: Orders are immutable, so duplication is acceptable
- ✅ **Reporting**: Can analyze order items without product table

#### Duplicate Customer Info
```python
customer_name = db.Column(db.String(255), nullable=True)
customer_email = db.Column(db.String(255), nullable=True)
customer_phone = db.Column(db.String(64), nullable=True)
```
- ✅ **Guest checkout support**: Don't require user_id
- ✅ **Historical record**: Captures customer info at order time
- ✅ **Contact info**: Can contact customer even if they close account
- ❌ **Duplicates user data**: If user is logged in
- ✅ **But**: Important for order history and customer service

#### Float for Total
```python
total = db.Column(db.Float, default=0.0)
```
- ✅ **Calculations**: Sum, average, revenue reports
- ✅ **Filtering**: Query orders over/under certain amounts
- ❌ **Precision issues**: 0.1 + 0.2 = 0.30000000000000004
- ✅ **But**: Already calculated in application layer with proper rounding
- ✅ **Display uses string**: Frontend formats for display

---

### 5. Rating Table
**File**: `flask-backend/models.py` (Lines 116-137)

```python
class Rating(db.Model):
    __tablename__ = 'ratings'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    product_id = db.Column(db.String(64), db.ForeignKey('products.id'), nullable=False)
    order_id = db.Column(db.String(64), db.ForeignKey('orders.id'), nullable=True)
    rating = db.Column(db.Integer, nullable=False)  # 1-5 stars
    review = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
```

**Data Structure**: Many-to-Many Junction with Extra Data

**Why This Structure**:
- ✅ **Verified purchases**: order_id links rating to actual purchase
- ✅ **Multiple ratings**: User can rate multiple products
- ✅ **Product can have many ratings**: Many users rate same product
- ✅ **Integer rating**: 1-5 scale, easy to average
- ✅ **Optional review text**: Rating required, review optional
- ✅ **Timestamps**: Track when created/updated for sorting

---

## Frontend Data Structures

### 1. React Query Cache
**File**: `client/src/lib/queryClient.ts`

```typescript
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000,   // 10 minutes
    },
  },
});
```

**Data Structure**: In-Memory Key-Value Cache

**Why This Structure**:
- ✅ **Automatic caching**: Prevents duplicate API calls
- ✅ **Stale-while-revalidate**: Shows cached data while fetching fresh
- ✅ **Garbage collection**: Removes unused data after 10 minutes
- ✅ **Optimistic updates**: UI updates instantly before server confirms
- ✅ **Background refetching**: Keeps data fresh automatically

**Example**: Product List Cache
```typescript
const { data: products } = useQuery<Product[]>({
  queryKey: ['/api/products', filters],
  queryFn: async () => { /* fetch */ }
});
```
- Key: `['/api/products', {category: 'phones', minPrice: 100}]`
- Value: Array of Product objects
- Automatic invalidation when filters change

---

### 2. Cart State Management
**File**: `client/src/hooks/use-cart.ts` (Lines 1-232)

```typescript
const { data: cartItems = [], isLoading } = useQuery<CartItemWithProduct[]>({
  queryKey: ['/api/cart', sessionId],
  queryFn: async () => { /* fetch cart */ },
  staleTime: Infinity,  // Never goes stale
  gcTime: Infinity,     // Never garbage collected
});
```

**Data Structure**: Persistent Query Cache with Session-based Keys

**Why This Structure**:

#### Session-based Keys
```typescript
const sessionId = token 
  ? `user-${token.substring(0, 20)}` 
  : guestSessionId;
```
- ✅ **User isolation**: Each user has separate cart
- ✅ **Guest support**: Session ID for non-logged-in users
- ✅ **Automatic switching**: Changes from guest to user on login

#### Infinite Stale Time
```typescript
staleTime: Infinity,  // Never goes stale
gcTime: Infinity,     // Never garbage collected
```
- ✅ **Cart persistence**: Cart stays in memory during entire session
- ✅ **No unnecessary refetches**: Cart only updates on explicit actions
- ✅ **Optimistic updates**: UI updates immediately on add/remove
- ✅ **Server sync**: Background sync ensures consistency

---

### 3. Product Filters
**File**: `client/src/lib/types.ts`

```typescript
export interface ProductFilters {
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  searchQuery?: string;
}
```

**Data Structure**: Optional Properties Object (TypeScript Interface)

**Why This Structure**:
- ✅ **Optional fields**: Only include filters that are set
- ✅ **URL-friendly**: Easy to convert to query params
- ✅ **Type safety**: TypeScript ensures correct types
- ✅ **Composable**: Can combine multiple filters

**Example URL Construction** (`client/src/pages/home.tsx` lines 30-42):
```typescript
const params = new URLSearchParams();
if (filters.category) params.append('category', filters.category);
if (filters.brand) params.append('brand', filters.brand);
if (filters.minPrice) params.append('minPrice', filters.minPrice.toString());
// ...
const url = `/api/products?${params.toString()}`;
```

Result: `/api/products?category=phones&minPrice=100&maxPrice=500`

---

## In-Memory Data Structures

### 1. Browsing History
**File**: `flask-backend/routes/recommendations.py` (Lines 11-13)

```python
# Format: {user_id or session_id: [(product_id, timestamp), ...]}
browsing_history = {}
```

**Data Structure**: Nested Dictionary with List of Tuples

**Structure**:
```python
{
  "user_123": [
    ("product-1", "2025-11-30T10:30:00"),
    ("product-5", "2025-11-30T10:25:00"),
    ("product-3", "2025-11-30T10:20:00")
  ],
  "session_abc": [
    ("product-2", "2025-11-30T10:15:00"),
    ("product-4", "2025-11-30T10:10:00")
  ]
}
```

**Why This Structure**:

#### Dictionary for User Lookup
- ✅ **O(1) access**: Instant lookup by user/session ID
- ✅ **Memory efficient**: Only stores IDs, not full products
- ✅ **Fast insertion**: Append to list is O(1)

#### List of Tuples for History
```python
browsing_history[key] = [(product_id, timestamp)] + [
    (pid, ts) for pid, ts in browsing_history[key] if pid != product_id
][:50]
```
- ✅ **Chronological order**: Most recent first
- ✅ **No duplicates**: Filter removes existing product before adding
- ✅ **Limited size**: Keep only 50 most recent (prevents memory bloat)
- ✅ **Tuple immutability**: (product_id, timestamp) can't be modified

**Why In-Memory Instead of Database**:
- ✅ **Speed**: No database I/O for every page view
- ✅ **High frequency**: Product views happen very often
- ✅ **Temporary data**: Don't need to persist long-term
- ✅ **Easy to clear**: Restart server clears all history
- ❌ **Lost on restart**: But that's acceptable for browsing history
- ❌ **Not shared across servers**: Would need Redis in production

**Production Alternative**:
```python
# Use Redis with expiring keys
redis.lpush(f"history:{user_id}", product_id)
redis.ltrim(f"history:{user_id}", 0, 49)  # Keep 50
redis.expire(f"history:{user_id}", 86400)  # 24 hours
```

---

### 2. Search Query Cache
**File**: `client/src/pages/search.tsx` (Lines 31-56)

```typescript
const { data: products = [], isLoading, error } = useQuery<Product[]>({
  queryKey: ['search-products', searchQuery],
  queryFn: async () => {
    const url = `/api/products?search=${encodeURIComponent(searchQuery)}`;
    const response = await fetch(url);
    return response.json();
  },
  enabled: !!searchQuery,
  staleTime: 10000,  // 10 seconds
});
```

**Data Structure**: React Query Cache with String Key

**Why This Structure**:
- ✅ **Debounced caching**: Same search within 10s uses cache
- ✅ **Memory efficient**: Old searches garbage collected
- ✅ **Conditional execution**: `enabled: !!searchQuery` prevents empty searches
- ✅ **Automatic deduplication**: Multiple components can use same query

**Example Cache State**:
```javascript
{
  'search-products': {
    'iphone': { data: [...], dataUpdatedAt: 1701345678 },
    'samsung': { data: [...], dataUpdatedAt: 1701345690 },
    'laptop': { data: [...], dataUpdatedAt: 1701345702 }
  }
}
```

---

## Browser Storage Structures

### 1. localStorage - Authentication Token
**File**: `client/src/hooks/use-auth.tsx` (Lines 27-82)

```typescript
// Store token
localStorage.setItem('token', newToken);

// Retrieve token
const storedToken = localStorage.getItem('token');

// Remove token
localStorage.removeItem('token');
```

**Data Structure**: Simple String Key-Value

**Why localStorage**:
- ✅ **Persists across sessions**: User stays logged in after browser close
- ✅ **Synchronous access**: No async needed
- ✅ **5-10MB storage**: More than enough for JWT token
- ✅ **Domain-scoped**: Can't be accessed by other sites
- ❌ **XSS vulnerable**: Malicious scripts can read
- ✅ **But**: Content Security Policy mitigates risk

**Why Not Cookies**:
- ❌ **Sent with every request**: Increases bandwidth
- ❌ **Size limit**: 4KB max
- ✅ **localStorage**: Only sent when explicitly requested

**Security Note**:
```typescript
// Token is JWT (JSON Web Token)
// Format: "eyJhbGciOiJIUzI1NiIs...".base64encoded
// Contains: user_id, expiration, signature
// Cannot be modified without invalidating signature
```

---

### 2. localStorage - Guest Session ID
**File**: `client/src/hooks/use-cart.ts` (Lines 6-13)

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

**Data Structure**: Generated String with Timestamp + Random

**Format**: `"guest-1701345678-k3j2h9f4a"`

**Why This Structure**:
- ✅ **Unique per browser**: Timestamp + random prevents collisions
- ✅ **Persistent**: Survives page refreshes and browser restarts
- ✅ **Guest cart tracking**: Associates cart with anonymous user
- ✅ **Prefix "guest-"**: Easy to identify guest vs user sessions

**Why Not sessionStorage**:
- ❌ **Lost on tab close**: Cart would disappear
- ✅ **localStorage**: Cart persists across visits

---

### 3. sessionStorage - Checkout Customer Info
**File**: `client/src/components/shopping-cart.tsx` (Line 29)

```typescript
sessionStorage.setItem('checkoutCustomer', JSON.stringify(customer));
```

**Retrieved**: `client/src/pages/checkout.tsx` (Lines 75-84)
```typescript
const raw = sessionStorage.getItem('checkoutCustomer');
if (raw) {
  const data = JSON.parse(raw);
  setCustomer({
    name: data.name || '',
    email: data.email || '',
    address: data.address || ''
  });
  sessionStorage.removeItem('checkoutCustomer');
}
```

**Data Structure**: JSON String

**Stored Object**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "address": "123 Main St, City, State 12345"
}
```

**Why sessionStorage**:
- ✅ **Temporary data**: Only needed during checkout flow
- ✅ **Tab-scoped**: Each tab has independent checkout
- ✅ **Auto-cleared on tab close**: No data left behind
- ✅ **Privacy**: Shipping info not stored permanently
- ✅ **Remove after use**: Explicitly deleted after reading

**Why Not localStorage**:
- ❌ **Security risk**: Personal info shouldn't persist
- ❌ **Stale data**: Old addresses could cause errors

---

## Why These Structures Were Chosen

### Design Principles

#### 1. **Simplicity First**
```python
# Simple: Store address as JSON
shipping_address = db.Column(db.JSON)

# vs Complex: Separate tables
class Address(db.Model):
    street = db.Column(db.String)
    city = db.Column(db.String)
    state = db.Column(db.String)
    # ... more tables, joins, migrations
```
- ✅ TechBazaar chose JSON: Simpler, faster development
- ✅ Trade-off accepted: Can't query by city (not needed)

#### 2. **Performance Where It Matters**
```python
# Fast: In-memory browsing history
browsing_history = {}  # O(1) lookup

# vs Slow: Database query for every view
db.query(BrowsingHistory).filter_by(user_id=user_id).all()
```
- ✅ In-memory for high-frequency operations
- ✅ Database for important persistent data

#### 3. **Data Integrity**
```python
# Foreign keys ensure consistency
product_id = db.Column(db.String(64), db.ForeignKey('products.id'))
```
- ✅ Can't add cart item for non-existent product
- ✅ Database enforces referential integrity

#### 4. **Flexibility**
```python
# JSON allows flexible schemas
specifications = db.Column(db.Text)  # Can be any JSON structure
```
- ✅ Each product type can have different specs
- ✅ No schema migrations when adding new fields

#### 5. **User Experience**
```typescript
// Optimistic updates for instant feedback
queryClient.setQueryData(['/api/cart'], (old) => [...old, newItem]);
// UI updates immediately, syncs to server in background
```
- ✅ App feels fast and responsive
- ✅ Users don't wait for server roundtrips

---

### Specific Use Case Justifications

#### Why In-Memory for Browsing History?
**Decision**: `browsing_history = {}` (Python dict)

**Alternatives Considered**:
1. ❌ **Database table**: Too slow for high-frequency writes
2. ❌ **Redis**: Adds infrastructure complexity
3. ✅ **In-memory dict**: Perfect for MVP and small-medium traffic

**When to Change**:
- Traffic > 10,000 concurrent users
- Need cross-server synchronization
- Want persistent analytics

**Then switch to**: Redis with sorted sets
```python
redis.zadd(f"history:{user_id}", {product_id: timestamp})
redis.zrange(f"history:{user_id}", 0, 49, desc=True)
```

---

#### Why React Query for State Management?
**Decision**: Use React Query instead of Redux/Context

**Alternatives Considered**:
1. ❌ **Redux**: Too much boilerplate for simple data fetching
2. ❌ **Context API**: No caching, refetches on every render
3. ✅ **React Query**: Perfect fit for server state

**Benefits**:
```typescript
// Automatic caching
const { data: products } = useQuery(['/api/products'], fetchProducts);
// Second component using same query uses cache, no second fetch

// Automatic background updates
refetchInterval: 60000  // Refresh every minute

// Optimistic updates
mutate({ id, quantity }, {
  onMutate: (vars) => {
    // Update UI immediately
    queryClient.setQueryData(['cart'], newData);
  }
});
```

---

#### Why Denormalize Order Items?
**Decision**: Store complete order details in JSON

**Normalized Alternative**:
```python
class OrderItem(db.Model):
    order_id = db.Column(db.ForeignKey('orders.id'))
    product_id = db.Column(db.ForeignKey('products.id'))
    quantity = db.Column(db.Integer)
    price_at_purchase = db.Column(db.Float)
```

**Why Denormalized Won**:
- ✅ **Immutability**: Orders never change after creation
- ✅ **Historical accuracy**: Preserves exact state at purchase time
- ✅ **Query performance**: Single query for full order
- ✅ **Product independence**: Order stays valid even if product deleted
- ✅ **Simple reporting**: No complex joins for order analysis

**When Normalized is Better**:
- Mutable data (products can change)
- Need to query by order item properties
- Real-time inventory tracking across orders

---

#### Why String IDs for Products?
**Decision**: `id = db.Column(db.String(64))`

**Alternative**: `id = db.Column(db.Integer, autoincrement=True)`

**String ID Benefits**:
```python
# Meaningful IDs
Product(id='iphone-15-pro-256gb')
Product(id='samsung-galaxy-s24-ultra')

# vs Meaningless integers
Product(id=47)
Product(id=103)
```

**Trade-offs**:
- ✅ **Readability**: URLs like `/product/iphone-15-pro` vs `/product/47`
- ✅ **Import/Export**: Easy to sync with external systems
- ✅ **Debugging**: Logs show "iphone-15-pro" instead of cryptic numbers
- ❌ **Join performance**: String comparison slower than integer
- ✅ **But**: Negligible for <100k products

**When to Use Integer IDs**:
- Very large datasets (>1M rows)
- Frequent complex joins
- Auto-increment needed

---

## Performance Analysis

### Time Complexity Summary

| Operation | Data Structure | Complexity | Why |
|-----------|---------------|------------|-----|
| Get user cart | Dict lookup + DB query | O(1) + O(n) | Dict lookup for session, query returns all items |
| Add to cart | Insert into DB | O(1) | Single row insert |
| Search products | DB query with LIKE | O(n) | Full table scan, can add FULLTEXT index |
| Get browsing history | Dict lookup + slice | O(1) + O(k) | Dict lookup, slice first 50 items |
| Filter products | DB query with WHERE | O(n) | Table scan with filters |
| Get recommendations | Multiple DB queries | O(n+m+k) | Category query + history query + popular query |

### Space Complexity Summary

| Data Structure | Space | Growth Rate | Cleanup Strategy |
|---------------|-------|-------------|------------------|
| Products table | O(n) | Linear with products | Manual deletion |
| Cart items | O(u*p) | Users × Products per cart | Delete after checkout |
| Orders | O(o) | Linear with orders | Permanent storage |
| Browsing history | O(u*50) | Users × 50 items | Auto-limit to 50 per user |
| React Query cache | O(q) | Number of queries | Auto garbage collection |
| localStorage | O(1) | Fixed (token + session ID) | Manual clear on logout |

---

## Code Reference Index

### Backend Files

#### Database Models
- **All models**: `flask-backend/models.py`
  - User model: Lines 6-26
  - Product model: Lines 29-61
  - CartItem model: Lines 64-79
  - Order model: Lines 82-113
  - Rating model: Lines 116-137

#### API Routes
- **Products**: `flask-backend/routes/products.py`
  - List products: Lines 60-114
  - Search implementation: Lines 98-119
  - Product filters: Lines 67-97
  - Create product: Lines 145-204
  - Update product: Lines 207-245
  - Delete product: Lines 248-263

- **Cart**: `flask-backend/routes/cart.py`
  - Get cart: Lines 10-30
  - Add to cart: Lines 33-70
  - Update cart item: Lines 73-100
  - Remove from cart: Lines 103-125
  - Transfer cart: Lines 128-155

- **Orders**: `flask-backend/routes/orders.py`
  - Create order: Lines 10-85
  - List orders: Lines 88-105
  - Update order status: Lines 108-135

- **Recommendations**: `flask-backend/routes/recommendations.py`
  - Browsing history dict: Line 13
  - Add to history: Lines 16-42
  - Get history: Lines 45-68
  - Get recommendations: Lines 71-131

- **Authentication**: `flask-backend/routes/auth.py`
  - Register: Lines 23-50
  - Login: Lines 53-75
  - Get user: Lines 78-86

### Frontend Files

#### Hooks & State Management
- **Cart hook**: `client/src/hooks/use-cart.ts`
  - Session ID generation: Lines 6-13
  - Cart query: Lines 24-44
  - Login transfer: Lines 62-120
  - Add to cart: Lines 122-145
  - Update quantity: Lines 147-170
  - Remove from cart: Lines 172-195

- **Auth hook**: `client/src/hooks/use-auth.tsx`
  - Token storage: Lines 27-82
  - Login: Lines 85-110
  - Logout: Lines 113-135
  - Register: Lines 138-165

#### Components
- **Browsing History**: `client/src/components/browsing-history.tsx`
  - Token retrieval: Line 7
  - History query: Lines 9-20

- **Shopping Cart**: `client/src/components/shopping-cart.tsx`
  - sessionStorage save: Line 29
  - Cart display: Lines 13-204

- **Product Card**: `client/src/components/product-card.tsx`
  - Product display: Lines 1-80

#### Pages
- **Home**: `client/src/pages/home.tsx`
  - Filter state: Line 13
  - URL parsing: Lines 15-28
  - Products query: Lines 30-49
  - Filter construction: Lines 32-39

- **Search**: `client/src/pages/search.tsx`
  - Search query: Lines 12-28
  - Search API call: Lines 31-56
  - Sort logic: Lines 58-69

- **Product Detail**: `client/src/pages/product-detail.tsx`
  - Product query: Lines 15-25
  - Add to history: Lines 29-45
  - Token access: Line 34

- **Checkout**: `client/src/pages/checkout.tsx`
  - sessionStorage retrieve: Lines 75-84
  - Guest session ID: Lines 116-118
  - Order creation: Lines 90-150

#### Type Definitions
- **TypeScript types**: `client/src/lib/types.ts`
  - Product interface: Lines 1-10
  - ProductFilters: Lines 14-21
  - CartItemWithProduct: Line 12
  - AdminStats: Lines 23-28

- **Shared schema**: `shared/schema.ts`
  - Database schema types: Lines 1-76

### Configuration Files
- **Query Client**: `client/src/lib/queryClient.ts`
  - Cache configuration: Lines 3-11

- **Database**: `flask-backend/extensions.py`
  - SQLAlchemy setup: Lines 1-5

- **App initialization**: `flask-backend/app.py`
  - Database initialization: Lines 15-25
  - Route registration: Lines 27-35

---

## Summary

### Key Takeaways

1. **Hybrid Storage Strategy**
   - Database (SQLite): Persistent, important data
   - In-memory (Python dicts): High-frequency, temporary data
   - Browser storage: Client-side persistence
   - React Query: Smart caching layer

2. **Trade-offs Made**
   - ✅ Simplicity over premature optimization
   - ✅ Developer experience over perfect normalization
   - ✅ User experience over theoretical purity
   - ✅ Fast development over scalability to billions

3. **When to Refactor**
   - **Users > 10,000**: Move browsing history to Redis
   - **Products > 100,000**: Add search indexes, consider Elasticsearch
   - **Orders > 1,000,000**: Partition by date, add data warehouse
   - **Multi-region**: Distributed database, CDN, caching layer

4. **Why These Structures Work**
   - ✅ **Right size**: Perfect for small-medium e-commerce
   - ✅ **Maintainable**: Easy to understand and modify
   - ✅ **Performant**: Fast enough for target scale
   - ✅ **Flexible**: Can evolve as needs change

---

**Document Version**: 1.0  
**Last Updated**: November 30, 2025  
**Author**: TechBazaar Development Team
