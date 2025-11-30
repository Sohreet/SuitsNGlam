// =====================================================
// GLOBAL NAVBAR LOGIN SYSTEM (FLICKER-FREE VERSION)
// =====================================================

// Elements (safe for all pages)
const loginBtn =
  document.getElementById("loginButton") ||
  document.getElementById("loginBtn");

const accountIcon = document.getElementById("accountIcon");
const cartBadge = document.getElementById("cartCount");

// =====================================================
// READ USER FROM LOCAL STORAGE (Unified Format)
// =====================================================
function getUser() {
  // Full object format
  const obj = localStorage.getItem("sg_user");
  if (obj) return JSON.parse(obj);

  // Old key fallback
  const email = localStorage.getItem("userEmail");
  if (email) {
    return {
      email,
      name: localStorage.getItem("userName") || "",
      picture: localStorage.getItem("userPic") || "",
      token: localStorage.getItem("token") || ""
    };
  }

  return null;
}

// =====================================================
// FLICKER-FREE NAVBAR UPDATE
// =====================================================
function setupLoginUI() {
  const user = getUser();

  // Hide everything first to prevent DOM flicker
  if (loginBtn) {
    loginBtn.style.visibility = "hidden";
    loginBtn.style.display = "none";
  }
  if (accountIcon) {
    accountIcon.style.visibility = "hidden";
    accountIcon.style.display = "none";
  }

  // If logged in → show profile icon
  if (user) {
    if (accountIcon) {
      accountIcon.src = user.picture || "images/default-user.png";
      accountIcon.style.display = "inline-block";
      accountIcon.style.visibility = "visible";
    }
  }

  // If logged out → show login button
  else {
    if (loginBtn) {
      loginBtn.style.display = "inline-block";
      loginBtn.style.visibility = "visible";
    }
  }
}

// =====================================================
// LOGOUT
// =====================================================
function logoutUser() {
  localStorage.removeItem("sg_user");
  localStorage.removeItem("userEmail");
  localStorage.removeItem("userName");
  localStorage.removeItem("userPic");
  localStorage.removeItem("isAdmin");
  localStorage.removeItem("token");

  if (google?.accounts?.id) {
    google.accounts.id.disableAutoSelect();
  }

  setupLoginUI();
  updateCartBadge();
  window.location.href = "index.html";
}

window.logoutUser = logoutUser;

// =====================================================
// UPDATE CART BADGE
// =====================================================
async function updateCartBadge() {
  if (!cartBadge) return;

  cartBadge.textContent = "";

  const user = getUser();
  if (!user || !user.token) return;

  try {
    const res = await fetch("https://api.suitsnglam.com/api/cart", {
      headers: { "auth-token": user.token }
    });

    const data = await res.json();

    if (data.items?.length > 0) {
      cartBadge.textContent = data.items.length;
    }
  } catch (err) {
    console.error("Cart badge error:", err);
  }
}

window.updateCartBadge = updateCartBadge;

// =====================================================
// RUN ON PAGE LOAD
// =====================================================
document.addEventListener("DOMContentLoaded", () => {
  setupLoginUI();
  updateCartBadge();
});
