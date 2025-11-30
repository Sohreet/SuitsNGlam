// ------------------------------
// FLICKER-FREE GLOBAL NAVBAR
// ------------------------------

const loginBtn = document.getElementById("loginBtn") || document.getElementById("loginButton");
const accountIcon = document.getElementById("accountIcon");
const wrapper = document.querySelector(".nav-login-area");
const cartBadge = document.getElementById("cartCount");

// Read user
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

// Apply login/logout UI
function setupLoginUI() {
  const user = getUser();

  // Hide first (prevents flicker)
  if (wrapper) wrapper.style.visibility = "hidden";

  if (loginBtn) loginBtn.style.display = "none";
  if (accountIcon) accountIcon.style.display = "none";

  if (user) {
    if (accountIcon) {
      accountIcon.src = user.picture || "images/default-user.png";
      accountIcon.style.display = "inline-block";
    }
  } else {
    if (loginBtn) loginBtn.style.display = "inline-block";
  }

  // Reveal wrapper AFTER correct UI is set
  requestAnimationFrame(() => {
    if (wrapper) wrapper.style.visibility = "visible";
  });
}

// Logout function
function logoutUser() {
  localStorage.clear();
  if (google?.accounts?.id) google.accounts.id.disableAutoSelect();
  window.location.href = "index.html";
}

window.logoutUser = logoutUser;

// Cart badge
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
    if (data.items) cartBadge.textContent = data.items.length;

  } catch (err) {
    console.error("Cart badge error:", err);
  }
}

window.updateCartBadge = updateCartBadge;

// On load
document.addEventListener("DOMContentLoaded", () => {
  setupLoginUI();
  updateCartBadge();
});
