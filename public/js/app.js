/******************************************************
 * SUITS N GLAM — APP.JS (CLEAN + OPTIMIZED + FIXED)
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
const qs = (s, r = document) => r.querySelector(s);
const qsa = (s, r = document) => [...r.querySelectorAll(s)];
const byId = (id) => document.getElementById(id);

function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[m]);
}

function safeJSONParse(v, f = null) {
  try {
    return JSON.parse(v) ?? f;
  } catch {
    return f;
  }
}
const safeJSONSerialize = (v) => JSON.stringify(v);

/* ------------------ USER STORAGE ------------------ */
function getUser() {
  return safeJSONParse(localStorage.getItem("sg_user"));
}
function saveUser(obj) {
  if (!obj?.email) return;
  localStorage.setItem("sg_user", safeJSONSerialize(obj));
}
function clearUser() {
  localStorage.removeItem("sg_user");
  localStorage.removeItem("adminLoggedIn");
  // if you store a token in future:
  localStorage.removeItem("sg_token");
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
    adminBadge && (adminBadge.style.display = "none");
    return;
  }

  btn.style.display = "none";
  icon.src = user.picture || DEFAULTS.userPicture;
  icon.style.display = "inline-block";

  if (ADMINS.includes(user.email)) {
    adminBadge && (adminBadge.style.display = "inline-block");
    icon.onclick = () => (location.href = "admin.html");
  } else {
    adminBadge && (adminBadge.style.display = "none");
    icon.onclick = () => (location.href = "account.html");
  }
}

/* ------------------ LOGOUT ------------------ */
window.logout = () => {
  clearUser();
  location.href = "index.html";
};

/* ------------------ EMAIL/PASSWORD LOGIN ------------------ */
/**
 * Uses current backend /api/auth/login which returns:
 * { success: true, user: { email, name, picture, isAdmin }, token? }
 *
 * This function stores the user under "sg_user" and also stores
 * an optional token under "sg_token" (if backend returns it).
 */
window.loginWithPassword = async (email, password) => {
  if (!email || !password) {
    alert("Please provide email and password");
    return;
  }

  try {
    const resp = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // If you switch to cookie sessions later, use credentials: "include"
      body: JSON.stringify({ email, password }),
    });

    // network-level or non-json responses will throw when parsing
    const data = await resp.json().catch(() => null);

    if (!data) {
      alert("Unexpected server response. Check console.");
      return;
    }

    if (!data.success) {
      alert(data.message || "Login failed");
      return;
    }

    // Server might return token (future-proof)
    if (data.token) {
      localStorage.setItem("sg_token", data.token);
    }

    const user = data.user || data; // fallback if server returns user at root
    if (!user || !user.email) {
      alert("Login succeeded but server did not return user info.");
      return;
    }

    // Save user and admin flag
    saveUser(user);
    if (ADMINS.includes(user.email)) localStorage.setItem("adminLoggedIn", "true");
    else localStorage.removeItem("adminLoggedIn");

    // Update UI and redirect
    setupLoginUI();
    updateCartBadge();
    location.href = "account.html";
  } catch (err) {
    console.error("Login error:", err);
    alert("Login failed (network error). See console for details.");
  }
};

/* If you have an HTML form with id="loginForm" this will wire it up.
   It does nothing if the form doesn't exist.
*/
function wireLoginForm() {
  const form = byId("loginForm");
  if (!form) return;
  form.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const email = (byId("loginEmail") || {}).value;
    const password = (byId("loginPassword") || {}).value;
    await window.loginWithPassword(email, password);
  });
}

/* ------------------ GOOGLE LOGIN ------------------ */
async function initGoogleLogin() {
  const wait = async () => {
    for (let i = 0; i < 80; i++) {
      if (window.google?.accounts?.id) return true;
      await new Promise((r) => setTimeout(r, 100));
    }
    return false;
  };

  if (!(await wait())) return;

  google.accounts.id.initialize({
    client_id: "653374521156-6retcia1fiu5dvmbjik9sq89ontrkmvt.apps.googleusercontent.com",
    callback: handleGoogleResponse,
    ux_mode: "popup",
  });
}

