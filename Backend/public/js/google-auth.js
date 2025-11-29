// ------------------------------------------------------
// SIMPLE GOOGLE LOGIN SYSTEM (FIXED + INDEX COMPATIBLE)
// ------------------------------------------------------

const GOOGLE_CLIENT_ID =
  "653374521156-6retcia1fiu5dvmbjik9sq89ontrkmvt.apps.googleusercontent.com";

/* Load Google SDK only once */
(function loadGoogleSDK() {
  if (document.getElementById("gsi-script")) return;
  const s = document.createElement("script");
  s.id = "gsi-script";
  s.src = "https://accounts.google.com/gsi/client";
  s.async = true;
  s.defer = true;
  document.head.appendChild(s);
})();

/* Handle Google Login Response */
function handleCredentialResponse(response) {
  try {
    const data = jwt_decode(response.credential); // decode user info

    // Store user object for entire website
    const user = {
      email: data.email,
      name: data.name,
      picture: data.picture,
      token: response.credential
    };

    localStorage.setItem("sg_user", JSON.stringify(user));

    // Admin check
    const ADMIN_EMAILS = ["sohabrar10@gmail.com"];
    if (ADMIN_EMAILS.includes(data.email)) {
      localStorage.setItem("isAdmin", "true");
    } else {
      localStorage.removeItem("isAdmin");
    }

    // Update UI (if these functions exist)
    if (window.setupLoginUI) setupLoginUI();
    if (window.updateCartBadge) updateCartBadge();

  } catch (e) {
    console.error("Google Login Error →", e);
  }
}


/* Trigger login popup */
function triggerGoogleLoginPopup() {
  if (typeof google === "undefined" || !google.accounts) {
    return setTimeout(triggerGoogleLoginPopup, 300);
  }

  google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: handleCredentialResponse
  });

  google.accounts.id.prompt(); // show popup
}


/* Attach login button on page load */
document.addEventListener("DOMContentLoaded", () => {
  // SUPPORT BOTH ID TYPES
  const btn =
    document.getElementById("loginButton") ||
    document.getElementById("loginBtn");

  if (btn) btn.addEventListener("click", triggerGoogleLoginPopup);
});
