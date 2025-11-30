/******************************************************
 * SUITS N GLAM — FINAL SMART APP.JS (2025)
 * - Google login
 * - Navbar UI
 * - Product Details Page
 * - Product System (localStorage)
 * - Out of Stock system
 * - New Arrivals (15 days)
 * - Best Deals (10+ orders)
 * - Sales toggle
 * - Cart system
 * - Metres (1–6)
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
    accIcon.onclick = () => location.href = "account.html";

    // Safe admin badge
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

    // ⭐ After login → redirect to account page
    location.href = "account.html";

  } catch (err) {
    console.error("Google Auth Error:", err);
  }
}

function googleLogin() {
  if (!google?.accounts?.id)
    return setTimeout(googleLogin, 300);

  google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: handleCredentialResponse
  });

  google.accounts.id.prompt();
}

document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("loginBtn");
  if (btn) btn.onclick = googleLogin;
});

/******************************************************
 * METER CHANGE (1–6)
 ******************************************************/
function meterChange(id, delta) {
  const field = document.getElementById(`meter-${id}`);
  let v = parseInt(field.value);
  v = Math.max(1, Math.min(6, v + delta));  // ⭐ LIMIT 1–6
  field.value = v;
}

/******************************************************
 * PRODUCT LIST LOADER
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
  } 
  else if (category === "bestdeals") {
    filtered = list.filter(p => p.orderCount >= 10);
  }
  else if (category === "sales") {
    filtered = list.filter(p => p.sales === true);
  }
  else {
    filtered = list.filter(p => p.category === category);
  }

  container.innerHTML = "";

  if (!filtered.length) {
    if (comingSoon) comingSoon.style.display = "block";
    return;
  }

  filtered.forEach(p => {
    const id = p._id;

    container.innerHTML += `
      <div class="col-md-4 product-card" onclick="openProduct('${id}')">
        <div class="card shadow-sm position-relative">

          ${!p.inStock ? 
            `<span class="badge bg-danger position-absolute m-2" style="font-size:14px;">OUT OF STOCK</span>` 
          : ""}

          <img src="${p.images[0]}" class="card-img-top">

          <div class="card-body">
            <h5>${p.name}</h5>
            <p class="text-muted">${p.description.substring(0, 50)}...</p>

            <p class="fw-bold">₹${p.price} / metre</p>
          </div>
        </div>
      </div>
    `;
  });
}

/******************************************************
 * OPEN PRODUCT PAGE
 ******************************************************/
function openProduct(id) {
  location.href = `product.html?id=${id}`;
}

/******************************************************
 * PRODUCT PAGE LOADER
 ******************************************************/
function loadProductPage() {
  const params = new URLSearchParams(location.search);
  const id = params.get("id");
  if (!id) return;

  const list = JSON.parse(localStorage.getItem("products") || "[]");
  const p = list.find(x => x._id === id);
  if (!p) return;

  // Fill product page
  document.getElementById("pTitle").textContent = p.name;
  document.getElementById("pDesc").textContent = p.description;
  document.getElementById("pPrice").textContent = p.price;
  document.getElementById("mainImage").src = p.images[0];

  // Gallery
  const g = document.getElementById("galleryImages");
  p.images.forEach(img => {
    g.innerHTML += `<img src="${img}" class="thumb-img" onclick="setMainImage('${img}')">`;
  });

  // Video
  if (p.video) {
    document.getElementById("pVideo").innerHTML = `
      <video class="w-100 mt-3" controls>
        <source src="${p.video}" type="video/mp4">
      </video>
    `;
  }

  // Out of stock button
  const btn = document.getElementById("addCartBtn");
  if (!p.inStock) {
    btn.textContent = "OUT OF STOCK";
    btn.disabled = true;
  } else {
    btn.onclick = () => addToCart(id);
  }
}

function setMainImage(src) {
  document.getElementById("mainImage").src = src;
}

/******************************************************
 * ADD TO CART (with stock check)
 ******************************************************/
function addToCart(productId) {
  const list = JSON.parse(localStorage.getItem("products") || "[]");
  const p = list.find(x => x._id === productId);

  const user = getUser();
  if (!user) return alert("Please login first.");

  if (!p.inStock) return alert("This product is out of stock.");

  const metres = Number(document.getElementById(`meter-${productId}`).value || 1);

  const cart = JSON.parse(localStorage.getItem("cart") || "[]");

  cart.push({
    title: p.name,
    price: p.price,
    metres,
    image: p.images[0]
  });

  localStorage.setItem("cart", JSON.stringify(cart));
  alert("Added to cart!");
}

/******************************************************
 * ORDER SAVE (Auto Best Deals)
 ******************************************************/
function saveOrder(amount, shipping) {
  const cart = JSON.parse(localStorage.getItem("cart") || "[]");
  const orders = JSON.parse(localStorage.getItem("orders") || "[]");
  let products = JSON.parse(localStorage.getItem("products") || "[]");

  cart.forEach(item => {
    const p = products.find(x => x.name === item.title);
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
