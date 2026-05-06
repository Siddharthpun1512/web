const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const https = require("https");
const { signupUser, loginUser, getUserFromToken, updateUserProfile, changeUserPassword } = require("./authLogic");
const {
  connectDataStore,
  readProducts,
  writeProducts,
  readOrders,
  writeOrders,
  addContactRequest,
  readContactRequests,
  readUsers
} = require("./store");

// Load backend/.env before reading configuration values from process.env.
loadEnvFile(path.resolve(__dirname, "..", ".env"));

// Server and file locations used throughout the backend.
const host = process.env.HOST || "0.0.0.0";
const port = Number(process.env.PORT || 3000);
const frontendDir = path.resolve(__dirname, "..", "..", "frontend");

// Store and payment settings. Razorpay is enabled only when both keys exist.
const storeName = process.env.STORE_NAME || "JoyBox Gifts & Toys";
const storeEmail = process.env.STORE_EMAIL || "siddharthpun1512@gamil.com.com";
const razorpayKeyId = process.env.RAZORPAY_KEY_ID || "";
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || "";
const isRazorpayEnabled = Boolean(razorpayKeyId && razorpayKeySecret);
const adminId = process.env.ADMIN_ID || process.env.OWNER_ID || "admin";
const adminPassword = process.env.ADMIN_PASSWORD || process.env.OWNER_PASSWORD || "admin123";
const ownerTokenSecret = process.env.OWNER_TOKEN_SECRET || process.env.AUTH_TOKEN_SECRET || "change-owner-secret-in-backend-env";
const isProduction = process.env.NODE_ENV === "production";

// Shipping rule: orders at or above the threshold get free shipping.
const shippingThreshold = 3000;
const shippingFee = 149;

// Maps file extensions to browser-friendly Content-Type headers.
const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};

