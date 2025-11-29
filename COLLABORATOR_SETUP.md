# TechBazaar - Collaborator Setup Guide

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/strgglr0/TechBazaar-main.git
cd TechBazaar-main
```

### 2. Install Dependencies

**Backend (Flask):**
```bash
cd flask-backend
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

**Frontend (React):**
```bash
cd ..
npm install
```

### 3. Start the Application

**Option A: Run Both (Recommended)**
```bash
npm run dev:all
```

**Option B: Run Separately**

Terminal 1 - Backend:
```bash
cd flask-backend
source .venv/bin/activate
python app.py
```

Terminal 2 - Frontend:
```bash
npm run dev
```

### 4. Access the Application

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5001

---

## 👤 Test Accounts

### Admin Account
- **Email:** admin@techbazaar.com
- **Password:** admin123
- **Access:** Full admin panel, product management, order management, analytics

### Customer Account
- **Email:** customer@techbazaar.com
- **Password:** customer123
- **Access:** Shopping, cart, checkout, order history, product ratings

---

## 📦 Available Products

The system comes pre-seeded with products in these categories:
- **Phones** (iPhone 15 Pro, Samsung Galaxy S24, etc.)
- **Laptops** (MacBook Pro, Dell XPS, etc.)
- **Tablets** (iPad Pro, Samsung Galaxy Tab, etc.)
- **Accessories** (AirPods, cases, etc.)

---

## 🛠️ Key Features

### For Customers:
- Browse products by category/brand
- Add to cart (works for guests too)
- Checkout with COD or Online Payment
- Track order status
- Confirm receipt
- Rate products (1-5 stars)

### For Admins:
- Product CRUD operations
- Order management (change status, delete)
- View analytics dashboard
- Sales by category charts
- User management

---

## 🔧 Common Issues & Solutions

### Port Already in Use
```bash
# Kill process on port 5001 (backend)
lsof -ti:5001 | xargs kill -9

# Kill process on port 5173 (frontend)
lsof -ti:5173 | xargs kill -9
```

### Database Issues
```bash
# Reset database
cd flask-backend
rm -rf instance/data.db
python app.py  # Will recreate with seed data
```

### Missing Dependencies
```bash
# Backend
cd flask-backend
pip install -r requirements.txt

# Frontend
cd ..
npm install
```

---

## 📁 Project Structure

```
TechBazaar-main/
├── flask-backend/          # Python Flask API
│   ├── app.py             # Main Flask app
│   ├── models.py          # Database models
│   ├── routes/            # API endpoints
│   └── instance/          # SQLite database
├── client/                # React frontend
│   └── src/
│       ├── pages/         # Page components
│       ├── components/    # Reusable components
│       └── hooks/         # Custom hooks
└── package.json           # Node dependencies
```

---

## 🧪 Testing

### Test the System:
1. Register a new customer account
2. Browse products
3. Add items to cart
4. Complete checkout
5. Login as admin
6. Change order status to "delivered"
7. Login as customer
8. Confirm receipt and rate products

---

## 📝 Git Workflow

```bash
# Create your own branch
git checkout -b your-name/feature-name

# Make changes, then commit
git add .
git commit -m "Description of changes"

# Push to your branch
git push origin your-name/feature-name

# Create Pull Request on GitHub
```

---

## 🆘 Need Help?

- Check console logs for errors
- Backend logs: `flask-backend/flask.log`
- Frontend: Browser DevTools Console
- Database: Use DB Browser for SQLite to view `instance/data.db`

---

## 🎯 What to Work On

Good first tasks:
- [ ] Add new product categories
- [ ] Improve product filtering
- [ ] Add product search functionality
- [ ] Enhance mobile responsiveness
- [ ] Add order notifications
- [ ] Improve analytics visualizations

---

**Happy Coding! 🚀**
