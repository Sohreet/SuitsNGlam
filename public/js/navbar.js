// =====================================================
// GLOBAL NAVBAR LOGIN SYSTEM
// Works on ALL pages automatically
// =====================================================

// Get elements safely
const loginBtn = document.getElementById("loginButton") || document.getElementById("loginBtn");
const accountIcon = document.getElementById("accountIcon");
const cartBadge = document.getElementById("cartCount");

// =====================================================
// READ USER FROM LOCAL STORAGE
// Supports both old + new formats
// =====================================================
function getUser() {
  // Prefer full object
  const obj = localStorage.getItem("sg_user");
  if (obj) return JSON.parse(obj);

  // Fallback (old localStorage keys)
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
// UPDATE NAVBAR LOGIN UI
// =====================================================
function setupLoginUI() {
  const user = getUser();

  if (user) {
    // Hide login button
    if (loginBtn) loginBtn.style.display = "none";

    // Show profile image
    if (accountIcon) {
      accountIcon.src = user.picture || "images/default-user.png";
      accountIcon.style.display = "inline-block";
    }
  } else {
    // Show login button
    if (loginBtn) loginBtn.style.display = "inline-block";

    // Hide profile icon
    if (accountIcon) accountIcon.style.display = "none";
  }
}

// =====================================================
// LOGOUT FUNCTION
// =====================================================
function logoutUser() {
  localStorage.removeItem("sg_user");
  localStorage.removeItem("userEmail");
  localStorage.removeItem("userName");
  localStorage.removeItem("userPic");
  localStorage.removeItem("isAdmin");
  localStorage.removeItem("token");

  setupLoginUI();
  updateCartBadge();

  window.location.href = "index.html";
}

// Make logout available globally
window.logoutUser = logoutUser;

// =====================================================
// CART BADGE UPDATE (works after login too)
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

    if (data.items && data.items.length > 0) {
      cartBadge.textContent = data.items.length;
    }

  } catch (err) {
    console.error("Cart badge error:", err);
  }
}

// Make it available globally
window.updateCartBadge = updateCartBadge;

// =====================================================
// RUN ON PAGE LOAD
// =====================================================
document.addEventListener("DOMContentLoaded", () => {
  setupLoginUI();
  updateCartBadge();
});
