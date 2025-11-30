// --------------------------------------------------
// ADMIN PAGE AUTH CHECK
// --------------------------------------------------

console.log("ADMIN PAGE LOADED");

const isAdmin = localStorage.getItem("adminLoggedIn");

if (!isAdmin) {
  console.warn("NOT ADMIN — REDIRECTING...");
  window.location.href = "index.html";
}
