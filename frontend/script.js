const API = {
  config: "/api/config",
  products: "/api/products",
  orders: "/api/orders",
  verifyPayment: "/api/payments/verify",
  contact: "/api/contact",
  login: "/api/auth/login",
  signup: "/api/auth/signup",
  me: "/api/auth/me",
  profile: "/api/profile",
  profilePassword: "/api/profile/password",
  profileOrders: "/api/profile/orders",
  ownerLogin: "/api/owner/login",
  ownerProducts: "/api/owner/products",
  ownerOrders: "/api/owner/orders",
  ownerOrdersExport: "/api/owner/orders/export",
  ownerUsers: "/api/owner/users",
  ownerContacts: "/api/owner/contacts",
  ownerExport: "/api/owner/export"
};

const CART_KEY = "joybox-cart";
const AUTH_KEY = "joybox-auth";
const OWNER_KEY = "joybox-owner";
const SHIPPING_THRESHOLD = 3000;
const SHIPPING_FEE = 149;
const DEFAULT_PRODUCTS = [
  {
    id: "rainbow-party-box",
    name: "Rainbow Party Box",
    category: "gift-box",
    price: 1499,
    rating: 4.9,
    age: "3-8 years",
    stock: "In stock",
    delivery: "Delivery in 2-4 days",
    visual: "product-visual--one",
    description: "A bright return-gift box with mini puzzles, stickers, art cards, and a plush surprise.",
    highlights: ["Gift-ready packed", "Great for birthdays", "Colorful mixed toys"]
  },
  {
    id: "creative-play-set",
    name: "Creative Play Set",
    category: "creative-play",
    price: 899,
    rating: 4.7,
    age: "4-10 years",
    stock: "In stock",
    delivery: "Delivery tomorrow",
    visual: "product-visual--two",
    description: "A hands-on activity bundle with craft pieces, simple games, and colorful play materials.",
    highlights: ["Craft based fun", "Lightweight bundle", "Best for indoor play"]
  },
  {
    id: "little-wonder-hamper",
    name: "Little Wonder Hamper",
    category: "gift-box",
    price: 1899,
    rating: 4.8,
    age: "5-9 years",
    stock: "Only 6 left",
    delivery: "Delivery in 3 days",
    visual: "product-visual--three",
    description: "A premium hamper with story cards, sensory toys, tiny keepsakes, and a sweet unboxing feel.",
    highlights: ["Premium finish", "Keepsake pieces", "Ideal festive gift"]
  },
  {
    id: "snuggle-buddy-kit",
    name: "Snuggle Buddy Kit",
    category: "toy-set",
    price: 1099,
    rating: 4.6,
    age: "2-6 years",
    stock: "In stock",
    delivery: "Delivery in 2 days",
    visual: "product-visual--four",
    description: "A soft toy and bedtime comfort pack with plush elements, calming cards, and a mini night-light theme.",
    highlights: ["Soft and cozy", "Bedtime friendly", "Gift for toddlers"]
  },
  {
    id: "mini-maker-cart",
    name: "Mini Maker Cart",
    category: "creative-play",
    price: 1599,
    rating: 4.8,
    age: "6-11 years",
    stock: "Only 9 left",
    delivery: "Delivery in 4 days",
    visual: "product-visual--five",
    description: "A maker-focused bundle with paper craft kits, build cards, and playful challenge prompts.",
    highlights: ["STEM-inspired", "Creative challenges", "Great weekend activity"]
  },
  {
    id: "festival-fun-bundle",
    name: "Festival Fun Bundle",
    category: "toy-set",
    price: 2199,
    rating: 5,
    age: "3-10 years",
    stock: "In stock",
    delivery: "Delivery in 2-3 days",
    visual: "product-visual--six",
    description: "A celebratory family gift bundle with toys, keepsakes, decor accents, and festival-ready wrapping.",
    highlights: ["Family gifting", "Celebration-ready", "Best value box"]
  }
];
const DEFAULT_CONFIG = {
  storeName: "JoyBox Gifts & Toys",
  storeEmail: "hello@joybox.com",
  payment: {
    provider: "razorpay",
    enabled: false,
    keyId: ""
  }
};

const page = document.body.dataset.page || "";
initAuthNavigation();
initNavigation();
highlightCurrentNav();
updateCartBadges();

if (page === "home") {
  initHomePage();
}

if (page === "shop") {
  initShopPage();
}

if (page === "checkout") {
  initCheckoutPage();
}

if (page === "contact") {
  initContactPage();
}

if (page === "order-success") {
  initSuccessPage();
}

if (page === "login" || page === "signup") {
  initAuthPage(page);
}

if (page === "profile") {
  initProfilePage();
}

if (page === "owner") {
  initOwnerPage();
}

async function initHomePage() {
  const [products, config] = await Promise.all([loadProducts(), loadConfig()]);
  const featuredGrid = document.querySelector("#home-featured-products");
  const productCount = document.querySelector("[data-home-product-count]");
  const storeEmail = document.querySelector("[data-store-email]");
  const paymentCopy = document.querySelector("[data-payment-copy]");

  if (productCount) {
    productCount.textContent = `${products.length}+`;
  }

  if (storeEmail) {
    storeEmail.textContent = config.storeEmail || DEFAULT_CONFIG.storeEmail;
  }

  if (paymentCopy) {
    paymentCopy.textContent = config.payment.enabled
      ? "Cash on delivery and secure online checkout are available."
      : "Cash on delivery is available now. Online payment can be enabled from the backend later.";
  }

  if (!featuredGrid) {
    return;
  }

  featuredGrid.innerHTML = products
    .slice(0, 3)
    .map(
      (product) => `
        <article class="product-card">
          <div class="product-visual ${product.visual}" ${productImageStyle(product)}></div>
          <h3>${product.name}</h3>
          <p>${product.description}</p>
          <div class="price-row">
            <span class="price">${formatCurrency(product.price)}</span>
            <span class="stock-pill">${product.stock}</span>
          </div>
          <a class="text-link" href="shop.html?product=${encodeURIComponent(product.id)}">View product</a>
        </article>
      `
    )
    .join("");
}

