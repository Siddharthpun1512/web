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
MONGO_URI=mongodb+srv://your_db_user:your_encoded_password@your_cluster.mongodb.net/joybox?retryWrites=true&w=majority
MONGO_DB_NAME=joybox_store
AUTH_TOKEN_SECRET=use-a-long-random-secret
ADMIN_EMAIL=use-a-private-admin-email
ADMIN_PASSWORD=use-a-strong-admin-password
OWNER_TOKEN_SECRET=use-a-different-long-random-secret
RAZORPAY_KEY_ID=rzp_live_your_live_key
RAZORPAY_KEY_SECRET=your_live_secret
```

The server now refuses to start in production if required secrets are missing or still using demo defaults.

For Atlas, add your Render service's outbound IP range in **Network Access**. If you need a quick first deployment, add `0.0.0.0/0`, verify the app connects, then tighten the access list later.

## Before Launch

- Replace Razorpay test keys with live Razorpay keys.
- Change the admin email and password from the local defaults.
- Create at least one real customer account and test checkout.
- Add real product photos from the admin panel at `/admin.html`.
- Check `/api/readiness` after deployment.
- Put the app behind HTTPS using your host or reverse proxy.
- Keep `backend/.env` private and never commit it.
- Check the Render logs for `Data store: MongoDB` after deploy.

## Current Data Storage

Products, users, and orders use MongoDB when `MONGO_URI` is set. Without `MONGO_URI`, the app falls back to JSON files in `backend/data/`, which is useful locally but not reliable for live Render storage.
