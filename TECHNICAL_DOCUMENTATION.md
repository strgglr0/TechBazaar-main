# TechBazaar - Technical Documentation

## 🏗️ Technology Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.3.1 | UI framework |
| **TypeScript** | 5.6.2 | Type safety |
| **Vite** | 5.4.2 | Build tool & dev server |
| **TanStack Query** | 5.59.16 | Server state management |
| **Wouter** | 3.3.5 | Client-side routing |
| **Tailwind CSS** | 3.4.1 | Styling framework |
| **Shadcn/ui** | Latest | Component library |
| **Zod** | 3.23.8 | Schema validation |
| **React Hook Form** | 7.53.0 | Form handling |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| **Python** | 3.x | Programming language |
| **Flask** | 3.1.0 | Web framework |
| **SQLAlchemy** | 2.0.36 | ORM |
| **SQLite** | 3.x | Database |
| **Flask-CORS** | 5.0.0 | Cross-origin requests |
| **PyJWT** | 2.10.1 | Authentication tokens |
| **Werkzeug** | 3.1.3 | Password hashing |
| **Threading** | Built-in | Background tasks |

### Development Tools
- **npm** - Package management
- **pip** - Python packages
- **Git** - Version control
- **VS Code** - IDE
- **Dev Container** - Docker environment

---

## 🔄 Data Flow Architecture

### 1. Authentication Flow
```
User Input (Login/Signup)
    ↓
Frontend Validation (Zod)
    ↓
POST /api/auth/login or /api/auth/signup
    ↓
Flask Backend validates credentials
    ↓
Password verified (Werkzeug)
    ↓
JWT Token generated (PyJWT)
    ↓
Token stored in localStorage
    ↓
Token sent in Authorization header for protected routes
```

### 2. Product Browsing Flow
```
User visits Home Page
    ↓
TanStack Query fetches /api/products
    ↓
SQLAlchemy queries products table
    ↓
JSON response with products array
    ↓
React renders product grid
    ↓
User applies filters (category/brand/price)
    ↓
Query params updated (?category=laptops&minPrice=500)
    ↓
New API call with filters
    ↓
SQLAlchemy WHERE clause filtering
    ↓
Filtered results rendered
```

### 3. Shopping Cart Flow
```
User clicks "Add to Cart"
    ↓
Cart Context (React) updates state
    ↓
localStorage.setItem('cart', JSON.stringify(items))
    ↓
Cart badge updates (item count)
    ↓
User navigates to /cart
    ↓
Cart items rendered from Context
    ↓
User modifies quantity
    ↓
Cart Context recalculates totals
    ↓
localStorage synced
```

### 4. Checkout & Order Flow
```
User clicks "Proceed to Checkout"
    ↓
Form validation (React Hook Form + Zod)
    ↓
POST /api/checkout with order data
    ↓
Flask creates Order object
    ↓
Initial status: pending_payment (both payment methods)
    ↓
SQLAlchemy commits to database
    ↓
Response with order ID
    ↓
Cart cleared (Context + localStorage)
    ↓
User redirected to /checkout with orderId
    ↓
Order status displayed
    ↓
Admin confirms payment (changes to processing)
    ↓
Order Queue picks up order (background thread)
    ↓
Status transitions: processing → shipped → delivered → received
```

### 5. Order Processing Queue (Backend)
```
Order Queue Thread (runs every 30s)
    ↓
Queries orders with status = processing
    ↓
For each order:
    Wait 30s → Update to "shipped"
    Wait 30s → Update to "delivered"
    Wait 30s → Update to "received"
    ↓
SQLAlchemy commits each status change
    ↓
Frontend polls /api/user/orders
    ↓
TanStack Query refetches (refetchInterval: 5000ms)
    ↓
User sees updated status in real-time
```

### 6. Refund Flow
```
User clicks "Request Refund" (status: received)
    ↓
PUT /api/orders/{id}/request-refund
    ↓
Backend validates order ownership
    ↓
Status changed to: refunded
    ↓
refunded_at timestamp set
    ↓
refund_amount = order.total
    ↓
User sees "Confirm Refund Received" button
    ↓
User clicks confirmation
    ↓
POST /api/orders/{id}/confirm-refund
    ↓
Status changed to: completed
    ↓
Order cycle complete
```

