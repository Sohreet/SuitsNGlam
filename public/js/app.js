/******************************************************
 * SUITS N GLAM — APP.JS (CLEAN + OPTIMIZED)
 ******************************************************/

console.log("APP.JS LOADED");

/* ------------------ CONFIG ------------------ */
const ADMINS = ["sohabrar10@gmail.com"];
const GOOGLE_CLIENT_ID =
  "653374521156-6retcia1fiu5dvmbjik9sq89ontrkmvt.apps.googleusercontent.com";

const DEFAULTS = {
  userPicture: "/images/default-user.png",
  productImage: "/images/default-product.png",
  currencySymbol: "₹",
};

/* ------------------ UTILITIES ------------------ */
const noop = () => {};
const qs = (sel, root = document) => root.querySelector(sel);
const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const byId = (id) => document.getElementById(id);

function escapeHtml(str) {
  if (!str) return "";
  return String(str).replace(/[&<>"']/g, (m) => {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    }[m];
  });
}

function safeJSONParse(v, f = null) {
  try {
    return JSON.parse(v) ?? f;
  } catch {
    return f;
  }
}

function safeJSONSerialize(v) {
  try {
    return JSON.stringify(v);
  } catch {
    return null;
  }
}

/* ------------------ USER STORAGE ------------------ */
function getUser() {
  return safeJSONParse(localStorage.getItem("sg_user"), null);
}

function saveUserToLocal(obj) {
  if (!obj?.email) return;
  localStorage.setItem("sg_user", safeJSONSerialize(obj));
}

function clearUserLocal() {
  localStorage.removeItem("sg_user");
  localStorage.removeItem("adminLoggedIn");
}

/* ------------------ LOGIN UI ------------------ */
function setupLoginUI() {
  const btn = byId("loginBtn");
  const icon = byId("accountIcon");
  const adminBadge = byId("adminBadgeNav");
  const user = getUser();

  if (!btn || !icon) return;

  if (!user) {
    btn.style.display = "inline-block";
    icon.style.display = "none";
    if (adminBadge) adminBadge.style.display = "none";
    return;
  }

  btn.style.display = "none";
  icon.src = user.picture || DEFAULTS.userPicture;
  icon.style.display = "inline-block";

  if (ADMINS.includes(user.email)) {
    if (adminBadge) adminBadge.style.display = "inline-block";
    icon.onclick = () => (location.href = "admin.html");
  } else {
    if (adminBadge) adminBadge.style.display = "none";
    icon.onclick = () => (location.href = "account.html");
  }
}

function attachLoginButton() {
  const btn = byId("loginBtn");
  if (!btn) return;
  btn.onclick = () => (location.href = "login.html");
}

/* ------------------ LOGOUT ------------------ */
window.logout = () => {
  clearUserLocal();
  setupLoginUI();
  updateCartBadge();
  location.href = "index.html";
};

/* ------------------ GOOGLE LOGIN ------------------ */
async function waitForGoogle(ms = 8000) {
  const start = Date.now();
  while (Date.now() - start < ms) {
    if (window.google?.accounts?.id) return true;
    await new Promise((res) => setTimeout(res, 100));
  }
  return false;
}

async function initGoogleLogin() {
  const ready = await waitForGoogle();
  if (!ready) return false;

  if (!window.__sg_google_initialized) {
    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleCredentialResponse,
      ux_mode: "popup",
    });
    google.accounts.id.disableAutoSelect?.();
    window.__sg_google_initialized = true;
  }
  return true;
}

window.handleCredentialResponse = (res) => {
  if (!res?.credential) return alert("Google login failed");

  const data = jwt_decode(res.credential);
  const user = {
    email: data.email,
    name: data.name || data.email,
    picture: data.picture || DEFAULTS.userPicture,
    token: res.credential,
  };

  saveUserToLocal(user);

  if (ADMINS.includes(user.email))
    localStorage.setItem("adminLoggedIn", "true");
  else localStorage.removeItem("adminLoggedIn");

  setupLoginUI();
  updateCartBadge();
  location.reload();
};