window.handleGoogleResponse = (res) => {
  // jwt_decode must be available on the page via a script include
  // e.g. <script src="https://cdn.jsdelivr.net/npm/jwt-decode/build/jwt-decode.min.js"></script>
  try {
    const data = jwt_decode(res.credential);
    const user = {
      email: data.email,
      name: data.name,
      picture: data.picture || DEFAULTS.userPicture,
    };

    saveUser(user);

    if (ADMINS.includes(user.email)) localStorage.setItem("adminLoggedIn", "true");
    else localStorage.removeItem("adminLoggedIn");

    location.reload();
  } catch (err) {
    console.error("Google login decode error:", err);
    alert("Google login failed.");
  }
};

/* ------------------ CART ------------------ */
const parseCart = () => safeJSONParse(localStorage.getItem("cart"), []);
const saveCart = (c) => localStorage.setItem("cart", safeJSONSerialize(c));

window.addToCart = (p, m = 1) => {
  const cart = parseCart();
  cart.push({
    id: p._id,
    name: p.name,
    price: +p.price || 0,
    image: p.images?.[0] || DEFAULTS.productImage,
    metres: +m || 1,
  });
  saveCart(cart);
  alert("Added!");
  updateCartBadge();
};

window.removeItem = (i) => {
  const cart = parseCart();
  cart.splice(i, 1);
  saveCart(cart);
  loadCartPage();
  updateCartBadge();
};

function updateCartBadge() {
  const badge = byId("cartCount");
  if (!badge) return;
  badge.textContent = parseCart().length || "";
}
window.updateCartBadge = updateCartBadge;

function loadCartPage() {
  const cont = byId("cartItems");
  if (!cont) return;

  const cart = parseCart();
  if (!cart.length) {
    const emptyEl = byId("cartEmpty");
    const summaryEl = byId("cartSummary");
    if (emptyEl) emptyEl.style.display = "block";
    if (summaryEl) summaryEl.style.display = "none";
    return;
  }

  let total = 0;

  cont.innerHTML = cart
    .map((c, i) => {
      const line = c.price * c.metres;
      total += line;

      return `
      <div class="col-md-4 mb-3">
        <div class="card p-2 shadow-sm h-100">
          <img src="${c.image}" style="height:150px;width:100%;object-fit:cover;">
          <div class="card-body d-flex flex-column">
            <h5>${escapeHtml(c.name)}</h5>
            <p>${DEFAULTS.currencySymbol}${c.price} × ${c.metres} = ${DEFAULTS.currencySymbol}${line}</p>
            <button class="btn btn-danger btn-sm mt-auto" onclick="removeItem(${i})">Remove</button>
          </div>
        </div>
      </div>`;
    })
    .join("");

  const totalEl = byId("cartTotal");
  if (totalEl) totalEl.textContent = total;
}
window.loadCartPage = loadCartPage;

/* ------------------ PRODUCTS ------------------ */
window.openProduct = (id) => {
  location.href = `product.html?id=${encodeURIComponent(id)}`;
};

async function loadProducts(cat = "all", id = "productsContainer") {
  const box = byId(id);
  if (!box) return;

  box.innerHTML = "Loading...";

  try {
    const res = await fetch(`/api/products/category/${encodeURIComponent(cat)}`);
    const data = await res.json();

    if (!data || !data.length) {
      box.innerHTML = `<p>No products yet.</p>`;
      return;
    }

    box.innerHTML = data
      .map(
        (p) => `
      <div class="col-md-4 product-card">
        <div class="card shadow-sm" onclick="openProduct('${p._id}')">
          <img src="${p.images?.[0] || DEFAULTS.productImage}" style="height:250px;width:100%;object-fit:cover;">
          <div class="card-body">
            <h5>${escapeHtml(p.name)}</h5>
            <p class="fw-bold">${DEFAULTS.currencySymbol}${p.price}</p>
          </div>
        </div>
      </div>`
      )
      .join("");
  } catch (err) {
    console.error("loadProducts error:", err);
    box.innerHTML = "Error loading products.";
  }
}
window.loadProducts = loadProducts;

