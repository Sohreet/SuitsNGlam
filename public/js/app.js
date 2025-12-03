/******************************************************
 * SUITS N GLAM — APP.JS (FINAL GOOGLE LOGIN VERSION)
 ******************************************************/

console.log("APP.JS LOADED");

/* CONFIG ------------------------------------------------------ */
const ADMINS = ["sohabrar10@gmail.com"];
const GOOGLE_CLIENT_ID =
  "653374521156-6retcia1fiu5dvmbjik9sq89ontrkmvt.apps.googleusercontent.com";

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

  if (ADMINS.includes(user.email)) {
    adminBadge.style.display = "inline-block";
    icon.onclick = () => location.href = "admin.html";
  } else {
    adminBadge.style.display = "none";
    icon.onclick = () => location.href = "account.html";
  }
}

/* LOGOUT ------------------------------------------------------ */
window.logout = () => {
  clearUser();
  location.href = "index.html";
};

/* GOOGLE LOGIN ------------------------------------------------------ */
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

    location.reload();
  } catch (err) {
    alert("Google login failed");
  }
};

function wireGoogleButton() {
  const btn = byId("loginBtn");
  if (!btn) return;

  btn.addEventListener("click", () => {
    google.accounts.id.prompt(); // popup
  });
}

/* PASSWORD LOGIN ------------------------------------------------------ */
window.loginWithPassword = async (email, password) => {
  if (!email || !password) return alert("Enter details");

  const resp = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await resp.json();

  if (!data.success) return alert(data.message);

  saveUser(data.user);

  if (ADMINS.includes(data.user.email))
    localStorage.setItem("adminLoggedIn", "true");

  setupLoginUI();
  updateCartBadge();
  location.href = "account.html";
};

/* LOGIN FORM ------------------------------------------------------ */
function wireLoginForm() {
  const form = byId("loginForm");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    loginWithPassword(byId("loginEmail").value, byId("loginPassword").value);
  });
}

/* CART ------------------------------------------------------ */
const parseCart = () => safeJSONParse(localStorage.getItem("cart"), []);
const saveCart = (c) => localStorage.setItem("cart", safeJSONSerialize(c));

window.addToCart = (p, m = 1) => {
  const cart = parseCart();
  cart.push({
    id: p._id,
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
            <button class="btn btn-danger btn-sm mt-auto"
                    onclick="removeItem(${i})">Remove</button>
          </div>
        </div>
      </div>`;
    }).join("");

  byId("cartTotal").textContent = total;
}
window.loadCartPage = loadCartPage;

/* INIT ------------------------------------------------------ */
document.addEventListener("DOMContentLoaded", () => {
  setupLoginUI();
  updateCartBadge();
  wireGoogleButton();
  wireLoginForm();

  if (location.pathname.includes("cart"))
    loadCartPage();
});
