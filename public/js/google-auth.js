// -------------------------------------------
// GOOGLE AUTH (NO UI) — FINAL CLEAN VERSION
// -------------------------------------------

const GOOGLE_CLIENT_ID =
  "653374521156-6retcia1fiu5dvmbjik9sq89ontrkmvt.apps.googleusercontent.com";

// Load Google SDK once
(function loadSDK() {
  if (document.getElementById("gsi-script")) return;
  const s = document.createElement("script");
  s.id = "gsi-script";
  s.src = "https://accounts.google.com/gsi/client";
  s.async = true;
  s.defer = true;
  document.head.appendChild(s);
})();

// Save user
function saveUser(data, token) {
  const user = {
    email: data.email,
    name: data.name,
    picture: data.picture,
    token
  };

  localStorage.setItem("sg_user", JSON.stringify(user));

  const ADMINS = ["sohabrar10@gmail.com", "suitsnglam01@gmail.com"];
  if (ADMINS.includes(user.email)) {
    localStorage.setItem("isAdmin", "true");
  } else {
    localStorage.removeItem("isAdmin");
  }
}

// Handle Google login
function handleCredentialResponse(response) {
  const data = jwt_decode(response.credential);
  saveUser(data, response.credential);

  // Tell navbar to update UI
  if (window.setupLoginUI) setupLoginUI();
  if (window.updateCartBadge) updateCartBadge();
}

// Trigger popup
function googleLogin() {
  if (!google?.accounts) return setTimeout(googleLogin, 300);

  google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: handleCredentialResponse
  });

  google.accounts.id.prompt();
}

// Attach login button event
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("loginButton") || document.getElementById("loginBtn");
  if (btn) btn.addEventListener("click", googleLogin);
});