/* ------------------ CART ------------------ */
function safeParseCart() {
  return safeJSONParse(localStorage.getItem("cart"), []);
}

function saveCart(cart) {
  localStorage.setItem("cart", safeJSONSerialize(cart));
}

function updateCartBadge() {
  const badge = byId("cartCount");
  if (!badge) return;
  const cart = safeParseCart();
  badge.textContent = cart.length ? cart.length : "";
}

window.updateCartBadge = updateCartBadge;

window.addToCart = (p, m = 1) => {
  if (!p?._id) return alert("Invalid product");

  const cart = safeParseCart();
  cart.push({
    id: p._id,
    name: p.name,
    price: +p.price || 0,
    image: p.images?.[0] || DEFAULTS.productImage,
    metres: +m || 1,
  });

  saveCart(cart);
  updateCartBadge();
  alert("Added to cart!");
};

window.removeItem = (i) => {
  const cart = safeParseCart();
  cart.splice(i, 1);
  saveCart(cart);
  loadCartPage();
};

function loadCartPage() {
  const cont = byId("cartItems");
  const empty = byId("cartEmpty");
  const summary = byId("cartSummary");
  const totalEl = byId("cartTotal");

  if (!cont) return;

  const cart = safeParseCart();
  if (!cart.length) {
    empty?.style && (empty.style.display = "block");
    cont.innerHTML = "";
    summary.style.display = "none";
    totalEl.textContent = "0";
    return;
  }

  empty.style.display = "none";
  summary.style.display = "block";

  let total = 0;
  cont.innerHTML = cart
    .map((item, idx) => {
      const line = item.price * item.metres;
      total += line;
      return `
        <div class="col-md-4 mb-3">
          <div class="card p-2 shadow-sm h-100">
            <img src="${escapeHtml(item.image)}" style="height:150px;width:100%;object-fit:cover;">
            <div class="card-body d-flex flex-column">
              <h5>${escapeHtml(item.name)}</h5>
              <p>${DEFAULTS.currencySymbol}${item.price} × ${
        item.metres
      } = ${DEFAULTS.currencySymbol}${line}</p>
              <button class="btn btn-danger btn-sm mt-auto" onclick="removeItem(${idx})">Remove</button>
            </div>
          </div>
        </div>
      `;
    })
    .join("");

  totalEl.textContent = total;
}
window.loadCartPage = loadCartPage;
/* ------------------ FETCH WRAPPER ------------------ */
async function fetchJSON(url, opts = {}) {
  const res = await fetch(url, opts);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

/* ------------------ PRODUCTS LIST ------------------ */
window.openProduct = (id) => {
  location.href = `product.html?id=${encodeURIComponent(id)}`;
};

async function loadProducts(cat = "all", containerId = "productsContainer") {
  const box = byId(containerId);
  if (box) box.innerHTML = "Loading...";

  try {
    const products = await fetchJSON(
      `/api/products/category/${encodeURIComponent(cat)}`
    );

    if (!products.length) {
      box.innerHTML = `<p class="text-muted fw-bold">Coming Soon...</p>`;
      return;
    }

    box.innerHTML = products
      .map(
        (p) => `
      <div class="col-md-4 product-card">
        <div class="card shadow-sm" onclick="openProduct('${escapeHtml(
          p._id
        )}')" style="cursor:pointer;">
          <img src="${escapeHtml(
            p.images?.[0] || DEFAULTS.productImage
          )}" style="height:250px;width:100%;object-fit:cover;">
          <div class="card-body">
            <h5>${escapeHtml(p.name)}</h5>
            <p class="fw-bold">${DEFAULTS.currencySymbol}${escapeHtml(
          p.price
        )}</p>
          </div>
        </div>
      </div>
    `
      )
      .join("");
  } catch (e) {
    box.innerHTML = `<p class="text-muted">Error loading products.</p>`;
  }
}
window.loadProducts = loadProducts;

/* ------------------ SINGLE PRODUCT PAGE ------------------ */
async function loadSingleProduct() {
  const id = new URLSearchParams(location.search).get("id");
  if (!id) return;

  try {
    const p = await fetchJSON(`/api/products/${encodeURIComponent(id)}`);
    window.currentProduct = p;

    byId("p_name") && (byId("p_name").textContent = p.name);
    byId("p_price") && (byId("p_price").textContent = p.price);
    byId("p_desc") && (byId("p_desc").textContent = p.description);
    byId("p_category") && (byId("p_category").textContent = p.category);

    const mainImg = byId("mainImage");
    if (mainImg)
      mainImg.src = p.images?.[0] || DEFAULTS.productImage;

    const thumbRow = byId("thumbRow");
    if (thumbRow) {
      thumbRow.innerHTML = (p.images || [])
        .map(
          (img, i) => `
        <img src="${escapeHtml(
          img
        )}" class="thumb-img ${i === 0 ? "active" : ""}"
          style="height:60px;width:60px;object-fit:cover;margin-right:8px;cursor:pointer;"
          onclick="document.getElementById('mainImage').src='${escapeHtml(
            img
          )}'">
      `
        )
        .join("");
    }
  } catch (e) {
    console.error("loadSingleProduct error:", e);
  }
}
window.loadSingleProduct = loadSingleProduct;

window.addToCartPage = () => {
  if (!window.currentProduct) return alert("Product not loaded");
  const m = Number(byId("metreInput")?.value || 1);
  addToCart(window.currentProduct, m);
};

/* ------------------ ADMIN — DELETE PRODUCT ------------------ */
window.adminDeleteProduct = async (id) => {
  if (!confirm("Delete product permanently?")) return;
  try {
    const res = await fetchJSON(
      `/api/admin/products/${encodeURIComponent(id)}`,
      { method: "DELETE" }
    );
    if (res.success) {
      alert("Product deleted");
      renderAdminProducts();
    } else {
      alert("Delete failed");
    }
  } catch {
    alert("Server error");
  }
};

/* ------------------ ADMIN — RENDER PRODUCTS ------------------ */
async function renderAdminProducts() {
  const box = byId("productsAdminList");
  if (!box) return;

  box.innerHTML = "Loading...";

  try {
    const products = await fetchJSON("/api/products/category/all");
    box.innerHTML = products
      .map(
        (p) => `
      <div class="card p-2 mb-2">
        <div class="d-flex align-items-center">
          
          <img src="${escapeHtml(
            p.images?.[0] || DEFAULTS.productImage
          )}" style="width:70px;height:70px;border-radius:8px;object-fit:cover;">

          <div class="ms-3">
            <strong>${escapeHtml(p.name)}</strong> —
            ${DEFAULTS.currencySymbol}${escapeHtml(p.price)}
            <br>
            <span>${escapeHtml(p.category)}</span>
          </div>

          <button class="btn btn-danger btn-sm ms-auto"
            onclick="adminDeleteProduct('${escapeHtml(p._id)}')">Delete</button>

        </div>
      </div>
    `
      )
      .join("");
  } catch (e) {
    box.innerHTML = `<p class="text-muted">Failed to load products.</p>`;
  }
}
window.renderAdminProducts = renderAdminProducts;

/* ------------------ EMAIL LOGIN ------------------ */
window.emailLogin = async () => {
  const email = byId("loginEmail")?.value.trim();
  const pass = byId("loginPass")?.value;

  if (!email || !pass) return alert("Enter email + password");

  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: pass }),
    }).then((r) => r.json());

    if (!res.success) return alert(res.message || "Login failed");

    saveUserToLocal(res.user);

    if (ADMINS.includes(res.user.email))
      localStorage.setItem("adminLoggedIn", "true");

    location.reload();
  } catch (e) {
    console.error(e);
    alert("Server error");
  }
};

