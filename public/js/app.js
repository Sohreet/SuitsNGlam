/******************************************************
 * SUITS N GLAM — UPDATED SMART APP.JS
 * LocalStorage Only Version
 * Supports:
 * - Categories
 * - Sales (admin toggle)
 * - Best Deals (auto orderCount ≥ 10)
 * - New Arrivals (added ≤ 15 days)
 * - Order counter
 * - Image upload base64
 ******************************************************/

console.log("SMART APP.JS LOADED");

/******************************************************
 * HELPERS
 ******************************************************/
function getUser() {
  const raw = localStorage.getItem("sg_user");
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

function getProducts() {
  return JSON.parse(localStorage.getItem("products") || "[]");
}

function saveProducts(list) {
  localStorage.setItem("products", JSON.stringify(list));
}

function escapeHtml(x) {
  if (!x) return "";
  return x.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/******************************************************
 * UPDATE CART BADGE
 ******************************************************/
function updateCartBadge() {
  const badge = document.getElementById("cartCount");
  if (!badge) return;
  const cart = JSON.parse(localStorage.getItem("cart") || "[]");
  badge.textContent = cart.length || "";
}
window.updateCartBadge = updateCartBadge;

/******************************************************
 * LOGIN UI
 ******************************************************/
function setupLoginUI() {
  const user = getUser();
  const loginBtn = document.getElementById("loginBtn");
  const accountIcon = document.getElementById("accountIcon");
  const loginArea = document.querySelector(".nav-login-area");
  if (!loginBtn || !accountIcon) return;

  if (user) {
    accountIcon.src = user.picture || "default-user.png";
    accountIcon.style.display = "inline-block";
    loginBtn.style.display = "none";
  } else {
    loginBtn.style.display = "inline-block";
    accountIcon.style.display = "none";
  }

  loginArea.style.visibility = "visible";
}
document.addEventListener("DOMContentLoaded", setupLoginUI);


/******************************************************
 * GOOGLE LOGIN
 ******************************************************/
const ADMINS = ["sohabrar10@gmail.com"];

document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("loginBtn");
  if (btn) btn.onclick = () => {
    google.accounts.id.initialize({
      client_id: "653374521156-6retcia1fiu5dvmbjik9sq89ontrkmvt.apps.googleusercontent.com",
      callback: (response) => {
        const data = jwt_decode(response.credential);
        localStorage.setItem("sg_user", JSON.stringify(data));

        if (ADMINS.includes(data.email))
          localStorage.setItem("adminLoggedIn", "true");
        else
          localStorage.removeItem("adminLoggedIn");

        location.reload();
      }
    });
    google.accounts.id.prompt();
  };
});

/******************************************************
 * CART FUNCTIONS
 ******************************************************/
function loadCartPage() {
  const items = JSON.parse(localStorage.getItem("cart") || "[]");
  const box = document.getElementById("cartItems");
  const empty = document.getElementById("cartEmpty");
  const summary = document.getElementById("cartSummary");
  const totalEl = document.getElementById("cartTotal");

  box.innerHTML = "";

  if (!items.length) {
    empty.style.display = "block";
    summary.style.display = "none";
    return;
  }

  empty.style.display = "none";
  summary.style.display = "block";

  let total = 0;

  items.forEach((p, i) => {
    total += Number(p.price) * Number(p.metres);
    box.innerHTML += `
      <div class="col-md-4">
        <div class="card p-2">
          <img src="${p.image}" class="w-100" style="height:160px;object-fit:cover">
          <div class="card-body">
            <h5>${p.title}</h5>
            <p>₹${p.price} × ${p.metres}m</p>
            <button class="btn btn-danger btn-sm" onclick="removeItem(${i})">Remove</button>
          </div>
        </div>
      </div>`;
  });

  totalEl.textContent = total;
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
 * PRODUCTS LOADING (LOCAL STORAGE)
 ******************************************************/

// smart filter for categories
function filterProducts(type) {
  const list = getProducts();
  const now = Date.now();
  const days15 = 15 * 24 * 60 * 60 * 1000;

  if (type === "newarrivals") {
    return list.filter(p => now - p.addedAt <= days15);
  }
  if (type === "bestdeals") {
    return list.filter(p => p.orderCount >= 10);
  }
  if (type === "sales") {
    return list.filter(p => p.sales === true);
  }

  // category filter
  return list.filter(p => p.category === type);
}


function loadProducts(type, containerId = "productsContainer") {
  const container = document.getElementById(containerId);
  if (!container) return;

  const prods = filterProducts(type);
  container.innerHTML = "";

  prods.forEach(p => {
    container.innerHTML += `
      <div class="col-md-4 product-card">
        <div class="card shadow-sm">
          <img src="${p.images[0]}" class="card-img-top">
          <div class="card-body">
            <h5>${escapeHtml(p.name)}</h5>
            <p>${escapeHtml(p.description)}</p>
            <p class="fw-bold">₹${p.price} / metre</p>

            <button class="btn btn-primary w-100" onclick="addToCart('${p._id}')">
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    `;
  });

  if (!prods.length) {
    const msg = document.getElementById("comingSoonMsg");
    if (msg) msg.style.display = "block";
  }
}
window.loadProducts = loadProducts;

/******************************************************
 * ADD TO CART
 ******************************************************/
function addToCart(productId) {
  const user = getUser();
  if (!user) return alert("Please login first.");

  const list = getProducts();
  const p = list.find(x => x._id === productId);
  if (!p) return alert("Product not found!");

  const cart = JSON.parse(localStorage.getItem("cart") || "[]");
  cart.push({
    productId: p._id,
    title: p.name,
    price: p.price,
    image: p.images[0],
    metres: 2
  });

  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartBadge();
  alert("Added to cart!");
}
window.addToCart = addToCart;

/******************************************************
 * ORDER SAVE + ORDER COUNTER
 ******************************************************/
function saveOrder(amount, shipping) {
  const cart = JSON.parse(localStorage.getItem("cart") || "[]");
  const orders = JSON.parse(localStorage.getItem("orders") || "[]");
  const products = getProducts();

  cart.forEach(item => {
    const p = products.find(x => x._id === item.productId);
    if (p) p.orderCount = (p.orderCount || 0) + 1;
  });

  saveProducts(products);

  orders.push({
    id: "ORD" + Math.floor(Math.random() * 900000 + 100000),
    total: amount,
    date: new Date().toLocaleString(),
    items: cart,
    status: "Confirmed",
    shipping
  });

  localStorage.setItem("orders", JSON.stringify(orders));
  localStorage.setItem("cart", JSON.stringify([]));
}

/******************************************************
 * ADMIN GUARD
 ******************************************************/
if (window.location.pathname.includes("admin")) {
  if (!localStorage.getItem("adminLoggedIn")) {
    window.location.href = "index.html";
  }
}
