/******************************************************
 * SUITS N GLAM — APP.JS (FINAL: Google + Password)
 ******************************************************/
console.log("APP.JS LOADED");

/* CONFIG ------------------------------------------------------ */
const ADMINS = ["sohabrar10@gmail.com"]; // change as needed
const DEFAULTS = {
  userPicture: "/images/default-user.png",
  productImage: "/images/default-product.png",
  currencySymbol: "₹",
};

/* UTILITIES ------------------------------------------------------ */
const qs = (s, r = document) => r.querySelector(s);
const byId = (id) => document.getElementById(id);
const safeJSONParse = (v, f = null) => { try { return JSON.parse(v); } catch { return f; } };
const safeJSONSerialize = (v) => JSON.stringify(v);

/* USER STORAGE ------------------------------------------------------ */
function getUser() { return safeJSONParse(localStorage.getItem("sg_user")); }
function saveUser(o) { localStorage.setItem("sg_user", safeJSONSerialize(o)); }
function clearUser() {
  localStorage.removeItem("sg_user");
  localStorage.removeItem("adminLoggedIn");
}

/* LOGIN UI ------------------------------------------------------ */
function setupLoginUI() {
  const btn = byId("loginBtn");
  const icon = byId("accountIcon");
  const adminBadge = byId("adminBadgeNav");
  const user = getUser();

  if (!btn || !icon) return;

  if (!user) {
    btn.style.display = "inline-block";
    icon.style.display = "none";
    adminBadge.style.display = "none";
    return;
  }

  btn.style.display = "none";
  icon.src = user.picture || DEFAULTS.userPicture;
  icon.style.display = "inline-block";

  if (ADMINS.includes(user.email) || user.isAdmin) {
    adminBadge.style.display = "inline-block";
    icon.onclick = () => (location.href = "admin.html");
  } else {
    adminBadge.style.display = "none";
    icon.onclick = () => (location.href = "account.html");
  }
}

/* LOGOUT ------------------------------------------------------ */
window.logout = () => {
  clearUser();
  // If you used Google credential storage, revoke here if necessary
  location.href = "index.html";
};

/* GOOGLE LOGIN (callback used by google.accounts.id.initialize) --------------
   The browser receives a credential (id_token). Send to backend to verify
   and create/get user. Backend returns user object.
*/
window.handleGoogleResponse = async (res) => {
  try {
    if (!res || !res.credential) throw new Error("No credential");
    const idToken = res.credential;

    // send token to backend for verification + user creation
    const resp = await fetch("/api/auth/google", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_token: idToken }),
    });

    const data = await resp.json();
    if (!data.success) throw new Error(data.message || "Google login failed");

    // data.user { email, name, picture, isAdmin? }
    saveUser(data.user);
    if (data.user.isAdmin) localStorage.setItem("adminLoggedIn", "true");

    setupLoginUI();
    updateCartBadge();
    // redirect to account or admin
    if (data.user.isAdmin) location.href = "admin.html";
    else location.href = "account.html";
  } catch (err) {
    console.error(err);
    alert("Google login failed");
  }
};

/* wireGoogleButton: optional fallback to trigger prompt */
function wireGoogleButton() {
  const btn = byId("loginBtn");
  if (!btn) return;
  btn.addEventListener("click", () => {
    if (window.google && google.accounts && google.accounts.id) {
      google.accounts.id.prompt();
    } else {
      alert("Google SDK not loaded. Try refreshing.");
    }
  });
}

/* PASSWORD LOGIN ------------------------------------------------------ */
window.loginWithPassword = async (email, password) => {
  try {
    if (!email || !password) return alert("Enter details");

    const resp = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await resp.json();
    if (!data.success) return alert(data.message || "Login failed");

    saveUser(data.user);
    if (data.user.isAdmin) localStorage.setItem("adminLoggedIn", "true");

    setupLoginUI();
    updateCartBadge();
    location.href = "account.html";
  } catch (err) {
    console.error(err);
    alert("Login error");
  }
};

/* REGISTER ------------------------------------------------------ */
window.registerUser = async (name, email, password) => {
  try {
    if (!email || !password) return alert("Enter details");

    const resp = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await resp.json();
    if (!data.success) return alert(data.message || "Registration failed");

    alert("Registered! Please login.");
    location.href = "login.html";
  } catch (err) {
    console.error(err);
    alert("Registration error");
  }
};

/* CART ------------------------------------------------------ */
const parseCart = () => safeJSONParse(localStorage.getItem("cart"), []);
const saveCart = (c) => localStorage.setItem("cart", safeJSONSerialize(c));

window.addToCart = (p, m = 1) => {
  const cart = parseCart();
  cart.push({
    id: p._id || p.id,
    name: p.name,
    price: +p.price,
    image: p.images?.[0] || DEFAULTS.productImage,
    metres: +m,
  });
  saveCart(cart);
  updateCartBadge();
  alert("Added!");
};

window.removeItem = (i) => {
  const cart = parseCart();
  cart.splice(i, 1);
  saveCart(cart);
  loadCartPage();
  updateCartBadge();
};

function updateCartBadge() {
  const b = byId("cartCount");
  if (b) b.textContent = parseCart().length || "";
}
window.updateCartBadge = updateCartBadge;

