// --------------------------------------------------
// GOOGLE AUTH — FINAL CLEAN + STABLE VERSION
// --------------------------------------------------

console.log("google-auth.js loaded");

const GOOGLE_CLIENT_ID =
  "653374521156-6retcia1fiu5dvmbjik9sq89ontrkmvt.apps.googleusercontent.com";

// REAL ADMIN EMAIL(S)
const ADMINS = ["sohabrar10@gmail.com"];

// Load Google SDK
(function ensureGoogleSDK() {
  if (document.getElementById("gsi-script")) return;
  const s = document.createElement("script");
  s.id = "gsi-script";
  s.src = "https://accounts.google.com/gsi/client";
  s.async = true;
  s.defer = true;
  document.head.appendChild(s);
})();

// Save user after login
function saveUser(data, token) {
  const user = {
    email: data.email,
    name: data.name,
    picture: data.picture,
    token,
  };

  localStorage.setItem("sg_user", JSON.stringify(user));

  // ADMIN CHECK
  if (ADMINS.includes(user.email)) {
    localStorage.setItem("adminLoggedIn", "true");
    console.log("ADMIN SUCCESS");
  } else {
    localStorage.removeItem("adminLoggedIn");
    console.log("NORMAL USER LOGIN");
  }
}

// Handle Google response
function handleCredentialResponse(response) {
  try {
    const data = jwt_decode(response.credential);
    saveUser(data, response.credential);

    if (window.setupLoginUI) setupLoginUI();
    if (window.updateCartBadge) updateCartBadge();

  } catch (err) {
    console.error("Google Sign-In Error:", err);
  }
}

// Trigger Google login popup
function googleLogin() {
  if (!google?.accounts?.id)
    return setTimeout(googleLogin, 200);

  google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: handleCredentialResponse,
  });

  google.accounts.id.prompt();
}

// Attach login button
document.addEventListener("DOMContentLoaded", () => {
  const btn =
    document.getElementById("loginBtn") ||
    document.getElementById("loginButton");

  if (btn) btn.addEventListener("click", googleLogin);
});