### 7. Admin Analytics Flow
```
Admin navigates to /admin
    ↓
GET /api/admin/analytics (JWT verified)
    ↓
SQLAlchemy aggregates:
    - COUNT(orders) by status
    - SUM(total) for revenue
    - COUNT(users)
    - COUNT(products)
    ↓
JSON response with metrics
    ↓
React renders dashboard cards
    ↓
Admin filters orders by status
    ↓
Client-side array filtering
    ↓
Admin changes order status (dropdown)
    ↓
PUT /api/admin/orders/{id}/status
    ↓
SQLAlchemy updates order
    ↓
TanStack Query invalidates cache
    ↓
Table re-renders with new data
```

---

## 🗄️ Data Structures Used

### Arrays/Lists (O(n) search, O(1) access)
```typescript
// Products list
const products: Product[] = [
  { id: "1", name: "iPhone 15", price: 999 },
  { id: "2", name: "MacBook Pro", price: 2499 }
];

// Cart items
const cartItems: CartItem[] = [
  { productId: "1", quantity: 2, price: 999 }
];

// Order history
const orders: Order[] = [...];
```
**Usage**: Product listings, cart, order history  
**Why**: Simple iteration, map/filter operations

### Hash Tables/Objects (O(1) lookup)
```typescript
// Form state
const formData = {
  customerName: "John Doe",
  email: "john@example.com",
  shippingAddress: { ... }
};

// TanStack Query cache
{
  "products": [...],
  "cart": [...],
  "user-orders": [...]
}

// localStorage
localStorage.setItem('authToken', 'jwt...');
localStorage.setItem('cart', JSON.stringify(items));
```
**Usage**: Form data, cache, localStorage  
**Why**: Fast key-value lookups

### Queue (FIFO - O(1) enqueue/dequeue)
```python
# Order processing queue
order_queue = Queue()
order_queue.put(order_id)
order_id = order_queue.get()
```
**Usage**: Background order processing  
**Why**: First order in, first order processed

### Stack (LIFO - implicit in call stack)
```javascript
// Function call stack
handleCheckout() {
  validateForm() {
    checkRequired() { ... }
  }
  submitOrder() { ... }
}
```
**Usage**: Navigation history, function calls  
**Why**: Last page visited, first to return

### Tree Structure
```
Component Tree:
App
├── AuthProvider
│   ├── Home
│   │   └── ProductGrid
│   ├── Cart
│   └── Profile
│       └── OrderList

Database B-Tree Index:
products
├── id (PRIMARY KEY, indexed)
├── category (indexed for filtering)
└── price (indexed for range queries)
```
**Usage**: React components, database indexes  
**Why**: Hierarchical organization, O(log n) search

### Primitives
```typescript
let productId: string = "abc-123-def";
let price: number = 999.99;
let isAdmin: boolean = true;
let quantity: number = 2;
```
**Usage**: All data fields  
**Why**: Basic building blocks

---

## ❓ FAQs

### General System

**Q: What is TechBazaar?**  
A: A full-stack e-commerce platform for electronics with features like cart management, order tracking, automated refunds, and admin analytics.

**Q: Is it a real production system?**  
A: It's a full-featured demo/portfolio project. For production, you'd need to add payment gateway integration, cloud database, and enhanced security.

**Q: Can I deploy this?**  
A: Yes! Deploy Flask backend on Render/Railway and React frontend on Vercel/Netlify. Switch SQLite to PostgreSQL for production.

### Technical Architecture

**Q: Why Flask instead of Node.js?**  
A: Flask is lightweight, perfect for RESTful APIs, has excellent ORM (SQLAlchemy), and Python's readability aids rapid development.

**Q: Why SQLite instead of PostgreSQL/MySQL?**  
A: SQLite is perfect for development (zero config, single file, fast). For production with multiple users, switch to PostgreSQL.

**Q: Why TanStack Query instead of Redux?**  
A: TanStack Query handles server state (API data) with built-in caching, refetching, and loading states. Redux is overkill for this use case.

**Q: How does authentication work?**  
A: JWT tokens stored in localStorage. Backend verifies tokens with `@token_required` decorator. Tokens expire after 24 hours.

**Q: Is the password secure?**  
A: Yes. Passwords are hashed with Werkzeug's `generate_password_hash` (uses pbkdf2:sha256). Plain passwords never stored.

### Features

**Q: How does the order queue work?**  
A: A background Python thread runs every 30 seconds, checking for orders with status "processing" and automatically advancing them through shipped → delivered → received.

**Q: Can users cancel orders?**  
A: Yes, but only during "Pending Payment Confirmation" or "Processing" stages. After shipping, cancellation is disabled.