function loadCartPage() {
  const cont = byId("cartItems");
  if (!cont) return;

  const cart = parseCart();
  const emptyEl = byId("cartEmpty");
  const summaryEl = byId("cartSummary");

  if (!cart.length) {
    if (emptyEl) emptyEl.style.display = "block";
    if (summaryEl) summaryEl.style.display = "none";
    cont.innerHTML = "";
    return;
  }

  if (emptyEl) emptyEl.style.display = "none";
  if (summaryEl) summaryEl.style.display = "block";

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
            <p>${DEFAULTS.currencySymbol}${c.price} × ${c.metres} = ${DEFAULTS.currencySymbol}${line}</p>
            <button class="btn btn-danger btn-sm mt-auto"
                    onclick="removeItem(${i})">Remove</button>
          </div>
        </div>
      </div>`;
    }).join("");

  const totalEl = byId("cartTotal");
  if (totalEl) totalEl.textContent = total;
}

/* CATEGORY / PRODUCTS LOADER (supports 'all' and named categories) ------------- */
window.loadCategory = async (cat = "all") => {
  const grid = byId("productGrid");
  const coming = byId("comingSoon");
  if (!grid) return;

  grid.innerHTML = `<p class="text-center mt-4">Loading...</p>`;
  try {
    const path = cat === "all" ? "/api/products/category/all" : `/api/products/category/${encodeURIComponent(cat)}`;
    const res = await fetch(path);
    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      if (coming) coming.style.display = "block";
      grid.innerHTML = "";
      return;
    }

    if (coming) coming.style.display = "none";

    grid.innerHTML = data.map(p => `
      <div class="col-lg-3 col-md-4 col-sm-6">
        <div class="card shadow-sm h-100 p-2 card-button">
          <img src="${p.images?.[0] || DEFAULTS.productImage}" 
               class="card-img-top" style="height:200px;object-fit:cover;">
          <div class="card-body d-flex flex-column">
            <h6 class="mb-1">${p.name}</h6>
            <p class="mb-2"><strong>${DEFAULTS.currencySymbol}${p.price}</strong></p>
            <div class="mt-auto">
              <a href="product.html?id=${p._id}" class="btn btn-dark btn-sm w-100">View</a>
            </div>
          </div>
        </div>
      </div>
    `).join("");
  } catch (err) {
    console.error(err);
    if (coming) coming.style.display = "block";
    grid.innerHTML = "";
  }
};

/* LOAD SINGLE PRODUCT (used on product.html) --------------------------- */
window.loadProduct = async (id) => {
  const cont = byId("productDetail");
  if (!cont) return;
  cont.innerHTML = `<p class="text-center">Loading...</p>`;
  try {
    const res = await fetch(`/api/products/${id}`);
    const p = await res.json();
    if (!p || !p._id) {
      cont.innerHTML = `<p class="text-center">Product not found</p>`;
      return;
    }

    cont.innerHTML = `
      <div class="row">
        <div class="col-md-6">
          <img src="${p.images?.[0] || DEFAULTS.productImage}" class="img-fluid" style="max-height:500px;object-fit:cover;">
        </div>
        <div class="col-md-6">
          <h3>${p.name}</h3>
          <p><strong>${DEFAULTS.currencySymbol}${p.price}</strong></p>
          <p>${p.description || ""}</p>
          <div class="mb-2">
            <label>Metres:</label>
            <input id="buyMetres" type="number" min="1" value="1" class="form-control" style="max-width:120px;">
          </div>
          <button class="btn btn-primary" onclick="addToCart(${JSON.stringify(p).replace(/'/g, "\\'")}, document.getElementById('buyMetres').value)">Add to cart</button>
        </div>
      </div>
    `;
  } catch (err) {
    console.error(err);
    cont.innerHTML = `<p class="text-center">Failed to load product</p>`;
  }
};

/* ORDERS ------------------------------------------------------ */
window.placeOrder = async (order) => {
  try {
    const resp = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(order),
    });
    const data = await resp.json();
    if (!data.success) return alert("Order failed");
    // clear cart
    localStorage.removeItem("cart");
    updateCartBadge();
    alert("Order placed!");
    location.href = "account.html";
  } catch (err) {
    console.error(err);
    alert("Order error");
  }
};

/* LOGIN FORM WIRING ------------------------------------------------------ */
function wireLoginForm() {
  const form = byId("loginForm");
  if (!form) return;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = byId("loginEmail").value;
    const password = byId("loginPassword").value;
    loginWithPassword(email, password);
  });
}

function wireRegisterForm() {
  const form = byId("registerForm");
  if (!form) return;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = byId("registerName").value;
    const email = byId("registerEmail").value;
    const password = byId("registerPassword").value;
    registerUser(name, email, password);
  });
}

/* INIT ------------------------------------------------------ */
document.addEventListener("DOMContentLoaded", () => {
  setupLoginUI();
  updateCartBadge();
  wireGoogleButton();
  wireLoginForm();
  wireRegisterForm();

  if (location.pathname.includes("cart")) loadCartPage();
  // product page handler
  if (location.pathname.includes("product.html")) {
    const params = new URLSearchParams(location.search);
    const id = params.get("id");
    if (id) loadProduct(id);
  }
});
