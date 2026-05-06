const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");

const usersPath = path.resolve(__dirname, "..", "data", "users.json");
const tokenMaxAgeMs = 7 * 24 * 60 * 60 * 1000;

function signupUser(payload) {
  const name = String(payload.name || "").trim();
  const email = normalizeEmail(payload.email);
  const password = String(payload.password || "");
  const phone = String(payload.phone || "").trim();

  validateName(name);
  validateEmail(email);
  validatePassword(password);
  if (phone) {
    validatePhone(phone);
  }

  const users = readUsers();
  if (users.some((user) => normalizeEmail(user.email) === email)) {
    throw new Error("Email is already registered.");
  }

  const user = {
    id: `USER-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`,
    name,
    email,
    phone,
    address: emptyAddress(),
    passwordHash: hashPassword(password),
    updatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString()
  };

  users.push(user);
  writeUsers(users);

  return createAuthResponse(user);
}

function loginUser(payload) {
  const email = normalizeEmail(payload.email);
  const password = String(payload.password || "");

  validateEmail(email);
  if (!password) {
    throw new Error("Password is required.");
  }

  const users = readUsers();
  const user = users.find((entry) => normalizeEmail(entry.email) === email);

  if (!user || !verifyUserPassword(password, user)) {
    throw new Error("Invalid email or password.");
  }

  if (needsUserAuthUpgrade(user)) {
    upgradeUserAuthRecord(user, password);
    writeUsers(users);
  }

  return createAuthResponse(user);
}

function getUserFromToken(token) {
  return publicUser(getUserRecordFromToken(token));
}

function getUserRecordFromToken(token) {
  const decoded = verifyToken(token);
  const user = readUsers().find((entry) => getUserId(entry) === decoded.id);

  if (!user) {
    throw new Error("User account was not found.");
  }

  return user;
}

function updateUserProfile(token, payload) {
  const currentUser = getUserRecordFromToken(token);
  const users = readUsers();
  const user = users.find((entry) => getUserId(entry) === getUserId(currentUser));
  const name = String(payload.name || "").trim();
  const phone = String(payload.phone || "").trim();
  const address = normalizeAddress(payload.address || {});

  validateName(name);
  if (phone) {
    validatePhone(phone);
  }

  user.name = name;
  user.phone = phone;
  user.address = address;
  user.updatedAt = new Date().toISOString();
  writeUsers(users);

  return publicUser(user);
}

function changeUserPassword(token, payload) {
  const currentUser = getUserRecordFromToken(token);
  const users = readUsers();
  const user = users.find((entry) => getUserId(entry) === getUserId(currentUser));
  const currentPassword = String(payload.currentPassword || "");
  const nextPassword = String(payload.newPassword || "");

  if (!verifyPassword(currentPassword, user.passwordHash)) {
    throw new Error("Current password is incorrect.");
  }

  validatePassword(nextPassword);
  user.passwordHash = hashPassword(nextPassword);
  user.updatedAt = new Date().toISOString();
  writeUsers(users);

  return { ok: true };
}

function createAuthResponse(user) {
  return {
    user: publicUser(user),
    token: signToken(user)
  };
}

function publicUser(user) {
  return {
    id: getUserId(user),
    name: user.name,
    email: user.email,
    phone: user.phone || "",
    address: normalizeAddress(user.address || {}),
    createdAt: user.createdAt || ""
  };
}

function signToken(user) {
  const payload = {
    id: getUserId(user),
    email: user.email,
    exp: Date.now() + tokenMaxAgeMs
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createSignature(body);

  return `${body}.${signature}`;
}

function verifyToken(token) {
  const [body, signature] = String(token || "").split(".");

  if (!body || !signature || createSignature(body) !== signature) {
    throw new Error("Invalid login token.");
  }

  let payload;
  try {
    payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch (error) {
    throw new Error("Invalid login token.");
  }

  if (!payload.id || Date.now() > Number(payload.exp || 0)) {
    throw new Error("Login token has expired.");
  }

  return payload;
}

function createSignature(value) {
  const tokenSecret = process.env.AUTH_TOKEN_SECRET || "change-this-secret-in-backend-env";
  return crypto.createHmac("sha256", tokenSecret).update(value).digest("base64url");
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");

  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  const [salt, hash] = String(storedHash || "").split(":");

  if (!salt || !hash) {
    return false;
  }

  const candidateHash = crypto.scryptSync(password, salt, 64);
  const savedHash = Buffer.from(hash, "hex");

  return savedHash.length === candidateHash.length && crypto.timingSafeEqual(savedHash, candidateHash);
}

function verifyUserPassword(password, user) {
  if (!user) {
    return false;
  }

  if (verifyPassword(password, user.passwordHash)) {
    return true;
  }

  const legacyPassword = String(user.password || "");
  if (legacyPassword.startsWith("$2a$") || legacyPassword.startsWith("$2b$") || legacyPassword.startsWith("$2y$")) {
    return bcrypt.compareSync(password, legacyPassword);
  }

  return false;
}

function needsUserAuthUpgrade(user) {
  return Boolean(user && (!user.id || !user.passwordHash || user.password));
}

function upgradeUserAuthRecord(user, password) {
  user.id = getUserId(user);
  user.email = normalizeEmail(user.email);
  user.address = normalizeAddress(user.address || {});
  user.passwordHash = hashPassword(password);
  delete user.password;
  user.updatedAt = new Date().toISOString();
  user.createdAt = user.createdAt || user.updatedAt;
}

function getUserId(user) {
  return String(user?.id || user?._id || "");
}

function validateName(name) {
  if (name.length < 2) {
    throw new Error("Name must be at least 2 characters.");
  }
}

function validateEmail(email) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Enter a valid email address.");
  }
}

function validatePhone(phone) {
  if (!/^[0-9+\-\s()]{7,20}$/.test(phone)) {
    throw new Error("Enter a valid phone number.");
  }
}

function validatePassword(password) {
  if (password.length < 6) {
    throw new Error("Password must be at least 6 characters.");
  }
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function normalizeAddress(address) {
  return {
    street: String(address.street || "").trim(),
    city: String(address.city || "").trim(),
    state: String(address.state || "").trim(),
    pincode: String(address.pincode || address.zip || "").trim(),
    country: String(address.country || "India").trim()
  };
}

function emptyAddress() {
  return {
    street: "",
    city: "",
    state: "",
    pincode: "",
    country: "India"
  };
}

function readUsers() {
  try {
    const users = JSON.parse(fs.readFileSync(usersPath, "utf8"));
    return Array.isArray(users) ? users : [];
  } catch (error) {
    return [];
  }
}

function writeUsers(users) {
  fs.mkdirSync(path.dirname(usersPath), { recursive: true });
  fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
}

module.exports = {
  signupUser,
  loginUser,
  getUserFromToken,
  updateUserProfile,
  changeUserPassword
};
