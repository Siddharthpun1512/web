const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

const dataDir = path.resolve(__dirname, "..", "data");
const productsPath = path.join(dataDir, "products.json");
const ordersPath = path.join(dataDir, "orders.json");
const usersPath = path.join(dataDir, "users.json");
const contactRequestsPath = path.join(dataDir, "contact-requests.json");

let useMongo = false;

const flexibleSchemaOptions = {
  strict: false,
  versionKey: false
};

const productSchema = new mongoose.Schema({ id: { type: String, unique: true } }, flexibleSchemaOptions);
const orderSchema = new mongoose.Schema({ id: { type: String, unique: true } }, flexibleSchemaOptions);
const userSchema = new mongoose.Schema(
  {
    id: { type: String, unique: true },
    email: { type: String, unique: true }
  },
  flexibleSchemaOptions
);
const contactRequestSchema = new mongoose.Schema({ id: { type: String, unique: true } }, flexibleSchemaOptions);

const Product = mongoose.models.Product || mongoose.model("Product", productSchema);
const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);
const User = mongoose.models.User || mongoose.model("User", userSchema);
const ContactRequest = mongoose.models.ContactRequest || mongoose.model("ContactRequest", contactRequestSchema);

async function connectDataStore() {
  const mongoUri = getMongoUri();

  if (!mongoUri) {
    return false;
  }

  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });
  } catch (error) {
    throw new Error(formatMongoError(error));
  }

  useMongo = true;
  await seedProductsIfEmpty();
  return true;
}

async function readProducts() {
  if (useMongo) {
    return cleanDocs(await Product.find({}).sort({ createdAt: 1, _id: 1 }).lean());
  }

  return readJson(productsPath, []);
}

async function writeProducts(products) {
  if (useMongo) {
    await Product.deleteMany({});
    if (products.length) {
      await Product.insertMany(products, { ordered: true });
    }
    return;
  }

  writeJson(productsPath, products);
}

async function readOrders() {
  if (useMongo) {
    return cleanDocs(await Order.find({}).sort({ createdAt: 1, _id: 1 }).lean());
  }

  return readJson(ordersPath, []);
}

async function writeOrders(orders) {
  if (useMongo) {
    await Order.deleteMany({});
    if (orders.length) {
      await Order.insertMany(orders, { ordered: true });
    }
    return;
  }

  writeJson(ordersPath, orders);
}

async function addContactRequest(entry) {
  if (useMongo) {
    await ContactRequest.create(entry);
    return;
  }

  const entries = readJson(contactRequestsPath, []);
  entries.push(entry);
  writeJson(contactRequestsPath, entries);
}

async function readContactRequests() {
  if (useMongo) {
    return cleanDocs(await ContactRequest.find({}).sort({ createdAt: 1, _id: 1 }).lean());
  }

  return readJson(contactRequestsPath, []);
}

async function readUsers() {
  if (useMongo) {
    return cleanDocs(await User.find({}).sort({ createdAt: 1, _id: 1 }).lean());
  }

  return readJson(usersPath, []);
}

async function writeUsers(users) {
  if (useMongo) {
    await User.deleteMany({});
    if (users.length) {
      await User.insertMany(users, { ordered: true });
    }
    return;
  }

  writeJson(usersPath, users);
}

async function seedProductsIfEmpty() {
  const count = await Product.countDocuments();

  if (count > 0) {
    return;
  }

  const localProducts = readJson(productsPath, []);
  if (localProducts.length) {
    await Product.insertMany(localProducts, { ordered: true });
  }
}

function cleanDocs(docs) {
  return docs.map((doc) => {
    const { _id, __v, ...cleaned } = doc;
    if (!cleaned.id && _id) {
      cleaned.id = String(_id);
    }
    return cleaned;
  });
}

function normalizeMongoUri(value) {
  if (!value) {
    return "";
  }

  let uri = String(value).trim();

  if (uri.startsWith("MONGO_URI=")) {
    uri = uri.slice("MONGO_URI=".length).trim();
  }

  if ((uri.startsWith("\"") && uri.endsWith("\"")) || (uri.startsWith("'") && uri.endsWith("'"))) {
    uri = uri.slice(1, -1).trim();
  }

  return uri;
}

function getMongoUri() {
  const mongoUri = normalizeMongoUri(process.env.MONGO_URI);

  if (!mongoUri) {
    return "";
  }

  validateMongoUri(mongoUri);
  return addDefaultDatabaseName(mongoUri, process.env.MONGO_DB_NAME || "joybox_store");
}

function validateMongoUri(uri) {
  if (!uri.startsWith("mongodb://") && !uri.startsWith("mongodb+srv://")) {
    throw new Error("MONGO_URI is invalid. In Render, the value must start with mongodb+srv:// and must not include MONGO_URI=.");
  }

  if (uri.includes("<") || uri.includes(">")) {
    throw new Error("MONGO_URI is invalid. Replace <db_username> and <db_password> with your real MongoDB Atlas database user and password.");
  }

  if (process.env.NODE_ENV === "production" && /mongodb:\/\/(127\.0\.0\.1|localhost)/.test(uri)) {
    throw new Error("MONGO_URI points to localhost. Render must use your MongoDB Atlas mongodb+srv:// connection string, not 127.0.0.1.");
  }

  if (hasSrvPort(uri)) {
    throw new Error("MONGO_URI is invalid. mongodb+srv:// connection strings must not include a port number like :27017. Remove the port from the Atlas URI.");
  }
}

function addDefaultDatabaseName(uri, databaseName) {
  try {
    const parsed = new URL(uri);

    if (!parsed.pathname || parsed.pathname === "/") {
      parsed.pathname = `/${databaseName}`;
    }

    return parsed.toString();
  } catch (error) {
    return uri;
  }
}

function hasSrvPort(uri) {
  if (!uri.startsWith("mongodb+srv://")) {
    return false;
  }

  try {
    const parsed = new URL(uri);
    return Boolean(parsed.port);
  } catch (error) {
    return /mongodb\+srv:\/\/[^/]+:\d+(?:\/|$)/.test(uri.replace(/^mongodb\+srv:\/\/[^@]+@/, "mongodb+srv://"));
  }
}

function formatMongoError(error) {
  const message = error.message || "Unknown MongoDB connection error.";

  if (/bad auth|authentication failed|auth failed/i.test(message)) {
    return "MongoDB connection failed: username or password is wrong. Use the Database Access user, not your Atlas login.";
  }

  if (/not authorized|requires authentication/i.test(message)) {
    return "MongoDB connection failed: the database user does not have permission for this cluster/database.";
  }

  if (/ENOTFOUND|querySrv|ETIMEOUT|server selection timed out|getaddrinfo/i.test(message)) {
    return "MongoDB connection failed: Atlas host/IP access problem. Check Network Access allows Render, and confirm the cluster host is correct.";
  }

  return `MongoDB connection failed: ${message}`;
}

function readJson(filePath, fallbackValue) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    return fallbackValue;
  }
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
}

module.exports = {
  connectDataStore,
  getMongoUri,
  normalizeMongoUri,
  validateMongoUri,
  readProducts,
  writeProducts,
  readOrders,
  writeOrders,
  addContactRequest,
  readContactRequests,
  readUsers,
  writeUsers
};
