console.log("NAVBAR JS RUNNING");
console.log("accountIcon =", document.getElementById("accountIcon"));
console.log("redirect override =", window.location.pathname.includes("admin.html"));

// --------------------------------------------------
// NAVBAR UI — FINAL NON-FLICKER VERSION
// --------------------------------------------------

const loginBtn = document.getElementById("loginBtn") || document.getElementById("loginButton");
const accountIcon = document.getElementById("accountIcon");
const loginArea = document.querySelector(".nav-login-area");
const cartBadge = document.getElementById("cartCount");

// Read saved user
function getUser() {
  const raw = localStorage.getItem("sg_user");
  return raw ? JSON.parse(raw) : null;
}

// Update navbar UI (NO FLICKER)
function setupLoginUI() {
  const user = getUser();

  if (user) {
    if (accountIcon) {
      accountIcon.src = user.picture || "images/default-user.png";
      accountIcon.style.display = "inline-block";
    }

    if (loginBtn) loginBtn.style.display = "none";

  } else {
    if (loginBtn) loginBtn.style.display = "inline-block";
    if (accountIcon) accountIcon.style.display = "none";
  }

  if (loginArea) loginArea.style.visibility = "visible";
}

// FIX: Prevent redirect on admin page
if (accountIcon) {
  if (!window.location.pathname.includes("admin.html")) {
    accountIcon.addEventListener("click", () => {
      window.location.href = "account.html";
    });
  }
}

// Update cart badge
async function updateCartBadge() {
  if (!cartBadge) return;

  cartBadge.textContent = "";

  const user = getUser();
  if (!user?.token) return;

  try {
    const res = await fetch("https://api.suitsnglam.com/api/cart", {
      headers: { "auth-token": user.token },
    });

    const data = await res.json();
    if (data.items?.length) cartBadge.textContent = data.items.length;

  } catch (err) {
    console.error("Cart badge error:", err);
  }
}

// Run instantly when DOM loads
document.addEventListener("DOMContentLoaded", () => {
  setupLoginUI();
  updateCartBadge();
});
