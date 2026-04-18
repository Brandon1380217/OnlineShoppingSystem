# ShopEase - Online Shopping System

A full-stack member-based online shopping system, featuring both customer and business account functionality.

## Tech Stack

- **Frontend**: React 18 + Vite + TailwindCSS + Recharts
- **Backend**: Node.js + Express + SQLite (via better-sqlite3)
- **Auth**: JWT-based authentication with bcrypt password hashing

## Quick Start

### 1. Install Dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2. Seed the Database

```bash
cd backend
npm run seed
```

### 3. Start the Servers

```bash
# Terminal 1 - Backend API (port 3001)
cd backend
npm run dev

# Terminal 2 - Frontend (port 5173)
cd frontend
npm run dev
```

### 4. Open the App

Visit **http://localhost:5173** in your browser.

## Demo Accounts

| Role     | Email              | Password    |
|----------|--------------------|-------------|
| Customer | customer@demo.com  | password123 |
| Business | business@demo.com  | password123 |
| Customer | alice@demo.com     | password123 |
| Admin    | admin@demo.com     | password123 |

## Features

### Customer Side

1. **Product Browsing** - Browse products with ratings, purchase counts, release dates, and brand info
2. **Product Search & Filter** - Search by keyword, category, brand, rating (0-5 stars), release date (30/90 days, coming soon), deals
3. **Product Detail** - View images, price, description, variants, reviews, and related products
4. **Shopping Cart** - Add/remove products, adjust quantities, view summary
5. **Checkout** - Shipping address, delivery method selection, payment method
6. **Order History** - View past orders with status tracking, cancel, return, and reorder functionality
7. **Shop Reviews & Ratings** - Rate and comment on shops after purchasing from them, with star breakdown and edit/delete
8. **Live Chat with Shops** - Floating chat widget with polling-based "real-time" messaging, preset quick questions, and unread indicators

### Business Side

1. **Order Operations**
   - 1.1 Order Entry: Centralized dashboard with all orders from web/sales channels
   - 1.2 Validation & Checking: Validates customer info, payment, and inventory
   - 1.3 Order Processing: Update order status workflow (pending → confirmed → processing → packed → shipped → delivered)
   - 1.4 Fulfillment/Shipping: Batch status updates with tracking numbers
   - 1.5 Invoicing & Payment: Invoice management with payment status tracking
   - 1.6 Returns Management: Handle, track, and process returned items

2. **Analytics & Reporting**
   - Revenue charts (daily, by category)
   - Order volume and status distribution
   - Top products by revenue
   - Sales by channel breakdown
   - Configurable time periods (7, 30, 90, 365 days)

3. **Product List Management**
   - Add new products directly from the dashboard (name, photo, price, stock, category/brand, deals)
   - Edit product name, photo (image URL), price, stock, and deal settings inline
   - Remove (archive) products from active listings
   - Restore archived products back to active
   - Permanent delete archived products (preserved if order history exists)

4. **Customer Messaging**
   - Built-in Messages tab to reply to customer conversations from the live chat widget
   - Quick-reply preset responses, unread counts, and per-conversation message history

## Project Structure

```
├── backend/
│   ├── db/
│   │   ├── schema.js       # Database schema & initialization
│   │   └── seed.js         # Seed data with demo products & orders
│   ├── middleware/
│   │   └── auth.js         # JWT authentication middleware
│   ├── routes/
│   │   ├── auth.js         # Login, register, profile
│   │   ├── products.js     # Product listing, search, detail
│   │   ├── cart.js         # Shopping cart operations
│   │   ├── orders.js       # Customer order management
│   │   ├── business.js     # Business dashboard, analytics, product CRUD
│   │   ├── shops.js        # Shop listing, follow, shop reviews & ratings
│   │   └── chats.js        # Live customer-shop chat conversations
│   └── server.js           # Express server entry point
├── frontend/
│   └── src/
│       ├── components/     # Reusable UI components
│       ├── context/        # React contexts (Auth, Cart)
│       ├── pages/          # Page components
│       ├── api.js          # API client
│       └── App.jsx         # Router setup
└── README.md
```
