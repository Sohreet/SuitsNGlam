/******************************************************
 * SUITS N GLAM — ROBUST APP.JS (DEBUG + POPUP SAFE)
 ******************************************************/

console.log("APP.JS LOADED");

const ADMINS = ["sohabrar10@gmail.com"];
const GOOGLE_CLIENT_ID = "653374521156-6retcia1fiu5dvmbjik9sq89ontrkmvt.apps.googleusercontent.com";

/* ------------------ HELPERS ------------------ */
function getUser() {
  const raw = localStorage.getItem("sg_user");
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

function escapeHtml(str) {
  return str?.replace(/[&<>"']/g, (m) =>
    ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m])
  );
}

/* ------------------ NAVBAR LOGIN UI ------------------ */
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
    icon.onclick = () => (window.location.href = "admin.html");
  } else {
    icon.onclick = () => (window.location.href = "account.html");
    if (adminBadge) adminBadge.style.display = "none";
  }
}

/* ------------------ SAVE / LOGOUT ------------------ */
function saveUser(data, token) {
  const user = {
    email: data.email,
    name: data.name,
    picture: data.picture,
    token,
    joined: new Date().toLocaleDateString(),
  };
  localStorage.setItem("sg_user", JSON.stringify(user));
  if (ADMINS.includes(user.email)) localStorage.setItem("adminLoggedIn", "true");
  else localStorage.removeItem("adminLoggedIn");
}
window.logout = function() {
  localStorage.removeItem("sg_user");
  localStorage.removeItem("adminLoggedIn");
  // NOTE: This does NOT clear Google cookies; it logs the user out locally.
  console.log("Local logout done. To fully sign out, clear Google cookie/site data.");
  setupLoginUI();
  updateCartBadge();
};

/* ------------------ GOOGLE HANDLER (EXPOSED) ------------------ */
window.handleCredentialResponse = function(response) {
  console.log("handleCredentialResponse called", response);
  try {
    const data = jwt_decode(response.credential);
    console.log("Decoded token:", data);
    saveUser(data, response.credential);
    setupLoginUI();
    updateCartBadge();
    // optional: close any UI modals or notify user
    alert(`Welcome ${data.name || data.email}`);
    // reload to reflect role changes (admin badge etc.)
    window.location.reload();
  } catch (err) {
    console.error("Google Auth error decoding token:", err);
    alert("Login failed (check console).");
  }
};

/* ------------------ GOOGLE INITIALIZATION (ROBUST) ------------------ */
/*
 * initGoogleLogin() is invoked from the login button click.
 * It waits for google.accounts to be available and then initializes
 * in popup mode and calls prompt() as a result of a user gesture.
 */
async function waitForGoogle(timeoutMs = 5000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (window.google && google.accounts && google.accounts.id) return true;
    await new Promise((r) => setTimeout(r, 100));
  }
  return false;
}

async function initGoogleLogin() {
  console.log("initGoogleLogin called");
  const ready = await waitForGoogle(8000); // wait up to 8s
  if (!ready) {
    console.error("Google Identity library not loaded (accounts.google.com/gsi).");
    alert("Google login is not ready. Try reloading the page or check console.");
    return;
  }

  try {
    // Initialize only once (guard)
    if (!window.__sg_google_initialized) {
      google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: window.handleCredentialResponse,
        ux_mode: "popup",
        auto_select: false,
      });
      google.accounts.id.disableAutoSelect && google.accounts.id.disableAutoSelect();
      window.__sg_google_initialized = true;
      console.log("Google Identity initialized (popup mode).");
    } else {
      console.log("Google Identity already initialized.");
    }

    // Must be called as a result of user gesture (click). We call prompt()
    // which will open account chooser in popup mode.
    google.accounts.id.prompt((notification) => {
      // NOTE: in popup mode prompt() is used to trigger the flow. We still
      // pass a small callback for logging useful info.
      console.log("google.accounts.id.prompt() callback:", notification);
    });

  } catch (err) {
    console.error("Error initializing Google Identity:", err);
    alert("Login init failed (see console).");
  }
}

/* Attach login button to call initGoogleLogin (user gesture) */
function attachLoginButton() {
  const btn = document.getElementById("loginBtn");
  if (!btn) return;
  btn.onclick = (e) => {
    // prevent accidental double click
    btn.disabled = true;
    setTimeout(() => (btn.disabled = false), 1200);
    initGoogleLogin();
  };
}

/* ------------------ CART + PRODUCTS (unchanged) ------------------ */
function updateCartBadge() {
  const badge = document.getElementById("cartCount");
  if (!badge) return;
  const cart = JSON.parse(localStorage.getItem("cart") || "[]");
  badge.textContent = cart.length ? cart.length : "";
}
window.updateCartBadge = updateCartBadge;