function initNavigation() {
  const menuToggle = document.querySelector(".menu-toggle");
  const navLinks = document.querySelector(".nav-links");

  if (!menuToggle || !navLinks) {
    return;
  }

  menuToggle.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("is-open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });

  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("is-open");
      menuToggle.setAttribute("aria-expanded", "false");
    });
  });
}

function highlightCurrentNav() {
  const currentPath = window.location.pathname.split("/").pop() || "index.html";

  document.querySelectorAll(".nav-links a").forEach((link) => {
    const linkPath = link.getAttribute("href") || "";

    if (linkPath === currentPath || (currentPath === "" && linkPath === "index.html")) {
      link.setAttribute("aria-current", "page");
    }
  });
}

function initAuthNavigation() {
  const navLinks = document.querySelector(".nav-links");
  const cartLink = document.querySelector(".nav-cart");

  if (!navLinks) {
    return;
  }

  const auth = getAuth();
  const authLink = document.createElement("a");

  if (auth?.user?.role === "admin") {
    authLink.href = "admin.html";
    authLink.className = "nav-auth";
    authLink.textContent = "Admin";
  } else if (auth?.user) {
    authLink.href = "profile.html";
    authLink.className = "nav-auth";
    authLink.textContent = `Account`;
  } else {
    authLink.href = "login.html";
    authLink.className = "nav-auth";
    authLink.textContent = "Login";
  }

  navLinks.insertBefore(authLink, cartLink || null);
}

function initAuthPage(mode) {
  const form = document.querySelector("#auth-form");
  const messageEl = document.querySelector("#auth-message");
  const submitButton = document.querySelector("#auth-submit");
  const auth = getAuth();
  const nextPage = getSafeNextPage();

  if (auth?.token && auth?.user) {
    window.location.href = auth.user.role === "admin" ? "admin.html" : nextPage || "profile.html";
    return;
  }

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const payload = {
      email: String(formData.get("email") || "").trim(),
      password: String(formData.get("password") || "")
    };

    if (mode === "signup") {
      payload.name = String(formData.get("name") || "").trim();
      payload.phone = String(formData.get("phone") || "").trim();
    }

    messageEl.textContent = mode === "signup" ? "Creating your account..." : "Logging you in...";
    submitButton.disabled = true;

    try {
      const result = await apiJson(mode === "signup" ? API.signup : API.login, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      setAuth(result);
      if (result.user?.role === "admin") {
        setOwnerToken(result.adminToken || result.token);
      }
      showToast(mode === "signup" ? "Account created." : "Logged in.");
      window.location.href = result.user?.role === "admin" ? "admin.html" : nextPage || "profile.html";
    } catch (error) {
      messageEl.textContent = error.message || "Unable to continue.";
      submitButton.disabled = false;
    }
  });
}

async function initProfilePage() {
  const auth = getAuth();
  const profileForm = document.querySelector("#profile-form");
  const passwordForm = document.querySelector("#password-form");
  const profileMessage = document.querySelector("#profile-message");
  const passwordMessage = document.querySelector("#password-message");
  const ordersList = document.querySelector("#profile-orders");
  const logoutButton = document.querySelector("#logout-button");

  if (!auth?.token) {
    window.location.href = "login.html";
    return;
  }

  try {
    const [profileResult, orderResult] = await Promise.all([
      apiJson(API.me, { headers: authHeaders() }),
      apiJson(API.profileOrders, { headers: authHeaders() })
    ]);

    setAuth({ ...auth, user: profileResult.user });
    fillProfileForm(profileResult.user);
    renderProfileSummary(profileResult.user, orderResult.orders || []);
    renderOrders(orderResult.orders || []);
  } catch (error) {
    clearAuth();
    window.location.href = "login.html";
    return;
  }

  profileForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(profileForm);
    const payload = {
      name: String(formData.get("name") || "").trim(),
      phone: String(formData.get("phone") || "").trim(),
      address: {
        street: String(formData.get("street") || "").trim(),
        city: String(formData.get("city") || "").trim(),
        state: String(formData.get("state") || "").trim(),
        pincode: String(formData.get("pincode") || "").trim(),
        country: String(formData.get("country") || "").trim()
      }
    };

    profileMessage.textContent = "Saving profile...";

    try {
      const result = await apiJson(API.profile, {
        method: "PUT",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      setAuth({ ...getAuth(), user: result.user });
      fillProfileForm(result.user);
      renderProfileSummary(result.user, []);
      profileMessage.textContent = "Profile saved.";
      showToast("Profile updated.");
    } catch (error) {
      profileMessage.textContent = error.message || "Unable to save profile.";
    }
  });

  passwordForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(passwordForm);
    const payload = {
      currentPassword: String(formData.get("currentPassword") || ""),
      newPassword: String(formData.get("newPassword") || "")
    };

    passwordMessage.textContent = "Changing password...";

    try {
      await apiJson(API.profilePassword, {
        method: "PUT",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      passwordForm.reset();
      passwordMessage.textContent = "Password changed.";
      showToast("Password updated.");
    } catch (error) {
      passwordMessage.textContent = error.message || "Unable to change password.";
    }
  });

  logoutButton?.addEventListener("click", () => {
    clearAuth();
    showToast("Logged out.");
    window.location.href = "login.html";
  });

  function fillProfileForm(user) {
    if (!profileForm) {
      return;
    }

    profileForm.elements.name.value = user.name || "";
    profileForm.elements.email.value = user.email || "";
    profileForm.elements.phone.value = user.phone || "";
    profileForm.elements.street.value = user.address?.street || "";
    profileForm.elements.city.value = user.address?.city || "";
    profileForm.elements.state.value = user.address?.state || "";
    profileForm.elements.pincode.value = user.address?.pincode || "";
    profileForm.elements.country.value = user.address?.country || "India";
  }

  function renderProfileSummary(user, orders) {
    const initials = document.querySelector("#profile-initials");
    const name = document.querySelector("#profile-name");
    const email = document.querySelector("#profile-email");
    const phone = document.querySelector("#profile-phone");
    const orderCount = document.querySelector("#profile-order-count");

    if (initials) {
      initials.textContent = user.name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0].toUpperCase())
        .join("") || "U";
    }
    if (name) name.textContent = user.name || "Your account";
    if (email) email.textContent = user.email || "";
    if (phone) phone.textContent = user.phone || "Add phone number";
    if (orderCount && orders.length) orderCount.textContent = String(orders.length);
  }

  function renderOrders(orders) {
    if (!ordersList) {
      return;
    }

    const orderCount = document.querySelector("#profile-order-count");
    if (orderCount) {
      orderCount.textContent = String(orders.length);
    }

    if (!orders.length) {
      ordersList.innerHTML = '<p class="empty-state">No orders yet. Your account is ready when you place one.</p>';
      return;
    }

    ordersList.innerHTML = orders
      .map((order) => `
        <article class="profile-order">
          <div>
            <strong>${order.id}</strong>
            <p>${new Date(order.createdAt).toLocaleDateString("en-IN")} - ${order.status}</p>
          </div>
          <div>
            <strong>${formatCurrency(order.totals?.total || 0)}</strong>
            <p>${(order.items || []).length} item${(order.items || []).length === 1 ? "" : "s"}</p>
          </div>
        </article>
      `)
      .join("");
  }
}

