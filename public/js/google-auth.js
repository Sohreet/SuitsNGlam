console.log("GOOGLE AUTH LOADED!");

// ====================== GOOGLE AUTH ======================
const GOOGLE_CLIENT_ID = "653374521156-6retcia1fiu5dvmbjik9sq89ontrkmvt.apps.googleusercontent.com";

function handleCredentialResponse(response) {
  try {
    const data = jwt_decode(response.credential);

    const user = {
      email: data.email,
      name: data.name,
      picture: data.picture,
      token: response.credential
    };

    localStorage.setItem("sg_user", JSON.stringify(user));

    if (window.setupLoginUI) setupLoginUI();
    if (window.updateCartBadge) updateCartBadge();

  } catch (err) {
    console.error("Google Auth Error:", err);
  }
}

function googleLogin() {
  if (!window.google || !google.accounts || !google.accounts.id) {
    console.log("Google SDK not ready, retrying...");
    return setTimeout(googleLogin, 300);
  }

  google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: handleCredentialResponse,
  });

  google.accounts.id.prompt();
}

document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("loginBtn");

  console.log("Login button:", btn);

  if (btn) btn.addEventListener("click", googleLogin);
});
