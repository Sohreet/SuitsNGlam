/******************************************************
 * SUITS N GLAM — APP.JS (ULTRA-CLEAN & OPTIMIZED)
 * - Merged: navbar / auth / google / cart / products / admin
 * - Safe parsing, fallbacks, and robust DOM init
 ******************************************************/

console.log("APP.JS (CLEAN) LOADED");

/* ------------------ CONFIG ------------------ */
const ADMINS = ["sohabrar10@gmail.com"];
const GOOGLE_CLIENT_ID = "653374521156-6retcia1fiu5dvmbjik9sq89ontrkmvt.apps.googleusercontent.com";

/* ------------------ HELPERS ------------------ */
function safeJSONParse(raw, fallback = []) {
  try {
    if (raw === null || raw === undefined) return fallback;
    const parsed = JSON.parse(raw);
    return parsed === null ? fallback : parsed;
  } catch (e) {
    console.error("safeJSONParse error:", e);
    return fallback;
  }
}

function getUser() {
  try {
    return safeJSONParse(localStorage.getItem("sg_user"), null);
  } catch {
    return null;
  }
}

function saveUserToLocal(userObj) {
  try {
    localStorage.setItem("sg_user", JSON.stringify(userObj));
  } catch (e) {
    console.error("saveUserToLocal failed:", e);
  }
}

function escapeHtml(str) {
  if (!str && str !== 0) return "";
  return String(str).replace(/[&<>"']/g, (m) =>
    ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m])
  );
}

/* ------------------ NAVBAR & LOGIN UI ------------------ */
function setupLoginUI() {
  const loginBtn = document.getElementById("loginBtn");
  const icon = document.getElementById("accountIcon");
  const navArea = document.querySelector(".nav-login-area");
  const adminBadge = document.getElementById("adminBadgeNav");

  const user = getUser();

  if (!navArea) return;
  navArea.style.visibility = "visible";

  if (!loginBtn || !icon) {
    // elements missing — nothing else to do
    if (adminBadge) adminBadge.style.display = "none";
    return;
  }

  if (!user) {
    loginBtn.style.display = "inline-block";
    icon.style.display = "none";
    if (adminBadge) adminBadge.style.display = "none";
    return;
  }

  // logged in
  loginBtn.style.display = "none";
  icon.src = user.picture || "/images/default-user.png";
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
  const btn = document.getElementById("loginBtn");
  if (!btn) return;
  btn.onclick = () => {
    const modalEl = document.getElementById("emailLoginModal");
    if (!modalEl) return;
    try {
      const m = new bootstrap.Modal(modalEl);
      m.show();
    } catch (e) {
      // fallback: redirect to a login page if bootstrap missing
      console.warn("Bootstrap modal failed:", e);
      window.location.href = "login.html";
    }
  };
}

window.logout = function() {
  localStorage.removeItem("sg_user");
  localStorage.removeItem("adminLoggedIn");
  console.log("Local logout done.");
  setupLoginUI();
  updateCartBadge();
  window.location.href = "index.html";
};

/* ------------------ GOOGLE IDENTITY (POPUP-SAFE) ------------------ */

/* Wait until google object is available (polling, user gesture required for prompt) */
async function waitForGoogle(timeoutMs = 8000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (window.google && google.accounts && google.accounts.id) return true;
    await new Promise((r) => setTimeout(r, 100));
  }
  return false;
}

/* Handle the response from Google Identity Services (GSI) */
window.handleCredentialResponse = function(response) {
  console.log("handleCredentialResponse", response);
  try {
    const data = jwt_decode(response.credential);
    const user = {
      email: data.email,
      name: data.name || data.given_name || data.email,
      picture: data.picture || "/images/default-user.png",
      token: response.credential,
      joined: new Date().toLocaleDateString()
    };
    saveUserToLocal(user);
    if (ADMINS.includes(user.email)) localStorage.setItem("adminLoggedIn", "true");
    else localStorage.removeItem("adminLoggedIn");

    // close modal if present
    const loginModalEl = document.getElementById("emailLoginModal");
    if (loginModalEl) {
      try {
        const m = bootstrap.Modal.getInstance(loginModalEl);
        if (m) m.hide();
      } catch (e) { /* ignore */ }
    }

    setupLoginUI();
    updateCartBadge();
    alert(`Welcome ${user.name || user.email}`);
    // avoid reload if not necessary; but consistent UX is to reload so navbar reflects admin badge
    try { window.location.reload(); } catch(e) { console.log("reload failed:", e); }

  } catch (err) {
    console.error("Google Auth Error:", err);
    alert("Google login failed. See console for details.");
  }
};

