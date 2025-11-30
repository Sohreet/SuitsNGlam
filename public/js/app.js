/******************************************************
 * SUITS N GLAM — FINAL MERGED APP.JS (FULL VERSION)
 ******************************************************/

console.log("APP.JS LOADED");

/******************************************************
 * GLOBALS
 ******************************************************/
const ADMINS = ["sohabrar10@gmail.com", "suitsnglam01@gmail.com"];

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
 * GOOGLE LOGIN
 ******************************************************/
const GOOGLE_CLIENT_ID =
  "653374521156-6retcia1fiu5dvmbjik9sq89ontrkmvt.apps.googleusercontent.com";

(function loadSDK() {
  if (document.getElementById("gsi-script")) return;
  const s = document.createElement("script");
  s.id = "gsi-script";
  s.src = "https://accounts.google.com/gsi/client";
  s.async = true;
  s.defer = true;
  document.head.appendChild(s);
})();

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

function handleCredentialResponse(response) {
  try {
    const data = jwt_decode(response.credential);
    saveUser(data, response.credential);
    setupLoginUI();
  } catch (err) {
    console.error("Google Auth Error:", err);
  }
}

function googleLogin() {
  if (!google?.accounts?.id) return setTimeout(googleLogin, 200);

  google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: handleCredentialResponse,
  });

  google.accounts.id.prompt();
}

/******************************************************
 * AUTO SETUP LOGIN UI ON PAGE LOAD
 ******************************************************/
document.addEventListener("DOMContentLoaded", () => {
  setupLoginUI();
  updateCartBadge();
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

  cart.forEach((item, i) => {
    total += Number(item.price) * Number(item.metres);

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
 * PRODUCT DETAILS PAGE
 ******************************************************/
async function loadSingleProduct() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  if (!id) return;

  const res = await fetch(`/api/products/${id}`);
  const p = await res.json();

  document.getElementById("pd-title").textContent = p.name;
  document.getElementById("pd-price").textContent = "₹" + p.price;
  document.getElementById("pd-desc").textContent = p.description;

  const imgCont = document.getElementById("pd-images");
  imgCont.innerHTML = p.images.map(img =>
    `<img src="${img}" class="img-fluid mb-2" style="border-radius:10px;">`
  ).join("");

  if (p.video) {
    document.getElementById("pd-video").innerHTML = `
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
  container.innerHTML = "Loading...";

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