const server = http.createServer(async (request, response) => {
  // Every request needs a URL so we can decide which route or file to serve.
  if (!request.url) {
    sendJson(response, 400, { error: "Missing request URL" });
    return;
  }

  const url = new URL(request.url, `http://${host}:${port}`);
  applySecurityHeaders(request, response, url);

  // Simple health endpoint used to check that the backend is running.
  if (request.method === "GET" && url.pathname === "/api/health") {
    sendJson(response, 200, { status: "ok" });
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/readiness") {
    sendJson(response, 200, {
      status: "ready",
      razorpayEnabled: isRazorpayEnabled,
      production: isProduction
    });
    return;
  }

  // Sends frontend-safe store settings, including whether online payment is ready.
  if (request.method === "GET" && url.pathname === "/api/config") {
    sendJson(response, 200, {
      storeName,
      storeEmail,
      payment: {
        provider: "razorpay",
        enabled: isRazorpayEnabled,
        keyId: razorpayKeyId
      }
    });
    return;
  }

  // Returns the product catalog from backend/data/products.json.
  if (request.method === "GET" && url.pathname === "/api/products") {
    sendJson(response, 200, await readProducts());
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/owner/login") {
    try {
      const payload = await readRequestBody(request);
      const incomingAdminId = String(payload.adminId || payload.ownerId || "").trim();
      const password = String(payload.password || "");

      if (!incomingAdminId || incomingAdminId !== adminId || !password || password !== adminPassword) {
        sendJson(response, 401, { error: "Invalid admin ID or password." });
        return;
      }

      sendJson(response, 200, { token: signOwnerToken(incomingAdminId), adminId: incomingAdminId });
    } catch (error) {
      sendJson(response, 400, { error: error.message || "Unable to login admin." });
    }
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/owner/products") {
    try {
      requireOwner(request);
      sendJson(response, 200, { products: await readProducts() });
    } catch (error) {
      sendJson(response, 401, { error: error.message || "Admin login required." });
    }
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/owner/orders") {
    try {
      requireOwner(request);
      const orders = (await readOrders()).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      sendJson(response, 200, { orders });
    } catch (error) {
      sendJson(response, 401, { error: error.message || "Admin login required." });
    }
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/owner/users") {
    try {
      requireOwner(request);
      const users = (await readUsers()).map(publicAdminUser);
      sendJson(response, 200, { users });
    } catch (error) {
      sendJson(response, 401, { error: error.message || "Admin login required." });
    }
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/owner/contacts") {
    try {
      requireOwner(request);
      const contacts = (await readContactRequests()).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      sendJson(response, 200, { contacts });
    } catch (error) {
      sendJson(response, 401, { error: error.message || "Admin login required." });
    }
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/owner/export") {
    try {
      requireOwner(request);
      const exportData = {
        generatedAt: new Date().toISOString(),
        products: await readProducts(),
        orders: await readOrders(),
        users: (await readUsers()).map(publicAdminUser),
        contactRequests: await readContactRequests()
      };

      response.setHeader("Content-Disposition", `attachment; filename="joybox-data-${Date.now()}.json"`);
      send(response, 200, mimeTypes[".json"], JSON.stringify(exportData, null, 2));
    } catch (error) {
      sendJson(response, 401, { error: error.message || "Admin login required." });
    }
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/owner/products") {
    try {
      requireOwner(request);
      const payload = await readRequestBody(request);
      const products = await readProducts();
      const product = normalizeProduct(payload, products);

      products.push(product);
      await writeProducts(products);
      sendJson(response, 201, { product, products });
    } catch (error) {
      sendJson(response, 400, { error: error.message || "Unable to add product." });
    }
    return;
  }

  if (request.method === "PUT" && url.pathname.startsWith("/api/owner/products/")) {
    try {
      requireOwner(request);
      const productId = decodeURIComponent(url.pathname.replace("/api/owner/products/", ""));
      const payload = await readRequestBody(request);
      const products = await readProducts();
      const productIndex = products.findIndex((product) => product.id === productId);

      if (productIndex === -1) {
        sendJson(response, 404, { error: "Product not found." });
        return;
      }

      const product = normalizeProduct({ ...products[productIndex], ...payload, id: productId }, products, productId);
      products[productIndex] = product;
      await writeProducts(products);
      sendJson(response, 200, { product, products });
    } catch (error) {
      sendJson(response, 400, { error: error.message || "Unable to update product." });
    }
    return;
  }

  if (request.method === "DELETE" && url.pathname.startsWith("/api/owner/products/")) {
    try {
      requireOwner(request);
      const productId = decodeURIComponent(url.pathname.replace("/api/owner/products/", ""));
      const products = await readProducts();
      const nextProducts = products.filter((product) => product.id !== productId);

      if (nextProducts.length === products.length) {
        sendJson(response, 404, { error: "Product not found." });
        return;
      }

      await writeProducts(nextProducts);
      sendJson(response, 200, { ok: true, products: nextProducts });
    } catch (error) {
      sendJson(response, 400, { error: error.message || "Unable to remove product." });
    }
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/auth/signup") {
    try {
      const payload = await readRequestBody(request);
      sendJson(response, 201, await signupUser(payload));
    } catch (error) {
      sendJson(response, 400, { error: error.message || "Unable to create account." });
    }
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/auth/login") {
    try {
      const payload = await readRequestBody(request);
      sendJson(response, 200, await loginUser(payload));
    } catch (error) {
      sendJson(response, 401, { error: error.message || "Unable to login." });
    }
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/auth/me") {
    try {
      const token = getBearerToken(request);
      sendJson(response, 200, { user: await getUserFromToken(token) });
    } catch (error) {
      sendJson(response, 401, { error: error.message || "Please login again." });
    }
    return;
  }

  if (request.method === "PUT" && url.pathname === "/api/profile") {
    try {
      const token = getBearerToken(request);
      const payload = await readRequestBody(request);
      sendJson(response, 200, { user: await updateUserProfile(token, payload) });
    } catch (error) {
      sendJson(response, 400, { error: error.message || "Unable to update profile." });
    }
    return;
  }

  if (request.method === "PUT" && url.pathname === "/api/profile/password") {
    try {
      const token = getBearerToken(request);
      const payload = await readRequestBody(request);
      sendJson(response, 200, await changeUserPassword(token, payload));
    } catch (error) {
      sendJson(response, 400, { error: error.message || "Unable to change password." });
    }
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/profile/orders") {
    try {
      const token = getBearerToken(request);
      const user = await getUserFromToken(token);
      const orders = (await readOrders())
        .filter((order) => order.userId === user.id || order.customer?.email === user.email)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      sendJson(response, 200, { orders });
    } catch (error) {
      sendJson(response, 401, { error: error.message || "Unable to load orders." });
    }
    return;
  }

  // Saves contact form submissions into backend/data/contact-requests.json.
  if (request.method === "POST" && url.pathname === "/api/contact") {
    const payload = await readRequestBody(request);
    const name = String(payload.name || "").trim();
    const email = String(payload.email || "").trim();
    const phone = String(payload.phone || "").trim();
    const message = String(payload.message || "").trim();

    if (!name || !email || !message) {
      sendJson(response, 400, { error: "Name, email, and message are required." });
      return;
    }

    if (!isValidEmail(email)) {
      sendJson(response, 400, { error: "Enter a valid email address." });
      return;
    }

    await addContactRequest({
      id: `MSG-${Date.now()}`,
      name,
      email,
      phone,
      message,
      createdAt: new Date().toISOString()
    });

    sendJson(response, 201, { ok: true, message: "Your message has been saved." });
    return;
  }

  // Creates a customer order. It supports COD directly and Razorpay online payment.
  if (request.method === "POST" && url.pathname === "/api/orders") {
    try {
      const payload = await readRequestBody(request);
      const user = await requireCustomer(request);
      const result = await createOrder(payload, user);
      sendJson(response, 201, result);
    } catch (error) {
      const status = error.message === "Please login before placing an order." ? 401 : 400;
      sendJson(response, status, { error: error.message || "Unable to create order." });
    }
    return;
  }

  // Confirms a Razorpay payment by checking the signature sent by Razorpay checkout.
  if (request.method === "POST" && url.pathname === "/api/payments/verify") {
    try {
      const payload = await readRequestBody(request);
      const result = await verifyPayment(payload);
      sendJson(response, 200, result);
    } catch (error) {
      sendJson(response, 400, { error: error.message || "Payment verification failed." });
    }
    return;
  }

  // If no API route matched, treat the request as a frontend file request.
  serveStaticAsset(url.pathname, response);
});

