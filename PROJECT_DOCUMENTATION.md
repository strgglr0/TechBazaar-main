# TechBazaar - Complete Project Documentation

## 📋 Table of Contents
1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [Data Flow Architecture](#data-flow-architecture)
4. [Data Structures Used](#data-structures-used)
5. [Backend Architecture Guide](#backend-architecture-guide)
6. [Frontend Architecture Guide](#frontend-architecture-guide)
7. [FAQs](#faqs)

---

## 🎯 System Overview

**TechBazaar** is a full-stack e-commerce platform for electronics and gadgets with comprehensive order management, admin analytics, and automated refund processing.

### Key Features
- 🛒 **Shopping System**: Browse products, add to cart, checkout with multiple payment methods
- 👤 **User Management**: Authentication, profile management, order history
- 📦 **Order Processing**: Automated order queue with status progression
- 💰 **Refund System**: User-initiated refunds with automatic processing
- 📊 **Admin Dashboard**: Order management, analytics, product management
- 🔐 **Authentication**: JWT-based secure authentication
- 📧 **Email Notifications**: Order confirmations and updates

---

## 🛠️ Technology Stack

### **Frontend**
| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.x | UI framework |
| **TypeScript** | 5.x | Type-safe JavaScript |
| **Vite** | 5.x | Build tool & dev server |
| **TanStack Query** | 5.x | Data fetching & caching |
| **Wouter** | 3.x | Lightweight routing |
| **Tailwind CSS** | 3.x | Utility-first styling |
| **shadcn/ui** | Latest | Component library |
| **Lucide React** | Latest | Icon library |

### **Backend**
| Technology | Version | Purpose |
|------------|---------|---------|
| **Flask** | 3.x | Python web framework |
| **SQLAlchemy** | 2.x | ORM for database |
| **SQLite** | 3.x | Database |
| **Flask-CORS** | 4.x | Cross-origin support |
| **PyJWT** | 2.x | JWT authentication |
| **Werkzeug** | 3.x | Password hashing |

### **Development Tools**
- **npm** - Package management
- **Python venv** - Virtual environment
- **Git** - Version control
- **VS Code** - IDE with dev container support

---

## 🔄 Data Flow Architecture

### **1. User Authentication Flow**
```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │ 1. POST /api/auth/login
       │    {email, password}
       ↓
┌─────────────────┐
│  Auth Routes    │
│  (auth.py)      │
└──────┬──────────┘
       │ 2. Verify credentials
       │    Hash comparison
       ↓
┌─────────────────┐
│   User Model    │
│  (models.py)    │
└──────┬──────────┘
       │ 3. Generate JWT token
       │    PyJWT.encode()
       ↓
┌─────────────────┐
│  localStorage   │ ← 4. Store token
│   (Frontend)    │
└─────────────────┘
```

### **2. Product Browsing Flow**
```
User → Home Page → GET /api/products?filters
                     ↓
              Products Routes (products.py)
                     ↓
              Product Model Query
                     ↓
              JSON Response → Display Product Cards
```

### **3. Shopping Cart Flow**
```
Add to Cart → POST /api/cart/items
                ↓
         CartItem Model
                ↓
         Session/User Association
                ↓
         GET /api/cart → Display Cart
                ↓
         Update Quantity → PUT /api/cart/items/:id
                ↓
         Remove Item → DELETE /api/cart/items/:id
```

### **4. Checkout & Order Processing Flow**
```
┌──────────────┐
│  Checkout    │
│   (User)     │
└──────┬───────┘
       │ POST /api/orders/checkout
       │ {customerInfo, paymentMethod, items}
       ↓
┌──────────────────────────┐
│  Orders Routes           │
│  (orders.py)             │
│  - Validate items        │
│  - Calculate total       │
│  - Create Order          │
│  - Status: pending_payment│
└──────┬───────────────────┘
       │
       ├─── Payment Method = COD ───┐
       │                             │
       └─── Payment Method = Online ─┤
                                     ↓
                        ┌────────────────────┐
                        │  Order Created     │
                        │  Status: pending_  │
                        │  payment           │
                        └─────┬──────────────┘
                              │
                Admin Confirms Payment
                              ↓
                ┌────────────────────────┐
                │ Status → processing    │
                │ Added to Order Queue   │
                └─────┬──────────────────┘
                      │
                      ↓
        ┌──────────────────────────────┐
        │   Order Queue System         │
        │   (order_queue.py)           │
        │   - FIFO Queue Processing    │
        │   - 24h intervals            │
        └──────┬───────────────────────┘
               │
    processing → shipped → delivered
               │             │
               │             ↓
               │    User Confirms Receipt
               │             ↓
               └────────→ received → completed
```

### **5. Refund Processing Flow**
```
User Requests Refund → POST /api/orders/:id/request-refund
                              ↓
                       Status: refund_requested
                              ↓
                       Automatic Processing
                              ↓
                       Status: refunded
                       refund_amount saved
                              ↓
            User Confirms Receipt → Status: completed
```

### **6. Admin Analytics Flow**
```
Admin Dashboard → GET /api/analytics/overview
                        ↓
                  Aggregate Queries
                  - Total Revenue
                  - Order Counts
                  - Top Products
                  - Status Distribution
                        ↓
                  Real-time Charts & Metrics
```

---

## 📊 Data Structures Used

### **1. Arrays (Lists)**
**Purpose**: Store collections of items
**Usage Examples**:
```python
# Backend - Product filtering
products = Product.query.filter_by(category='phones').all()  # Returns list

# Frontend - Cart items
const cartItems = [
  {id: '1', name: 'iPhone', quantity: 2, price: 999},
  {id: '2', name: 'MacBook', quantity: 1, price: 2499}
]
```
**Complexity**: O(n) search, O(1) append

---

### **2. Hash Tables (Dictionaries/Objects)**
**Purpose**: Fast key-value lookups
**Usage Examples**:
```python
# Backend - User session data
session_data = {
    'user_id': 123,
    'email': 'user@example.com',
    'cart_count': 5
}

# Frontend - Product specifications
specifications = {
    'brand': 'Apple',
    'storage': '256GB',
    'color': 'Silver'
}
```
**Complexity**: O(1) average lookup/insert

---

### **3. Queues (FIFO)**
**Purpose**: Order processing system
**Implementation**: Python `queue.Queue()`
```python
# Backend - Order Queue System (order_queue.py)
class OrderQueue:
    def __init__(self):
        self.processing_queue = Queue()  # FIFO queue
        self.delivery_queue = Queue()
    
    def add_order(self, order_id):
        self.processing_queue.put({
            'order_id': order_id,
            'status': 'processing',
            'queued_at': datetime.utcnow()
        })
```
**Complexity**: O(1) enqueue/dequeue

**Queue Flow**:
```
processing_queue → (24h) → delivery_queue → (user confirm) → completed
```

---

### **4. Stacks (Implicit)**
**Purpose**: Navigation history, undo operations
**Usage Examples**:
```javascript
// Frontend - Browser history (Wouter routing)
// Uses browser's history stack
history.push('/checkout')  // Push new page
history.back()             // Pop to previous page

// Function call stack (implicit)
checkoutMutation.mutate() 
  → apiRequest()
    → fetch()
      → Backend
```

---

### **5. Trees (Nested Structures)**
**Purpose**: Component hierarchy, nested data
**Usage Examples**:
```javascript
// Frontend - React Component Tree
<App>
  <Header>
    <ShoppingCart />
  </Header>
  <Home>
    <ProductFilters />
    <ProductCard />
    <ProductCard />
  </Home>
  <Footer />
</App>

// Backend - JSON nested data
order.shipping_address = {
    'street': '123 Main St',
    'city': 'New York',
    'country': 'USA'
}
```

---

### **6. Primitives & JSON**
**Purpose**: Data storage and transfer
```python
# Order model uses JSON for flexible data
class Order(db.Model):
    items = db.Column(db.JSON)  # Array of cart items
    shipping_address = db.Column(db.JSON)  # Nested object
```

---

## 🏗️ Backend Architecture Guide

### **Memory Aid: "RMRAEQ" (Rum Rare Queue)**

**R** - **Routes** (Entry points)
**M** - **Models** (Database schemas)
**R** - **Routes Logic** (Business logic)
**A** - **Authentication** (Security layer)
**E** - **Extensions** (Database & tools)
**Q** - **Queue** (Order processing)

---

### **File Structure Breakdown**

```
flask-backend/
├── app.py                    # 🚀 Application factory & server setup
├── models.py                 # 📊 Database models (User, Product, Order, CartItem)
├── extensions.py             # 🔌 SQLAlchemy & Migrate setup
├── order_queue.py           # ⏱️ Background order processing queue
├── email_service.py         # 📧 Email notification system
├── utils.py                 # 🛠️ Helper functions & decorators
├── routes/
│   ├── auth.py              # 🔐 Login, signup, logout
│   ├── products.py          # 🛍️ Product CRUD & search
│   ├── cart.py              # 🛒 Cart management
│   ├── orders.py            # 📦 Order checkout & management
│   ├── profile.py           # 👤 User profile & order history
│   ├── admin.py             # 👨‍💼 Admin operations
│   ├── analytics.py         # 📈 Dashboard analytics
│   └── recommendations.py   # 🎯 Product recommendations
└── instance/
    └── data.db              # 💾 SQLite database file
```

---

### **Backend Memory Guide: "PAMORE"**

#### **P - Products** (products.py)
```python
GET    /api/products          # List all products with filters
GET    /api/products/:id      # Get single product
POST   /api/products          # Create product (admin)
PUT    /api/products/:id      # Update product (admin)
DELETE /api/products/:id      # Delete product (admin)
```
**Memory Tip**: "Products are the foundation - they come first"

---

#### **A - Authentication** (auth.py)
```python
POST   /api/auth/signup       # Register new user
POST   /api/auth/login        # Login & get JWT token
POST   /api/auth/logout       # Logout
GET    /api/auth/me           # Get current user info
```
**Memory Tip**: "Auth protects everything - it's the gatekeeper"

---

#### **M - My Cart** (cart.py)
```python
GET    /api/cart              # Get cart items
POST   /api/cart/items        # Add item to cart
PUT    /api/cart/items/:id    # Update quantity
DELETE /api/cart/items/:id    # Remove from cart
DELETE /api/cart              # Clear entire cart
```
**Memory Tip**: "My cart holds items before checkout"

---

#### **O - Orders** (orders.py)
```python
POST   /api/orders/checkout               # Create order
GET    /api/orders                        # Get all orders (admin)
GET    /api/orders/:id                    # Get single order
PUT    /api/orders/:id/status             # Update status (admin)
POST   /api/orders/:id/cancel             # Cancel order (user)
POST   /api/orders/:id/request-refund     # Request refund (user)
POST   /api/orders/:id/refund             # Process refund (admin)
POST   /api/orders/:id/confirm-receipt    # Confirm delivery (user)
POST   /api/orders/:id/confirm-refund     # Confirm refund received (user)
```
**Memory Tip**: "Orders are the core business transaction"

---

#### **R - Recommendations & Reports** (recommendations.py, analytics.py)
```python
# Recommendations
GET    /api/recommendations/browsing-history   # Personalized suggestions

# Analytics
GET    /api/analytics/overview    # Dashboard metrics
GET    /api/analytics/revenue     # Revenue trends
GET    /api/analytics/products    # Product performance
```
**Memory Tip**: "Reports help make data-driven decisions"

---

#### **E - Everything User** (profile.py)
```python
GET    /api/user/profile         # Get user profile
PUT    /api/user/profile         # Update profile
GET    /api/user/orders          # User's order history
```
**Memory Tip**: "Everything about the user in one place"

---

### **Database Models Memory Aid: "UPOC"**

#### **U - User**
```python
class User(db.Model):
    id, email, password_hash, name, phone, address, is_admin, created_at
```
**Fields to Remember**: Email (unique), password_hash (never plain), is_admin (boolean)

---

#### **P - Product**
```python
class Product(db.Model):
    id, name, description, price, category, brand, sku, 
    imageUrl, specifications, stock_quantity, is_active
```
**Fields to Remember**: Price (decimal), stock_quantity (integer), specifications (JSON)

---

#### **O - Order**
```python
class Order(db.Model):
    id, user_id, customer_name, customer_email, customer_phone,
    shipping_address (JSON), items (JSON), total, payment_method,
    status, refunded_at, refund_amount, created_at
```
**Fields to Remember**: 
- `status`: pending_payment → processing → shipped → delivered → received → completed
- `items`: JSON array of cart items
- `payment_method`: 'cod' or 'online'

---

#### **C - CartItem**
```python
class CartItem(db.Model):
    id, session_id, user_id, product_id, quantity, added_at
```
**Fields to Remember**: Either session_id (guest) OR user_id (logged in)

---

### **Authentication Flow (Token-Based)**

```python
# 1. User Login
@auth_bp.route('/auth/login', methods=['POST'])
def login():
    # Verify password
    if not check_password_hash(user.password_hash, password):
        return error
    
    # Generate JWT token
    token = jwt.encode({
        'user_id': user.id,
        'exp': datetime.utcnow() + timedelta(days=7)
    }, app.config['SECRET_KEY'])
    
    return {'token': token, 'user': user.to_dict()}

# 2. Protected Routes
@token_required  # Decorator checks token
def get_profile():
    user_id = get_current_user_id()  # Extract from token
    # ... return user data
```

**Memory Tip**: "JWT = JSON Web Token = Stateless Auth"

---

### **Order Queue System (Background Worker)**

```python
class OrderQueue:
    def __init__(self):
        self.processing_queue = Queue()  # Orders being prepared
        self.delivery_queue = Queue()    # Orders out for delivery
        self.running = False
    
    def _process_orders(self):
        while self.running:
            # Move orders through stages after time delays
            # processing (24h) → delivered (wait for confirm) → received
```

**Memory Tip**: "Queue = FIFO = First In First Out = Fair processing"

---

## 🎨 Frontend Architecture Guide

### **Memory Aid: "PHLRC" (Phil's RC Car)**

**P** - **Pages** (Route components)
**H** - **Hooks** (Custom React hooks)
**L** - **Lib** (Utilities & API)
**R** - **Routes** (Navigation)
**C** - **Components** (Reusable UI)

---

### **File Structure**

```
client/src/
├── main.tsx                 # 🚀 App entry point
├── App.tsx                  # 🏠 Root component with routing
├── pages/                   # 📄 Page components
│   ├── home.tsx            # Homepage with products
│   ├── product-detail.tsx  # Single product page
│   ├── cart.tsx            # Shopping cart
│   ├── checkout.tsx        # Checkout process
│   ├── profile.tsx         # User profile & orders
│   ├── admin.tsx           # Admin dashboard
│   ├── login.tsx           # Login page
│   └── signup.tsx          # Registration page
├── components/              # 🧩 Reusable components
│   ├── header.tsx          # Navigation bar
│   ├── footer.tsx          # Footer
│   ├── product-card.tsx    # Product display card
│   ├── shopping-cart.tsx   # Cart sidebar
│   ├── product-filters.tsx # Filter controls
│   ├── admin/              # Admin-specific components
│   │   ├── order-management.tsx
│   │   ├── product-table.tsx
│   │   ├── analytics-dashboard.tsx
│   │   └── ratings-monitor.tsx
│   └── ui/                 # shadcn/ui components
├── hooks/                   # 🎣 Custom hooks
│   ├── use-auth.tsx        # Authentication state
│   ├── use-cart.ts         # Cart management
│   └── use-toast.ts        # Toast notifications
└── lib/                     # 🛠️ Utilities
    ├── api.ts              # API URL helpers
    ├── queryClient.ts      # TanStack Query config
    ├── types.ts            # TypeScript types
    └── utils.ts            # Helper functions
```

---

### **Key Frontend Concepts**

#### **1. TanStack Query (React Query)**
```typescript
// Data fetching with automatic caching
const { data: products } = useQuery({
  queryKey: ['/api/products'],
  queryFn: async () => {
    const res = await fetch('/api/products');
    return res.json();
  }
});

// Mutations for POST/PUT/DELETE
const mutation = useMutation({
  mutationFn: async (data) => apiRequest('POST', '/api/orders/checkout', data),
  onSuccess: () => {
    queryClient.invalidateQueries(['/api/cart']); // Refresh cart
  }
});
```

**Memory Tip**: "Query = GET, Mutation = POST/PUT/DELETE"

---

#### **2. Authentication Hook**
```typescript
const { user, isAuthenticated, login, logout } = useAuth();

// Stores token in localStorage
// Verifies token on app load
// Provides user context to entire app
```

---

#### **3. Cart Management**
```typescript
const { 
  cartItems,      // Array of items
  itemCount,      // Total items
  totalPrice,     // Total cost
  addToCart,      // Add product
  updateQuantity, // Change quantity
  removeItem      // Delete item
} = useCart();
```

---

### **Component Communication Patterns**

```
App (AuthProvider)
  ├── Header
  │    ├── ShoppingCart (reads cartItems)
  │    └── User Menu (reads user)
  ├── Home
  │    ├── ProductFilters (updates filters state)
  │    └── ProductCard (onClick → addToCart)
  └── Checkout (reads cartItems, submits order)
```

**Memory Tip**: "Props down, Events up, Context anywhere"

---

## ❓ FAQs

### **Q1: How does authentication work?**
**A**: JWT tokens stored in localStorage. When user logs in, backend generates token. Frontend includes token in `Authorization` header for protected routes.

---

### **Q2: How are orders processed automatically?**
**A**: Background thread in `order_queue.py` runs continuously, moving orders through stages (processing → shipped → delivered) with 24-hour intervals.

---

### **Q3: What happens when payment method is Online vs COD?**
**A**: 
- **Online**: Order starts with `pending_payment` status, waits for admin confirmation
- **COD**: Order starts with `pending_payment` status (unified flow for both methods)
- Admin changes status to `processing` to start fulfillment

---

### **Q4: How does the refund system work?**
**A**: User requests refund → Status changes to `refund_requested` → Automatically processed → Status becomes `refunded` → User confirms receipt → Status becomes `completed`

---

### **Q5: Where is user data stored?**
**A**: SQLite database in `flask-backend/instance/data.db`. Passwords are hashed with Werkzeug's `generate_password_hash`.

---

### **Q6: How to add a new product category?**
**A**: Categories are text fields, not enforced by database. Just use the new category name when creating products.

---

### **Q7: How to reset the database?**
**A**: 
```bash
cd flask-backend
rm -rf instance/
python3 reset_db.py
python3 seed_data.py
```

---

### **Q8: What's the difference between session_id and user_id in cart?**
**A**: 
- `session_id`: For guest users (not logged in)
- `user_id`: For authenticated users
- Cart persists even if user logs in/out

---

### **Q9: How does product search work?**
**A**: SQL LIKE queries on product name, description, category, and brand. Case-insensitive search across multiple fields.

---

### **Q10: Can users cancel orders?**
**A**: Yes, but only when status is `pending_payment` or `processing`. Once shipped, must use refund system.

---

## 🎓 Quick Presentation Guide

### **30-Second Pitch**
"TechBazaar is a full-stack e-commerce platform built with React and Flask. It features automated order processing with queues, JWT authentication, real-time admin analytics, and an intelligent refund system. The backend uses SQLAlchemy ORM with SQLite, while the frontend leverages TanStack Query for efficient data management."

### **2-Minute Technical Overview**
1. **Frontend**: React + TypeScript with component-based architecture
2. **Backend**: Flask REST API with 8 route modules
3. **Database**: SQLite with 4 main models (User, Product, Order, CartItem)
4. **Key Features**: 
   - JWT authentication
   - Queue-based order processing (FIFO)
   - Automatic refund handling
   - Admin analytics dashboard
5. **Data Structures**: Arrays for products, Hash tables for fast lookups, Queues for order processing, Trees for component hierarchy

### **5-Minute Deep Dive Topics**
1. **Authentication Flow**: Show JWT generation, token storage, protected routes
2. **Order Processing Queue**: Explain FIFO queue, background worker, status progression
3. **Data Flow**: Demonstrate a complete checkout flow from frontend to database
4. **Admin Features**: Show order management, analytics, refund processing
5. **Code Structure**: Walk through a single route (e.g., checkout) end-to-end

---

## 📝 Quick Reference Commands

```bash
# Start development server
npm run dev:All

# Backend only
cd flask-backend && flask run

# Frontend only
npm run dev

# Reset database
cd flask-backend && python3 reset_db.py && python3 seed_data.py

# Run diagnostics
python3 DIAGNOSE_STATUS_ISSUE.py
```

---

**Last Updated**: December 2025
**Version**: 1.0
**Maintainer**: TechBazaar Team