/* Initialize Google Identity (id.initialize). Must be called before prompt() */
async function initGoogleLogin() {
  const ready = await waitForGoogle(8000);
  if (!ready) {
    console.warn("Google Identity not available yet.");
    return false;
  }
  try {
    if (!window.__sg_google_initialized) {
      google.accounts.id.initialize({
        client_id: "653374521156-6retcia1fiu5dvmbjik9sq89ontrkmvt.apps.googleusercontent.com",
        callback: window.handleCredentialResponse,
        ux_mode: "popup",
        auto_select: false,
      });
      // optional: disable auto select if API supports it
      if (google.accounts.id.disableAutoSelect) google.accounts.id.disableAutoSelect();
      window.__sg_google_initialized = true;
      console.log("Google Identity initialized (popup).");
    }
    return true;
  } catch (e) {
    console.error("initGoogleLogin error:", e);
    return false;
  }
}

/* Trigger login from a user gesture (button click). This will open popup */
async function triggerGoogleLogin() {
  const ok = await initGoogleLogin();
  if (!ok) {
    alert("Google login not ready. Try again in a moment.");
    return;
  }
  try {
    // prompt() can show one-tap or auto UI. For popup we rely on initialize+callback and rely on GSI's popup.
    google.accounts.id.prompt((notification) => {
      console.log("google.accounts.id.prompt():", notification);
    });
  } catch (e) {
    console.warn("google.accounts.id.prompt() failed:", e);
    // fallback: instruct user
    alert("Unable to open Google login popup. Please try email login.");
  }
}

/* ------------------ CART (ROBUST) ------------------ */

function safeParseCart() {
  return safeJSONParse(localStorage.getItem("cart"), []);
}

function updateCartBadge() {
  const badge = document.getElementById("cartCount");
  if (!badge) return;
  const cart = safeParseCart();
  badge.textContent = cart.length ? String(cart.length) : "";
  badge.setAttribute("aria-label", `${cart.length} items in cart`);
}
window.updateCartBadge = updateCartBadge;

function addToCart(product, metres = 1) {
  if (!product || !product._id) {
    console.warn("addToCart: invalid product", product);
    alert("Unable to add product to cart.");
    return;
  }
  const cart = safeParseCart();

  const image = (product.images && product.images[0]) ? product.images[0] : "/images/default-product.png";
  const price = Number(product.price) || 0;
  const qty = Math.max(1, Number(metres) || 1);

  cart.push({
    id: product._id,
    name: product.name || "Untitled product",
    price,
    image,
    metres: qty
  });

  try {
    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartBadge();
    alert("Added to cart!");
  } catch (e) {
    console.error("Failed to save cart", e);
    alert("Could not save cart (storage error).");
  }
}
window.addToCart = addToCart;

function removeItem(index) {
  const cart = safeParseCart();
  if (index < 0 || index >= cart.length) return;
  cart.splice(index, 1);
  try {
    localStorage.setItem("cart", JSON.stringify(cart));
  } catch (e) { console.error("removeItem save failed:", e); }
  loadCartPage();
}
window.removeItem = removeItem;