startServer().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

async function startServer() {
  assertProductionConfig();
  const connectedToMongo = await connectDataStore();

  server.listen(port, host, () => {
    console.log(`JoyBox server running at http://${host}:${port}`);
    console.log(`Data store: ${connectedToMongo ? "MongoDB" : "JSON files"}`);
  });
}

async function createOrder(payload, user = null) {
  // Normalize customer input so validations and saved data use clean strings.
  const incomingCustomer = payload.customer || {};
  const customer = {
    name: String(incomingCustomer.name || "").trim(),
    email: String(incomingCustomer.email || "").trim(),
    phone: String(incomingCustomer.phone || "").trim(),
    address: String(incomingCustomer.address || "").trim(),
    city: String(incomingCustomer.city || "").trim(),
    state: String(incomingCustomer.state || "").trim(),
    pincode: String(incomingCustomer.pincode || "").trim()
  };
  const items = Array.isArray(payload.items) ? payload.items : [];
  const paymentMethod = payload.paymentMethod === "cod" ? "cod" : "razorpay";

  // Stop early when required customer or cart data is missing or invalid.
  if (!customer.name || !customer.email || !customer.phone || !customer.address || !customer.city || !customer.state || !customer.pincode) {
    throw new Error("Complete customer details are required.");
  }

  if (!isValidEmail(customer.email)) {
    throw new Error("Enter a valid email address.");
  }

  if (!isValidPhone(customer.phone)) {
    throw new Error("Enter a valid phone number.");
  }

  if (!isValidPincode(customer.pincode)) {
    throw new Error("Enter a valid 6-digit pincode.");
  }

  if (!items.length) {
    throw new Error("Cart is empty.");
  }

  const catalog = await readProducts();
  const detailedItems = items.map((item) => {
    // Look up each cart item in the real product catalog so price cannot be faked by the browser.
    const product = catalog.find((entry) => entry.id === item.id);
    const quantity = Math.max(1, Number(item.quantity || 1));

    if (!product) {
      throw new Error(`Product not found: ${item.id}`);
    }

    return {
      id: product.id,
      name: product.name,
      price: product.price,
      quantity,
      total: product.price * quantity
    };
  });

  // Calculate totals on the backend to keep order pricing trustworthy.
  const subtotal = detailedItems.reduce((sum, item) => sum + item.total, 0);
  const shipping = subtotal >= shippingThreshold ? 0 : shippingFee;
  const total = subtotal + shipping;
  const orderId = `JOY-${Date.now()}`;
  const receipt = `receipt_${Date.now()}`;
  const orders = await readOrders();

  const baseOrder = {
    id: orderId,
    userId: user?.id || "",
    receipt,
    customer,
    items: detailedItems,
    paymentMethod,
    totals: { subtotal, shipping, total, currency: "INR" },
    createdAt: new Date().toISOString(),
    status: paymentMethod === "cod" ? "confirmed" : "pending_payment",
    paymentStatus: paymentMethod === "cod" ? "pay_on_delivery" : "initiated"
  };

  // COD orders are immediately confirmed because no online gateway step is needed.
  if (paymentMethod === "cod") {
    orders.push(baseOrder);
    await writeOrders(orders);
    return {
      ok: true,
      mode: "cod",
      id: orderId,
      orderNumber: orderId,
      totals: baseOrder.totals
    };
  }

  // Online payment cannot continue unless Razorpay credentials are configured.
  if (!isRazorpayEnabled) {
    throw new Error("Razorpay is not configured yet. Add your keys in backend/.env to enable online payments.");
  }

  // Create a Razorpay order first, then save the matching local order with gateway details.
  const razorpayOrder = await createRazorpayOrder(total, receipt);
  const orderWithGateway = {
    ...baseOrder,
    gateway: {
      provider: "razorpay",
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency
    }
  };

  orders.push(orderWithGateway);
  await writeOrders(orders);

  return {
    ok: true,
    mode: "razorpay",
    id: orderId,
    orderNumber: orderId,
    customer,
    totals: orderWithGateway.totals,
    gateway: {
      provider: "razorpay",
      keyId: razorpayKeyId,
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      name: storeName,
      description: `Order ${orderId}`
    }
  };
}

