/******************************************************
 * SUITS N GLAM — SMART APP.JS
 * Handles:
 * - Google Login
 * - Navbar UI
 * - Cart
 * - Product System (localStorage)
 * - Auto New Arrivals
 * - Auto Best Deals
 * - Admin Controls
 * - Orders
 ******************************************************/

console.log("APP.JS LOADED");

/******************************************************
 * UNIVERSAL HELPERS
 ******************************************************/
function getUser() {
  const raw = localStorage.getItem("sg_user");
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/[&<>"']/g, m =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
}

/******************************************************
 * NAVBAR LOGIN UI
 ******************************************************/
function setupLoginUI() {
  const user = getUser();

  const loginBtn = document.getElementById("loginBtn");
  const accIcon = document.getElementById("accountIcon");
  const adminBadge = document.getElementById("adminBadgeNav");

  if (!loginBtn || !accIcon) return;

  if (user) {
    loginBtn.style.display = "none";
    accIcon.src = user.picture;
    accIcon.style.display = "block";
    accIcon.onclick = () => (window.location.href = "account.html");

    if (user.email === "sohabrar10@gmail.com") {
      if (adminBadge) adminBadge.style.display = "inline-block";
      localStorage.setItem("adminLoggedIn", "true");
    }
  } else {
    loginBtn.style.display = "inline-block";
    accIcon.style.display = "none";
  }
}

document.addEventListener("DOMContentLoaded", setupLoginUI);

/******************************************************
 * GOOGLE LOGIN
 ******************************************************/
console.log("GOOGLE AUTH LOADED");

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
    joined: new Date().toLocaleDateString()
  };

  localStorage.setItem("sg_user", JSON.stringify(user));
}

function handleCredentialResponse(response) {
  try {
    const data = jwt_decode(response.credential);
    saveUser(data, response.credential);

    setupLoginUI();

    // ⭐ FIX: REDIRECT TO ACCOUNT PAGE AFTER LOGIN
    window.location.href = "account.html";

  } catch (err) {
    console.error("Google Auth Error:", err);
  }
}

function googleLogin() {
  if (!google?.accounts?.id)
    return setTimeout(googleLogin, 300);

  google.accounts.id.initialize({
    client_id: 653374521156-6retcia1fiu5dvmbjik9sq89ontrkmvt.apps.googleusercontent.com,
    callback: handleCredentialResponse
  });

  google.accounts.id.prompt();
}

document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("loginBtn");
  if (btn) btn.addEventListener("click", googleLogin);
});

/******************************************************
 * CART FUNCTIONS
 ******************************************************/
function loadCartPage() {
  const itemsContainer = document.getElementById("cartItems");
  const emptyEl = document.getElementById("cartEmpty");
  const summaryEl = document.getElementById("cartSummary");
  const totalEl = document.getElementById("cartTotal");

  const cart = JSON.parse(localStorage.getItem("cart") || "[]");

  itemsContainer.innerHTML = "";
  emptyEl.style.display = cart.length ? "none" : "block";
  summaryEl.style.display = cart.length ? "block" : "none";

  if (!cart.length) return;

  let total = 0;

  cart.forEach((p, idx) => {
    total += p.price * p.metres;

    itemsContainer.innerHTML += `
      <div class="col-md-4">
        <div class="card p-2">
          <img src="${p.image}" class="w-100" style="height:160px;object-fit:cover">
          <div class="card-body">
            <h5>${p.title}</h5>
            <p>₹${p.price} × ${p.metres}m</p>
            <button class="btn btn-danger btn-sm" onclick="removeItem(${idx})">Remove</button>
          </div>
        </div>
      </div>
    `;
  });

  totalEl.textContent = total;
}

function removeItem(index) {
  const cart = JSON.parse(localStorage.getItem("cart") || "[]");
  cart.splice(index, 1);
  localStorage.setItem("cart", JSON.stringify(cart));
  loadCartPage();
}

/******************************************************
 * PRODUCT LOADING (LOCALSTORAGE)
 ******************************************************/
function loadProducts(category) {
  const container = document.getElementById("productsContainer");
  const comingSoon = document.getElementById("comingSoonMsg");

  const list = JSON.parse(localStorage.getItem("products") || "[]");
  let filtered = [];

  const now = Date.now();
  const fifteenDays = 15 * 24 * 60 * 60 * 1000;

  if (category === "newarrivals") {
    filtered = list.filter(p => now - p.addedAt <= fifteenDays);
  } else if (category === "bestdeals") {
    filtered = list.filter(p => p.orderCount >= 10);
  } else if (category === "sales") {
    filtered = list.filter(p => p.sales === true);
  } else {
    filtered = list.filter(p => p.category === category);
  }

  container.innerHTML = "";

  if (!filtered.length) {
    if (comingSoon) comingSoon.style.display = "block";
    return;
  }

  filtered.forEach(p => {
    const id = p._id;
    const mainImg = p.images[0];

    container.innerHTML += `
      <div class="col-md-4 product-card">
        <div class="card shadow-sm">
          <img src="${mainImg}" class="card-img-top">

          <div class="card-body">
            <h5>${p.name}</h5>
            <p>${p.description}</p>

            <p class="fw-bold">₹${p.price} / metre</p>

            <div class="d-flex mb-2">
              <button class="btn btn-sm btn-outline-secondary" onclick="meterChange('${id}', -1)">-</button>
              <input id="meter-${id}" class="form-control mx-2" style="width:60px;" value="2" readonly>
              <button class="btn btn-sm btn-outline-secondary" onclick="meterChange('${id}', 1)">+</button>
            </div>

            <button class="btn btn-primary w-100" onclick="addToCart('${id}')">Add to Cart</button>
          </div>
        </div>
      </div>
    `;
  });
}

/******************************************************
 * METER CHANGE
 ******************************************************/
function meterChange(id, delta) {
  const field = document.getElementById(`meter-${id}`);
  let v = parseInt(field.value);
  v = Math.max(1, v + delta);
  field.value = v;
}

/******************************************************
 * ADD TO CART
 ******************************************************/
function addToCart(productId) {
  const list = JSON.parse(localStorage.getItem("products") || "[]");
  const product = list.find(p => p._id === productId);
  const user = getUser();

  if (!user) return alert("Please login first.");

  const metres = Number(document.getElementById(`meter-${productId}`).value);

  const cart = JSON.parse(localStorage.getItem("cart") || "[]");

  cart.push({
    title: product.name,
    price: product.price,
    metres,
    image: product.images[0]
  });

  localStorage.setItem("cart", JSON.stringify(cart));
  alert("Added to cart!");
}

/******************************************************
 * CHECKOUT (LOCAL ONLY)
 ******************************************************/
function saveOrder(amount, shipping) {
  const cart = JSON.parse(localStorage.getItem("cart") || "[]");
  const orders = JSON.parse(localStorage.getItem("orders") || "[]");
  let products = JSON.parse(localStorage.getItem("products") || "[]");

  // Increase order count for best deals auto
  cart.forEach(cartItem => {
    const p = products.find(x => x.name === cartItem.title);
    if (p) p.orderCount++;
  });

  localStorage.setItem("products", JSON.stringify(products));

  orders.push({
    id: "ORD" + Math.floor(Math.random() * 900000 + 100000),
    date: new Date().toLocaleString(),
    total: amount,
    status: "Confirmed",
    items: cart,
    shipping
  });

  localStorage.setItem("orders", JSON.stringify(orders));
  localStorage.removeItem("cart");
}