/* ------------------ EMAIL REGISTER ------------------ */
window.emailRegister = async () => {
  const name = byId("regName")?.value.trim();
  const email = byId("regEmail")?.value.trim();
  const pass = byId("regPass")?.value;

  if (!email || !pass) return alert("Enter valid details");

  try {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password: pass }),
    }).then((r) => r.json());

    if (!res.success) return alert(res.message || "Registration failed");

    alert("Account created! Please login.");
    location.href = "login.html";
  } catch (e) {
    console.error(e);
    alert("Server error");
  }
};

window.openRegister = () => {
  location.href = "register.html";
};
/* ------------------ ORDER HISTORY ------------------ */
async function loadOrderHistory() {
  const user = getUser();
  const box = byId("ordersList");

  if (!box) return;

  if (!user) {
    box.innerHTML = `
      <p class="text-danger mt-3">Please login to view your orders.</p>
    `;
    return;
  }

  try {
    const orders = await fetch(`/api/orders/${user.email}`).then((r) =>
      r.json()
    );

    if (!orders.length) {
      box.innerHTML = `
        <div class="text-center mt-5">
          <img src="https://cdn-icons-png.flaticon.com/512/4076/4076500.png"
               width="110" class="opacity-75 mb-3">
          <h5 class="fw-bold text-secondary">No Orders Yet</h5>
          <p class="text-muted">When you purchase something, it will show here.</p>
          <a href="allproducts.html" class="btn btn-primary mt-2">Start Shopping</a>
        </div>
      `;
      return;
    }

    box.innerHTML = orders
      .map(
        (o) => `
      <div class="card p-3 mb-3 shadow-sm">
        <h5 class="fw-bold">Order #${o._id}</h5>
        <p><strong>Date:</strong> ${new Date(o.date).toLocaleString()}</p>
        <p><strong>Total:</strong> ₹${o.total}</p>
        <hr>
        <h6 class="fw-bold">Items:</h6>
        ${o.items
          .map(
            (i) =>
              `<p class="mb-1">• ${escapeHtml(i.name)} (x${i.quantity})</p>`
          )
          .join("")}
      </div>
    `
      )
      .join("");
  } catch (e) {
    console.error("Order history error:", e);
    box.innerHTML = `<p class="text-muted">Error loading orders.</p>`;
  }
}

