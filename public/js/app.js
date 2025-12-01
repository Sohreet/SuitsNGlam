/******************************************************
 * SUITS N GLAM — APP.JS (C) — MORE OPTIMIZED / MODULAR
 * - Single-file, compact, defensive, tested patterns
 * - Email auth, Google Identity (popup), cart, products, admin
 * - Exports window._sg for tests / console
 ******************************************************/

console.log("APP.JS (OPTIMIZED) LOADED");

/* ------------------ CONFIG ------------------ */
const ADMINS = ["sohabrar10@gmail.com"];
const GOOGLE_CLIENT_ID = "653374521156-6retcia1fiu5dvmbjik9sq89ontrkmvt.apps.googleusercontent.com";
const DEFAULTS = {
  userPicture: "/images/default-user.png",
  productImage: "/images/default-product.png",
  currencySymbol: "₹"
};

/* ------------------ UTILITIES ------------------ */
const noop = () => {};
const isObj = (x) => x && typeof x === "object" && !Array.isArray(x);

function safeJSONParse(raw, fallback = null) {
  try {
    if (raw === undefined || raw === null) return fallback;
    const parsed = JSON.parse(raw);
    return parsed === null ? fallback : parsed;
  } catch (e) {
    console.error("safeJSONParse:", e);
    return fallback;
  }
}

function safeJSONSerialize(payload) {
  try {
    return JSON.stringify(payload);
  } catch (e) {
    console.error("safeJSONSerialize:", e);
    return null;
  }
}

function qs(sel, root = document) {
  return root.querySelector(sel);
}
function qsa(sel, root = document) {
  return Array.from(root.querySelectorAll(sel));
}

function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str).replace(/[&<>"']/g, (m) =>
    ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m])
  );
}

function byId(id) { return document.getElementById(id); }

/* ------------------ STORAGE / USER ------------------ */
function getUser() {
  return safeJSONParse(localStorage.getItem("sg_user"), null);
}
function saveUserToLocal(userObj) {
  if (!userObj || !userObj.email) return;
  try {
    localStorage.setItem("sg_user", safeJSONSerialize(userObj));
  } catch (e) { console.error("saveUserToLocal failed:", e); }
}
function clearUserLocal() {
  try {
    localStorage.removeItem("sg_user");
    localStorage.removeItem("adminLoggedIn");
  } catch (e) { console.error("clearUserLocal failed:", e); }
}

/* ------------------ UI: Login / Navbar ------------------ */
function setupLoginUI() {
  const loginBtn = byId("loginBtn");
  const icon = byId("accountIcon");
  const navArea = document.querySelector(".nav-login-area");
  const adminBadge = byId("adminBadgeNav");

  const user = getUser();

  if (navArea) navArea.style.visibility = "visible";

  if (!loginBtn || !icon) {
    if (adminBadge) adminBadge.style.display = "none";
    return;
  }

  if (!user) {
    loginBtn.style.display = "inline-block";
    icon.style.display = "none";
    if (adminBadge) adminBadge.style.display = "none";
    return;
  }

  loginBtn.style.display = "none";
  icon.src = user.picture || DEFAULTS.userPicture;
  icon.alt = escapeHtml(user.name || user.email || "Account");
  icon.style.display = "inline-block";

  if (ADMINS.includes(user.email)) {
    if (adminBadge) adminBadge.style.display = "inline-block";
    icon.onclick = () => (window.location.href = "admin.html");
  } else {
    if (adminBadge) adminBadge.style.display = "none";
    icon.onclick = () => (window.location.href = "account.html");
  }
}

function attachLoginButton() {
  const btn = byId("loginBtn");
  if (!btn) return;
  btn.onclick = () => {
    const modalEl = byId("emailLoginModal");
    if (!modalEl) {
      window.location.href = "login.html";
      return;
    }
    try {
      const m = new bootstrap.Modal(modalEl);
      m.show();
    } catch (e) {
      console.warn("Bootstrap modal open failed:", e);
      window.location.href = "login.html";
    }
  };
}