**Q: How do refunds work?**  
A: User requests refund → Status immediately changes to "refunded" → User confirms receipt → Status becomes "completed". Fully automated, no admin approval needed.

**Q: What payment methods are supported?**  
A: Cash on Delivery (COD) and Online Payment. Both start at "Pending Payment Confirmation" status. (Note: Actual payment processing not implemented - this is a demo system.)

**Q: How does real-time order tracking work?**  
A: TanStack Query polls `/api/user/orders` every 5 seconds (`refetchInterval: 5000`) to fetch latest order status.

### Database

**Q: Where is the database stored?**  
A: Locally at `flask-backend/instance/data.db` (SQLite file). Access with `sqlite3 flask-backend/instance/data.db`.

**Q: How do I reset the database?**  
A: Run `rm flask-backend/instance/data.db && python flask-backend/reset_db.py && python flask-backend/seed_data.py`

**Q: What happens if I lose data.db?**  
A: All users, products, and orders are lost. Always backup before major changes. Seed script restores 11 sample products.

**Q: Can multiple users access the database simultaneously?**  
A: SQLite supports multiple readers but only one writer. For high concurrency, migrate to PostgreSQL.

### Development

**Q: How do I run the project?**  
A: `npm run dev:All` (starts both Flask backend on :5001 and Vite frontend on :3000)

**Q: How do I add a new product?**  
A: Login as admin (admin@techbazaar.com / admin123) → Admin Panel → Add Product

**Q: How do I test the order flow?**  
A: Login as user (user@test.com / password123) → Add items to cart → Checkout → Watch status auto-update every 30s

**Q: Why is my order stuck at "Pending Payment Confirmation"?**  
A: Admin must manually change status to "Processing" via Admin Panel → Order Management → Status dropdown

**Q: How do I view all API endpoints?**  
A: Check Flask console on startup. All routes logged. Or see `flask-backend/routes/*.py` files.

### Deployment

**Q: How do I deploy to production?**  
A: 
1. Backend: Deploy Flask to Render/Railway/Heroku
2. Frontend: Deploy React to Vercel/Netlify
3. Database: Switch to PostgreSQL on Railway/Supabase
4. Environment: Set `DATABASE_URL` env variable

**Q: What environment variables are needed?**  
A:
```bash
# Backend
DATABASE_URL=postgresql://...
SECRET_KEY=your-secret-key
FLASK_ENV=production

# Frontend
VITE_API_URL=https://your-backend.com
```

**Q: Is HTTPS required?**  
A: Yes for production. Most deployment platforms (Vercel, Render) provide free SSL certificates.

### Common Issues

**Q: Getting 401 Unauthorized errors?**  
A: Token expired or missing. Logout and login again. Token is in localStorage, expires after 24 hours.

**Q: Orders not auto-advancing?**  
A: Ensure Flask backend is running. Order queue only processes orders with status "processing". Check admin changed status from "Pending Payment Confirmation".

**Q: Cart not persisting after refresh?**  
A: Check browser's localStorage. Cart is saved there. If disabled (incognito mode), cart won't persist.

**Q: Admin panel not accessible?**  
A: Login with admin account (admin@techbazaar.com / admin123). User accounts don't have admin access.

**Q: Products not showing?**  
A: Run seed script: `python flask-backend/seed_data.py`. This adds 11 sample products.

---

## 🎓 Quick Reference

### Key Files
- **Backend Entry**: `flask-backend/app.py`
- **Frontend Entry**: `client/src/main.tsx`
- **API Routes**: `flask-backend/routes/*.py`
- **Database Models**: `flask-backend/models.py`
- **Auth Context**: `client/src/hooks/use-auth.tsx`

### Admin Credentials
```
Email: admin@techbazaar.com
Password: admin123
```

### Test User Credentials
```
Email: user@test.com
Password: password123
```

### Development Commands
```bash
npm run dev:All          # Start full stack
npm run dev              # Frontend only
cd flask-backend && python app.py  # Backend only
```

---

*Last Updated: December 2025*


This concise documentation covers:
- ✅ Complete tech stack with versions
- ✅ 7 detailed data flow diagrams
- ✅ Data structures with code examples
- ✅ 25+ FAQs covering everything
- ✅ Quick reference section

It's production-ready for presentations and academic submissions!This concise documentation covers:
- ✅ Complete tech stack with versions
- ✅ 7 detailed data flow diagrams
- ✅ Data structures with code examples
- ✅ 25+ FAQs covering everything
- ✅ Quick reference section

It's production-ready for presentations and academic submissions!
