// ------------------------------------------------------
// SIMPLE GOOGLE LOGIN SYSTEM (COMPATIBLE WITH ALL PAGES)
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

/* Normalize user storage so every script can read the same keys.
   We keep `sg_user` (object) for newer code, and also set
   `userEmail`, `userName`, `userPic`, and `isAdmin` for older pages. */
function applyUserToStorage(userObj) {
  // sg_user remains for code that expects the object
  localStorage.setItem("sg_user", JSON.stringify(userObj));

  // also set individual keys used by navbar.js and other pages
  if (userObj.email) localStorage.setItem("userEmail", userObj.email);
  if (userObj.name)  localStorage.setItem("userName", userObj.name);
  if (userObj.picture) localStorage.setItem("userPic", userObj.picture);
}

/* Handle Google Login Response */
function handleCredentialResponse(response) {
  try {
    const data = jwt_decode(response.credential); // decode user info

    // Build user object
    const user = {
      email: data.email,
      name: data.name,
      picture: data.picture,
      token: response.credential
    };

    // Persist in localStorage (both object + individual keys)
    applyUserToStorage(user);

    // Admin check: put admin emails here
    const ADMIN_EMAILS = ["sohabrar10@gmail.com", "suitsnglam01@gmail.com"];
    if (ADMIN_EMAILS.includes(data.email)) {
      localStorage.setItem("isAdmin", "true");
    } else {
      localStorage.removeItem("isAdmin");
    }

    // Update UI immediately if helper functions exist
    if (window.setupLoginUI) setupLoginUI();
    if (window.updateCartBadge) updateCartBadge();

  } catch (e) {
    console.error("Google Login Error →", e);
  }
}

/* Trigger login popup (safe if SDK isn't loaded yet) */
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

/* Attach login click(s) on page load (support both ID names) */
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("loginButton") || document.getElementById("loginBtn");
  if (btn) btn.addEventListener("click", triggerGoogleLoginPopup);

  // If user already logged in (persisted), update UI now:
  if (localStorage.getItem("sg_user") && window.setupLoginUI) setupLoginUI();
});
