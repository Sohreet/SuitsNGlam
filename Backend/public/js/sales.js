// ------------------------------
// LOGIN TOGGLE (Firebase-based)
// ------------------------------
document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  const loginBtn = document.getElementById("loginBtn");
  const accountIcon = document.getElementById("accountIcon");

  if (token) {
    loginBtn.style.display = "none";
    accountIcon.style.display = "inline";
  } else {
    loginBtn.style.display = "inline-block";
    accountIcon.style.display = "none";
  }
});


// ------------------------------
// CART COUNT
// ------------------------------
async function loadCartCount() {
  const badge = document.getElementById("cartCount");
  const token = localStorage.getItem("token");

  if (!token) {
    badge.textContent = "";
    return;
  }

  try {
    const res = await fetch("https://api.suitsnglam.com/api/cart", {
      headers: { "auth-token": token }
    });

    const data = await res.json();
    badge.textContent = data.items?.length || "";

  } catch (err) {
    console.error(err);
  }
}

loadCartCount();


// ------------------------------
// DOM ELEMENTS
// ------------------------------
const container = document.getElementById("salesContainer");
const comingSoonMsg = document.getElementById("comingSoonMsg");


// ------------------------------
// UNIVERSAL LOAD PRODUCTS
// ------------------------------
async function loadProducts(category) {
  try {
    const res = await fetch(`https://api.suitsnglam.com/api/products/category/${category}`);
    const data = await res.json();

    if (Array.isArray(data) && data.length === 0) {
      comingSoonMsg.style.display = "block";
      return;
    }

    if (!Array.isArray(data)) {
      comingSoonMsg.style.display = "block";
      return;
    }

    comingSoonMsg.style.display = "none";
    container.innerHTML = "";

    data.forEach(p => container.appendChild(createCard(p)));

  } catch (err) {
    console.error("Error loading:", err);
    comingSoonMsg.style.display = "block";
  }
}


// ------------------------------
// LOAD SALES PRODUCTS HERE
// ------------------------------
loadProducts("sales");


// ------------------------------
// PRODUCT CARD UI
// ------------------------------
function createCard(p) {
  const col = document.createElement("div");
  col.className = "col-md-4";

  let media = "";
  if (p.images?.length) {
    media += `<img src="${p.images[0]}" class="card-img-top">`;
  }

  if (p.video) {
    media += `
      <video class="w-100 mt-2" controls>
        <source src="${p.video}" type="video/mp4">
      </video>
    `;
  }

  col.innerHTML = `
    <div class="card shadow-sm card-button">
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

        <button class="btn btn-primary w-100" onclick="addToCart('${p._id}')">Add to Cart</button>
      </div>
    </div>
  `;
  return col;
}


// ------------------------------
// METER CHANGE
// ------------------------------
function meterChange(id, amt) {
  const field = document.getElementById(`meter-${id}`);
  let value = parseInt(field.value);

  value += amt;
  if (value < 1) value = 1;
  if (value > 50) value = 50;

  field.value = value;
}


// ------------------------------
// ADD TO CART
// ------------------------------
async function addToCart(id) {
  const token = localStorage.getItem("token");

  if (!token) {
    return alert("Please log in.");
  }

  const metres = document.getElementById(`meter-${id}`).value;

  try {
    const res = await fetch("https://api.suitsnglam.com/api/cart/add", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "auth-token": token
      },
      body: JSON.stringify({ productId: id, metres })
    });

    const data = await res.json();

    if (res.ok) {
      alert("Added to cart!");
      loadCartCount();
    } else {
      alert(data.message || "Error adding to cart.");
    }

  } catch (err) {
    console.error(err);
    alert("Something went wrong.");
  }
}
