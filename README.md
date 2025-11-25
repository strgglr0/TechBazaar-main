# HMN Tech Store

## 🔶 Modern E-Commerce Platform for Technology Products

HMN Tech Store is a modern, full-stack e-commerce platform built for technology products. Shop for the latest smartphones, laptops, desktops, and accessories with an intuitive and seamless shopping experience.

## 🚀 Features

### Customer Features
- 🛍️ Browse products by category
- 🔍 Advanced search and filtering
- 🛒 Real-time shopping cart
- 👤 User authentication and profiles
- 📦 Order tracking
- 📱 Responsive design for all devices

### Admin Features
- 📊 Analytics dashboard
- 📝 Product management (CRUD)
- 🎯 Order management
- 📈 Sales tracking by category
- 🔔 Low stock alerts

## 🛠️ Technology Stack

### Frontend
- **React 18.3.1** - UI library
- **TypeScript 5.6.3** - Type safety
- **Vite 5.4.20** - Build tool
- **Tailwind CSS 3.4.17** - Styling
- **TanStack Query 5.60.5** - Data fetching
- **Radix UI** - Component primitives
- **Recharts 2.15.4** - Analytics visualization

### Backend
- **Node.js + Express 4.21.2** - Server
- **TypeScript 5.6.3** - Type-safe backend
- **Drizzle ORM 0.39.1** - Database ORM
- **Passport.js 0.7.0** - Authentication
- **WebSocket (ws 8.18.0)** - Real-time updates

### Database
- **PostgreSQL** (Production)
- **SQLite** (Development)

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- PostgreSQL (for production)

### Setup

```bash
# Clone the repository
git clone <repository-url>
cd TechBazaar-main

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
npm run db:push

# Start development server
npm run dev:all
```

## 🎯 Usage

### Development

```bash
# Start frontend only
npm run dev:frontend

# Start backend only
npm run dev

# Start both frontend and backend
npm run dev:all
```

### Production

```bash
# Build for production
npm run build

# Start production server
npm start
```

## 📁 Project Structure

```
TechBazaar-main/
├── client/              # React frontend
│   ├── src/
│   │   ├── components/  # UI components
│   │   ├── pages/       # Route pages
│   │   ├── hooks/       # Custom hooks
│   │   └── lib/         # Utilities
├── server/              # Node.js backend
│   ├── routes.ts        # API routes
│   ├── storage.ts       # Data layer
│   └── index.ts         # Server entry
├── shared/              # Shared types
└── flask-backend/       # Legacy backend
```

## 🔑 Default Admin Access

For development and testing:
- **Email:** admin@hmntech.com
- **Password:** HMN2025!

## 🌐 API Endpoints

### Public Endpoints
```
GET    /api/products         # Get all products
GET    /api/products/:id     # Get single product
GET    /api/categories       # Get categories
GET    /api/cart             # Get cart items
POST   /api/cart             # Add to cart
POST   /api/orders           # Create order
```

### Admin Endpoints
```
POST   /api/products         # Create product
PUT    /api/products/:id     # Update product
DELETE /api/products/:id     # Delete product
GET    /api/admin/stats      # Get statistics
GET    /api/admin/analytics  # Get analytics
```

### Authentication
```
POST   /api/auth/login       # User login
POST   /api/auth/signup      # User registration
POST   /api/auth/logout      # User logout
GET    /api/auth/user        # Get current user
```

## 🎨 Branding

- **Brand Name:** HMN Tech Store
- **Logo:** Modern tech store logo with orange and white colors
- **Color Scheme:** Dark theme with orange accents
- **Typography:** Modern sans-serif fonts

## 🔒 Security Features

- Session-based authentication
- Password hashing
- HTTP-only cookies
- CORS protection
- Input validation with Zod
- SQL injection prevention

## 📈 Performance

- React Query caching
- Optimistic UI updates
- Code splitting
- Lazy loading
- Image optimization
- Minified production builds

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

## 📄 License

MIT License - See LICENSE file for details

## 📧 Contact

For questions or support, please open an issue on GitHub.

---

**HMN Tech Store** - Your Destination for the Latest Technology
