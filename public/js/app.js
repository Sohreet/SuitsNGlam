/******************************************************
 * SUITS N GLAM — FINAL MERGED app.js
 ******************************************************/
console.log("APP.JS LOADED");

const ADMINS = ["sohabrar10@gmail.com","suitsnglam01@gmail.com"];
const GOOGLE_CLIENT_ID = "653374521156-6retcia1fiu5dvmbjik9sq89ontrkmvt.apps.googleusercontent.com";

/* ---------- helpers ---------- */
function getUser(){
  const raw = localStorage.getItem("sg_user");
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

function saveUserLocal(userObj){
  localStorage.setItem("sg_user", JSON.stringify(userObj));
  if (ADMINS.includes(userObj.email)) localStorage.setItem("adminLoggedIn","true");
  else localStorage.removeItem("adminLoggedIn");
}

/* ---------- navbar/login UI (no flicker) ---------- */
function setupLoginUI(){
  const loginBtn = document.getElementById("loginBtn");
  const accountIcon = document.getElementById("accountIcon");
  const navArea = document.querySelector(".nav-login-area");
  const adminBadgeNav = document.getElementById("adminBadgeNav");

  if (!navArea) return;
  navArea.style.visibility = "visible";

  const user = getUser();
  if (!loginBtn || !accountIcon) return;

  if (!user) {
    loginBtn.style.display = "inline-block";
    accountIcon.style.display = "none";
    if (adminBadgeNav) adminBadgeNav.style.display = "none";
    return;
  }

  loginBtn.style.display = "none";
  accountIcon.src = user.picture || "/public/images/default-user.png";
  accountIcon.style.display = "inline-block";

  if (ADMINS.includes(user.email)) {
    if (adminBadgeNav) adminBadgeNav.style.display = "inline-block";
    accountIcon.onclick = () => window.location.href = "admin.html";
  } else {
    if (adminBadgeNav) adminBadgeNav.style.display = "none";
    accountIcon.onclick = () => window.location.href = "account.html";
  }
}

/* ---------- Google Sign-In robust init ---------- */
let _gsiInitialized = false;

function handleCredentialResponse(resp){
  try {
    const data = jwt_decode(resp.credential);
    const user = { email: data.email, name: data.name, picture: data.picture, token: resp.credential, joined: new Date().toLocaleDateString() };
    saveUserLocal(user);
    setupLoginUI();
    updateCartBadge();
  } catch (err) { console.error("GSI decode error", err); }
}

function initGSI(){
  if (_gsiInitialized) return;
  if (!window.google || !google.accounts || !google.accounts.id) return;
  google.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, callback: handleCredentialResponse, ux_mode: "popup" });
  _gsiInitialized = true;
}

function loadGSIScriptOnce(){
  if (document.getElementById("gsi-script")) return;
  const s = document.createElement("script");
  s.id = "gsi-script";
  s.src = "https://accounts.google.com/gsi/client";
  s.async = true; s.defer = true;
  s.onload = () => { initGSI(); };
  document.head.appendChild(s);
}

function waitForGSI(timeoutMs=5000){
  return new Promise(resolve=>{
    if (window.google && google.accounts && google.accounts.id) return resolve(true);
    const start = Date.now();
    const iv = setInterval(()=>{
      if (window.google && google.accounts && google.accounts.id) { clearInterval(iv); return resolve(true); }
      if (Date.now()-start > timeoutMs) { clearInterval(iv); return resolve(false); }
    },150);
  });
}

async function attachLoginButton(){
  const btn = document.getElementById("loginBtn");
  if (!btn) return;
  btn.removeEventListener("click", _loginClickHandler);
  btn.addEventListener("click", _loginClickHandler);
}

