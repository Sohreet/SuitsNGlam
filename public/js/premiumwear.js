// ===============================
// ✅ GOOGLE LOGIN CHECK
// ===============================
function checkLogin() {
  const loginBtn = document.getElementById("loginButton");
  const accountIcon = document.getElementById("accountIcon");
  const user = JSON.parse(localStorage.getItem("sg_user"));

  if (user) {
    loginBtn.style.display = "none";
    accountIcon.style.display = "inline";
    loadCartCount();
    checkAdmin(user.email);
  } else {
    loginBtn.style.display = "inline-block";
    accountIcon.style.display = "none";
  }
}

document.addEventListener("DOMContentLoaded", checkLogin);


// ===============================
// 🛒 CART COUNT
// ===============================
async function loadCartCount() {
  const badge = document.getElementById("cartCount");
  const user = JSON.parse(localStorage.getItem("sg_user"));

  if (!user?.email) {
    badge.textContent = "";
    return;
  }

  try {
    const res = await fetch(`https://api.suitsnglam.com/api/cart/${user.email}`);
    const data = await res.json();

    badge.textContent = data.items?.length || "";

  } catch (err) {
    console.error("Cart error:", err);
  }
}


// ===============================
// 👑 ADMIN CHECK
// ===============================
function checkAdmin(email) {
  if (email === "suitsnglam01@gmail.com") {
    document.getElementById("adminForm").style.display = "block";
  }
}


// ===============================
// 👗 LOAD PREMIUM WEAR PRODUCTS
// ===============================
async function loadProducts(category) {
  try {
    const res = await fetch(`https://api.suitsnglam.com/api/products/category/${category}`);
    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      comingSoonMsg.style.display = "block";
      return;
    }

    comingSoonMsg.style.display = "none";
    container.innerHTML = "";

    data.forEach(product => container.appendChild(createCard(product)));

  } catch (err) {
    console.error("Error loading products:", err);
    comingSoonMsg.style.display = "block";
  }
}


// ===============================
// 🎴 PRODUCT CARD
// ===============================
function createCard(p) {
  const col = document.createElement("div");
  col.className = "col-md-4";

  let media = "";
  if (p.images?.length)
    media += `<img src="${p.images[0]}" class="card-img-top">`;

  if (p.video)
    media += `<video class="w-100 mt-2" controls><source src="${p.video}"></video>`;

  col.innerHTML = `
    <div class="card shadow-sm card-button premiumwear-bg">
      ${media}
      <div class="card-body">
        <h5>${p.name}</h5>
        <p class="text-muted">${p.description || ""}</p>

        <p class="fw-bold">₹${p.pricePerMeter} / metre</p>

        <div class="d-flex align-items-center mb-2">
          <button class="btn btn-outline-secondary btn-sm" onclick="meterChange('${p._id}', -1)">-</button>
          <input id="meter-${p._id}" class="form-control mx-2" style="width:60px;" value="2" readonly>
          <button class="btn btn-outline-secondary btn-sm" onclick="meterChange('${p._id}', 1)">+</button>
        </div>

        <button class="btn btn-primary w-100" onclick="addPremiumWear('${p._id}_
