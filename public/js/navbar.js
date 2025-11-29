/* ---------------------------------------------------
   NAVBAR LOGIN / ACCOUNT ICON CONTROLLER
   Works on all pages
---------------------------------------------------- */

document.addEventListener("DOMContentLoaded", () => {
  setupLoginUI();
  updateCartBadge();

  // Account icon click → Go to account page
  const accountIcon = document.getElementById("accountIcon");
  if (accountIcon) {
    accountIcon.addEventListener("click", () => {
      window.location.href = "account.html";
    });
  }

  // If Login button exists → And user already logged in → Take to account.html
  const loginBtn = document.getElementById("loginBtn");
  if (loginBtn) {
    loginBtn.addEventListener("click", () => {
      const email = localStorage.getItem("userEmail");

      if (email) {
        // Already logged in → go to account page
        window.location.href = "account.html";
      }
      // If not logged in → google-auth.js will open Google popup
    });
  }
});

/* ---------------------------------------------------
   Update navbar login/account icon UI
---------------------------------------------------- */
function setupLoginUI() {
  const loginBtn = document.getElementById("loginBtn");
  const accountIcon = document.getElementById("accountIcon");

  if (!loginBtn || !accountIcon) return;

  const email = localStorage.getItem("userEmail");
  const pic = localStorage.getItem("userPic");

  if (!email) {
    // User not logged in
    loginBtn.style.display = "inline-block";
    accountIcon.style.display = "none";
    return;
  }

  // User logged in
  loginBtn.style.display = "none";
  accountIcon.style.display = "inline-block";
  accountIcon.src = pic || "https://www.svgrepo.com/show/382106/profile-user.svg";
}

/* ---------------------------------------------------
   Update cart badge
---------------------------------------------------- */
function updateCartBadge() {
  const badge = document.getElementById("cartCount");
  if (!badge) return;

  const cart = JSON.parse(localStorage.getItem("cart") || "[]");
  badge.textContent = cart.length > 0 ? cart.length : "";
}
