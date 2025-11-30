/******************************************************
 * SUITS N GLAM — FINAL MERGED APP.JS (STABLE VERSION)
 ******************************************************/

console.log("APP.JS LOADED");

/******************************************************
 * UNIVERSAL HELPERS
 ******************************************************/
const ADMINS = ["sohabrar10@gmail.com", "suitsnglam01@gmail.com"];

function getUser() {
  const raw = localStorage.getItem("sg_user");
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

function escapeHtml(text) {
  return text?.replace(/[&<>"']/g, m =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[m])
  );
}

/******************************************************
 * NAVBAR LOGIN UI — FIXED (NO FLICKER)
 ******************************************************/
function setupLoginUI() {
  const user = getUser();
  const loginBtn = document.getElementById("loginBtn");
  const icon = document.getElementById("accountIcon");
  const navArea = document.querySelector(".nav-login-area");
  const adminBadge = document.getElementById("adminBadgeNav");

  if (!loginBtn || !icon || !navArea) return;

  navArea.style.visibility = "visible";

  if (!user) {
    loginBtn.style.display = "inline-block";
    icon.style.display = "none";
    if (adminBadge) adminBadge.style.display = "none";
    return;
  }

  // User logged in
  loginBtn.style.display = "none";
  icon.src = user.picture || "/public/images/default-user.png";
  icon.style.display = "inline-block";

  // Admin badge
  if (ADMINS.includes(user.email)) {
    if (adminBadge) adminBadge.style.display = "inline-block";
  }

  /***********************
   * FIX: ACCOUNT ICON REDIRECT
   ***********************/
  if (ADMINS.includes(user.email)) {
    // Admin → admin.html
    icon.onclick = () => window.location.href = "admin.html";
  } else {
    // Normal user → account.html
    icon.onclick = () => window.location.href = "account.html";
  }
}

document.addEventListener("DOMContentLoaded", setupLoginUI);

/******************************************************
 * GOOGLE LOGIN
 ******************************************************/
const GOOGLE_CLIENT_ID =
  "653374521156-6retcia1fiu5dvmbjik9sq89ontrkmvt.apps.googleusercontent.com";

(function loadSDK() {
  if (!document.getElementById("gsi-script")) {
    const s = document.createElement("script");
    s.id = "gsi-script";
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.defer = true;
    document.head.appendChild(s);
  }
})();

function saveUser(data, token) {
  const user = {
    email: data.email,
    name: data.name,
    picture: data.picture,
    token,
    joined: new Date().toLocaleDateString()
  };

  localStorage.setItem("sg_user", JSON.stringify(user));

  if (ADMINS.includes(user.email)) {
    localStorage.setItem("adminLoggedIn", "true");
  } else {
    localStorage.removeItem("adminLoggedIn");
  }
}

function handleCredentialResponse(response) {
  try {
    const data = jwt_decode(response.credential);
    saveUser(data, response.credential);
    setupLoginUI();
  } catch (e) {
    console.error("Google Auth failed:", e);
  }
}

function googleLogin() {
  if (!window.google?.accounts?.id) {
    return setTimeout(googleLogin, 300);
  }

  google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: handleCredentialResponse,
  });

  google.accounts.id.prompt();
}

document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("loginBtn");
  if (btn) btn.onclick = googleLogin;
});

/******************************************************
 * CART BADGE
 ******************************************************/
async function updateCartBadge() {
  const badge = document.getElementById("cartCount");
  if (!badge) return;

  badge.textContent = "";
  const user = getUser();

  // Local fallback
  const cartLocal = JSON.parse(localStorage.getItem("cart") || "[]");
  if (cartLocal.length) {
    badge.textContent = cartLocal.length;
    return;
  }
}

window.updateCartBadge = updateCartBadge;

/******************************************************
 * LOAD PRODUCTS — FIXED (API + ADMIN-ADDED PRODUCTS)
 ******************************************************/
async function loadProducts(category, containerId = "productsContainer") {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `<p class="text-muted">Loading...</p>`;

  let products = [];

  /* 1️⃣ Load from API (if working) */
  try {
    const res = await fetch(`/api/products/category/${category}`);
    if (res.ok) {
      const apiProducts = await res.json();
      products = [...products, ...apiProducts];
    }
  } catch (e) {
    console.warn("API not available, loading only local products.");
  }

  /* 2️⃣ Load admin-added local products */
  const localProducts = JSON.parse(localStorage.getItem("products") || "[]");

  // filter local products by category
  const localFiltered = localProducts.filter(p => {
    return p.category?.toLowerCase() === category.toLowerCase() ||
           category === "all";
  });

  products = [...products, ...localFiltered];

  /* 3️⃣ Display */
  if (!products.length) {
    container.innerHTML = `
      <p class="text-muted fw-bold">Coming Soon...</p>
    `;
    return;
  }

  container.innerHTML = "";

  products.forEach(p => {
    const outOfStock = p.stock === 0;

    container.innerHTML += `
      <div class="col-md-4 product-card">
        <div class="card shadow-sm" onclick="openProduct('${p._id || p.id}')">
          <img src="${p.images?.[0] || ''}" class="card-img-top" 
               style="height:250px;object-fit:cover">

          ${outOfStock ? `<span class="badge bg-danger m-2">Out of Stock</span>` : ""}

          <div class="card-body">
            <h5>${p.name}</h5>
            <p>₹${p.pricePerMeter || p.price}/m</p>
          </div>
        </div>
      </div>
    `;
  });
}
window.loadProducts = loadProducts;

/******************************************************
 * OPEN PRODUCT DETAILS PAGE
 ******************************************************/
function openProduct(id) {
  window.location.href = `product.html?id=${id}`;
}

window.openProduct = openProduct;

/******************************************************
 * CART OPERATIONS
 ******************************************************/
function loadCartPage() {
  const items = JSON.parse(localStorage.getItem("cart") || "[]");
  const cont = document.getElementById("cartItems");
  const empty = document.getElementById("cartEmpty");
  const summary = document.getElementById("cartSummary");

  if (!items.length) {
    empty.style.display = "block";
    cont.innerHTML = "";
    summary.style.display = "none";
    updateCartBadge();
    return;
  }

  empty.style.display = "none";
  summary.style.display = "block";
  cont.innerHTML = "";

  let total = 0;

  items.forEach((p, i) => {
    total += Number(p.price || 0) * Number(p.metres || 1);
    cont.innerHTML += `
      <div class="col-md-4">
        <div class="card p-2">
          <img src="${p.image}" style="height:180px;width:100%;object-fit:cover">
          <div class="card-body">
            <h5>${p.title}</h5>
            <p>₹${p.price} × ${p.metres}m</p>
            <button class="btn btn-danger btn-sm" onclick="removeItem(${i})">Remove</button>
          </div>
        </div>
      </div>
    `;
  });

  document.getElementById("cartTotal").textContent = total;
  updateCartBadge();
}

window.loadCartPage = loadCartPage;

function removeItem(i) {
  const cart = JSON.parse(localStorage.getItem("cart") || "[]");
  cart.splice(i, 1);
  localStorage.setItem("cart", JSON.stringify(cart));
  loadCartPage();
  updateCartBadge();
}

window.removeItem = removeItem;

/******************************************************
 * ORDER SYSTEM (unchanged)
 ******************************************************/
document.addEventListener("DOMContentLoaded", updateCartBadge);