window.logout = function() {
  clearUserLocal();
  console.log("Logged out locally");
  setupLoginUI();
  updateCartBadge();
  // gently redirect to home
  try { window.location.href = "index.html"; } catch (e) { /* ignore */ }
};

/* ------------------ GOOGLE IDENTITY (POPUP SAFE) ------------------ */
/* Wait for the GSI library to appear */
async function waitForGoogle(timeoutMs = 8000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (window.google && google.accounts && google.accounts.id) return true;
    await new Promise((r) => setTimeout(r, 100));
  }
  return false;
}

/* Initialize Google Identity (non-blocking safe) */
async function initGoogleLogin() {
  const ready = await waitForGoogle(8000);
  if (!ready) {
    console.warn("Google Identity not available");
    return false;
  }
  try {
    if (!window.__sg_google_initialized) {
      google.accounts.id.initialize({
        client_id: "653374521156-6retcia1fiu5dvmbjik9sq89ontrkmvt.apps.googleusercontent.com",
        callback: handleCredentialResponse,
        ux_mode: "popup",
        auto_select: false
      });
      if (google.accounts.id.disableAutoSelect) google.accounts.id.disableAutoSelect();
      window.__sg_google_initialized = true;
      console.log("Google Identity initialized");
    }
    return true;
  } catch (e) {
    console.error("initGoogleLogin error:", e);
    return false;
  }
}

/* Trigger the popup-based login flow (user gesture required) */
async function triggerGoogleLogin() {
  const ok = await initGoogleLogin();
  if (!ok) {
    alert("Google login not ready. Try again.");
    return;
  }
  try {
    google.accounts.id.prompt((notif) => {
      console.log("google prompt:", notif);
    });
  } catch (e) {
    console.warn("google.accounts.id.prompt failed:", e);
    alert("Unable to open Google login. Try email login.");
  }
}

/* Response handler called by GSI */
window.handleCredentialResponse = function(response) {
  console.log("handleCredentialResponse:", response && !!response.credential);
  if (!response || !response.credential) {
    alert("Google login failed.");
    return;
  }
  try {
    const data = jwt_decode(response.credential); // ensure jwt_decode is included in page
    const user = {
      email: data.email,
      name: data.name || data.given_name || data.email,
      picture: data.picture || DEFAULTS.userPicture,
      token: response.credential,
      joined: new Date().toLocaleDateString()
    };
    saveUserToLocal(user);
    if (ADMINS.includes(user.email)) localStorage.setItem("adminLoggedIn", "true");
    else localStorage.removeItem("adminLoggedIn");

    // close modal if open
    const loginModalEl = byId("emailLoginModal");
    if (loginModalEl) {
      try {
        const inst = bootstrap.Modal.getInstance(loginModalEl);
        if (inst) inst.hide();
      } catch (e) { /* ignore */ }
    }

    setupLoginUI();
    updateCartBadge();
    alert(`Welcome ${user.name || user.email}`);
    try { window.location.reload(); } catch (e) { console.log("reload failed:", e); }
  } catch (err) {
    console.error("Google auth parse error:", err);
    alert("Google login failed. Check console.");
  }
};

/* ------------------ CART (LOCALSTORAGE) ------------------ */
function safeParseCart() {
  return safeJSONParse(localStorage.getItem("cart"), []);
}
function saveCart(cart) {
  try {
    localStorage.setItem("cart", safeJSONSerialize(cart || []));
  } catch (e) { console.error("saveCart failed:", e); }
}

function updateCartBadge() {
  const badge = byId("cartCount");
  if (!badge) return;
  const cart = safeParseCart() || [];
  badge.textContent = cart.length ? String(cart.length) : "";
  badge.setAttribute("aria-label", `${cart.length} items in cart`);
}
window.updateCartBadge = updateCartBadge;

