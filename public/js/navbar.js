// ---------------------------------------------
// NAVBAR UI CONTROLLER — FINAL VERSION
// ---------------------------------------------

const loginBtn = document.getElementById("loginButton") || document.getElementById("loginBtn");
const accountIcon = document.getElementById("accountIcon");
const cartBadge = document.getElementById("cartCount");
const loginArea = document.querySelector(".nav-login-area");

// Read user
function getUser() {
  const raw = localStorage.getItem("sg_user");
  return raw ? JSON.parse(raw) : null;
}

// Update UI
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

  // After everything is set → show area (no flicker)
  if (loginArea) loginArea.style.visibility = "visible";
}

// Account click → always go to account.html
if (accountIcon) {
  accountIcon.addEventListener("click", () => {
    window.location.href = "account.html";
  });
}

// Cart badge
async function updateCartBadge() {
  if (!cartBadge) return;

  cartBadge.textContent = "";

  const user = getUser();
  if (!user?.token) return;

  try {
    const res = await fetch("https://api.suitsnglam.com/api/cart", {
      headers: { "auth-token": user.token }
    });

    const data = await res.json();
    if (data.items?.length) {
      cartBadge.textContent = data.items.length;
    }
  } catch (err) {
    console.error("Cart badge error:", err);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  setupLoginUI();
  updateCartBadge();
});
