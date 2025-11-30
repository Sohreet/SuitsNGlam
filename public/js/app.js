/******************************************************
 * SUITS N GLAM — MERGED APP.JS
 * Combines:
 * admin.js
 * cart.js
 * google-auth.js
 * navbar.js
 * order-management.js
 * orderhistory.js
 * ordertracking.js
 * payment.js
 * products-common.js
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

function escapeHtml(s) {
  if (!s) return "";
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/******************************************************
 * CART BADGE — THE ONLY FINAL VERSION
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

  if (user?.token) {
    try {
      const res = await fetch("/api/cart", {
        headers: { "auth-token": user.token },
      });
      if (res.ok) {
        const data = await res.json();
        badge.textContent = data.items?.length || "";
        return;
      }
    } catch (e) {}
  }

  if (user?.email) {
    try {
      const res = await fetch(`/api/cart/${encodeURIComponent(user.email)}`);
      if (res.ok) {
        const data = await res.json();
        badge.textContent = data.items?.length || "";
      }
    } catch (e) {}
  }
}

window.updateCartBadge = updateCartBadge;

/******************************************************
 * NAVBAR LOGIN UI
 ******************************************************/
function setupLoginUI() {
  const user = getUser();
  const loginBtn = document.getElementById("loginBtn");
  const accountIcon = document.getElementById("accountIcon");
  const loginArea = document.querySelector(".nav-login-area");

  if (!loginBtn || !accountIcon || !loginArea) return;

  if (user) {
    accountIcon.src = user.picture || "/public/images/default-user.png";
    accountIcon.style.display = "inline-block";
    loginBtn.style.display = "none";
  } else {
    accountIcon.style.display = "none";
    loginBtn.style.display = "inline-block";
  }

  loginArea.style.visibility = "visible";

  if (!window.location.pathname.includes("admin")) {
    accountIcon.onclick = () => window.location.href = "/account.html";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  setupLoginUI();
  updateCartBadge();
});

/******************************************************
 * GOOGLE AUTH
 ******************************************************/
console.log("GOOGLE AUTH LOADED");

const GOOGLE_CLIENT_ID =
  "653374521156-6retcia1fiu5dvmbjik9sq89ontrkmvt.apps.googleusercontent.com";

const ADMINS = ["sohabrar10@gmail.com", "suitsnglam01@gmail.com"];

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
    if (window.setupLoginUI) setupLoginUI();
  } catch (err) {
    console.error("Google Auth Error:", err);
  }
}

function googleLogin() {
  if (!google?.accounts?.id)
    return setTimeout(googleLogin, 200);

  google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: handleCredentialResponse,
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
    total += Number(p.price || 0) * (Number(p.metres || 1));

    const col = document.createElement("div");
    col.className = "col-md-4";
    col.innerHTML = `
      <div class="card p-2">
        <img src="${p.image || ''}" class="w-100" style="height:160px;object-fit:cover">
        <div class="card-body">
          <h5>${p.title}</h5>
          <p>₹${p.price} × ${p.metres}m</p>
          <button class="btn btn-danger btn-sm" onclick="removeItem(${idx})">Remove</button>
        </div>
      </div>
    `;
    itemsContainer.appendChild(col);
  });

  totalEl.textContent = total;
  updateCartBadge();
}

function removeItem(index) {
  const cart = JSON.parse(localStorage.getItem("cart") || "[]");
  cart.splice(index, 1);
  localStorage.setItem("cart", JSON.stringify(cart));
  loadCartPage();
  updateCartBadge();
}

window.loadCartPage = loadCartPage;
window.removeItem = removeItem;

/******************************************************
 * PRODUCT LOADER + ADD TO CART
 ******************************************************/

function meterChange(id, delta) {
  const field = document.getElementById(`meter-${id}`);
  let v = parseInt(field.value || "1", 10);
  v = Math.max(1, Math.min(50, v + delta));
  field.value = v;
}
window.meterChange = meterChange;

async function loadProducts(category, containerId = "productsContainer") {
  const container = document.getElementById(containerId);
  if (!container) return;

  try {
    const res = await fetch(`/api/products/category/${encodeURIComponent(category)}`);
    const data = await res.json();

    container.innerHTML = "";

    data.forEach(p => {
      const col = document.createElement("div");
      col.className = "col-md-4";

      const id = p._id || p.id || Math.random().toString(36).slice(2);
      const price = p.pricePerMeter || p.price;

      col.innerHTML = `
        <div class="card shadow-sm">
          <img src="${p.images?.[0] || ''}" class="card-img-top">
          <div class="card-body">
            <h5>${p.name}</h5>
            <p>${p.description || ""}</p>
            <p class="fw-bold">₹${price} / metre</p>

            <div class="d-flex mb-2">
              <button class="btn btn-sm btn-outline-secondary" onclick="meterChange('${id}',-1)">-</button>
              <input id="meter-${id}" class="form-control mx-2" style="width:60px;" value="2" readonly>
              <button class="btn btn-sm btn-outline-secondary" onclick="meterChange('${id}',1)">+</button>
            </div>

            <button class="btn btn-primary w-100" onclick="addToCart('${id}','${p._id || p.id}')">Add to Cart</button>
          </div>
        </div>
      `;

      container.appendChild(col);
    });

    updateCartBadge();
  } catch (err) {
    console.error("Product load error:", err);
  }
}
window.loadProducts = loadProducts;

