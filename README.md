# ShopEase - Online Shopping System

A full-stack member-based online shopping system, featuring both customer and business account functionality.

## Tech Stack

- **Frontend**: React 18 + Vite + TailwindCSS + Recharts
- **Backend**: Node.js + Express + SQLite (via better-sqlite3)
- **Auth**: JWT-based authentication with bcrypt password hashing

## Prerequisites

Before you start, make sure you have these installed:

| Tool    | Version       | Check with            | Get it from                               |
|---------|---------------|-----------------------|-------------------------------------------|
| Node.js | **18 or newer** | `node -v`           | https://nodejs.org (pick the LTS installer) |
| npm     | 9 or newer    | `npm -v`              | Comes bundled with Node.js                |
| Git     | any recent    | `git --version`       | https://git-scm.com/downloads             |

> **Windows note:** `better-sqlite3` is a native module. If you hit a `node-gyp` / build error during `npm install`, install the **"Desktop development with C++"** workload from Visual Studio Build Tools: https://visualstudio.microsoft.com/visual-cpp-build-tools/. Most users on Node 18+ LTS won't need this because a prebuilt binary is downloaded automatically.

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/Brandon1380217/OnlineShoppingSystem.git
cd OnlineShoppingSystem
```

### 2. Install dependencies (backend + frontend)

There are two separate `package.json` files — one in `backend/`, one in `frontend/`. Install both:

```bash
cd backend
npm install
cd ../frontend
npm install
cd ..
```

You should now have `backend/node_modules/` and `frontend/node_modules/` folders. Expect this step to take 1-3 minutes.

### 3. Seed the database

This creates `backend/shopease.db` (a local SQLite file) and fills it with demo users, products, orders, reviews, and chat history.

```bash
cd backend
npm run seed
```

You should see `Database seeded successfully!`. Run this command again any time you want a **clean reset** — it wipes all tables and repopulates them.

### 4. Start both servers

The app needs **two terminals running at the same time** — one for the API, one for the web UI.

**Terminal 1 — Backend API (port 3001)**

```bash
cd backend
npm run dev
```

Wait for `ShopEase API running on http://localhost:3001`. Leave this terminal open.

**Terminal 2 — Frontend dev server (port 5173)**

```bash
cd frontend
npm run dev
```

Wait for `Local: http://localhost:5173/`. Leave this terminal open too.

### 5. Open the app

Visit **http://localhost:5173** in your browser and log in with any of the [demo accounts below](#demo-accounts).

To stop the servers later, press **Ctrl + C** in each terminal.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `EADDRINUSE` on port 3001 or 5173 | Another process is using the port. Close it, or change it — backend uses `process.env.PORT` (`PORT=3002 npm run dev`); for frontend edit the `server.port` in `frontend/vite.config.js`. |
| Frontend shows a blank page / 401 errors | Make sure the backend is running on port 3001. The frontend proxies `/api` and `/uploads` to that port (see `frontend/vite.config.js`). |
| "Invalid email or password" | The DB may be empty. Re-run `cd backend && npm run seed`. |
| Weird DB errors after schema changes | Delete `backend/shopease.db`, `backend/shopease.db-shm`, `backend/shopease.db-wal`, then run `npm run seed` again. |
| Uploaded product images disappear after reset | Expected — uploaded files live in `backend/uploads/` and are gitignored. They are per-machine and survive server restarts but are removed when you manually clean that folder. |
| `node-gyp` / MSBuild errors on `npm install` (Windows) | See the Visual Studio Build Tools note in Prerequisites. |
| `ERR_DLOPEN_FAILED` / `NODE_MODULE_VERSION` mismatch from `better-sqlite3` when running the backend | Your Node.js version changed after `npm install`. Rebuild the native binary against the current Node: `cd backend && npm rebuild better-sqlite3`. |

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
7. **Shop Reviews & Ratings** - Rate and comment on shops after purchasing from them, with a star breakdown; reviews are **final** (cannot be edited or deleted once submitted)
8. **Live Chat with Shops** - Floating chat widget with polling-based "real-time" messaging, preset quick questions, and unread indicators
9. **Multi-Currency Display** - Switch the storefront between **HKD** (default), **USD**, **GBP**, and **EUR** from the header; the selection is remembered in `localStorage` and applied site-wide (product cards, cart, checkout, orders, and dashboards)

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
   - Edit product name, **upload a new product photo** (drag-and-drop or click to browse, JPG/PNG/WEBP/GIF up to 5 MB), price, stock, and deal settings inline
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
│   │   └── seed.js         # Seed data with demo products, orders, reviews, chats
│   ├── middleware/
│   │   └── auth.js         # JWT authentication middleware
│   ├── routes/
│   │   ├── auth.js         # Login, register, profile
│   │   ├── products.js     # Product listing, search, detail
│   │   ├── cart.js         # Shopping cart operations
│   │   ├── orders.js       # Customer order management
│   │   ├── business.js     # Business dashboard, analytics, product CRUD
│   │   ├── shops.js        # Shop listing, follow, shop reviews & ratings
│   │   ├── chats.js        # Live customer-shop chat conversations
│   │   ├── notifications.js# In-app notifications
│   │   ├── admin.js        # Admin user management
│   │   └── uploads.js      # Image-upload endpoint (multer)
│   ├── uploads/            # User-uploaded product images (gitignored)
│   └── server.js           # Express server entry point
├── frontend/
│   ├── vite.config.js      # Dev server + proxy for /api and /uploads
│   └── src/
│       ├── components/     # Reusable UI (Layout, ProductCard, StarRating, ChatWidget)
│       ├── context/        # React contexts (Auth, Cart)
│       ├── pages/          # Route pages (Home, Products, BusinessDashboard, ...)
│       ├── api.js          # API client + upload helper
│       └── App.jsx         # Router setup
├── .gitignore
└── README.md
```
