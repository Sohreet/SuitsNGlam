// ------------------------------------------------------
// SIMPLE GOOGLE LOGIN SYSTEM (COMPATIBLE WITH ALL PAGES)
// ------------------------------------------------------

const GOOGLE_CLIENT_ID =
  "653374521156-6retcia1fiu5dvmbjik9sq89ontrkmvt.apps.googleusercontent.com";

/* Load Google SDK once */
(function loadGoogleSDK() {
  if (document.getElementById("gsi-script")) return;
  const s = document.createElement("script");
  s.id = "gsi-script";
  s.src = "https://accounts.google.com/gsi/client";
  s.async = true;
  s.defer = true;
  document.head.appendChild(s);
})();

/* Save user in both formats (object + old keys) */
function applyUserToStorage(userObj) {
  localStorage.setItem("sg_user", JSON.stringify(userObj));

  if (userObj.email) localStorage.setItem("userEmail", userObj.email);
  if (userObj.name) localStorage.setItem("userName", userObj.name);
  if (userObj.picture) localStorage.setItem("userPic", userObj.picture);
}

/* Handle Google Login Response */
function handleCredentialResponse(response) {
  try {
    const data = jwt_decode(response.credential);

    const user = {
      email: data.email,
      name: data.name,
      picture: data.picture,
      token: response.credential
    };

    applyUserToStorage(user);

    const ADMIN_EMAILS = [
      "sohabrar10@gmail.com",
      "suitsnglam01@gmail.com"
    ];
    localStorage.setItem("isAdmin", ADMIN_EMAILS.includes(user.email) ? "true" : "false");

    // ❌ Remove UI update here — navbar.js handles UI
    // ❌ Do NOT call setupLoginUI() or updateCartBadge()

  } catch (e) {
    console.error("Google Login Error →", e);
  }
}

/* Trigger login popup safely */
function triggerGoogleLoginPopup() {
  if (typeof google === "undefined" || !google.accounts) {
    return setTimeout(triggerGoogleLoginPopup, 300);
  }

  google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: handleCredentialResponse
  });

  google.accounts.id.prompt();
}

/* Attach login button */
document.addEventListener("DOMContentLoaded", () => {
  const btn =
    document.getElementById("loginButton") ||
    document.getElementById("loginBtn");

  if (btn) btn.addEventListener("click", triggerGoogleLoginPopup);
});
