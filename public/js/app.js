/******************************************************
 * SUITS N GLAM — APP.JS (DIRECT GOOGLE LOGIN VERSION)
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
const byId = (id) => document.getElementById(id);

function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[m]);
}

function safeJSONParse(v, f = null) {
  try { return JSON.parse(v) ?? f; } catch { return f; }
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
  localStorage.removeItem("sg_token");
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

/* ------------------ DIRECT GOOGLE LOGIN ------------------ */
let googleReady = false;

async function initGoogleLogin() {
  // wait for Google script
  const wait = async () => {
    for (let i = 0; i < 80; i++) {
      if (window.google?.accounts?.id) return true;
      await new Promise((r) => setTimeout(r, 100));
    }
    return false;
  };

  if (!(await wait())) return;

  googleReady = true;

  google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: handleGoogleResponse,
    ux_mode: "popup",
  });
}

/* ---- Google Login Response ---- */
window.handleGoogleResponse = (res) => {
  try {
    const data = jwt_decode(res.credential);
    const user = {
      email: data.email,
      name: data.name,
      picture: data.picture || DEFAULTS.userPicture,
    };

    saveUser(user);

    if (ADMINS.includes(user.email))
      localStorage.setItem("adminLoggedIn", "true");
    else
      localStorage.removeItem("adminLoggedIn");

    location.reload();
  } catch (err) {
    console.error("Google login decode error:", err);
    alert("Google login failed.");
  }
};

/* CLICK LOGIN BUTTON → GOOGLE POPUP */
function wireDirectGoogleLogin() {
  const btn = byId("loginBtn");
  if (!btn) return;

  btn.addEventListener("click", () => {
    if (!googleReady) {
      alert("Google login not ready. Please wait 1 second.");
      return;
    }
    google.accounts.id.prompt();
  });
}

/* ------------------ EMAIL PASSWORD LOGIN ------------------ */
window.loginWithPassword = async (email, password) => {
  if (!email || !password) {
    alert("Please provide email and password");
    return;
  }

  try {
    const resp = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await resp.json().catch(() => null);
    if (!data?.success) return alert(data?.message || "Login failed");

    if (data.token) localStorage.setItem("sg_token", data.token);

    const user = data.user || data;
    saveUser(user);

    if (ADMINS.includes(user.email))
      localStorage.setItem("adminLoggedIn", "true");
    else
      localStorage.removeItem("adminLoggedIn");

    setupLoginUI();
    updateCartBadge();
    location.href = "account.html";
  } catch (err) {
    console.error("Login error:", err);
    alert("Network error. Try again.");
  }
};

/* ------------------ LOGIN FORM (IF EXISTS) ------------------ */
function wireLoginForm() {
  const form = byId("loginForm");
  if (!form) return;

  form.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const email = byId("loginEmail")?.value;
    const password = byId("loginPassword")?.value;
    loginWithPassword(email, password);
  });
}

/* ------------------ CART / PRODUCTS / ORDERS (unchanged) ------------------ */
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
  updateCartBadge();
};

window.removeItem = (i) => {
  const cart = parseCart();
  cart.splice(i, 1);
  saveCart(cart);
  loadCartPage();
  updateCartBadge();
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
    byId("cartEmpty")?.style.display = "block";
    byId("cartSummary")?.style.display = "none";
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
              <h5>${escapeHtml(c.name)}</h5>
              <p>${DEFAULTS.currencySymbol}${c.price} × ${c.metres} = ${DEFAULTS.currencySymbol}${line}</p>
              <button class="btn btn-danger btn-sm mt-auto" onclick="removeItem(${i})">Remove</button>
            </div>
          </div>
        </div>`;
    })
    .join("");

  byId("cartTotal").textContent = total;
}
window.loadCartPage = loadCartPage;

/* ------------------ INIT ------------------ */
document.addEventListener("DOMContentLoaded", () => {
  setupLoginUI();
  updateCartBadge();

  initGoogleLogin();         // google setup
  wireDirectGoogleLogin();   // click = google popup
  wireLoginForm();           // email login form if exists

  const p = location.pathname.toLowerCase();
  if (p.includes("cart")) loadCartPage();
});
