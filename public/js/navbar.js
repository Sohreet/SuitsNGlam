console.log("NAVBAR JS LOADED");

// Read saved user
function getUser() {
  const raw = localStorage.getItem("sg_user");
  return raw ? JSON.parse(raw) : null;
}

function setupLoginUI() {
  const user = getUser();
  const loginBtn = document.getElementById("loginBtn");
  const accountIcon = document.getElementById("accountIcon");
  const loginArea = document.querySelector(".nav-login-area");

  if (!loginBtn || !accountIcon || !loginArea) {
    console.error("Navbar elements missing");
    return;
  }

  if (user) {
    // show account picture
    accountIcon.src = user.picture || "images/default-user.png";
    accountIcon.style.display = "inline-block";
    loginBtn.style.display = "none";
  } else {
    accountIcon.style.display = "none";
    loginBtn.style.display = "inline-block";
  }

  // prevent flicker
  loginArea.style.visibility = "visible";
}

document.addEventListener("DOMContentLoaded", () => {
  setupLoginUI();
});
