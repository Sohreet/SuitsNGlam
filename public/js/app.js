/******************************************************
 * SUITS N GLAM — APP.JS (CLEAN + OPTIMIZED + FIXED)
 ******************************************************/

console.log("APP.JS LOADED");

/* ------------------ CONFIG ------------------ */
const ADMINS = ["sohabrar10@gmail.com"];
const GOOGLE_CLIENT_ID =
  "653374521156-6retcia1fiu5dvmbjik9sq89ontrkmvt.apps.googleusercontent.com";

const DEFAULTS = {
  userPicture: "/images/default-user.png",
  productImage: "/images/default-product.png",
  currencySymbol: "₹",
};

/* ------------------ UTILITIES ------------------ */
const qs = (s, r = document) => r.querySelector(s);
const qsa = (s, r = document) => [...r.querySelectorAll(s)];
const byId = (id) => document.getElementById(id);

function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[m]);
}

function safeJSONParse(v, f = null) {
  try {
    return JSON.parse(v) ?? f;
  } catch {
    return f;
  }
}
const safeJSONSerialize = (v) => JSON.stringify(v);

/* ------------------ USER STORAGE ------------------ */
function getUser() {
  return safeJSONParse(localStorage.getItem("sg_user"));
}
function saveUser(obj) {
  if (!obj?.email) return;
  localStorage.setItem("sg_user", safeJSONSerialize(obj));
}
function clearUser() {
  localStorage.removeItem("sg_user");
  localStorage.removeItem("adminLoggedIn");
}

/* ------------------ LOGIN UI ------------------ */
function setupLoginUI() {
  const btn = byId("loginBtn");
  const icon = byId("accountIcon");
  const adminBadge = byId("adminBadgeNav");
  const user = getUser();

  if (!btn || !icon) return;

  if (!user) {
    btn.style.display = "inline-block";
    icon.style.display = "none";
    adminBadge && (adminBadge.style.display = "none");
    return;
  }

  btn.style.display = "none";
  icon.src = user.picture || DEFAULTS.userPicture;
  icon.style.display = "inline-block";

  if (ADMINS.includes(user.email)) {
    adminBadge && (adminBadge.style.display = "inline-block");
    icon.onclick = () => (location.href = "admin.html");
  } else {
    adminBadge && (adminBadge.style.display = "none");
    icon.onclick = () => (location.href = "account.html");
  }
}

/* ------------------ LOGOUT ------------------ */
window.logout = () => {
  clearUser();
  location.href = "index.html";
};

/* ------------------ GOOGLE LOGIN ------------------ */
async function initGoogleLogin() {
  const wait = async () => {
    for (let i = 0; i < 80; i++) {
      if (window.google?.accounts?.id) return true;
      await new Promise((r) => setTimeout(r, 100));
    }
    return false;
  };

  if (!(await wait())) return;

  google.accounts.id.initialize({
    client_id: "653374521156-6retcia1fiu5dvmbjik9sq89ontrkmvt.apps.googleusercontent.com",
    callback: handleGoogleResponse,
    ux_mode: "popup",
  });
}

window.handleGoogleResponse = (res) => {
  const data = jwt_decode(res.credential);
  const user = {
    email: data.email,
    name: data.name,
    picture: data.picture || DEFAULTS.userPicture,
  };

  saveUser(user);

  if (ADMINS.includes(user.email)) localStorage.setItem("adminLoggedIn", "true");
  else localStorage.removeItem("adminLoggedIn");

  location.reload();
};

/* ------------------ CART ------------------ */
const parseCart = () => safeJSONParse(localStorage.getItem("cart"), []);
const saveCart = (c) => localStorage.setItem("cart", safeJSONSerialize(c));

window.addToCart = (p, m = 1) => {
  const cart = parseCart();
  cart.push({
    id: p._id,
    name: p.name,
    price: +p.price || 0,
    image: p.images?.[0] || DEFAULTS.productImage,
    metres: +m || 1,
  });
  saveCart(cart);
  alert("Added!");
};

