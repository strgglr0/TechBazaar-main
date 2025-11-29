# TechBazaar Data Structures & Algorithms Documentation

## 📚 Table of Contents
1. [Cart Management System](#1-cart-management-system)
2. [Order Processing Queue](#2-order-processing-queue)
3. [Product Recommendation System](#3-product-recommendation-system)
4. [Browsing History Tracking](#4-browsing-history-tracking)
5. [Analytics & Aggregation](#5-analytics--aggregation)
6. [Authentication & Session Management](#6-authentication--session-management)
7. [Database Relationships](#7-database-relationships)

---

## 1. Cart Management System

### Data Structure: **Relational Database Table + In-Memory Cache**

**Database Schema:**
```python
class CartItem(db.Model):
    id = String (UUID)
    user_id = Integer (Foreign Key to User) | NULL for guests
    session_id = String | NULL for authenticated users
    product_id = String (Foreign Key to Product)
    quantity = Integer
    product = Relationship (SQLAlchemy)
```

**Frontend Cache:**
```typescript
// React Query Cache with localStorage fallback
const cartItems: CartItemWithProduct[] = []
const guestSessionId: string = localStorage.getItem('guest-session-id')
```

### Why This Structure?

**✅ Advantages:**
1. **Dual Key System (user_id + session_id):**
   - Supports both authenticated users and guests
   - Guest carts persist across page refreshes via `session_id`
   - User carts persist across devices via `user_id`
   
2. **SQLAlchemy Relationship:**
   - `product = db.relationship('Product')` provides automatic JOIN
   - One query fetches cart items WITH product details
   - No N+1 query problem (efficient)
   
3. **React Query Cache:**
   - In-memory cache prevents unnecessary API calls
   - `staleTime: Infinity` - cart data doesn't go stale
   - `gcTime: Infinity` - cache never garbage collected
   - Instant UI updates via optimistic updates

4. **Session Persistence:**
   ```typescript
   const sessionId = localStorage.getItem('guest-session-id') || `guest-${Date.now()}-${random()}`
   ```
   - Survives browser refresh
   - Unique per browser/device
   - Can be transferred to user cart on login

**🎯 Use Case Flow:**
```
Guest → Add to Cart → session_id stored
     → Login → Transfer cart (session_id → user_id)
     → Logout → Switch back to guest cart (keep user cart in DB)
```

**Time Complexity:**
- Add item: O(1) - Direct insert
- Get cart: O(n) - One query with JOIN (n = cart items)
- Update quantity: O(1) - Direct update by ID
- Delete item: O(1) - Direct delete by ID

---

## 2. Order Processing Queue

### Data Structure: **Python queue.Queue (FIFO Queue)**

**Implementation:**
```python
class OrderProcessingQueue:
    processing_queue = queue.Queue()  # FIFO
    delivery_queue = queue.Queue()    # FIFO
    completed_orders = {}             # Hash Map (dict)
    worker_thread = Thread            # Background thread
```

### Why Queue Data Structure?

**✅ Advantages:**
1. **FIFO (First In, First Out):**
   - Orders processed in the order they're placed
   - Fair processing - no order skips ahead
   - Natural for order fulfillment workflow

2. **Thread-Safe:**
   - Python's `queue.Queue` is thread-safe by design
   - No race conditions with concurrent access
   - Multiple workers can safely access queue

3. **Two-Stage Pipeline:**
   ```
   processing_queue (24h) → delivery_queue (manual) → completed_orders
   ```
   - Clear separation of order stages
   - Easy to add more stages if needed
   - Each stage has different timing rules

4. **Background Worker Thread:**
   ```python
   def _process_orders(self):
       while self.running:
           item = self.processing_queue.get(timeout=1)
           if elapsed >= 86400:  # 24 hours
               move_to_delivery_queue(item)
   ```
   - Non-blocking for main application
   - Automatic status progression
   - Configurable timing intervals

**🎯 Status Flow:**
```
Order Created (COD) → processing_queue
                    → (after 24h) → delivery_queue
                    → (manual confirm) → completed_orders
```

**Time Complexity:**
- Enqueue (add_order): O(1)
- Dequeue (get order): O(1)
- Status check: O(n) - Linear scan of queue
- Get order by ID: O(n) - Could be improved with hash map

**Better Alternative (Future):**
```python
# Use Redis Queue + Hash Map for O(1) lookup
self.order_map = {}  # order_id -> {queue, position, timestamp}
```

---

## 3. Product Recommendation System

### Data Structure: **In-Memory Dictionary + SQL Database**

**Implementation:**
```python
browsing_history = {
    "user_123": [("product_1", "timestamp"), ("product_2", "timestamp")],
    "session_abc": [("product_3", "timestamp")]
}
```

### Why Dictionary (Hash Map)?

**✅ Advantages:**
1. **Fast Lookup - O(1):**
   - Instant access to user's browsing history
   - Key: user_id or session_id
   - Value: List of (product_id, timestamp) tuples

2. **List for Order Preservation:**
   ```python
   # Most recent first
   browsing_history[key] = [(new_product, now)] + existing_history[:49]
   ```
   - Maintains chronological order
   - Slice to keep last 50 items
   - O(1) prepend (list concatenation)

3. **Hybrid Approach:**
   - In-memory for speed (no DB queries)
   - SQL for product details (JOIN with Product table)
   ```python
   product_ids = [pid for pid, _ in history[:limit]]
   products = Product.query.filter(Product.id.in_(product_ids)).all()
   ```

**🎯 Recommendation Algorithm:**
```
Strategy 1: Similar Products (Same Category)
  → If viewing product X (category: Phones)
  → Recommend other products in "Phones"
  → Filter: in stock, exclude current product

Strategy 2: Based on Browsing History
  → Extract categories from user's history
  → Recommend products from those categories
  → Prioritize recently viewed categories

Strategy 3: Frequently Bought Together
  → Analyze order items (co-occurrence)
  → If product A bought with B, recommend B when viewing A
  → Uses order.items JSON array
```

**Time Complexity:**
- Add to history: O(1) - Dictionary insert
- Get history: O(k) - k = limit (default 10)
- Recommendations: O(n + m) - n = DB query, m = sorting

**Production Improvement:**
```python
# Use Redis with expiration
redis.zadd(f"history:{user_id}", {product_id: timestamp})
redis.zrevrange(f"history:{user_id}", 0, 49)  # Get last 50
redis.expire(f"history:{user_id}", 86400 * 30)  # 30 days
```

---

## 4. Browsing History Tracking

### Data Structure: **Dictionary → List of Tuples**

**Structure:**
```python
browsing_history = {
    "user_1": [
        ("product_123", "2025-11-29T10:00:00"),
        ("product_456", "2025-11-29T09:55:00"),
        ("product_789", "2025-11-29T09:50:00")
    ]
}
```

### Why List of Tuples?

**✅ Advantages:**
1. **Tuples are Immutable:**
   - `(product_id, timestamp)` cannot be modified
   - Prevents accidental data corruption
   - Hashable (can be used as dict keys if needed)

2. **Order Matters:**
   - List preserves insertion order
   - Most recent views at index 0
   - Easy to slice: `history[:10]` = last 10 views

3. **Automatic Deduplication:**
   ```python
   browsing_history[key] = [(product_id, timestamp)] + [
       (pid, ts) for pid, ts in browsing_history[key] if pid != product_id
   ]
   ```
   - Viewing same product moves it to front
   - No duplicate entries
   - List comprehension filters out old entry

4. **Limit Enforcement:**
   ```python
   browsing_history[key] = browsing_history[key][:50]
   ```
   - Slice keeps only last 50 items
   - Prevents unlimited growth
   - O(1) slice operation

**🎯 Usage Flow:**
```
User views product → POST /browsing-history
                   → Add to dictionary
                   → Move to front (dedupe)
                   → Limit to 50 items
                   
User requests history → GET /browsing-history
                      → Fetch product details (JOIN)
                      → Return with timestamps
```

**Time Complexity:**
- Add view: O(n) - List comprehension (n = history size, max 50)
- Get history: O(k + m) - k = limit, m = DB query
- Deduplication: O(n) - Linear scan

**Alternative (Better for Scale):**
```python
# Use Redis Sorted Set (ZADD with timestamp as score)
redis.zadd(f"views:{user_id}", {product_id: timestamp})
redis.zrevrange(f"views:{user_id}", 0, 49)  # O(log n + k)
```

---

## 5. Analytics & Aggregation

### Data Structure: **Dictionary (Hash Map) for Aggregation**

**Implementation:**
```python
# Aggregate sales by category
category_sales = {}  # {category: sales_count}

for order in all_orders:
    for item in order.items:
        category = item.get('category', 'Other')
        category_sales[category] = category_sales.get(category, 0) + item['quantity']
```

### Why Hash Map for Aggregation?

**✅ Advantages:**
1. **O(1) Accumulation:**
   - Each item lookup/update is instant
   - No need to search for category
   - Perfect for counting/summing

2. **Dynamic Keys:**
   - Categories discovered at runtime
   - No need to predefine all categories
   - Handles new categories automatically

3. **Single Pass:**
   ```python
   for order in orders:          # O(n)
       for item in order.items:  # O(m)
           category_sales[cat] += qty  # O(1)
   ```
   - Total: O(n * m) - n orders, m items per order
   - Only one iteration needed
   - Result immediately available

4. **Easy Sorting:**
   ```python
   sorted_categories = sorted(
       category_sales.items(), 
       key=lambda x: x[1],  # Sort by sales count
       reverse=True
   )
   ```

**🎯 Analytics Metrics:**

| Metric | Data Structure | Why |
|--------|---------------|-----|
| Total Revenue | `db.session.query(func.sum(Order.total))` | SQL aggregate - efficient |
| Top Products | `dict` → sorted list | Hash map accumulation |
| Sales by Category | `dict` → chart data | Group by category |
| Monthly Revenue | `list` of dicts | Time-series data |
| Product Sales Count | `dict` accumulation | Count occurrences |

**Time Complexity:**
- Aggregate all orders: O(n * m) - n orders, m items
- Sort results: O(k log k) - k = unique categories/products
- Total: O(n * m + k log k)

**Alternative (Better for Real-time):**
```python
# Maintain running totals in database
class CategoryStats(db.Model):
    category = String
    total_sales = Integer
    total_revenue = Float
    last_updated = DateTime

# Update on each order (O(1))
# Query for analytics (O(1))
```

---

## 6. Authentication & Session Management

### Data Structure: **Browser Storage + JWT Token**

**Frontend Storage:**
```typescript
// localStorage - Persistent across sessions
localStorage.setItem('token', jwt_token)
localStorage.setItem('guest-session-id', session_id)

// sessionStorage - Cleared on browser close
sessionStorage.setItem('checkoutCustomer', customer_data)
```

### Why localStorage + sessionStorage?

**✅ localStorage Advantages:**
1. **Persistent Storage:**
   - Survives browser close/reopen
   - Perfect for authentication tokens
   - Guest session IDs remain intact

2. **Synchronous Access:**
   - `localStorage.getItem('token')` - Instant, no async
   - No network latency
   - Available before React hydration

3. **Cross-Tab Communication:**
   ```typescript
   window.addEventListener('storage', (e) => {
       if (e.key === 'token') {
           // Token changed in another tab
           syncAuthState()
       }
   })
   ```

**✅ sessionStorage Advantages:**
1. **Temporary Data:**
   - Checkout form data (`checkoutCustomer`)
   - Cleared on tab close
   - More secure than localStorage for sensitive data

2. **Isolated Per Tab:**
   - Different tabs = different sessionStorage
   - Prevents data leakage between tabs

**🎯 Authentication Flow:**
```
Login → JWT Token → localStorage
     → API calls include: Authorization: Bearer {token}
     → Token validated on backend
     → Returns user data

Logout → Remove from localStorage
      → Dispatch 'auth:logout' event
      → Clear React Query cache
      → Redirect to login
```

**JWT Token Structure:**
```python
jwt.encode({
    'user_id': 123,
    'email': 'user@example.com',
    'exp': datetime.utcnow() + timedelta(days=7)
}, SECRET_KEY)
```

### Guest Session Management

**Structure:**
```typescript
const sessionId = `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
// Example: guest-1732867200000-k3j5h2p9q
```

**Why This Format?**
1. **Timestamp:** Sortable, identifies creation time
2. **Random String:** Prevents collisions
3. **Prefix:** Easy to identify guest vs user sessions

**Time Complexity:**
- Store in localStorage: O(1)
- Retrieve: O(1)
- Token validation: O(1) - JWT decode

---

## 7. Database Relationships

### Data Structure: **Relational Database (SQLite/PostgreSQL)**

**Schema Diagram:**
```
User (1) ←──── (*) Order
  ↑                  ↑
  │                  │
  │ (*)          (*) │
CartItem         OrderItems (JSON)
  ↓                  
  │ (1)
Product (1) ←──── (*) Rating
```

### Why Relational Database?

**✅ Advantages:**

1. **Foreign Keys - Data Integrity:**
   ```python
   user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
   ```
   - Cannot create cart item without valid user
   - Cannot delete user with existing orders (or CASCADE)
   - Database enforces relationships

2. **Joins - Efficient Queries:**
   ```python
   CartItem.query.join(Product).filter(CartItem.user_id == user_id).all()
   ```
   - One query fetches cart with product details
   - No N+1 problem
   - Database optimizes JOIN execution

3. **ACID Properties:**
   - **Atomicity:** Rating + product update in one transaction
   - **Consistency:** Foreign keys maintain referential integrity
   - **Isolation:** Concurrent users don't interfere
   - **Durability:** Data persists after commit

4. **Complex Queries:**
   ```sql
   SELECT category, SUM(quantity) 
   FROM orders o
   JOIN order_items oi ON o.id = oi.order_id
   GROUP BY category
   ORDER BY SUM(quantity) DESC
   ```

### JSON vs. Separate Table: Order Items

**Current: JSON Array**
```python
items = db.Column(db.JSON, nullable=False)
# [{"productId": "1", "name": "iPhone", "quantity": 2, "price": "999"}]
```

**✅ Why JSON for Order Items?**
1. **Snapshot in Time:**
   - Product price/name may change
   - Order must reflect price at purchase time
   - JSON preserves historical data

2. **Flexible Schema:**
   - Can add fields without migration
   - Different order types, different fields
   - Easy to extend

3. **Single Query:**
   - Order + all items in one fetch
   - No JOIN needed
   - Faster reads

**❌ Tradeoff:**
- Cannot JOIN on order items
- Must parse JSON in application
- Harder to aggregate (need application code)

**Alternative (Normalized):**
```python
class OrderItem(db.Model):
    order_id = ForeignKey
    product_id = ForeignKey
    quantity = Integer
    price_at_purchase = Decimal
```
- Better for analytics
- Can JOIN with Product
- Requires migration for schema changes

---

## 📊 Performance Comparison Table

| Operation | Data Structure | Time Complexity | Space | Best For |
|-----------|---------------|-----------------|-------|----------|
| Cart lookup | Dictionary (user_id key) | O(1) | O(n) | Fast access |
| Order queue | FIFO Queue | O(1) enqueue/dequeue | O(n) | Sequential processing |
| Browsing history | Dict → List | O(n) add, O(1) access | O(n) | Recent items |
| Recommendations | In-memory Dict + SQL | O(n + k log k) | O(n) | Fast reads |
| Analytics aggregation | Dictionary | O(n*m) | O(k) | Grouping/counting |
| Product search | SQL B-tree index | O(log n) | O(n) | Range queries |
| Session storage | Browser localStorage | O(1) | 5-10 MB | Client-side cache |

**Legend:**
- n = number of items
- m = items per container
- k = unique groups/categories

---

## 🚀 Optimization Recommendations

### Current State vs. Production-Ready

| Feature | Current | Production | Reason |
|---------|---------|-----------|--------|
| Browsing History | In-memory dict | Redis Sorted Set | Survives server restart, distributed |
| Order Queue | Python Queue | RabbitMQ/Celery | Persistent, scalable, distributed |
| Cart Cache | React Query | React Query + Redis | Share cache across servers |
| Analytics | On-demand calc | Pre-aggregated tables | Faster dashboard load |
| Session Storage | localStorage | localStorage + httpOnly cookies | More secure tokens |

### When to Scale

**In-Memory Dict → Redis:**
- When: Multiple server instances (load balancer)
- Why: Shared state across servers

**Python Queue → Message Queue:**
- When: > 1000 orders/day
- Why: Persistent, survives crashes, better monitoring

**JSON Order Items → Separate Table:**
- When: Complex order analytics needed
- Why: SQL aggregation is faster than JSON parsing

---

## 🎯 Key Takeaways

1. **Cart: Dual-key system (user + session)** enables guest carts and seamless login experience
2. **Queue: FIFO ensures fair order processing** with clear stage separation
3. **History: Dict → List maintains order** and enables fast recommendations
4. **Analytics: Hash map aggregation** provides O(1) accumulation for counts/sums
5. **Storage: localStorage for persistence**, sessionStorage for temporary data
6. **Database: Relational model with JSON** balances normalization and flexibility

**Each data structure was chosen for specific properties that align with the feature's requirements!** 🎉