/* ------------------ SINGLE PRODUCT (helper used in init) ------------------ */
async function loadSingleProduct() {
  const q = new URLSearchParams(location.search);
  const id = q.get("id");
  if (!id) return;
  const el = byId("singleProductContainer");
  if (el) el.innerHTML = "Loading...";
  try {
    const res = await fetch(`/api/products/${encodeURIComponent(id)}`);
    const p = await res.json();
    if (!p) {
      if (el) el.innerHTML = "<p>Product not found.</p>";
      return;
    }
    // render minimal product view (you can expand)
    if (el) {
      el.innerHTML = `
        <div class="card">
          <img src="${p.images?.[0] || DEFAULTS.productImage}" style="height:350px;width:100%;object-fit:cover;">
          <div class="card-body">
            <h3>${escapeHtml(p.name)}</h3>
            <p>${DEFAULTS.currencySymbol}${p.price}</p>
            <p>${escapeHtml(p.description || "")}</p>
            <button class="btn btn-primary" onclick='addToCart(${JSON.stringify(
              { _id: p._id, name: escapeHtml(p.name), price: p.price, images: p.images }
            )}, 1)'>Add to cart</button>
          </div>
        </div>
      `;
    }
  } catch (err) {
    console.error("loadSingleProduct error:", err);
    if (el) el.innerHTML = "<p>Error loading product.</p>";
  }
}

/* ------------------ ORDER HISTORY (FIXED ROUTE) ------------------ */
async function loadOrderHistory() {
  const user = getUser();
  const box = byId("ordersList");

  if (!box) return;

  if (!user) {
    box.innerHTML = "<p>Please login first.</p>";
    return;
  }

  try {
    const res = await fetch(`/api/orders/history/${encodeURIComponent(user.email)}`, {
      // if you later use cookie sessions, add credentials: 'include' here
      headers: {
        // If token stored, set Authorization header automatically
        ...(localStorage.getItem("sg_token")
          ? { Authorization: `Bearer ${localStorage.getItem("sg_token")}` }
          : {}),
      },
    });
    const orders = await res.json();

    if (!orders || !orders.length) {
      box.innerHTML = `
        <div class="text-center mt-5">
          <h5>No Orders Yet</h5>
        </div>`;
      return;
    }

    box.innerHTML = orders
      .map(
        (o) => `
        <div class="card p-3 mb-3 shadow-sm">
          <h5>Order #${o._id}</h5>
          <p><b>Total:</b> ${DEFAULTS.currencySymbol}${o.total}</p>
          <hr>
          ${o.items
            .map((i) => `<p>• ${escapeHtml(i.name)} × ${i.quantity || 1}</p>`)
            .join("")}
        </div>`
      )
      .join("");
  } catch (err) {
    console.error("loadOrderHistory error:", err);
    box.innerHTML = "<p>Error loading orders.</p>";
  }
}
window.loadOrderHistory = loadOrderHistory;

/* ------------------ INIT ------------------ */
document.addEventListener("DOMContentLoaded", () => {
  setupLoginUI();
  updateCartBadge();
  initGoogleLogin();
  wireLoginForm(); // wire the login form if present

  const p = location.pathname.toLowerCase();
  if (p.includes("cart")) loadCartPage();
  if (p.includes("product")) loadSingleProduct();
  if (p.includes("admin")) {
    // you might want to check adminLoggedIn before rendering
    renderAdminProducts && renderAdminProducts();
  }
  if (p.includes("orderhistory")) loadOrderHistory();
});