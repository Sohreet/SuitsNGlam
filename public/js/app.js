/******************************************************
 * SUITS N GLAM — FINAL MERGED APP.JS (FULL VERSION)
 * (Fixed Google Sign-In initialization + handlers)
 ******************************************************/

console.log("APP.JS LOADED");

/******************************************************
 * GLOBALS
 ******************************************************/
const ADMINS = ["sohabrar10@gmail.com", "suitsnglam01@gmail.com"];
const GOOGLE_CLIENT_ID = "653374521156-6retcia1fiu5dvmbjik9sq89ontrkmvt.apps.googleusercontent.com";

/******************************************************
 * UNIVERSAL HELPERS
 ******************************************************/
function getUser() {
  const raw = localStorage.getItem("sg_user");
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

function escapeHtml(str) {
  return str?.replace(/[&<>"']/g, (m) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#039;" }[m])
  );
}

/******************************************************
 * NAVBAR LOGIN UI — FIX (NO FLICKER)
 ******************************************************/
function setupLoginUI() {
  const loginBtn = document.getElementById("loginBtn");
  const icon = document.getElementById("accountIcon");
  const navArea = document.querySelector(".nav-login-area");
  const adminBadge = document.getElementById("adminBadgeNav");

  const user = getUser();

  if (!loginBtn || !icon || !navArea) return;

  navArea.style.visibility = "visible";

  if (!user) {
    loginBtn.style.display = "inline-block";
    icon.style.display = "none";
    if (adminBadge) adminBadge.style.display = "none";
    return;
  }

  loginBtn.style.display = "none";
  icon.src = user.picture || "/public/images/default-user.png";
  icon.style.display = "inline-block";

  if (ADMINS.includes(user.email)) {
    if (adminBadge) adminBadge.style.display = "inline-block";
    icon.onclick = () => window.location.href = "admin.html";
  } else {
    icon.onclick = () => window.location.href = "account.html";
    if (adminBadge) adminBadge.style.display = "none";
  }
}

/******************************************************
 * GOOGLE AUTH — handlers + robust init
 ******************************************************/
/*
  Strategy:
  - Wait for window.google (GSI SDK) to be available.
  - Initialize google.accounts.id exactly once.
  - Provide handleCredentialResponse which decodes JWT and saves user.
  - Attach a guaranteed-click handler on #loginBtn that will call prompt()
    after initialization; if not ready it waits a short interval.
*/

let _gsiInitialized = false;

/* save user to localStorage and mark admin */
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

/* callback from Google when credential received */
function handleCredentialResponse(response) {
  try {
    // jwt_decode is loaded via HTML <script src=".../jwt-decode.min.js">
    const data = jwt_decode(response.credential);
    saveUser(data, response.credential);
    // refresh UI
    setupLoginUI();
    updateCartBadge();
  } catch (err) {
    console.error("Google credential handling failed:", err);
  }
}

/* initialize GSI — safe to call multiple times */
function initGSI() {
  if (_gsiInitialized) return;
  if (!window.google || !google.accounts || !google.accounts.id) return;

  google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: handleCredentialResponse,
    ux_mode: "popup"
  });

  _gsiInitialized = true;
  // optional: configure auto prompt off — we will prompt on click
  // google.accounts.id.prompt(); // don't call automatically
}

/* utility: wait for GSI to load, up to timeoutMs */
function waitForGSI(timeoutMs = 5000) {
  return new Promise((resolve) => {
    if (window.google && google.accounts && google.accounts.id) {
      return resolve(true);
    }
    const start = Date.now();
    const iv = setInterval(() => {
      if (window.google && google.accounts && google.accounts.id) {
        clearInterval(iv);
        return resolve(true);
      }
      if (Date.now() - start > timeoutMs) {
        clearInterval(iv);
        return resolve(false);
      }
    }, 150);
  });
}

/* attach click handler to login button (guaranteed) */
async function attachLoginButton() {
  const loginBtn = document.getElementById("loginBtn");
  if (!loginBtn) return;

  loginBtn.removeEventListener("click", _loginClickHandler);
  loginBtn.addEventListener("click", _loginClickHandler);
}

async function _loginClickHandler(e) {
  // ensure GSI present and initialized
  const ok = await waitForGSI(7000);
  if (!ok) {
    // fallback: try to load GSI script dynamically (if missing)
    loadGSIScriptOnce();
    const ok2 = await waitForGSI(7000);
    if (!ok2) return alert("Google Sign-In not available right now. Try again later.");
  }
  initGSI();

  try {
    // request popup
    google.accounts.id.prompt(); // will show the One Tap or popup depending on state
  } catch (err) {
    // fallback to request a credential immediately (older flows) — still try prompt
    try { google.accounts.id.prompt(); } catch (e) { console.error("GSI prompt failed", e); }
  }
}

/* if HTML didn't include the GSI script for some reason, load it */
function loadGSIScriptOnce() {
  if (document.getElementById("gsi-script")) return;
  const s = document.createElement("script");
  s.id = "gsi-script";
  s.src = "https://accounts.google.com/gsi/client";
  s.async = true;
  s.defer = true;
  s.onload = () => {
    console.log("GSI script loaded dynamically");
    initGSI();
  };
  document.head.appendChild(s);
}

/******************************************************
 * INITIALIZATIONS: ensure login UI and button wiring
 ******************************************************/
