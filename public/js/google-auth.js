// --------------------------------------------------
// GOOGLE AUTH — FINAL FIXED VERSION
// --------------------------------------------------

console.log("GOOGLE AUTH LOADED");

const GOOGLE_CLIENT_ID =
  "653374521156-6retcia1fiu5dvmbjik9sq89ontrkmvt.apps.googleusercontent.com";

// Admin email list
const ADMINS = ["sohabrar10@gmail.com"];

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

  // Admin check
  if (ADMINS.includes(user.email)) {
    console.log("ADMIN LOGIN DETECTED");
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
  } catch (err) {
    console.error("Google Auth Error:", err);
  }
}

function googleLogin() {
  console.log("GOOGLE LOGIN CLICKED");

  if (!google?.accounts?.id)
    return setTimeout(googleLogin, 200);

  google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: handleCredentialResponse,
  });

  google.accounts.id.prompt();
}

// Attach to login button
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("loginBtn");
  if (btn) btn.addEventListener("click", googleLogin);
});