function addToCart(product, metres = 1) {
  let cart = JSON.parse(localStorage.getItem("cart") || "[]");
  cart.push({
    id: product._id,
    name: product.name,
    price: product.price,
    image: product.images[0],
    metres,
  });
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartBadge();
  alert("Added to cart!");
}
window.addToCart = addToCart;

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

  if (cont) {
    cont.innerHTML = "";
    let total = 0;
    cart.forEach((i, idx) => {
      total += i.price * i.metres;
      cont.innerHTML += `
        <div class="col-md-4">
          <div class="card p-2 shadow-sm">
            <img src="${i.image}" style="height:150px;width:100%;object-fit:cover;">
            <div class="card-body">
              <h5>${i.name}</h5>
              <p>₹${i.price} × ${i.metres}m</p>
              <button class="btn btn-danger btn-sm" onclick="removeItem(${idx})">Remove</button>
            </div>
          </div>
        </div>
      `;
    });
    const tEl = document.getElementById("cartTotal");
    if (tEl) tEl.textContent = total;
  }
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

/* PRODUCT & ADMIN (unchanged) */
async function loadSingleProduct() {
  const id = new URLSearchParams(window.location.search).get("id");
  if (!id) return;
  const res = await fetch(`/api/products/${id}`);
  const p = await res.json();
  document.getElementById("p_name").textContent = p.name;
  document.getElementById("p_price").textContent = p.price;
  document.getElementById("p_desc").textContent = p.description;
  document.getElementById("p_category").textContent = p.category;
  document.getElementById("mainImage").src = p.images[0];
  const thumbRow = document.getElementById("thumbRow");
  if (thumbRow) {
    thumbRow.innerHTML = "";
    p.images.forEach((img, i) => {
      thumbRow.innerHTML += `
        <img src="${img}" class="thumb-img ${i === 0 ? "active" : ""}"
             onclick="document.getElementById('mainImage').src='${img}'">
      `;
    });
  }
  window.currentProduct = p;
}
window.loadSingleProduct = loadSingleProduct;

function addToCartPage() {
  const m = Number(document.getElementById("metreInput").value);
  addToCart(window.currentProduct, m);
}

async function loadProducts(cat, containerId = "productsContainer") {
  const box = document.getElementById(containerId);
  if (box) box.innerHTML = "Loading...";
  const res = await fetch(`/api/products/category/${cat}`);
  const products = await res.json();
  if (!products.length) {
    if (box) box.innerHTML = `<p class='text-muted fw-bold'>Coming Soon...</p>`;
    return;
  }
  if (box) box.innerHTML = "";
  products.forEach((p) => {
    if (box)
      box.innerHTML += `
        <div class="col-md-4 product-card">
          <div class="card shadow-sm" onclick="openProduct('${p._id}')">
            <img src="${p.images[0]}" style="height:250px;width:100%;object-fit:cover;">
            <div class="card-body">
              <h5>${p.name}</h5>
              <p class="fw-bold">₹${p.price}/m</p>
            </div>
          </div>
        </div>
      `;
  });
}
window.loadProducts = loadProducts;

function openProduct(id) {
  window.location.href = `product.html?id=${id}`;
}

async function adminDeleteProduct(id) {
  if (!confirm("Delete this product permanently?")) return;
  const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
  const data = await res.json();
  if (data.success) { alert("Product deleted."); renderAdminProducts(); }
  else alert("Delete failed.");
}
window.adminDeleteProduct = adminDeleteProduct;

async function renderAdminProducts() {
  const out = document.getElementById("productsAdminList");
  const res = await fetch("/api/products/category/all");
  const products = await res.json();
  if (!out) return;
  out.innerHTML = products
    .map((p) => `
      <div class="card p-2 mb-2">
        <div class="d-flex align-items-center">
          <img src="${p.images[0]}" style="width:70px;height:70px;border-radius:8px;object-fit:cover;">
          <div class="ms-3">
            <strong>${p.name}</strong> — ₹${p.price}<br><span>${p.category}</span>
          </div>
          <button class="btn btn-danger btn-sm ms-auto" onclick="adminDeleteProduct('${p._id}')">Delete</button>
        </div>
      </div>
    `).join("");
}
window.renderAdminProducts = renderAdminProducts;

/* ADMIN GUARD */
if (window.location.pathname.includes("admin")) {
  if (!localStorage.getItem("adminLoggedIn")) window.location.href = "index.html";
}

/* INITIALIZE UI */
document.addEventListener("DOMContentLoaded", () => {
  setupLoginUI();
  updateCartBadge();
  attachLoginButton();
});