async function _loginClickHandler(e){
  const ok = await waitForGSI(7000);
  if (!ok) {
    loadGSIScriptOnce();
    const ok2 = await waitForGSI(7000);
    if (!ok2) return alert("Google Sign-In not available. Try again later.");
  }
  initGSI();
  try { google.accounts.id.prompt(); } catch (err) { console.error("GSI prompt failed", err); alert("Google Sign-In failed."); }
}

/* expose googleLogin for pages */
function googleLogin(){
  _loginClickHandler();
}
window.googleLogin = googleLogin;

/* init */
document.addEventListener("DOMContentLoaded", async ()=>{
  setupLoginUI();
  updateCartBadge();

  if (window.google && google.accounts && google.accounts.id) initGSI();
  else {
    // try to load if page included GSI tag didn't finish or didn't include it
    await waitForGSI(2500);
    if (!window.google) loadGSIScriptOnce();
    else initGSI();
  }
  attachLoginButton();
});

/* ---------- CART ---------- */
function updateCartBadge(){
  const badge = document.getElementById("cartCount");
  if (!badge) return;
  const cart = JSON.parse(localStorage.getItem("cart") || "[]");
  badge.textContent = cart.length ? cart.length : "";
}
window.updateCartBadge = updateCartBadge;

function addToCart(productId, metres=1){
  metres = Math.max(1, Math.min(6, Number(metres) || 1));

  // fetch product details (try server, fallback local)
  fetch(`/api/products/${productId}`).then(r=>r.json()).then(p=>{
    if (!p) return alert("Product not found");
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    cart.push({
      productId: p._id || p.id,
      title: p.name,
      price: p.price,
      image: p.images?.[0] || '',
      metres
    });
    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartBadge();
    alert("Added to cart!");
  }).catch(async ()=> {
    // fallback local product store
    const localProducts = JSON.parse(localStorage.getItem("products") || "[]");
    const p = localProducts.find(x => x._id === productId);
    if (!p) return alert("Product not found (offline)");
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    cart.push({ productId: p._id, title: p.name, price: p.price, image: p.images?.[0]||'', metres });
    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartBadge();
    alert("Added to cart (local)!");
  });
}
window.addToCart = addToCart;

function loadCartPage(){
  const container = document.getElementById("cartItems");
  const emptyEl = document.getElementById("cartEmpty");
  const summary = document.getElementById("cartSummary");
  const totalEl = document.getElementById("cartTotal");

  if (!container) return;

  const cart = JSON.parse(localStorage.getItem("cart") || "[]");
  container.innerHTML = "";
  if (!cart.length) {
    if (emptyEl) emptyEl.style.display = "block";
    if (summary) summary.style.display = "none";
    updateCartBadge(); return;
  }

  if (emptyEl) emptyEl.style.display = "none";
  if (summary) summary.style.display = "block";

  let total = 0;
  cart.forEach((it, i) => {
    total += Number(it.price || 0) * Number(it.metres || 1);
    container.innerHTML += `
      <div class="col-md-4">
        <div class="card p-2">
          <img src="${it.image||''}" class="w-100" style="height:180px;object-fit:cover">
          <div class="card-body">
            <h5>${it.title}</h5>
            <p>₹${it.price} × ${it.metres}m</p>
            <button class="btn btn-danger btn-sm" onclick="removeItem(${i})">Remove</button>
          </div>
        </div>
      </div>
    `;
  });

  if (totalEl) totalEl.textContent = total;
  updateCartBadge();
}
window.loadCartPage = loadCartPage;

function removeItem(index){
  const cart = JSON.parse(localStorage.getItem("cart") || "[]");
  cart.splice(index,1);
  localStorage.setItem("cart", JSON.stringify(cart));
  loadCartPage();
  updateCartBadge();
}
window.removeItem = removeItem;