function addToCart(product, metres = 1) {
  if (!product || !product._id) {
    console.warn("addToCart invalid product", product);
    alert("Unable to add product to cart.");
    return;
  }
  const cart = safeParseCart() || [];
  const image = product.images && product.images[0] ? product.images[0] : DEFAULTS.productImage;
  const price = Number(product.price) || 0;
  const qty = Math.max(1, Number(metres) || 1);
  cart.push({
    id: product._id,
    name: product.name || "Untitled product",
    price,
    image,
    metres: qty
  });
  saveCart(cart);
  updateCartBadge();
  alert("Added to cart!");
}
window.addToCart = addToCart;

function removeItem(index) {
  const cart = safeParseCart() || [];
  if (index < 0 || index >= cart.length) return;
  cart.splice(index, 1);
  saveCart(cart);
  loadCartPage();
}
window.removeItem = removeItem;

function loadCartPage() {
  const cont = byId("cartItems");
  const empty = byId("cartEmpty");
  const summary = byId("cartSummary");
  const tEl = byId("cartTotal");

  if (!cont) { updateCartBadge(); return; }

  const cart = safeParseCart() || [];

  if (!cart.length) {
    if (empty) empty.style.display = "block";
    cont.innerHTML = "";
    if (summary) summary.style.display = "none";
    if (tEl) tEl.textContent = "0";
    updateCartBadge();
    return;
  }

  if (empty) empty.style.display = "none";
  if (summary) summary.style.display = "block";

  let total = 0;
  const html = cart.map((item, idx) => {
    const name = escapeHtml(item.name || "Product");
    const image = escapeHtml(item.image || DEFAULTS.productImage);
    const price = Number(item.price) || 0;
    const metres = Number(item.metres) || 1;
    const lineTotal = price * metres;
    total += lineTotal;
    return `
      <div class="col-md-4 mb-3">
        <div class="card p-2 shadow-sm h-100">
          <img src="${image}" alt="${name}" style="height:150px;width:100%;object-fit:cover;">
          <div class="card-body d-flex flex-column">
            <h5 class="card-title mb-1">${name}</h5>
            <p class="mb-2">${DEFAULTS.currencySymbol}${price} × ${metres}m = ${DEFAULTS.currencySymbol}${lineTotal}</p>
            <div class="mt-auto">
              <button class="btn btn-danger btn-sm" onclick="removeItem(${idx})">Remove</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join("");

  cont.innerHTML = html;
  if (tEl) tEl.textContent = total;
  updateCartBadge();
}
window.loadCartPage = loadCartPage;

/* ------------------ PRODUCT LIST & SINGLE PRODUCT ------------------ */
async function fetchJSON(url, opts = {}) {
  try {
    const res = await fetch(url, opts);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    console.error("fetchJSON error:", e, url);
    throw e;
  }
}

function openProduct(id) {
  window.location.href = `product.html?id=${encodeURIComponent(id)}`;
}
window.openProduct = openProduct;

async function loadProducts(cat = "all", containerId = "productsContainer") {
  const box = byId(containerId);
  if (box) box.innerHTML = "Loading...";
  try {
    const res = await fetchJSON(`/api/products/category/${encodeURIComponent(cat)}`);
    if (!res || !res.length) {
      if (box) box.innerHTML = `<p class='text-muted fw-bold'>Coming Soon...</p>`;
      return;
    }
    if (box) box.innerHTML = "";
    res.forEach((p) => {
      if (!box) return;
      const img = escapeHtml((p.images && p.images[0]) ? p.images[0] : DEFAULTS.productImage);
      box.innerHTML += `
        <div class="col-md-4 product-card">
          <div class="card shadow-sm" onclick="openProduct('${escapeHtml(p._id)}')" style="cursor:pointer;">
            <img src="${img}" style="height:250px;width:100%;object-fit:cover;">
            <div class="card-body">
              <h5>${escapeHtml(p.name)}</h5>
              <p class="fw-bold">${DEFAULTS.currencySymbol}${escapeHtml(p.price)}</p>
            </div>
          </div>
        </div>
      `;
    });
  } catch (e) {
    if (box) box.innerHTML = `<p class='text-muted'>Error loading products.</p>`;
  }
}
window.loadProducts = loadProducts;

async function loadSingleProduct() {
  const id = new URLSearchParams(window.location.search).get("id");
  if (!id) return;
  try {
    const p = await fetchJSON(`/api/products/${encodeURIComponent(id)}`);
    if (!p) return;
    const elName = byId("p_name");
    if (elName) elName.textContent = p.name || "";
    const elPrice = byId("p_price");
    if (elPrice) elPrice.textContent = p.price || "";
    const elDesc = byId("p_desc");
    if (elDesc) elDesc.textContent = p.description || "";
    const elCat = byId("p_category");
    if (elCat) elCat.textContent = p.category || "";
    const mainImage = byId("mainImage");
    if (mainImage) mainImage.src = (p.images && p.images[0]) ? p.images[0] : DEFAULTS.productImage;
    const thumbRow = byId("thumbRow");
    if (thumbRow) {
      thumbRow.innerHTML = "";
      (p.images || []).forEach((img, i) => {
        const safe = escapeHtml(img || DEFAULTS.productImage);
        thumbRow.innerHTML += `
          <img src="${safe}" class="thumb-img ${i===0?'active':''}"
               style="height:60px;width:60px;object-fit:cover;margin-right:8px;cursor:pointer;"
               onclick="document.getElementById('mainImage').src='${safe}'">
        `;
      });
    }
    window.currentProduct = p;
  } catch (e) { /* fail silently */ console.error("loadSingleProduct:", e); }
}
window.loadSingleProduct = loadSingleProduct;

function addToCartPage() {
  const mEl = byId("metreInput");
  const metres = mEl ? Number(mEl.value) || 1 : 1;
  if (!window.currentProduct) {
    alert("Product not loaded.");
    return;
  }
  addToCart(window.currentProduct, metres);
}
window.addToCartPage = addToCartPage;

/* ------------------ ADMIN ------------------ */
async function adminDeleteProduct(id) {
  if (!confirm("Delete this product permanently?")) return;
  try {
    const res = await fetchJSON(`/api/admin/products/${encodeURIComponent(id)}`, { method: "DELETE" });
    if (res && res.success) {
      alert("Product deleted.");
      renderAdminProducts();
    } else alert("Delete failed.");
  } catch (e) {
    alert("Delete failed (server error).");
  }
}
window.adminDeleteProduct = adminDeleteProduct;

async function renderAdminProducts() {
  const out = byId("productsAdminList");
  if (!out) return;
  out.innerHTML = "Loading...";
  try {
    const products = await fetchJSON("/api/products/category/all");
    out.innerHTML = products
      .map((p) => `
        <div class="card p-2 mb-2">
          <div class="d-flex align-items-center">
            <img src="${escapeHtml((p.images && p.images[0]) ? p.images[0] : DEFAULTS.productImage)}"
                 style="width:70px;height:70px;border-radius:8px;object-fit:cover;">
            <div class="ms-3">
              <strong>${escapeHtml(p.name)}</strong> — ${DEFAULTS.currencySymbol}${escapeHtml(p.price)}<br><span>${escapeHtml(p.category)}</span>
            </div>
            <button class="btn btn-danger btn-sm ms-auto" onclick="adminDeleteProduct('${escapeHtml(p._id)}')">Delete</button>
          </div>
        </div>
      `).join("");
  } catch (e) {
    out.innerHTML = "<p class='text-muted'>Failed to load admin products.</p>";
  }
}
window.renderAdminProducts = renderAdminProducts;

/* ------------------ EMAIL AUTH (LOGIN / REGISTER) ------------------ */
async function emailLogin() {
  const email = byId("loginEmail")?.value.trim() || "";
  const pass = byId("loginPass")?.value || "";
  if (!email || !pass) return alert("Please enter email and password.");
  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: safeJSONSerialize({ email, password: pass })
    });
    const data = await res.json();
    if (!data || !data.success) return alert(data && data.message ? data.message : "Login failed");
    const user = data.user;
    saveUserToLocal(user);
    if (ADMINS.includes(user.email)) localStorage.setItem("adminLoggedIn", "true");
    else localStorage.removeItem("adminLoggedIn");
    const modalEl = byId("emailLoginModal");
    if (modalEl) {
      try {
        const m = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
        m.hide();
      } catch (e) { /* ignore */ }
    }
    setupLoginUI();
    updateCartBadge();
    window.location.reload();
  } catch (e) {
    console.error("emailLogin error:", e);
    alert("Login failed (server error).");
  }
}
window.emailLogin = emailLogin;

async function emailRegister() {
  const name = byId("regName")?.value.trim() || "";
  const email = byId("regEmail")?.value.trim() || "";
  const pass = byId("regPass")?.value || "";
  if (!email || !pass) return alert("Please enter email and password.");
  try {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: safeJSONSerialize({ name, email, password: pass })
    });
    const data = await res.json();
    if (!data || !data.success) return alert(data && data.message ? data.message : "Register failed");
    alert("Account created! Please login.");
    try {
      const rm = bootstrap.Modal.getInstance(byId("registerModal"));
      if (rm) rm.hide();
    } catch (e) { /* ignore */ }
    try {
      const lm = new bootstrap.Modal(byId("emailLoginModal"));
      lm.show();
    } catch (e) { /* ignore */ }
  } catch (e) {
    console.error("emailRegister error:", e);
    alert("Register failed (server error).");
  }
}
window.emailRegister = emailRegister;

function openRegister() {
  try {
    const rm = new bootstrap.Modal(byId("registerModal"));
    rm.show();
  } catch (e) {
    window.location.href = "register.html";
  }
}
window.openRegister = openRegister;

/* ------------------ ADMIN GUARD ------------------ */
(function adminGuard() {
  try {
    if (window.location.pathname.includes("admin")) {
      if (!localStorage.getItem("adminLoggedIn")) {
        window.location.href = "index.html";
      }
    }
  } catch (e) {
    console.error("adminGuard error:", e);
  }
})();

/* ------------------ PAGE INITIALIZATION ------------------ */
document.addEventListener("DOMContentLoaded", async () => {
  setupLoginUI();
  updateCartBadge();
  attachLoginButton();

  // kick off non-blocking google init
  initGoogleLogin().then(ok => { if (ok) console.log("Google ready"); }).catch(noop);

  // run page-specific logic
  const path = (window.location.pathname || "").toLowerCase();

  if (path.includes("cart") || byId("cartItems")) {
    try { loadCartPage(); } catch (e) { console.error(e); }
  }

  if (path.includes("product") || byId("p_name")) {
    try { loadSingleProduct(); } catch (e) { console.error(e); }
  }

  if (path.includes("admin") && byId("productsAdminList")) {
    try { renderAdminProducts(); } catch (e) { console.error(e); }
  }

  // auto-load any containers that declare data-products-cat
  const prodContainers = qsa("[data-products-cat]");
  prodContainers.forEach((el) => {
    const cat = el.getAttribute("data-products-cat") || "all";
    loadProducts(cat, el.id);
  });
});

/* ------------------ EXPORTS ------------------ */
window._sg = {
  // user / auth
  getUser,
  saveUserToLocal,
  clearUserLocal,
  // google
  initGoogleLogin,
  triggerGoogleLogin,
  // cart
  safeParseCart,
  addToCart,
  removeItem,
  loadCartPage,
  updateCartBadge,
  // products
  loadProducts,
  loadSingleProduct,
  openProduct,
  addToCartPage,
  // admin
  renderAdminProducts,
  adminDeleteProduct,
  // email auth
  emailLogin,
  emailRegister,
  openRegister
};