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
MONGO_URI=mongodb+srv://your_db_user:your_encoded_password@your_cluster.mongodb.net/joybox?retryWrites=true&w=majority
MONGO_DB_NAME=joybox_store
CONTACT_TO_EMAIL=punsiddharth1512@gmail.com
AUTH_TOKEN_SECRET=replace_with_a_long_random_secret
ADMIN_EMAIL=joybox.admin.7294@joybox.local
ADMIN_PASSWORD=replace_with_a_strong_admin_password
OWNER_TOKEN_SECRET=replace_with_another_long_random_secret
RAZORPAY_KEY_ID=rzp_test_or_live_key_id
RAZORPAY_KEY_SECRET=razorpay_secret
```

Do not paste `MONGO_URI=` into the Render value box. The key should be `MONGO_URI`, and the value should start with `mongodb+srv://`.

For Atlas SRV URLs, do not include a port number:

```text
Wrong: mongodb+srv://user:password@cluster0.xxxxx.mongodb.net:27017/joybox
Right: mongodb+srv://user:password@cluster0.xxxxx.mongodb.net/joybox?retryWrites=true&w=majority
```

## MongoDB Atlas Access

In MongoDB Atlas, open **Network Access** and add the outbound IP range that Render shows for your service region. For a quick test, you can add `0.0.0.0/0`, then redeploy. Atlas allows this but it means any IP can attempt to connect, so keep a strong database username and password.

If your database password contains special characters such as `@`, `#`, `/`, `?`, or `:`, URL-encode the password before putting it in the connection string.

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

Admin panel:

```text
https://your-render-service.onrender.com/admin.html
```

## Vercel Note

This project does not need Vercel right now because Render serves both frontend and backend together. Use Vercel later only if you want to split the static frontend from the API.