function loadCartPage() {
  const cont = document.getElementById("cartItems");
  const empty = document.getElementById("cartEmpty");
  const summary = document.getElementById("cartSummary");
  const tEl = document.getElementById("cartTotal");

  if (!cont) {
    // not on cart page
    updateCartBadge();
    return;
  }

  const cart = safeParseCart();

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
  cont.innerHTML = cart.map((item, idx) => {
    const name = escapeHtml(item.name || "Product");
    const image = escapeHtml(item.image || "/images/default-product.png");
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
            <p class="mb-2">₹${price} × ${metres}m = ₹${lineTotal}</p>
            <div class="mt-auto">
              <button class="btn btn-danger btn-sm" onclick="removeItem(${idx})">Remove</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join("");

  if (tEl) tEl.textContent = total;
  updateCartBadge();
}
window.loadCartPage = loadCartPage;

/* ------------------ PRODUCT PAGE ------------------ */

async function loadSingleProduct() {
  const id = new URLSearchParams(window.location.search).get("id");
  if (!id) return;
  try {
    const res = await fetch(`/api/products/${encodeURIComponent(id)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const p = await res.json();
    if (!p) return;

    const elName = document.getElementById("p_name");
    if (elName) elName.textContent = p.name || "";

    const elPrice = document.getElementById("p_price");
    if (elPrice) elPrice.textContent = p.price || "";

    const elDesc = document.getElementById("p_desc");
    if (elDesc) elDesc.textContent = p.description || "";

    const elCat = document.getElementById("p_category");
    if (elCat) elCat.textContent = p.category || "";

    const mainImage = document.getElementById("mainImage");
    if (mainImage) mainImage.src = (p.images && p.images[0]) ? p.images[0] : "/images/default-product.png";

    const thumbRow = document.getElementById("thumbRow");
    if (thumbRow) {
      thumbRow.innerHTML = "";
      (p.images || []).forEach((img, i) => {
        const safe = escapeHtml(img || "/images/default-product.png");
        thumbRow.innerHTML += `
          <img src="${safe}" class="thumb-img ${i===0?'active':''}"
               style="height:60px;width:60px;object-fit:cover;margin-right:8px;cursor:pointer;"
               onclick="document.getElementById('mainImage').src='${safe}'">
        `;
      });
    }

    window.currentProduct = p;
  } catch (e) {
    console.error("loadSingleProduct error:", e);
  }
}
window.loadSingleProduct = loadSingleProduct;

function addToCartPage() {
  const mEl = document.getElementById("metreInput");
  const m = mEl ? Number(mEl.value) || 1 : 1;
  if (!window.currentProduct) {
    alert("Product not loaded.");
    return;
  }
  addToCart(window.currentProduct, m);
}
window.addToCartPage = addToCartPage;

/* ------------------ LOAD PRODUCTS LIST ------------------ */

async function loadProducts(cat, containerId = "productsContainer") {
  const box = document.getElementById(containerId);
  if (box) box.innerHTML = "Loading...";
  try {
    const res = await fetch(`/api/products/category/${encodeURIComponent(cat)}`);
    if (!res.ok) {
      if (box) box.innerHTML = `<p class='text-muted'>Failed to load products.</p>`;
      return;
    }
    const products = await res.json();
    if (!products || !products.length) {
      if (box) box.innerHTML = `<p class='text-muted fw-bold'>Coming Soon...</p>`;
      return;
    }
    if (box) box.innerHTML = "";
    products.forEach((p) => {
      if (!box) return;
      const img = escapeHtml((p.images && p.images[0]) ? p.images[0] : "/images/default-product.png");
      box.innerHTML += `
        <div class="col-md-4 product-card">
          <div class="card shadow-sm" onclick="openProduct('${escapeHtml(p._id)}')" style="cursor:pointer;">
            <img src="${img}" style="height:250px;width:100%;object-fit:cover;">
            <div class="card-body">
              <h5>${escapeHtml(p.name)}</h5>
              <p class="fw-bold">₹${escapeHtml(p.price)}</p>
            </div>
          </div>
        </div>
      `;
    });
  } catch (e) {
    console.error("loadProducts error:", e);
    if (box) box.innerHTML = `<p class='text-muted'>Error loading products.</p>`;
  }
}
window.loadProducts = loadProducts;

function openProduct(id) {
  window.location.href = `product.html?id=${encodeURIComponent(id)}`;
}
window.openProduct = openProduct;

/* ------------------ ADMIN ------------------ */

async function adminDeleteProduct(id) {
  if (!confirm("Delete this product permanently?")) return;
  try {
    const res = await fetch(`/api/admin/products/${encodeURIComponent(id)}`, { method: "DELETE" });
    const data = await res.json();
    if (data && data.success) { alert("Product deleted."); renderAdminProducts(); }
    else alert("Delete failed.");
  } catch (e) {
    console.error("adminDeleteProduct error:", e);
    alert("Delete failed (server error).");
  }
}
window.adminDeleteProduct = adminDeleteProduct;

async function renderAdminProducts() {
  const out = document.getElementById("productsAdminList");
  if (!out) return;
  out.innerHTML = "Loading...";
  try {
    const res = await fetch("/api/products/category/all");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const products = await res.json();
    out.innerHTML = products
      .map((p) => `
        <div class="card p-2 mb-2">
          <div class="d-flex align-items-center">
            <img src="${escapeHtml((p.images && p.images[0]) ? p.images[0] : '/images/default-product.png')}"
                 style="width:70px;height:70px;border-radius:8px;object-fit:cover;">
            <div class="ms-3">
              <strong>${escapeHtml(p.name)}</strong> — ₹${escapeHtml(p.price)}<br><span>${escapeHtml(p.category)}</span>
            </div>
            <button class="btn btn-danger btn-sm ms-auto" onclick="adminDeleteProduct('${escapeHtml(p._id)}')">Delete</button>
          </div>
        </div>
      `).join("");
  } catch (e) {
    console.error("renderAdminProducts error:", e);
    out.innerHTML = "<p class='text-muted'>Failed to load admin products.</p>";
  }
}
window.renderAdminProducts = renderAdminProducts;

/* ------------------ EMAIL AUTH (LOGIN / REGISTER) ------------------ */

async function emailLogin() {
  const emailEl = document.getElementById("loginEmail");
  const passEl = document.getElementById("loginPass");
  const email = emailEl ? emailEl.value.trim() : "";
  const pass = passEl ? passEl.value : "";

  if (!email || !pass) return alert("Please enter email and password.");

  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: pass })
    });
    const data = await res.json();
    if (!data || !data.success) return alert(data && data.message ? data.message : "Login failed");
    const user = data.user;
    saveUserToLocal(user);
    if (ADMINS.includes(user.email)) localStorage.setItem("adminLoggedIn", "true");
    else localStorage.removeItem("adminLoggedIn");

    // close modal safely
    const modalEl = document.getElementById("emailLoginModal");
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
  const nameEl = document.getElementById("regName");
  const emailEl = document.getElementById("regEmail");
  const passEl = document.getElementById("regPass");
  const name = nameEl ? nameEl.value.trim() : "";
  const email = emailEl ? emailEl.value.trim() : "";
  const pass = passEl ? passEl.value : "";

  if (!email || !pass) return alert("Please enter email and password.");

  try {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password: pass })
    });
    const data = await res.json();
    if (!data || !data.success) return alert(data && data.message ? data.message : "Register failed");

    alert("Account created! Please login.");
    // show login modal
    try {
      const rm = bootstrap.Modal.getInstance(document.getElementById("registerModal"));
      if (rm) rm.hide();
    } catch (e) { /* ignore */ }
    try {
      const lm = new bootstrap.Modal(document.getElementById("emailLoginModal"));
      lm.show();
    } catch (e) { /* ignore */ }
  } catch (e) {
    console.error("emailRegister error:", e);
    alert("Register failed (server error).");
  }
}
window.emailRegister = emailRegister;

/* Small helper to open register modal from inline links */
function openRegister() {
  try {
    const rm = new bootstrap.Modal(document.getElementById("registerModal"));
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

/* ------------------ INITIALIZE ON DOM READY ------------------ */
document.addEventListener("DOMContentLoaded", async () => {
  setupLoginUI();
  updateCartBadge();
  attachLoginButton();

  // Init Google library in background (non-blocking)
  initGoogleLogin().then((ok) => {
    if (ok) console.log("Google ready (background init)");
  }).catch((e) => console.warn("Background Google init failed:", e));

  // decide what to run on current page
  const path = (window.location.pathname || "").toLowerCase();

  // cart page
  if (path.includes("cart") || document.getElementById("cartItems")) {
    try { loadCartPage(); } catch (e) { console.error("loadCartPage failed:", e); }
  }

  // product details page
  if (path.includes("product") || document.getElementById("p_name")) {
    try { loadSingleProduct(); } catch (e) { console.error("loadSingleProduct failed:", e); }
  }

  // admin products list
  if (path.includes("admin") && document.getElementById("productsAdminList")) {
    try { renderAdminProducts(); } catch (e) { console.error("renderAdminProducts failed:", e); }
  }

  // product list containers (common case)
  // if any element with id 'productsContainer' exists and has data-cat attribute, load it
  const prodContainers = document.querySelectorAll("[data-products-cat]");
  prodContainers.forEach((el) => {
    const cat = el.getAttribute("data-products-cat") || "all";
    loadProducts(cat, el.id);
  });
});

/* ------------------ EXPORTS (for tests / console) ------------------ */
window._sg = {
  safeParseCart,
  safeJSONParse,
  getUser,
  addToCart,
  removeItem,
  loadCartPage,
  loadProducts,
  loadSingleProduct,
  triggerGoogleLogin,
  renderAdminProducts,
  emailLogin,
  emailRegister,
  openRegister
};