/******************************************************
 * SUITS N GLAM — FINAL MASTER APP.JS (CLEAN & FIXED)
 ******************************************************/

console.log("APP.JS LOADED");

/******************************************************
 * GLOBALS
 ******************************************************/
const ADMINS = ["sohabrar10@gmail.com"];
const GOOGLE_CLIENT_ID = "653374521156-6retcia1fiu5dvmbjik9sq89ontrkmvt.apps.googleusercontent.com";

/******************************************************
 * HELPERS
 ******************************************************/
function getUser() {
  const raw = localStorage.getItem("sg_user");
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

function escapeHtml(str) {
  return str?.replace(/[&<>"']/g, (m) =>
    ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#039;"
    }[m])
  );
}

/******************************************************
 * NAVBAR LOGIN UI
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
 * GOOGLE LOGIN — REDIRECT MODE
 ******************************************************/

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
    updateCartBadge();

    window.location.reload();
  } catch (err) {
    console.error("Google Auth Error:", err);
  }
}

// FAST redirect login
function initGoogleLogin() {
  google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: handleCredentialResponse,
    ux_mode: "redirect",
    auto_select: false
  });

  google.accounts.id.prompt();
}

function attachLoginButton() {
  const btn = document.getElementById("loginBtn");
  if (btn) btn.onclick = () => initGoogleLogin();
}

/******************************************************
 * INITIALIZE ALL
 ******************************************************/
document.addEventListener("DOMContentLoaded", () => {
  setupLoginUI();
  updateCartBadge();

  // REMOVE initGSI + waitForGSI — not needed in redirect mode
  // Attach login button directly
  attachLoginButton();
});


/******************************************************
 * CART SYSTEM
 ******************************************************/
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
    metres
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

  document.getElementById("cartTotal").textContent = total;
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
 * PRODUCT PAGE LOAD
 ******************************************************/
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
  thumbRow.innerHTML = "";

  p.images.forEach((img, i) => {
    thumbRow.innerHTML += `
      <img src="${img}" class="thumb-img ${i === 0 ? "active" : ""}"
           onclick="document.getElementById('mainImage').src='${img}'">
    `;
  });

  window.currentProduct = p;
}
window.loadSingleProduct = loadSingleProduct;

function addToCartPage() {
  const m = Number(document.getElementById("metreInput").value);
  addToCart(window.currentProduct, m);
}

/******************************************************
 * LOAD PRODUCTS BY CATEGORY
 ******************************************************/
async function loadProducts(cat, containerId = "productsContainer") {
  const box = document.getElementById(containerId);
  box.innerHTML = "Loading...";

  const res = await fetch(`/api/products/category/${cat}`);
  const products = await res.json();

  if (!products.length) {
    box.innerHTML = `<p class='text-muted fw-bold'>Coming Soon...</p>`;
    return;
  }

  box.innerHTML = "";

  products.forEach((p) => {
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

/******************************************************
 * ADMIN DELETE PRODUCT
 ******************************************************/
async function adminDeleteProduct(id) {
  if (!confirm("Delete this product permanently?")) return;

  const res = await fetch(`/api/admin/products/${id}`, {
    method: "DELETE"
  });

  const data = await res.json();
  if (data.success) {
    alert("Product deleted.");
    renderAdminProducts();
  } else {
    alert("Delete failed.");
  }
}
window.adminDeleteProduct = adminDeleteProduct;

/******************************************************
 * ADMIN PRODUCT LIST
 ******************************************************/
async function renderAdminProducts() {
  const out = document.getElementById("productsAdminList");
  const res = await fetch("/api/products/category/all");
  const products = await res.json();

  out.innerHTML = products
    .map((p) => `
      <div class="card p-2 mb-2">
        <div class="d-flex align-items-center">
          <img src="${p.images[0]}" style="width:70px;height:70px;border-radius:8px;object-fit:cover;">
          <div class="ms-3">
            <strong>${p.name}</strong> — ₹${p.price}  
            <br>
            <span>${p.category}</span>
          </div>
          <button class="btn btn-danger btn-sm ms-auto" onclick="adminDeleteProduct('${p._id}')">
            Delete
          </button>
        </div>
      </div>
    `)
    .join("");
}
window.renderAdminProducts = renderAdminProducts;

/******************************************************
 * ADMIN GUARD
 ******************************************************/
if (window.location.pathname.includes("admin")) {
  if (!localStorage.getItem("adminLoggedIn"))
    window.location.href = "index.html";
}
