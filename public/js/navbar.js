console.log("NAVBAR JS LOADED");

function getUser() {
  const raw = localStorage.getItem("sg_user");
  try { return raw ? JSON.parse(raw) : null; } catch { return null; }
}

function setupLoginUI() {
  const user = getUser();
  const loginBtn = document.getElementById("loginBtn");
  const accountIcon = document.getElementById("accountIcon");
  const loginArea = document.querySelector(".nav-login-area");

  if (!loginBtn || !accountIcon || !loginArea) return;

  if (user) {
    accountIcon.src = user.picture || "/public/images/default-user.png";
    accountIcon.style.display = "inline-block";
    loginBtn.style.display = "none";
  } else {
    accountIcon.style.display = "none";
    loginBtn.style.display = "inline-block";
  }

  // reveal UI (no flicker)
  loginArea.style.visibility = "visible";

  // prevent redirect on admin page
  if (!window.location.pathname.includes("admin.html")) {
    accountIcon.onclick = () => {
      window.location.href = "/account.html";
    };
  }
}

document.addEventListener("DOMContentLoaded", () => {
  setupLoginUI();
  if (window.updateCartBadge) updateCartBadge();
});