window.removeItem = (i) => {
  const cart = parseCart();
  cart.splice(i, 1);
  saveCart(cart);
  loadCartPage();
};

function updateCartBadge() {
  const badge = byId("cartCount");
  if (!badge) return;
  badge.textContent = parseCart().length || "";
}
window.updateCartBadge = updateCartBadge;

function loadCartPage() {
  const cont = byId("cartItems");
  if (!cont) return;

  const cart = parseCart();
  if (!cart.length) {
    byId("cartEmpty").style.display = "block";
    byId("cartSummary").style.display = "none";
    return;
  }

  let total = 0;

  cont.innerHTML = cart
    .map((c, i) => {
      const line = c.price * c.metres;
      total += line;

      return `
      <div class="col-md-4 mb-3">
        <div class="card p-2 shadow-sm h-100">
          <img src="${c.image}" style="height:150px;width:100%;object-fit:cover;">
          <div class="card-body d-flex flex-column">
            <h5>${c.name}</h5>
            <p>₹${c.price} × ${c.metres} = ₹${line}</p>
            <button class="btn btn-danger btn-sm mt-auto" onclick="removeItem(${i})">Remove</button>
          </div>
        </div>
      </div>`;
    })
    .join("");

  byId("cartTotal").textContent = total;
}
window.loadCartPage = loadCartPage;

/* ------------------ PRODUCTS ------------------ */
window.openProduct = (id) => {
  location.href = `product.html?id=${id}`;
};

async function loadProducts(cat = "all", id = "productsContainer") {
  const box = byId(id);
  if (!box) return;

  box.innerHTML = "Loading...";

  try {
    const res = await fetch(`/api/products/category/${cat}`);
    const data = await res.json();

    if (!data.length) {
      box.innerHTML = `<p>No products yet.</p>`;
      return;
    }

    box.innerHTML = data
      .map(
        (p) => `
      <div class="col-md-4 product-card">
        <div class="card shadow-sm" onclick="openProduct('${p._id}')">
          <img src="${p.images?.[0] || DEFAULTS.productImage}" style="height:250px;width:100%;object-fit:cover;">
          <div class="card-body">
            <h5>${p.name}</h5>
            <p class="fw-bold">₹${p.price}</p>
          </div>
        </div>
      </div>`
      )
      .join("");
  } catch {
    box.innerHTML = "Error loading products.";
  }
}
window.loadProducts = loadProducts;

/* ------------------ ORDER HISTORY (FIXED ROUTE) ------------------ */
async function loadOrderHistory() {
  const user = getUser();
  const box = byId("ordersList");

  if (!user) {
    box.innerHTML = "<p>Please login first.</p>";
    return;
  }

  const res = await fetch(`/api/orders/history/${user.email}`);
  const orders = await res.json();

  if (!orders.length) {
    box.innerHTML = `
      <div class="text-center mt-5">
        <h5>No Orders Yet</h5>
      </div>`;
    return;
  }

  box.innerHTML = orders
    .map(
      (o) => `
      <div class="card p-3 mb-3 shadow-sm">
        <h5>Order #${o._id}</h5>
        <p><b>Total:</b> ₹${o.total}</p>
        <hr>
        ${o.items
          .map((i) => `<p>• ${i.name} × ${i.quantity || 1}</p>`)
          .join("")}
      </div>`
    )
    .join("");
}
window.loadOrderHistory = loadOrderHistory;

/* ------------------ INIT ------------------ */
document.addEventListener("DOMContentLoaded", () => {
  setupLoginUI();
  updateCartBadge();
  initGoogleLogin();

  const p = location.pathname.toLowerCase();
  if (p.includes("cart")) loadCartPage();
  if (p.includes("product")) loadSingleProduct();
  if (p.includes("admin")) renderAdminProducts();
  if (p.includes("orderhistory")) loadOrderHistory();
});