async function addToCart(fakeId, realId) {
  const metres = document.getElementById(`meter-${fakeId}`).value;
  const user = getUser();

  if (!user) return alert("Please login first.");

  const body = { productId: realId, metres: Number(metres) };

  try {
    const res = await fetch("/api/cart/add", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(user.token ? { "auth-token": user.token } : {})
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (res.ok) {
      alert("Added to cart!");
      updateCartBadge();
    } else {
      alert(data.message || "Error");
    }
  } catch (e) {
    alert("Add to cart failed.");
  }
}
window.addToCart = addToCart;

/******************************************************
 * PAYMENT + ORDER SAVE
 ******************************************************/
function loadCheckoutData() {
  const cart = JSON.parse(localStorage.getItem("cart") || "[]");
  const list = document.getElementById("cartList");
  const totalEl = document.getElementById("grandTotal");

  let total = 0;
  list.innerHTML = "";

  cart.forEach(item => {
    list.innerHTML += `<li>${item.title} — ₹${item.price}</li>`;
    total += Number(item.price || 0);
  });

  totalEl.textContent = total;
}

document.addEventListener("DOMContentLoaded", loadCheckoutData);

function startPayment() {
  const name = fullName.value.trim();
  const phone = phone.value.trim();
  const addressVal = address.value.trim();
  const cityVal = city.value.trim();
  const stateVal = state.value.trim();
  const pincodeVal = pincode.value.trim();

  if (!name || !phone || !addressVal || !cityVal || !stateVal || !pincodeVal) {
    return alert("Fill all address fields.");
  }

  const amount = Number(document.getElementById("grandTotal").textContent);

  const options = {
    key: "rzp_test_123456789",
    amount: amount * 100,
    currency: "INR",
    name: "Suits N Glam",
    description: "Order Payment",
    handler: function () {
      saveOrder(amount, { name, phone, address: addressVal, city: cityVal, state: stateVal, pincode: pincodeVal });
      window.location.href = `success.html?amount=${amount}`;
    }
  };

  new Razorpay(options).open();
}

function saveOrder(amount, shipping) {
  const cart = JSON.parse(localStorage.getItem("cart") || "[]");
  const orders = JSON.parse(localStorage.getItem("orders") || "[]");

  orders.push({
    id: "ORD" + Math.floor(Math.random() * 900000 + 100000),
    date: new Date().toLocaleString(),
    total: amount,
    status: "Confirmed",
    items: cart,
    shipping
  });

  localStorage.setItem("orders", JSON.stringify(orders));
}

/******************************************************
 * ORDER HISTORY / TRACKING
 ******************************************************/
document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("ordersList");
  if (!container) return;

  const orders = JSON.parse(localStorage.getItem("orders") || "[]");
  if (!orders.length)
    return (container.innerHTML = "<h4>No orders yet.</h4>");

  container.innerHTML = orders
    .map(
      (o) => `
    <div class="card p-3 mb-2">
      <h5>Order ID: ${o.id}</h5>
      <p>${o.date}</p>
      <p>₹${o.total}</p>
      <p>Status: ${o.status}</p>
    </div>
  `
    )
    .join("");
});

/******************************************************
 * ADMIN GUARD (Admin Dashboard)
 ******************************************************/
if (window.location.pathname.includes("admin")) {
  const isAdmin = localStorage.getItem("adminLoggedIn");
  if (!isAdmin) {
    window.location.href = "index.html";
  }
}

/******************************************************
 * ADMIN ORDER TABLE
 ******************************************************/
document.addEventListener("DOMContentLoaded", () => {
  const table = document.getElementById("ordersTable");
  if (!table) return;

  const orders = JSON.parse(localStorage.getItem("orders") || "[]");

  if (!orders.length) {
    table.innerHTML = "<p>No orders yet</p>";
    return;
  }

  table.innerHTML = orders
    .map(
      (o) => `
    <tr>
      <td>${o.id}</td>
      <td>${o.shipping?.name || ""}<br>${o.shipping?.phone || ""}</td>
      <td>₹${o.total}</td>
      <td>${o.status}</td>
      <td>${o.date}</td>
    </tr>`
    )
    .join("");
});

