console.log("GOOGLE AUTH LOADED!");

google.accounts.id.initialize({
  client_id: 653374521156-6retcia1fiu5dvmbjik9sq89ontrkmvt.apps.googleusercontent.com,
  callback: function (response) {
    const decoded = jwt_decode(response.credential);

    const user = {
      name: decoded.name,
      email: decoded.email,
      picture: decoded.picture
    };

    localStorage.setItem("sng_user", JSON.stringify(user));

    window.location.reload();
  }
});

google.accounts.id.renderButton(
  document.getElementById("loginBtn"),
  { theme: "filled_black", size: "medium" }
);
