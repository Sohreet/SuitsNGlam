// ------------------------------------------------------
// GOOGLE LOGIN (Unified Storage + Flicker Free)
// ------------------------------------------------------

const GOOGLE_CLIENT_ID =
  "653374521156-6retcia1fiu5dvmbjik9sq89ontrkmvt.apps.googleusercontent.com";

// Load Google SDK
(function loadGoogleSDK() {
  if (document.getElementById("gsi-script")) return;
  const s = document.createElement("script");
  s.id = "gsi-script";
  s.src = "https://accounts.google.com/gsi/client";
  s.async = true;
  s.defer = true;
  document.head.appendChild(s);
})();

function applyUserToStorage(userObj) {
  localStorage.setItem("sg_user", JSON.stringify(userObj));

  localStorage.setItem("userEmail", userObj.email);
  localStorage.setItem("userName", userObj.name);
  localStorage.setItem("userPic", userObj.picture);
  localStorage.setItem("token", userObj.token);
}

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

    const ADMIN_EMAILS = ["sohabrar10@gmail.com", "suitsnglam01@gmail.com"];
    if (ADMIN_EMAILS.includes(data.email)) {
      localStorage.setItem("isAdmin", "true");
    } else {
      localStorage.removeItem("isAdmin");
    }

    if (window.setupLoginUI) setupLoginUI();
    if (window.updateCartBadge) updateCartBadge();

  } catch (e) {
    console.error("Google Login Error →", e);
  }
}

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

document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("loginBtn") || document.getElementById("loginButton");
  if (btn) btn.addEventListener("click", triggerGoogleLoginPopup);

  if (localStorage.getItem("sg_user") && window.setupLoginUI) {
    setupLoginUI();
  }
});