/* ---------- PRODUCTS (list & single) ---------- */
async function loadProducts(category, containerId="productsContainer"){
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = "Loading...";

  try {
    const res = await fetch(`/api/products/category/${encodeURIComponent(category)}`);
    const products = await res.json();
    if (!products || products.length === 0) {
      container.innerHTML = `<p class="text-muted fw-bold">Coming Soon...</p>`;
      return;
    }
    container.innerHTML = "";
    products.forEach(p => {
      const outOfStock = (p.stock === 0);
      container.innerHTML += `
        <div class="col-md-4 product-card">
          <div class="card shadow-sm" onclick="openProduct('${p._id || p.id}')">
            <img src="${p.images?.[0] || ''}" class="card-img-top" style="height:250px;object-fit:cover">
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
    console.error("loadProducts error:", err);
    // fallback: localStorage products
    const local = JSON.parse(localStorage.getItem("products") || "[]").filter(pp => (category==="all" || pp.category===category));
    if (!local.length) { container.innerHTML = `<p class="text-muted fw-bold">Coming Soon...</p>`; return; }
    container.innerHTML = "";
    local.forEach(p => {
      container.innerHTML += `
        <div class="col-md-4 product-card">
          <div class="card shadow-sm" onclick="openProduct('${p._id}')">
            <img src="${p.images?.[0]||''}" class="card-img-top" style="height:250px;object-fit:cover">
            ${p.stock===0?`<span class="badge bg-danger m-2">Out of Stock</span>`:""}
            <div class="card-body"><h5>${p.name}</h5><p class="fw-bold">₹${p.price}/m</p></div>
          </div>
        </div>
      `;
    });
  }
}
window.loadProducts = loadProducts;

function openProduct(id){ window.location.href = `product.html?id=${id}`; }
window.openProduct = openProduct;

async function loadSingleProduct(){
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  if (!id) return;
  try {
    const res = await fetch(`/api/products/${encodeURIComponent(id)}`);
    const p = await res.json();
    window.selectedProduct = p;
    return p;
  } catch (err) {
    // fallback local
    const local = JSON.parse(localStorage.getItem("products") || "[]");
    const p = local.find(x=>x._id===id);
    window.selectedProduct = p;
    return p;
  }
}
window.loadSingleProduct = loadSingleProduct;

/* ---------- ADMIN helpers ---------- */
async function renderAdminProducts(){
  // used by admin.html and admin dashboard
  try {
    const res = await fetch("/api/products/category/all");
    if (!res.ok) throw new Error("server fail");
    const products = await res.json();
    return products;
  } catch (err) {
    return JSON.parse(localStorage.getItem("products") || "[]");
  }
}

async function deleteProductClient(id){
  try {
    const res = await fetch(`/api/admin/products/${encodeURIComponent(id)}`, { method:"DELETE" });
    if (res.ok) return true;
  } catch (e) {}
  // fallback local deletion
  const products = JSON.parse(localStorage.getItem("products") || "[]");
  const idx = products.findIndex(p => p._id === id);
  if (idx>=0) { products.splice(idx,1); localStorage.setItem("products", JSON.stringify(products)); return true; }
  return false;
}
window.deleteProductClient = deleteProductClient;

/* ---------- ORDER helpers ---------- */
function saveOrder(amount, shipping){
  const cart = JSON.parse(localStorage.getItem("cart") || "[]");
  const orders = JSON.parse(localStorage.getItem("orders") || "[]");
  orders.unshift({
    id: "ORD"+Math.floor(Math.random()*900000+100000),
    date: new Date().toLocaleString(),
    total: amount,
    status: "Confirmed",
    items: cart,
    shipping
  });
  localStorage.setItem("orders", JSON.stringify(orders));
  // clear cart
  localStorage.removeItem("cart");
  updateCartBadge();
}

/* Expose some high-level functions */
window.setupLoginUI = setupLoginUI;
window.saveUserLocal = saveUserLocal;
window.renderAdminProducts = renderAdminProducts;
window.deleteProductClient = deleteProductClient;
window.saveOrder = saveOrder;

/* ---------- end app.js ---------- */
