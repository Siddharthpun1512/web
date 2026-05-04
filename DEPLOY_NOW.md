# Deploy JoyBox On Render

This app is ready for Render as one web service. The backend serves the frontend files, so deploy Render first.

## Render Settings

Use the included `render.yaml` blueprint, or create a Web Service manually:

```text
Root Directory: backend
Build Command: npm install
Start Command: npm start
```

## Environment Variables

Add these in Render:

```env
NODE_ENV=production
HOST=0.0.0.0
PORT=10000
STORE_NAME=JoyBox Gifts & Toys
STORE_EMAIL=punsiddharth1512@gmail.com
CONTACT_TO_EMAIL=punsiddharth1512@gmail.com
AUTH_TOKEN_SECRET=replace_with_a_long_random_secret
OWNER_PASSWORD=replace_with_a_strong_owner_password
OWNER_TOKEN_SECRET=replace_with_another_long_random_secret
RAZORPAY_KEY_ID=rzp_test_or_live_key_id
RAZORPAY_KEY_SECRET=razorpay_secret
```

For real customers, use Razorpay live keys. For testing the deployed site, test keys are okay.

## After Deploy

Open:

```text
https://your-render-service.onrender.com/api/readiness
```

Then open:

```text
https://your-render-service.onrender.com
```

## Vercel Note

This project does not need Vercel right now because Render serves both frontend and backend together. Use Vercel later only if you want to split the static frontend from the API.
