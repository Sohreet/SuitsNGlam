/******************************************************
 * SUITS N GLAM — ROBUST APP.JS (POPUP SAFE + EMAIL AUTH)
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
  icon.src = user.picture || "/images/default-user.png";
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
function saveUserToLocal(userObj) {
  localStorage.setItem("sg_user", JSON.stringify(userObj));
}
window.logout = function() {
  localStorage.removeItem("sg_user");
  localStorage.removeItem("adminLoggedIn");
  console.log("Local logout done.");
  setupLoginUI();
  updateCartBadge();
  window.location.href = "index.html";
};

/* ------------------ GOOGLE HANDLER (EXPOSED) ------------------ */
window.handleCredentialResponse = function(response) {
  console.log("handleCredentialResponse called", response);
  try {
    const data = jwt_decode(response.credential);
    const user = {
      email: data.email,
      name: data.name,
      picture: data.picture || "/images/default-user.png",
      token: response.credential,
      joined: new Date().toLocaleDateString()
    };
    saveUserToLocal(user);
    if (ADMINS.includes(user.email)) localStorage.setItem("adminLoggedIn", "true");
    else localStorage.removeItem("adminLoggedIn");
    setupLoginUI();
    updateCartBadge();
    // Close modals if open
    const loginModalEl = document.getElementById("emailLoginModal");
    if (loginModalEl) {
      const m = bootstrap.Modal.getInstance(loginModalEl);
      if (m) m.hide();
    }
    alert(`Welcome ${user.name || user.email}`);
    window.location.reload();
  } catch (err) {
    console.error("Google Auth Error:", err);
    alert("Google login failed (check console).");
  }
};

/* ------------------ GOOGLE INITIALIZATION (ROBUST) ------------------ */
async function waitForGoogle(timeoutMs = 8000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (window.google && google.accounts && google.accounts.id) return true;
    await new Promise((r) => setTimeout(r, 100));
  }
  return false;
}

async function initGoogleLogin() {
  console.log("initGoogleLogin called");
  const ready = await waitForGoogle(8000);
  if (!ready) {
    console.error("Google Identity library not loaded.");
    alert("Google login not ready. Try reloading the page.");
    return;
  }

  try {
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

    // prompt() must be called from a user gesture — we call it inside click handlers
    google.accounts.id.prompt((notification) => {
      console.log("google.accounts.id.prompt() callback:", notification);
    });
  } catch (err) {
    console.error("Error initializing Google Identity:", err);
  }
}

/* Exposed helper to trigger Google login from modal button (user gesture) */
function triggerGoogleLogin() {
  // As this is user-triggered (button click), this should open Google popup
  initGoogleLogin();
}

/* Attach login button to open email modal by default (fallback first) */
function attachLoginButton() {
  const btn = document.getElementById("loginBtn");
  if (!btn) return;
  btn.onclick = () => {
    // show email login modal by default
    const modal = new bootstrap.Modal(document.getElementById("emailLoginModal"));
    modal.show();
  };
}

/* ------------------ CART + PRODUCTS ------------------ */
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

/* ------------------ PRODUCT PAGE ------------------ */
async function loadSingleProduct() {
  const id = new URLSearchParams(window.location.search).get("id");
  if (!id) return;
  const res = await fetch(`/api/products/${id}`);
  const p = await res.json();
  const elName = document.getElementById("p_name");
  if (elName) elName.textContent = p.name;
  const elPrice = document.getElementById("p_price");
  if (elPrice) elPrice.textContent = p.price;
  const elDesc = document.getElementById("p_desc");
  if (elDesc) elDesc.textContent = p.description;
  const elCat = document.getElementById("p_category");
  if (elCat) elCat.textContent = p.category;
  const mainImage = document.getElementById("mainImage");
  if (mainImage) mainImage.src = p.images[0];
  const thumbRow = document.getElementById("thumbRow");
  if (thumbRow) {
    thumbRow.innerHTML = "";
    p.images.forEach((img, i) => {
      thumbRow.innerHTML += `
        <img src="${img}" class="thumb-img ${i===0?'active':''}"
             style="height:60px;width:60px;object-fit:cover;margin-right:8px;cursor:pointer;"
             onclick="document.getElementById('mainImage').src='${img}'">
      `;
    });
  }
  window.currentProduct = p;
}
window.loadSingleProduct = loadSingleProduct;

function addToCartPage() {
  const m = Number(document.getElementById("metreInput").value) || 1;
  addToCart(window.currentProduct, m);
}

/* ------------------ LOAD PRODUCTS ------------------ */
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

/* ------------------ ADMIN ------------------ */
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
  if (!out) return;
  const res = await fetch("/api/products/category/all");
  const products = await res.json();
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

/* ------------------ EMAIL LOGIN & REGISTER ------------------ */
async function emailLogin() {
  const email = document.getElementById("loginEmail").value;
  const pass = document.getElementById("loginPass").value;
  if (!email || !pass) return alert("Please enter email and password.");
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: pass })
  });
  const data = await res.json();
  if (!data.success) return alert(data.message || "Login failed");
  const user = data.user;
  saveUserToLocal(user);
  if (ADMINS.includes(user.email)) localStorage.setItem("adminLoggedIn", "true");
  else localStorage.removeItem("adminLoggedIn");
  // close modal
  const modalEl = document.getElementById("emailLoginModal");
  const m = bootstrap.Modal.getInstance(modalEl);
  if (m) m.hide();
  setupLoginUI();
  updateCartBadge();
  window.location.reload();
}

async function emailRegister() {
  const name = document.getElementById("regName").value;
  const email = document.getElementById("regEmail").value;
  const pass = document.getElementById("regPass").value;
  if (!email || !pass) return alert("Please enter email and password.");
  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password: pass })
  });
  const data = await res.json();
  if (!data.success) return alert(data.message || "Register failed");
  alert("Account created! Please login.");
  // open login modal
  const rm = bootstrap.Modal.getInstance(document.getElementById("registerModal"));
  if (rm) rm.hide();
  const lm = new bootstrap.Modal(document.getElementById("emailLoginModal"));
  lm.show();
}

/* ------------------ ADMIN GUARD ------------------ */
if (window.location.pathname.includes("admin")) {
  if (!localStorage.getItem("adminLoggedIn")) window.location.href = "index.html";
}

/* ------------------ INITIALIZE UI ------------------ */
document.addEventListener("DOMContentLoaded", () => {
  setupLoginUI();
  updateCartBadge();
  attachLoginButton();
});