async function verifyPayment(payload) {
  // These values come back from Razorpay checkout after the user pays.
  const localOrderId = String(payload.localOrderId || "").trim();
  const razorpayOrderId = String(payload.razorpay_order_id || "").trim();
  const razorpayPaymentId = String(payload.razorpay_payment_id || "").trim();
  const razorpaySignature = String(payload.razorpay_signature || "").trim();

  if (!isRazorpayEnabled) {
    throw new Error("Razorpay is not configured.");
  }

  if (!localOrderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    throw new Error("Missing payment verification details.");
  }

  // Recreate Razorpay's expected signature using the secret key.
  // If it matches, the payment details were not tampered with.
  const generatedSignature = crypto
    .createHmac("sha256", razorpayKeySecret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");

  if (generatedSignature !== razorpaySignature) {
    throw new Error("Invalid payment signature.");
  }

  const orders = await readOrders();
  const order = orders.find((entry) => entry.id === localOrderId);

  if (!order) {
    throw new Error("Local order not found.");
  }

  // Mark the saved local order as paid after the gateway signature is verified.
  order.status = "paid";
  order.paymentStatus = "paid";
  order.paidAt = new Date().toISOString();
  order.gateway = {
    ...(order.gateway || {}),
    orderId: razorpayOrderId,
    paymentId: razorpayPaymentId,
    signature: razorpaySignature
  };

  await writeOrders(orders);

  return {
    ok: true,
    id: order.id,
    orderNumber: order.id,
    totals: order.totals
  };
}

function serveStaticAsset(pathname, response) {
  // Converts browser paths like "/" or "/about" into frontend files.
  const requestedPath = normalizePath(pathname);
  const filePath = resolveFrontendFile(requestedPath);

  fs.readFile(filePath, (error, fileContent) => {
    if (error) {
      sendNotFound(response);
      return;
    }

    const extension = path.extname(filePath).toLowerCase();
    send(response, 200, mimeTypes[extension] || "application/octet-stream", fileContent);
  });
}

function normalizePath(pathname) {
  // The homepage should serve frontend/index.html.
  if (pathname === "/") {
    return "index.html";
  }

  // Remove leading slashes so the path can be safely resolved inside frontendDir.
  const trimmed = pathname.replace(/^\/+/, "");
  if (!trimmed) {
    return "index.html";
  }

  if (path.extname(trimmed)) {
    return trimmed;
  }

  // Allows clean URLs like /cart to load cart.html.
  return `${trimmed}.html`;
}

function resolveFrontendFile(relativePath) {
  const normalizedFile = path.normalize(relativePath);
  const resolvedPath = path.resolve(frontendDir, normalizedFile);

  // Prevent path traversal attempts from reading files outside the frontend folder.
  if (!resolvedPath.startsWith(frontendDir)) {
    return path.resolve(frontendDir, "index.html");
  }

  return resolvedPath;
}

function readRequestBody(request) {
  // Collect the incoming request body, then parse it as JSON.
  return new Promise((resolve, reject) => {
    let body = "";

    request.on("data", (chunk) => {
      body += chunk;
      // Basic protection against accidentally huge form/order requests.
      if (body.length > 5000000) {
        reject(new Error("Request body too large."));
      }
    });

    request.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(new Error("Invalid JSON payload."));
      }
    });

    request.on("error", () => {
      reject(new Error("Unable to read request."));
    });
  });
}