document.addEventListener("DOMContentLoaded", async () => {
  setupLoginUI();
  updateCartBadge();

  // If GSI is already on the page (script tag in HTML), initialize
  if (window.google && google.accounts && google.accounts.id) {
    initGSI();
  } else {
    // wait briefly in case SDK is still loading; if not present, we may load it
    await waitForGSI(3000);
    if (!window.google) {
      // try to load the GSI script dynamically if the HTML didn't include it
      loadGSIScriptOnce();
    } else {
      initGSI();
    }
  }

  // attach robust click handler
  attachLoginButton();
});

/******************************************************
 * CART BADGE
 ******************************************************/
function updateCartBadge() {
  const badge = document.getElementById("cartCount");
  if (!badge) return;

  const cart = JSON.parse(localStorage.getItem("cart") || "[]");
  badge.textContent = cart.length ? cart.length : "";
}
window.updateCartBadge = updateCartBadge;

/******************************************************
 * CART SYSTEM
 ******************************************************/
function loadCartPage() {
  const cont = document.getElementById("cartItems");
  const empty = document.getElementById("cartEmpty");
  const summary = document.getElementById("cartSummary");

  const cart = JSON.parse(localStorage.getItem("cart") || "[]");

  if (!cart.length) {
    if (empty) empty.style.display = "block";
    if (cont) cont.innerHTML = "";
    if (summary) summary.style.display = "none";
    updateCartBadge();
    return;
  }

  if (empty) empty.style.display = "none";
  if (summary) summary.style.display = "block";

  if (cont) cont.innerHTML = "";
  let total = 0;

  cart.forEach((item, i) => {
    total += Number(item.price) * Number(item.metres);

    if (cont) {
      cont.innerHTML += `
        <div class="col-md-4">
          <div class="card p-2">
            <img src="${item.image}" class="w-100" style="height:180px;object-fit:cover">

            <div class="card-body">
              <h5>${item.title}</h5>
              <p>₹${item.price} × ${item.metres}m</p>

              <button class="btn btn-danger btn-sm" onclick="removeItem(${i})">
                Remove
              </button>
            </div>
          </div>
        </div>
      `;
    }
  });

  const totalEl = document.getElementById("cartTotal");
  if (totalEl) totalEl.textContent = total;
  updateCartBadge();
}
window.loadCartPage = loadCartPage;

function removeItem(i) {
  let cart = JSON.parse(localStorage.getItem("cart") || "[]");
  cart.splice(i, 1);
  localStorage.setItem("cart", JSON.stringify(cart));
  loadCartPage();
}
window.removeItem = removeItem;

/******************************************************
 * PRODUCT DETAILS PAGE
 ******************************************************/
async function loadSingleProduct() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  if (!id) return;

  const res = await fetch(`/api/products/${id}`);
  const p = await res.json();

  const titleEl = document.getElementById("pd-title");
  const priceEl = document.getElementById("pd-price");
  const descEl = document.getElementById("pd-desc");
  const imgCont = document.getElementById("pd-images");
  const videoCont = document.getElementById("pd-video");

  if (titleEl) titleEl.textContent = p.name;
  if (priceEl) priceEl.textContent = "₹" + p.price;
  if (descEl) descEl.textContent = p.description;

  if (imgCont) {
    imgCont.innerHTML = p.images.map(img =>
      `<img src="${img}" class="img-fluid mb-2" style="border-radius:10px;">`
    ).join("");
  }

  if (p.video && videoCont) {
    videoCont.innerHTML = `
      <video controls width="100%" class="mt-3 rounded">
        <source src="${p.video}">
      </video>
    `;
  }

  window.selectedProduct = p;
}
window.loadSingleProduct = loadSingleProduct;

function addDetailToCart() {
  const metres = Number(document.getElementById("meterInput").value || 1);

  const p = window.selectedProduct;
  if (!p) return;

  const cart = JSON.parse(localStorage.getItem("cart") || "[]");

  cart.push({
    productId: p._id,
    title: p.name,
    price: p.price,
    image: p.images[0],
    metres
  });

  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartBadge();

  alert("Added to cart!");
}

/******************************************************
 * LOAD PRODUCTS BY CATEGORY
 ******************************************************/
async function loadProducts(category, containerId = "productsContainer") {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = "Loading...";

  try {
    const res = await fetch(`/api/products/category/${category}`);
    const products = await res.json();

    if (!products.length) {
      container.innerHTML = `<p class="text-muted fw-bold">Coming Soon...</p>`;
      return;
    }

    container.innerHTML = "";

    products.forEach(p => {
      const outOfStock = p.stock === 0;

      container.innerHTML += `
        <div class="col-md-4 product-card">
          <div class="card shadow-sm" onclick="openProduct('${p._id}')">

            <img src="${p.images[0]}" class="card-img-top" 
                 style="height:250px;object-fit:cover">

            ${outOfStock ? `<span class="badge bg-danger m-2">Out of Stock</span>` : ""}

            <div class="card-body">
              <h5>${p.name}</h5>
              <p class="fw-bold">₹${p.price}/m</p>
            </div>

          </div>
        </div>
      `;
    });
  } catch (err) {
    console.error("Failed loading products:", err);
    container.innerHTML = `<p class="text-danger">Failed loading products.</p>`;
  }
}
window.loadProducts = loadProducts;

function openProduct(id) {
  window.location.href = `product.html?id=${id}`;
}
window.openProduct = openProduct;

/******************************************************
 * ADMIN PROTECTION
 ******************************************************/
if (window.location.pathname.includes("admin")) {
  const isAdmin = localStorage.getItem("adminLoggedIn");
  if (!isAdmin) window.location.href = "index.html";
}
