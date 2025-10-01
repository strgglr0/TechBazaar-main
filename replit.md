# TechMarket E-commerce Application

## Overview

TechMarket is a full-stack e-commerce application specializing in technology products (phones, laptops, desktops, and accessories). Built with React, Express, and PostgreSQL, it provides a complete shopping experience with product browsing, cart management, order processing, and an admin dashboard for product management.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build Tools**
- React 18 with TypeScript for type-safe component development
- Vite as the build tool and dev server for fast HMR and optimized production builds
- Wouter for lightweight client-side routing instead of React Router
- Path aliases configured (`@/` for client/src, `@shared/` for shared code) for clean imports

**State Management & Data Fetching**
- TanStack Query (React Query) for server state management, caching, and API calls
- Custom hooks pattern (`use-cart.ts`, `use-toast.ts`) for encapsulating business logic
- Session-based cart management using a default session ID stored in request headers

**UI Component System**
- Shadcn/ui component library built on Radix UI primitives
- Tailwind CSS for utility-first styling with custom design tokens
- Custom color scheme using CSS variables for theming (warm neutral palette with yellow/gold accents)
- Form handling with React Hook Form and Zod validation

**Design Philosophy**
- Mobile-first responsive design
- Component composition with Radix UI for accessibility
- Shared schema validation between client and server using Zod

### Backend Architecture

**Server Framework**
- Express.js with TypeScript in ESM module format
- Custom middleware for request logging and JSON response capture
- Development and production build modes using tsx/esbuild

**API Design Pattern**
- RESTful API endpoints under `/api/*` namespace
- Route organization: products, orders, cart, admin stats
- Request validation using Zod schemas derived from Drizzle ORM models
- Error handling with try-catch blocks returning appropriate HTTP status codes

**Storage Layer**
- In-memory storage implementation (`MemStorage` class) for development
- Interface-based design (`IStorage`) allows easy swap to database implementation
- Sample data initialization for immediate testing

**Development Experience**
- Vite middleware integration for SSR-like development experience
- Hot Module Replacement (HMR) in development
- Request/response logging with truncation for readability

### Data Storage & Schema

**Database Technology**
- PostgreSQL with Drizzle ORM for type-safe database access
- Neon serverless driver for PostgreSQL connections
- Schema-first approach with migrations directory

**Schema Design**
- **Products Table**: Core product information with JSONB specifications field for flexible attributes
- **Orders Table**: Customer orders with JSONB for shipping address and line items
- **Cart Items Table**: Session-based shopping cart with product references
- UUID primary keys generated via PostgreSQL `gen_random_uuid()`
- Timestamps for audit trails

**Type Safety**
- Shared schema definitions in `shared/schema.ts` for client-server consistency
- Drizzle-Zod integration for automatic validation schema generation
- TypeScript types exported from schema for use throughout application

### External Dependencies

**Core Infrastructure**
- Neon Database: Serverless PostgreSQL hosting (configured via `DATABASE_URL` environment variable)
- Drizzle Kit: Database schema management and migrations

**UI & Styling**
- Radix UI: Headless component primitives for accessibility
- Tailwind CSS: Utility-first CSS framework
- Lucide React: Icon library
- Custom fonts: Lora (serif), Geist (sans-serif), Space Grotesk (mono)

**Development Tools**
- Replit-specific plugins: runtime error overlay, cartographer, dev banner
- ESBuild: Production bundling for server code
- PostCSS with Autoprefixer for CSS processing

**Form & Validation**
- React Hook Form: Performant form state management
- Zod: Schema validation library
- Hookform Resolvers: Integration between React Hook Form and Zod

**Data Fetching & State**
- TanStack Query: Server state management with caching
- Built-in session management using Express sessions with connect-pg-simple