function createRazorpayOrder(amount, receipt) {
  // Razorpay expects amount in paise, so INR rupees are multiplied by 100.
  const payload = JSON.stringify({
    amount: amount * 100,
    currency: "INR",
    receipt
  });

  return new Promise((resolve, reject) => {
    // Make a direct HTTPS request to Razorpay's Orders API.
    const outgoingRequest = https.request(
      "https://api.razorpay.com/v1/orders",
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${razorpayKeyId}:${razorpayKeySecret}`).toString("base64")}`,
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload)
        }
      },
      (gatewayResponse) => {
        let body = "";

        gatewayResponse.on("data", (chunk) => {
          body += chunk;
        });

        gatewayResponse.on("end", () => {
          try {
            const parsed = JSON.parse(body);

            // Any 2xx response means Razorpay created the order successfully.
            if (gatewayResponse.statusCode && gatewayResponse.statusCode >= 200 && gatewayResponse.statusCode < 300) {
              resolve(parsed);
              return;
            }

            reject(new Error(parsed.error?.description || "Razorpay order creation failed."));
          } catch (error) {
            reject(new Error("Unable to parse Razorpay response."));
          }
        });
      }
    );

    outgoingRequest.on("error", () => {
      reject(new Error("Unable to reach Razorpay."));
    });

    outgoingRequest.write(payload);
    outgoingRequest.end();
  });
}

function loadEnvFile(filePath) {
  // This project avoids an external dotenv package, so this small helper loads KEY=value lines.
  if (!fs.existsSync(filePath)) {
    return;
  }

  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    if (!line || line.trim().startsWith("#") || !line.includes("=")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");
    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();

    if (key && !process.env[key]) {
      process.env[key] = value;
    }
  }
}

function assertProductionConfig() {
  if (!isProduction) {
    return;
  }

  const missing = [];

  if (!process.env.AUTH_TOKEN_SECRET || process.env.AUTH_TOKEN_SECRET === "change-this-secret-in-backend-env") {
    missing.push("AUTH_TOKEN_SECRET");
  }

  if (!process.env.MONGO_URI) {
    missing.push("MONGO_URI");
  }

  if (!process.env.ADMIN_ID && !process.env.OWNER_ID) {
    missing.push("ADMIN_ID");
  }

  if (
    (!process.env.ADMIN_PASSWORD && !process.env.OWNER_PASSWORD) ||
    adminPassword === "admin123" ||
    adminPassword === "owner123" ||
    adminPassword === "change_this_owner_password"
  ) {
    missing.push("ADMIN_PASSWORD");
  }

  if (!process.env.OWNER_TOKEN_SECRET || process.env.OWNER_TOKEN_SECRET === "change_this_owner_token_secret") {
    missing.push("OWNER_TOKEN_SECRET");
  }

  if (!razorpayKeyId || !razorpayKeySecret) {
    missing.push("RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET");
  }

  if (missing.length) {
    throw new Error(`Production config is incomplete: set ${missing.join(", ")} before going live.`);
  }
}

function applySecurityHeaders(request, response, url) {
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("X-Frame-Options", "DENY");
  response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  response.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  if (url.pathname.startsWith("/api/")) {
    response.setHeader("Cache-Control", "no-store");
  }
}

