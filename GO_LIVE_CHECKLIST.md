# JoyBox Go-Live Checklist

Use this before deploying the lightweight `backend/` + `frontend/` storefront.

## Required Environment

Set these values in `backend/.env` on the live server:

```env
NODE_ENV=production
HOST=0.0.0.0
PORT=3000
STORE_NAME=JoyBox Gifts & Toys
STORE_EMAIL=your-real-store-email@example.com
AUTH_TOKEN_SECRET=use-a-long-random-secret
OWNER_PASSWORD=use-a-strong-owner-password
OWNER_TOKEN_SECRET=use-a-different-long-random-secret
RAZORPAY_KEY_ID=rzp_live_your_live_key
RAZORPAY_KEY_SECRET=your_live_secret
```

The server now refuses to start in production if required secrets are missing or still using demo defaults.

## Before Launch

- Replace Razorpay test keys with live Razorpay keys.
- Change the owner password from the local default.
- Create at least one real customer account and test checkout.
- Add real product photos from the owner page.
- Check `/api/readiness` after deployment.
- Put the app behind HTTPS using your host or reverse proxy.
- Keep `backend/.env` private and never commit it.

## Current Data Storage

Products, users, and orders are stored as JSON files in `backend/data/`. This is fine for a small first launch, but a database is the next upgrade for heavier traffic, backups, and multiple admins.
