// --------------------------------------------------
// GOOGLE AUTH — FIXED ADMIN LOGIN VERSION
// --------------------------------------------------

const GOOGLE_CLIENT_ID =
  "653374521156-6retcia1fiu5dvmbjik9sq89ontrkmvt.apps.googleusercontent.com";

// Load Google SDK
(function loadSDK() {
  if (document.getElementById("gsi-script")) return;
  const s = document.createElement("script");
  s.id = "gsi-script";
  s.src = "https://accounts.google.com/gsi/client";
  s.async = true;
  s.defer = true;
  document.head.appendChild(s);
})();

function saveUser(data, token) {
  const user = {
    email: data.email,
    name: data.name,
    picture: data.picture,
    token,
  };

  localStorage.setItem("sg_user", JSON.stringify(user));

  const ADMINS = ["sohabrar10@gmail.com"];

  // 🔥 FIXED ADMIN LOGIC
  if (ADMINS.includes(user.email)) {
    localStorage.setItem("adminLoggedIn", "true");
  } else {
    localStorage.removeItem("adminLoggedIn");
  }
}

function handleCredentialResponse(response) {
  try {
    const data = jwt_decode(response.credential);
    saveUser(data, response.credential);

    if (window.setupLoginUI) setupLoginUI();
    if (window.updateCartBadge) updateCartBadge();
  } catch (err) {
    console.error("Google Auth Error:", err);
  }
}

function googleLogin() {
  if (!google?.accounts?.id) return setTimeout(googleLogin, 200);

  google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: handleCredentialResponse,
  });

  google.accounts.id.prompt();
}

document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("loginBtn") || document.getElementById("loginButton");
  if (btn) btn.addEventListener("click", googleLogin);
});