function isValidEmail(value) {
  // Basic email shape check for form/order validation.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidPhone(value) {
  // Allows digits plus common phone formatting characters.
  return /^[0-9+\-\s()]{7,20}$/.test(value);
}

function isValidPincode(value) {
  // Indian pincode format: exactly 6 digits.
  return /^[0-9]{6}$/.test(value);
}

function normalizeProduct(payload, products, existingId = "") {
  const name = String(payload.name || "").trim();
  const category = String(payload.category || "").trim();
  const price = Number(payload.price || 0);
  const rating = Number(payload.rating || 4.8);
  const age = String(payload.age || "").trim();
  const stock = String(payload.stock || "In stock").trim();
  const delivery = String(payload.delivery || "Delivery in 2-4 days").trim();
  const visual = String(payload.visual || "product-visual--one").trim();
  const image = String(payload.image || "").trim();
  const description = String(payload.description || "").trim();
  const highlights = Array.isArray(payload.highlights)
    ? payload.highlights.map((entry) => String(entry || "").trim()).filter(Boolean)
    : String(payload.highlights || "")
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean);
  const id = existingId || createProductId(name);

  if (!name || !category || !description) {
    throw new Error("Product name, category, and description are required.");
  }

  if (!Number.isFinite(price) || price <= 0) {
    throw new Error("Product price must be greater than 0.");
  }

  if (products.some((product) => product.id === id && product.id !== existingId)) {
    throw new Error("A product with this name already exists.");
  }

  return {
    id,
    name,
    category,
    price,
    rating: Number.isFinite(rating) ? rating : 4.8,
    age,
    stock,
    delivery,
    visual,
    image,
    description,
    highlights: highlights.length ? highlights.slice(0, 3) : ["New arrival", "Gift-ready", "Customer favorite"]
  };
}

function createProductId(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64) || `product-${Date.now()}`;
}

function publicAdminUser(user) {
  const { passwordHash, ...safeUser } = user || {};
  return safeUser;
}

function getBearerToken(request) {
  const header = request.headers.authorization || "";
  return header.startsWith("Bearer ") ? header.slice(7) : "";
}

function signOwnerToken(adminIdValue) {
  const payload = {
    owner: true,
    adminId: adminIdValue,
    exp: Date.now() + 12 * 60 * 60 * 1000
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createOwnerSignature(body);

  return `${body}.${signature}`;
}

function requireOwner(request) {
  const token = getBearerToken(request);
  const [body, signature] = String(token || "").split(".");

  if (!body || !signature || createOwnerSignature(body) !== signature) {
    throw new Error("Owner login required.");
  }

  const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));

  if (!payload.owner || Date.now() > Number(payload.exp || 0)) {
    throw new Error("Owner login expired.");
  }
}

function createOwnerSignature(value) {
  return crypto.createHmac("sha256", ownerTokenSecret).update(value).digest("base64url");
}

async function getOptionalUser(request) {
  const token = getBearerToken(request);

  if (!token) {
    return null;
  }

  try {
    return await getUserFromToken(token);
  } catch (error) {
    return null;
  }
}

async function requireCustomer(request) {
  const token = getBearerToken(request);

  if (!token) {
    throw new Error("Please login before placing an order.");
  }

  try {
    return await getUserFromToken(token);
  } catch (error) {
    throw new Error("Please login before placing an order.");
  }
}

function send(response, statusCode, contentType, body) {
  // Low-level response helper used by both JSON and static file replies.
  response.writeHead(statusCode, { "Content-Type": contentType });
  response.end(body);
}

function sendJson(response, statusCode, payload) {
  // Sends a JavaScript object as JSON to the frontend.
  send(response, statusCode, mimeTypes[".json"], JSON.stringify(payload));
}

function sendNotFound(response) {
  // For missing frontend files, return the homepage HTML with a 404 status.
  const fallbackFile = path.resolve(frontendDir, "index.html");

  fs.readFile(fallbackFile, (error, fileContent) => {
    if (error) {
      sendJson(response, 404, { error: "Not found" });
      return;
    }

    send(response, 404, mimeTypes[".html"], fileContent);
  });
}