window.loadOrderHistory = loadOrderHistory;

/* ------------------ ADMIN GUARD ------------------ */
(function adminGuard() {
  try {
    if (location.pathname.includes("admin")) {
      if (!localStorage.getItem("adminLoggedIn")) {
        location.href = "index.html";
      }
    }
  } catch (e) {
    console.error("adminGuard error:", e);
  }
})();

/* ------------------ PAGE INITIALIZATION ------------------ */
document.addEventListener("DOMContentLoaded", () => {
  setupLoginUI();
  updateCartBadge();
  attachLoginButton();
  initGoogleLogin();

  const path = location.pathname.toLowerCase();

  if (path.includes("cart")) loadCartPage();
  if (path.includes("product")) loadSingleProduct();
  if (path.includes("admin")) renderAdminProducts();
  if (path.includes("orderhistory")) loadOrderHistory();

  qsa("[data-products-cat]").forEach((el) =>
    loadProducts(el.getAttribute("data-products-cat") || "all", el.id)
  );
});

/* ------------------ EXPORTS ------------------ */
window._sg = {
  getUser,
  saveUserToLocal,
  clearUserLocal,

  initGoogleLogin,
  triggerGoogleLogin,

  safeParseCart,
  addToCart,
  removeItem,
  loadCartPage,
  updateCartBadge,

  loadProducts,
  loadSingleProduct,
  openProduct,
  addToCartPage,

  renderAdminProducts,
  adminDeleteProduct,

  emailLogin,
  emailRegister,
  openRegister,

  loadOrderHistory,
};
