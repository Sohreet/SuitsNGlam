// =====================================================
// GLOBAL NAVBAR LOGIN SYSTEM
// =====================================================

const loginBtn =
  document.getElementById("loginButton") ||
  document.getElementById("loginBtn");

const accountIcon = document.getElementById("accountIcon");
const cartBadge = document.getElementById("cartCount");

// =====================================================
// READ USER (supports both formats)
// =====================================================
function getUser() {
  const obj = localStorage.getItem("sg_user");
  if (obj) return JSON.parse(obj);

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
// LOGIN UI UPDATE
// =====================================================
function setupLoginUI() {
  const user = getUser();

  if (user) {
    if (loginBtn) loginBtn.style.display = "none";

    if (accountIcon) {
      accountIcon.src = user.picture || "images/default-user.png";
      accountIcon.style.display = "inline-block";
    }
  } else {
    if (loginBtn) loginBtn.style.display = "inline-block";

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

  if (google?.accounts?.id) google.accounts.id.disableAutoSelect();

  window.location.href = "index.html";
}

window.logoutUser = logoutUser;

// =====================================================
// CART BADGE
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
// INIT
// =====================================================
document.addEventListener("DOMContentLoaded", () => {
  setupLoginUI();
  updateCartBadge();
});