async function initOwnerPage() {
  const loginPanel = document.querySelector("#owner-login-panel");
  const dashboard = document.querySelector("#owner-dashboard");
  const loginForm = document.querySelector("#owner-login-form");
  const productForm = document.querySelector("#owner-product-form");
  const productList = document.querySelector("#owner-product-list");
  const loginMessage = document.querySelector("#owner-login-message");
  const productMessage = document.querySelector("#owner-product-message");
  const logoutButton = document.querySelector("#owner-logout-button");
  const resetButton = document.querySelector("#owner-reset-button");
  const exportButton = document.querySelector("#admin-order-export-button");
  const exportMessage = document.querySelector("#admin-export-message");
  const refreshOrdersButton = document.querySelector("#admin-refresh-orders-button");
  const summaryGrid = document.querySelector("#admin-summary-grid");
  const orderList = document.querySelector("#admin-order-list");
  const userList = document.querySelector("#admin-user-list");
  const contactList = document.querySelector("#admin-contact-list");
  let products = [];
  let orders = [];
  let users = [];
  let contacts = [];
  let editingProductId = "";

  if (getOwnerToken()) {
    await showOwnerDashboard();
  } else {
    showOwnerLogin();
  }

  loginForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(loginForm);

    loginMessage.textContent = "Checking admin credentials...";

    try {
      const result = await apiJson(API.ownerLogin, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminId: String(formData.get("adminId") || "").trim(),
          password: String(formData.get("password") || "")
        })
      });

      setOwnerToken(result.token);
      loginForm.reset();
      await showOwnerDashboard();
      showToast("Admin logged in.");
    } catch (error) {
      loginMessage.textContent = error.message || "Unable to login.";
    }
  });

  productForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(productForm);
    const payload = {
      name: String(formData.get("name") || "").trim(),
      category: String(formData.get("category") || "").trim(),
      price: Number(formData.get("price") || 0),
      rating: Number(formData.get("rating") || 4.8),
      age: String(formData.get("age") || "").trim(),
      stock: String(formData.get("stock") || "").trim(),
      delivery: String(formData.get("delivery") || "").trim(),
      visual: String(formData.get("visual") || "").trim(),
      image: String(formData.get("image") || "").trim(),
      description: String(formData.get("description") || "").trim(),
      highlights: String(formData.get("highlights") || "")
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean)
    };
    const imageFile = formData.get("imageFile");

    if (imageFile && imageFile.size) {
      payload.image = await readImageFile(imageFile);
    }

    const endpoint = editingProductId
      ? `${API.ownerProducts}/${encodeURIComponent(editingProductId)}`
      : API.ownerProducts;

    const wasEditing = Boolean(editingProductId);
    productMessage.textContent = wasEditing ? "Updating product..." : "Adding product...";

    try {
      const result = await apiJson(endpoint, {
        method: wasEditing ? "PUT" : "POST",
        headers: { ...ownerHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      products = result.products || [];
      renderOwnerProducts();
      resetOwnerForm();
      productMessage.textContent = wasEditing ? "Product updated." : "Product added.";
      showToast(wasEditing ? "Product updated." : "Product added.");
    } catch (error) {
      productMessage.textContent = error.message || "Unable to save product.";
    }
  });

  productList?.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-owner-action]");
    if (!button) {
      return;
    }

    const productId = button.dataset.productId;
    const product = products.find((entry) => entry.id === productId);

    if (!product) {
      return;
    }

    if (button.dataset.ownerAction === "edit") {
      editingProductId = product.id;
      fillOwnerForm(product);
      productMessage.textContent = `Editing ${product.name}. Change details and click Update Product.`;
      productForm.scrollIntoView({ behavior: "smooth", block: "start" });
      productForm.elements.name.focus();
    }

    if (button.dataset.ownerAction === "delete") {
      if (!window.confirm(`Remove ${product.name} from the shop?`)) {
        return;
      }

      productMessage.textContent = "Removing product...";

      try {
        const result = await apiJson(`${API.ownerProducts}/${encodeURIComponent(product.id)}`, {
          method: "DELETE",
          headers: ownerHeaders()
        });
        products = result.products || [];
        renderOwnerProducts();
        resetOwnerForm();
        productMessage.textContent = "Product removed.";
        showToast("Product removed.");
      } catch (error) {
        productMessage.textContent = error.message || "Unable to remove product.";
      }
    }
  });

  resetButton?.addEventListener("click", resetOwnerForm);

  exportButton?.addEventListener("click", downloadOrderData);
  refreshOrdersButton?.addEventListener("click", refreshAdminOrders);

  logoutButton?.addEventListener("click", () => {
    clearOwnerToken();
    clearAuth();
    showOwnerLogin();
    showToast("Admin logged out.");
  });

  async function showOwnerDashboard() {
    loginForm.hidden = true;
    dashboard.hidden = false;
    productMessage.textContent = "Loading products...";

    try {
      const [productResult, orderResult] = await Promise.all([
        apiJson(API.ownerProducts, { headers: ownerHeaders() }),
        apiJson(API.ownerOrders, { headers: ownerHeaders() })
      ]);

      products = productResult.products || [];
      orders = orderResult.orders || [];
      users = [];
      contacts = [];
      renderAdminSummary();
      renderAdminOrders();
      renderAdminUsers();
      renderAdminContacts();
      renderOwnerProducts();
      productMessage.textContent = "";
    } catch (error) {
      clearOwnerToken();
      showOwnerLogin();
      loginMessage.textContent = error.message || "Admin login expired.";
    }
  }

  function showOwnerLogin() {
    loginForm.hidden = false;
    dashboard.hidden = true;
  }

  function renderAdminSummary() {
    if (!summaryGrid) {
      return;
    }

    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.totals?.total || 0), 0);
    const pendingOrders = orders.filter((order) => /pending/i.test(order.status || order.paymentStatus || "")).length;

    summaryGrid.innerHTML = `
      <article class="admin-stat"><span>Products</span><strong>${products.length}</strong></article>
      <article class="admin-stat"><span>Orders</span><strong>${orders.length}</strong></article>
      <article class="admin-stat"><span>Revenue</span><strong>${formatCurrency(totalRevenue)}</strong></article>
      <article class="admin-stat"><span>Pending</span><strong>${pendingOrders}</strong></article>
    `;
  }

  function renderAdminOrders() {
    if (!orderList) {
      return;
    }

    if (!orders.length) {
      orderList.innerHTML = '<p class="empty-state">No orders have been placed yet.</p>';
      return;
    }

    orderList.innerHTML = orders
      .map((order) => {
        const itemCount = (order.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0);
        const itemNames = (order.items || [])
          .map((item) => `${escapeHtml(item.name || item.id || "Item")} x ${Number(item.quantity || 1)}`)
          .join(", ");
        const address = [
          order.customer?.address,
          order.customer?.city,
          order.customer?.state,
          order.customer?.pincode
        ].filter(Boolean).join(", ");

        return `
          <article class="admin-record">
            <div>
              <strong>${escapeHtml(order.id)}</strong>
              <p>${escapeHtml(order.customer?.name || "Customer")} - ${escapeHtml(order.customer?.phone || "")}</p>
              <p>${escapeHtml(order.customer?.email || "")}</p>
              <p>${escapeHtml(address)}</p>
              <p>${itemNames || "No item details"}</p>
            </div>
            <div class="admin-record__meta">
              <strong>${formatCurrency(order.totals?.total || 0)}</strong>
              <span>${itemCount} item${itemCount === 1 ? "" : "s"}</span>
              <span>${escapeHtml(order.paymentMethod || "")} - ${escapeHtml(order.status || "")}</span>
              <span>${formatDate(order.createdAt)}</span>
            </div>
          </article>
        `;
      })
      .join("");
  }

  function renderAdminUsers() {
    if (!userList) {
      return;
    }

    if (!users.length) {
      userList.innerHTML = '<p class="empty-state">No customer accounts yet.</p>';
      return;
    }

    userList.innerHTML = users
      .map((user) => {
        const address = [
          user.address?.street,
          user.address?.city,
          user.address?.state,
          user.address?.pincode,
          user.address?.country
        ].filter(Boolean).join(", ");

        return `
          <article class="admin-record">
            <div>
              <strong>${escapeHtml(user.name || "Customer")}</strong>
              <p>${escapeHtml(user.email || "")}</p>
              <p>${escapeHtml(user.phone || "No phone saved")}</p>
              <p>${escapeHtml(address || "No address saved")}</p>
            </div>
            <div class="admin-record__meta">
              <span>${escapeHtml(user.id || "")}</span>
              <span>${formatDate(user.createdAt)}</span>
            </div>
          </article>
        `;
      })
      .join("");
  }

  function renderAdminContacts() {
    if (!contactList) {
      return;
    }

    if (!contacts.length) {
      contactList.innerHTML = '<p class="empty-state">No contact messages yet.</p>';
      return;
    }

    contactList.innerHTML = contacts
      .map((contact) => `
        <article class="admin-record">
          <div>
            <strong>${escapeHtml(contact.name || "Visitor")}</strong>
            <p>${escapeHtml(contact.email || "")} ${contact.phone ? `- ${escapeHtml(contact.phone)}` : ""}</p>
            <p>${escapeHtml(contact.message || "")}</p>
          </div>
          <div class="admin-record__meta">
            <span>${escapeHtml(contact.id || "")}</span>
            <span>${formatDate(contact.createdAt)}</span>
          </div>
        </article>
      `)
      .join("");
  }

  async function refreshAdminOrders() {
    if (refreshOrdersButton) {
      refreshOrdersButton.disabled = true;
    }

    if (exportMessage) {
      exportMessage.textContent = "Refreshing orders...";
    }

    try {
      const orderResult = await apiJson(API.ownerOrders, { headers: ownerHeaders() });
      orders = orderResult.orders || [];
      renderAdminSummary();
      renderAdminOrders();
      if (exportMessage) {
        exportMessage.textContent = "Orders refreshed.";
      }
    } catch (error) {
      if (exportMessage) {
        exportMessage.textContent = error.message || "Unable to refresh orders.";
      }
    } finally {
      if (refreshOrdersButton) {
        refreshOrdersButton.disabled = false;
      }
    }
  }

  async function downloadOrderData() {
    if (!exportButton) {
      return;
    }

    exportButton.disabled = true;
    if (exportMessage) {
      exportMessage.textContent = "Preparing download...";
    }

    try {
      const response = await fetch(API.ownerOrdersExport, { headers: ownerHeaders() });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Unable to download order data.");
      }

      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `joybox-orders-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(downloadUrl);

      if (exportMessage) {
        exportMessage.textContent = "Download started.";
      }
      showToast("Order data download started.");
    } catch (error) {
      if (exportMessage) {
        exportMessage.textContent = error.message || "Unable to download data.";
      }
    } finally {
      exportButton.disabled = false;
    }
  }

  function renderOwnerProducts() {
    if (!productList) {
      return;
    }

    if (!products.length) {
      productList.innerHTML = '<p class="empty-state">No products in the catalog yet.</p>';
      return;
    }

    productList.innerHTML = products
      .map((product) => `
        <article class="owner-product">
          <div class="owner-product__thumb ${product.visual}" ${productImageStyle(product)}></div>
          <div>
            <strong>${product.name}</strong>
            <p>${product.category} - ${formatCurrency(product.price)} - ${product.stock}</p>
          </div>
          <div class="owner-product__actions">
            <button class="button button-secondary" type="button" data-owner-action="edit" data-product-id="${product.id}">Edit Product</button>
            <button class="button button-secondary" type="button" data-owner-action="delete" data-product-id="${product.id}">Remove</button>
          </div>
        </article>
      `)
      .join("");
  }

  function fillOwnerForm(product) {
    productForm.classList.add("is-editing");
    productForm.elements.name.value = product.name || "";
    productForm.elements.category.value = product.category || "";
    productForm.elements.price.value = product.price || "";
    productForm.elements.rating.value = product.rating || "";
    productForm.elements.age.value = product.age || "";
    productForm.elements.stock.value = product.stock || "";
    productForm.elements.delivery.value = product.delivery || "";
    productForm.elements.visual.value = product.visual || "product-visual--one";
    productForm.elements.image.value = product.image || "";
    productForm.elements.description.value = product.description || "";
    productForm.elements.highlights.value = (product.highlights || []).join(", ");
    productForm.querySelector("[data-owner-submit]").textContent = "Update Product";
  }

  function resetOwnerForm() {
    editingProductId = "";
    productForm.classList.remove("is-editing");
    productForm.reset();
    productForm.elements.category.value = "gift-box";
    productForm.elements.rating.value = "4.8";
    productForm.elements.stock.value = "In stock";
    productForm.elements.delivery.value = "Delivery in 2-4 days";
    productForm.elements.visual.value = "product-visual--one";
    productForm.elements.image.value = "";
    productForm.querySelector("[data-owner-submit]").textContent = "Add Product";
  }
}

async function initShopPage() {
  const products = await loadProducts();
  const url = new URL(window.location.href);
  const requestedFilter = String(url.searchParams.get("category") || "all");
  const requestedSearch = String(url.searchParams.get("search") || "").trim();
  const requestedProductId = String(url.searchParams.get("product") || "").trim();
  const catalogGrid = document.querySelector("#catalog-grid");
  const filterButtons = document.querySelectorAll("[data-filter]");
  const productSearch = document.querySelector("#product-search");
  const productSort = document.querySelector("#product-sort");
  const catalogCount = document.querySelector("#catalog-count");
  const cartItems = document.querySelector("#cart-items");
  const cartCount = document.querySelector("#cart-count");
  const cartSubtotal = document.querySelector("#cart-subtotal");
  const cartShipping = document.querySelector("#cart-shipping");
  const cartTotal = document.querySelector("#cart-total");
  const checkoutButton = document.querySelector("#checkout-button");
  const modal = document.querySelector("#product-modal");
  const modalVisual = document.querySelector("#modal-visual");
  const modalCategory = document.querySelector("#modal-category");
  const modalTitle = document.querySelector("#modal-title");
  const modalRating = document.querySelector("#modal-rating");
  const modalDescription = document.querySelector("#modal-description");
  const modalMeta = document.querySelector("#modal-meta");
  const modalPrice = document.querySelector("#modal-price");
  const modalStock = document.querySelector("#modal-stock");
  const modalAddCart = document.querySelector("#modal-add-cart");
  const modalBuyNow = document.querySelector("#modal-buy-now");

  let activeFilter = filterButtons.length && filterButtons[0]
    ? Array.from(filterButtons).some((button) => button.dataset.filter === requestedFilter)
      ? requestedFilter
      : "all"
    : "all";
  let searchValue = requestedSearch.toLowerCase();
  let activeSort = String(url.searchParams.get("sort") || "featured");
  let selectedProductId = requestedProductId || products[0]?.id || "";
  let cart = getCart();

  syncActiveFilterButton();
  if (productSearch) {
    productSearch.value = requestedSearch;
  }
  if (productSort) {
    productSort.value = activeSort;
  }
  renderCatalog();
  renderCart();

  if (requestedProductId && products.some((product) => product.id === requestedProductId)) {
    openModal(requestedProductId);
  }

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      activeFilter = button.dataset.filter || "all";
      syncActiveFilterButton();
      syncShopUrl();
      renderCatalog();
    });
  });

  productSearch?.addEventListener("input", (event) => {
    searchValue = event.target.value.trim().toLowerCase();
    syncShopUrl();
    renderCatalog();
  });

  productSort?.addEventListener("change", (event) => {
    activeSort = event.target.value || "featured";
    syncShopUrl();
    renderCatalog();
  });

  checkoutButton?.addEventListener("click", () => {
    if (!cart.length) {
      showToast("Add something to the cart first.");
      return;
    }

    if (!requireLoginToBuy("checkout.html")) {
      return;
    }

    window.location.href = "checkout.html";
  });

  modalAddCart?.addEventListener("click", () => {
    const product = getSelectedProduct();
    if (!product) {
      return;
    }

    cart = addToCart(product.id, 1);
    renderCart();
    closeModal();
    showToast(`${product.name} added to cart.`);
  });

  modalBuyNow?.addEventListener("click", () => {
    const product = getSelectedProduct();
    if (!product) {
      return;
    }

    if (!requireLoginToBuy("checkout.html")) {
      return;
    }

    cart = addToCart(product.id, 1);
    renderCart();
    window.location.href = "checkout.html";
  });

  document.querySelectorAll("[data-close-modal]").forEach((element) => {
    element.addEventListener("click", closeModal);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeModal();
    }
  });

  function getSelectedProduct() {
    return products.find((product) => product.id === selectedProductId) || products[0] || null;
  }

  function syncActiveFilterButton() {
    filterButtons.forEach((chip) => {
      chip.classList.toggle("is-active", chip.dataset.filter === activeFilter);
    });
  }

  function syncShopUrl() {
    const nextUrl = new URL(window.location.href);

    if (activeFilter && activeFilter !== "all") {
      nextUrl.searchParams.set("category", activeFilter);
    } else {
      nextUrl.searchParams.delete("category");
    }

    if (searchValue) {
      nextUrl.searchParams.set("search", searchValue);
    } else {
      nextUrl.searchParams.delete("search");
    }

    if (activeSort && activeSort !== "featured") {
      nextUrl.searchParams.set("sort", activeSort);
    } else {
      nextUrl.searchParams.delete("sort");
    }

    nextUrl.searchParams.delete("product");
    window.history.replaceState({}, "", nextUrl);
  }

  function getFilteredProducts() {
    const filtered = products.filter((product) => {
      const matchesFilter = activeFilter === "all" || product.category === activeFilter;
      const matchesSearch =
        !searchValue ||
        product.name.toLowerCase().includes(searchValue) ||
        product.description.toLowerCase().includes(searchValue);

      return matchesFilter && matchesSearch;
    });

    return filtered.sort((a, b) => {
      if (activeSort === "price-low") return a.price - b.price;
      if (activeSort === "price-high") return b.price - a.price;
      if (activeSort === "rating") return b.rating - a.rating;
      return products.indexOf(a) - products.indexOf(b);
    });
  }

  function renderCatalog() {
    const filteredProducts = getFilteredProducts();

    if (catalogCount) {
      catalogCount.textContent = `${filteredProducts.length} product${filteredProducts.length === 1 ? "" : "s"} found`;
    }

    if (!filteredProducts.length) {
      catalogGrid.innerHTML = '<p class="empty-state">No products match that search yet.</p>';
      return;
    }

    catalogGrid.innerHTML = filteredProducts
      .map((product) => `
        <article class="catalog-card">
          <div class="catalog-visual ${product.visual}" ${productImageStyle(product)}></div>
          <div class="catalog-card__top">
            <div>
              <span class="catalog-category">${product.category.replace("-", " ")}</span>
              <h3>${product.name}</h3>
              <p>${product.description}</p>
            </div>
          </div>
          <div class="catalog-card__meta">
            <div class="meta-card"><strong>Age</strong><span>${product.age}</span></div>
            <div class="meta-card"><strong>Delivery</strong><span>${product.delivery}</span></div>
          </div>
          <div class="catalog-buy-row">
            <span class="catalog-price">${formatCurrency(product.price)}</span>
            <span class="rating-pill">${product.rating} rating</span>
          </div>
          <div class="catalog-card__actions">
            <button class="button button-secondary" type="button" data-action="details" data-product-id="${product.id}">View Details</button>
            <button class="button button-secondary" type="button" data-action="cart" data-product-id="${product.id}">Add to Cart</button>
            <button class="button button-primary" type="button" data-action="buy" data-product-id="${product.id}">Buy Now</button>
          </div>
        </article>
      `)
      .join("");

    catalogGrid.querySelectorAll("[data-action]").forEach((button) => {
      button.addEventListener("click", () => {
        const productId = button.dataset.productId;
        const action = button.dataset.action;
        const product = products.find((entry) => entry.id === productId);

        if (!product) {
          return;
        }

        if (action === "details") {
          openModal(product.id);
        }

        if (action === "cart") {
          cart = addToCart(product.id, 1);
          renderCart();
          showToast(`${product.name} added to cart.`);
        }

        if (action === "buy") {
          if (!requireLoginToBuy("checkout.html")) {
            return;
          }

          cart = addToCart(product.id, 1);
          renderCart();
          window.location.href = "checkout.html";
        }
      });
    });
  }

  function renderCart() {
    const detailedItems = hydrateCart(cart, products);
    const totals = calculateTotals(detailedItems);

    if (!detailedItems.length) {
      cartItems.innerHTML = '<p class="empty-state">Your cart is empty. Add a product to get started.</p>';
      cartCount.textContent = "0 items";
      cartSubtotal.textContent = formatCurrency(0);
      cartShipping.textContent = formatCurrency(SHIPPING_FEE);
      cartTotal.textContent = formatCurrency(SHIPPING_FEE);
      updateCartBadges();
      return;
    }

    cartItems.innerHTML = detailedItems
      .map((item) => `
        <article class="cart-item">
          <div class="cart-item__row">
            <p class="cart-item__name">${item.name}</p>
            <strong>${formatCurrency(item.total)}</strong>
          </div>
          <p>${item.quantity} x ${formatCurrency(item.price)}</p>
          <div class="cart-item__controls">
            <button class="qty-button" type="button" data-cart-action="decrease" data-product-id="${item.id}">-</button>
            <span>${item.quantity}</span>
            <button class="qty-button" type="button" data-cart-action="increase" data-product-id="${item.id}">+</button>
            <button class="remove-link" type="button" data-cart-action="remove" data-product-id="${item.id}">Remove</button>
          </div>
        </article>
      `)
      .join("");

    cartCount.textContent = `${totals.count} item${totals.count === 1 ? "" : "s"}`;
    cartSubtotal.textContent = formatCurrency(totals.subtotal);
    cartShipping.textContent = totals.shipping === 0 ? "Free" : formatCurrency(totals.shipping);
    cartTotal.textContent = formatCurrency(totals.total);
    updateCartBadges();

    cartItems.querySelectorAll("[data-cart-action]").forEach((button) => {
      button.addEventListener("click", () => {
        const productId = button.dataset.productId;
        const action = button.dataset.cartAction;

        if (action === "increase") {
          cart = addToCart(productId, 1);
        }

        if (action === "decrease") {
          cart = changeCartQuantity(productId, -1);
        }

        if (action === "remove") {
          cart = removeFromCart(productId);
        }

        renderCart();
      });
    });
  }

  function openModal(productId) {
    const product = products.find((item) => item.id === productId);

    if (!product || !modal) {
      return;
    }

    selectedProductId = product.id;
    modalVisual.className = `product-modal__visual ${product.visual}`;
    modalVisual.style.backgroundImage = product.image ? `url("${escapeAttribute(product.image)}")` : "";
    modalCategory.textContent = product.category.replace("-", " ");
    modalTitle.textContent = product.name;
    modalRating.textContent = `${product.rating} rating`;
    modalDescription.textContent = product.description;
    modalPrice.textContent = formatCurrency(product.price);
    modalStock.textContent = product.stock;
    modalMeta.innerHTML = `
      <div class="meta-card"><strong>Age Group</strong><span>${product.age}</span></div>
      <div class="meta-card"><strong>Delivery</strong><span>${product.delivery}</span></div>
      <div class="meta-card"><strong>Highlight</strong><span>${product.highlights[0]}</span></div>
      <div class="meta-card"><strong>Why it sells</strong><span>${product.highlights[1]}</span></div>
    `;

    modal.hidden = false;
    document.body.style.overflow = "hidden";
    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.set("product", product.id);
    window.history.replaceState({}, "", nextUrl);
  }

  function closeModal() {
    if (!modal) {
      return;
    }

    modal.hidden = true;
    document.body.style.overflow = "";
    syncShopUrl();
  }
}

async function initCheckoutPage() {
  const [products, config] = await Promise.all([loadProducts(), loadConfig()]);
  const form = document.querySelector("#checkout-form");
  const checkoutItems = document.querySelector("#checkout-items");
  const subtotalEl = document.querySelector("#checkout-subtotal");
  const shippingEl = document.querySelector("#shipping-charge");
  const totalEl = document.querySelector("#checkout-total");
  const messageEl = document.querySelector("#checkout-message");
  const paymentStatus = document.querySelector("#payment-status");
  const placeOrderButton = document.querySelector("#place-order-button");
  const onlineOption = document.querySelector('input[name="paymentMethod"][value="razorpay"]');
  const codOption = document.querySelector('input[name="paymentMethod"][value="cod"]');
  const onlineOptionCard = onlineOption?.closest(".payment-option");
  const cart = getCart();
  const hydratedItems = hydrateCart(cart, products);
  const totals = calculateTotals(hydratedItems);
  const auth = getAuth();

  if (!auth?.token || !auth?.user) {
    showToast("Please login before checkout.");
    window.location.href = "login.html?next=checkout.html";
    return;
  }

  if (auth?.user && form) {
    form.elements.name.value = auth.user.name || "";
    form.elements.email.value = auth.user.email || "";
    form.elements.phone.value = auth.user.phone || "";
    form.elements.address.value = auth.user.address?.street || "";
    form.elements.city.value = auth.user.address?.city || "";
    form.elements.state.value = auth.user.address?.state || "";
    form.elements.pincode.value = auth.user.address?.pincode || "";
  }

  renderCheckoutSummary();
  updatePaymentStatus();
  syncPaymentOptions();

  if (!hydratedItems.length) {
    messageEl.textContent = "Your cart is empty. Please add products from the shop page.";
    placeOrderButton.disabled = true;
  }

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!hydratedItems.length) {
      return;
    }

    const formData = new FormData(form);
    const customer = {
      name: String(formData.get("name") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      phone: String(formData.get("phone") || "").trim(),
      address: String(formData.get("address") || "").trim(),
      city: String(formData.get("city") || "").trim(),
      state: String(formData.get("state") || "").trim(),
      pincode: String(formData.get("pincode") || "").trim()
    };
    const paymentMethod = String(formData.get("paymentMethod") || "razorpay");

    if (paymentMethod === "razorpay" && !config.payment.enabled) {
      messageEl.textContent = "Online payment is not enabled yet. Please choose cash on delivery.";
      placeOrderButton.disabled = false;
      return;
    }

    messageEl.textContent = "Processing your order...";
    placeOrderButton.disabled = true;

    try {
      const orderResponse = await apiJson(API.orders, {
        method: "POST",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({
          customer,
          items: cart,
          paymentMethod
        })
      });

      if (orderResponse.mode === "cod") {
        clearCart();
        window.location.href = `order-success.html?order=${encodeURIComponent(orderResponse.orderNumber)}&payment=Cash%20On%20Delivery&amount=${orderResponse.totals.total}`;
        return;
      }

      if (orderResponse.mode === "razorpay") {
        await launchRazorpay(orderResponse, customer);
        return;
      }
    } catch (error) {
      if (/login/i.test(error.message || "")) {
        clearAuth();
        window.location.href = "login.html?next=checkout.html";
        return;
      }

      messageEl.textContent = error.message || "Unable to place order.";
      placeOrderButton.disabled = false;
    }
  });

  function renderCheckoutSummary() {
    if (!hydratedItems.length) {
      checkoutItems.innerHTML = '<p class="empty-state">Your cart is empty.</p>';
      subtotalEl.textContent = formatCurrency(0);
      shippingEl.textContent = formatCurrency(SHIPPING_FEE);
      totalEl.textContent = formatCurrency(SHIPPING_FEE);
      return;
    }

    checkoutItems.innerHTML = hydratedItems
      .map((item) => `
        <article class="checkout-item">
          <div class="cart-item__row">
            <p class="checkout-item__name">${item.name}</p>
            <strong>${formatCurrency(item.total)}</strong>
          </div>
          <p>${item.quantity} x ${formatCurrency(item.price)}</p>
        </article>
      `)
      .join("");

    subtotalEl.textContent = formatCurrency(totals.subtotal);
    shippingEl.textContent = totals.shipping === 0 ? "Free" : formatCurrency(totals.shipping);
    totalEl.textContent = formatCurrency(totals.total);
  }

  function updatePaymentStatus() {
    if (!paymentStatus) {
      return;
    }

    paymentStatus.textContent = config.payment.enabled ? "Online payment ready" : "Cash on delivery active";
  }

  function syncPaymentOptions() {
    if (!onlineOption || !codOption) {
      return;
    }

    onlineOption.disabled = !config.payment.enabled;

    if (onlineOptionCard) {
      onlineOptionCard.classList.toggle("payment-option--disabled", !config.payment.enabled);
    }

    if (!config.payment.enabled && onlineOption.checked) {
      codOption.checked = true;
    }
  }

  async function launchRazorpay(orderResponse, customer) {
    try {
      await loadRazorpayScript();
    } catch (error) {
      messageEl.textContent = "Unable to load Razorpay checkout script.";
      placeOrderButton.disabled = false;
      return;
    }

    const options = {
      key: orderResponse.gateway.keyId,
      amount: orderResponse.gateway.amount,
      currency: orderResponse.gateway.currency,
      name: orderResponse.gateway.name,
      description: orderResponse.gateway.description,
      order_id: orderResponse.gateway.orderId,
      handler: async (paymentResponse) => {
        try {
          const verification = await apiJson(API.verifyPayment, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              localOrderId: orderResponse.id,
              ...paymentResponse
            })
          });

          clearCart();
          window.location.href = `order-success.html?order=${encodeURIComponent(verification.orderNumber)}&payment=Paid%20Online&amount=${verification.totals.total}`;
        } catch (error) {
          messageEl.textContent = error.message || "Payment verification failed.";
          placeOrderButton.disabled = false;
        }
      },
      prefill: {
        name: customer.name,
        email: customer.email,
        contact: customer.phone
      },
      theme: {
        color: "#f26f5c"
      },
      modal: {
        ondismiss: () => {
          messageEl.textContent = "Payment popup closed before completion.";
          placeOrderButton.disabled = false;
        }
      }
    };

    const razorpay = new window.Razorpay(options);
    razorpay.open();
  }
}

async function initContactPage() {
  const form = document.querySelector("#contact-form");
  const messageEl = document.querySelector("#contact-message");

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const payload = {
      name: String(formData.get("name") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      phone: String(formData.get("phone") || "").trim(),
      message: [String(formData.get("topic") || "").trim(), String(formData.get("message") || "").trim()]
        .filter(Boolean)
        .join("\n\n")
    };

    messageEl.textContent = "Sending...";

    try {
      const result = await apiJson(API.contact, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      messageEl.textContent = result.message || "Message sent successfully.";
      form.reset();
      showToast("Message sent.");
    } catch (error) {
      messageEl.textContent = error.message || "Unable to send message.";
    }
  });
}

function initSuccessPage() {
  const params = new URLSearchParams(window.location.search);
  const orderId = params.get("order") || "Order created";
  const payment = params.get("payment") || "Payment status available at checkout";
  const amount = Number(params.get("amount") || 0);

  document.querySelector("#success-order-id").textContent = orderId;
  document.querySelector("#success-payment-method").textContent = payment;
  document.querySelector("#success-amount").textContent = amount ? `Total paid: ${formatCurrency(amount)}` : "Your order is now in the system.";
}

async function loadProducts() {
  try {
    return await apiJson(API.products);
  } catch (error) {
    return DEFAULT_PRODUCTS;
  }
}

async function loadConfig() {
  try {
    return await apiJson(API.config);
  } catch (error) {
    return DEFAULT_CONFIG;
  }
}

async function apiJson(url, options = {}) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Request failed.");
  }

  return data;
}

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY) || "[]");
  } catch (error) {
    return [];
  }
}

function setCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadges();
  return cart;
}

function clearCart() {
  localStorage.removeItem(CART_KEY);
  updateCartBadges();
}

function getAuth() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_KEY) || "null");
  } catch (error) {
    return null;
  }
}

function setAuth(auth) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
}

function clearAuth() {
  localStorage.removeItem(AUTH_KEY);
}

function authHeaders() {
  const auth = getAuth();
  return auth?.token ? { Authorization: `Bearer ${auth.token}` } : {};
}

function requireLoginToBuy(nextPage) {
  const auth = getAuth();

  if (auth?.token && auth?.user) {
    return true;
  }

  showToast("Please login before buying.");
  window.location.href = `login.html?next=${encodeURIComponent(nextPage || "checkout.html")}`;
  return false;
}

function getSafeNextPage() {
  const next = new URLSearchParams(window.location.search).get("next") || "";

  if (/^[a-z0-9-]+\.html(?:[?#].*)?$/i.test(next)) {
    return next;
  }

  return "";
}

function getOwnerToken() {
  const ownerToken = localStorage.getItem(OWNER_KEY) || "";
  if (ownerToken) {
    return ownerToken;
  }

  const auth = getAuth();
  return auth?.user?.role === "admin" ? auth.token || "" : "";
}

function setOwnerToken(token) {
  localStorage.setItem(OWNER_KEY, token);
}

function clearOwnerToken() {
  localStorage.removeItem(OWNER_KEY);
}

function ownerHeaders() {
  const token = getOwnerToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function addToCart(productId, quantity) {
  const cart = getCart();
  const existing = cart.find((item) => item.id === productId);

  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({ id: productId, quantity });
  }

  return setCart(cart);
}

function changeCartQuantity(productId, delta) {
  const cart = getCart()
    .map((item) => {
      if (item.id !== productId) {
        return item;
      }

      return { ...item, quantity: item.quantity + delta };
    })
    .filter((item) => item.quantity > 0);

  return setCart(cart);
}

function removeFromCart(productId) {
  const cart = getCart().filter((item) => item.id !== productId);
  return setCart(cart);
}

function hydrateCart(cart, products) {
  return cart
    .map((item) => {
      const product = products.find((entry) => entry.id === item.id);
      return product
        ? {
            ...product,
            quantity: item.quantity,
            total: product.price * item.quantity
          }
        : null;
    })
    .filter(Boolean);
}

function productImageStyle(product) {
  return product.image ? `style="background-image: url('${escapeAttribute(product.image)}')"` : "";
}

function escapeAttribute(value) {
  return String(value || "").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function readImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Unable to read image file."));
    reader.readAsDataURL(file);
  });
}

function calculateTotals(items) {
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const shipping = subtotal >= SHIPPING_THRESHOLD || subtotal === 0 ? 0 : SHIPPING_FEE;
  const total = subtotal + shipping;
  const count = items.reduce((sum, item) => sum + item.quantity, 0);

  return { subtotal, shipping, total, count };
}

function updateCartBadges() {
  const count = getCart().reduce((sum, item) => sum + item.quantity, 0);
  document.querySelectorAll("[data-cart-count]").forEach((badge) => {
    badge.textContent = String(count);
  });
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(amount);
}

function formatDate(value) {
  if (!value) {
    return "No date";
  }

  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

let toastTimer;
function showToast(message) {
  const toast = document.querySelector("#toast");
  if (!toast) {
    return;
  }

  toast.textContent = message;
  toast.hidden = false;
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    toast.hidden = true;
  }, 2200);
}

function loadRazorpayScript() {
  if (window.Razorpay) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}
