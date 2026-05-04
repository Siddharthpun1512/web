# Northstar Commerce

A complete full-stack e-commerce web application with a responsive client, Express API, MongoDB/Mongoose models, JWT authentication, Stripe payment intent route, admin management, and automatic Excel reporting.

The previous `frontend/` and `backend/` folders are preserved. The production-ready implementation lives in:

- `client/` - responsive HTML, CSS, and JavaScript storefront/admin UI
- `server/` - Node.js, Express, MongoDB, JWT, Stripe, ExcelJS backend

## Features

- Home, shop, product details, cart, checkout, login, register, user dashboard, and admin dashboard
- `POST /api/auth/register` and `POST /api/auth/login`
- `GET /api/users/profile` and `PUT /api/users/profile`
- Product CRUD with admin protection
- User cart APIs
- Order APIs for users and admins
- Stripe payment intent endpoint with placeholder-key mode
- Mongoose schemas for users, products, carts, and orders
- `server/reports.xlsx` export for users, products, and orders
- Excel report refreshes when orders are created and products are added, updated, or deleted
- Central error handling, validation, JWT protection, and admin middleware

## Setup

1. Install dependencies:

```powershell
npm run install:all
```

2. Start MongoDB locally or update `server/.env`:

```env
MONGO_URI=mongodb://127.0.0.1:27017/commerce_app
JWT_SECRET=replace_with_a_long_random_secret
STRIPE_SECRET_KEY=your_key_here
PORT=5000
CLIENT_ORIGIN=http://localhost:5000
```

3. Seed starter data and the first admin account:

```powershell
npm run seed --prefix server
```

Admin login:

- Email: `admin@example.com`
- Password: `password123`

4. Run the app:

```powershell
npm run dev
```

Open `http://localhost:5000`.

## API Routes

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/users/profile`
- `PUT /api/users/profile`
- `GET /api/users` admin
- `GET /api/products`
- `GET /api/products/:id`
- `POST /api/products` admin
- `PUT /api/products/:id` admin
- `DELETE /api/products/:id` admin
- `POST /api/cart`
- `GET /api/cart`
- `DELETE /api/cart/:id`
- `POST /api/orders`
- `GET /api/orders`
- `GET /api/orders/:id`
- `PUT /api/orders/:id/status` admin
- `POST /api/payments/create-payment-intent`
- `GET /api/reports/download`

## Excel Reports

The backend writes `server/reports.xlsx` using ExcelJS. It contains three worksheets:

- Users
- Products
- Orders

The report updates automatically when:

- a user registers
- a product is created, edited, or deleted
- an order is created or updated

## Notes

- The first registered user is automatically assigned the `admin` role if the database is empty.
- Stripe returns a placeholder client secret until `STRIPE_SECRET_KEY` is replaced with a real key.
- `server/.env.example` is included as the environment template.
