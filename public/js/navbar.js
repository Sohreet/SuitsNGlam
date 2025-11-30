document.addEventListener("DOMContentLoaded", () => {
  const loginBtn = document.getElementById("loginBtn");
  const accountIcon = document.getElementById("accountIcon");
  const navLoginArea = document.querySelector(".nav-login-area");

  // ALWAYS show login area (remove flicker)
  navLoginArea.style.visibility = "visible";

  const user = localStorage.getItem("sng_user");

  if (user) {
    // Logged IN
    const u = JSON.parse(user);

    loginBtn.style.display = "none";
    accountIcon.style.display = "block";
    accountIcon.src = u.picture || "https://cdn-icons-png.flaticon.com/512/149/149071.png";
  } else {
    // Logged OUT
    loginBtn.style.display = "block";
    accountIcon.style.display = "none";
  }

  // Login button click
  loginBtn.addEventListener("click", () => {
    google.accounts.id.prompt(); // Show Google login popup
  });
});
