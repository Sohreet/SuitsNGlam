// products-common.js
// Universal product loader + cart adder (works with google-auth + navbar.js)

// --------- Helpers: user + token ----------
function getUser() {
  const obj = localStorage.getItem("sg_user");
  if (obj) try { return JSON.parse(obj); } catch(_) {}
  const email = localStorage.getItem("userEmail");
  if (email) {
    return {
      email,
      name: localStorage.getItem("userName") || "",
      picture: localStorage.getItem("userPic") || "",
      token: localStorage.getItem("token") || ""
    };
  }
  return null;
}

// --------- Update navbar cart badge (token -> fallback to email) ----------
async function updateCartBadge() {
  const badge = document.getElementById("cartCount");
  if (!badge) return;
  badge.textContent = "";

  const user = getUser();
  if (!user) return;

  // Prefer token-based private API
  if (user.token) {
    try {
      const res = await fetch("/api/cart", {
        headers: { "auth-token": user.token }
      });
      if (res.ok) {
        const data = await res.json();
        badge.textContent = data.items?.length || "";
        return;
      }
    } catch (e) {
      console.debug("Cart badge (token) failed:", e);
    }
  }

  // Fallback: public endpoint by email (if backend supports it)
  if (user.email) {
    try {
      const res = await fetch(`/api/cart/${encodeURIComponent(user.email)}`);
      if (res.ok) {
        const data = await res.json();
        badge.textContent = data.items?.length || "";
      }
    } catch (e) {
      console.debug("Cart badge (email) failed:", e);
    }
  }
}

// expose so navbar.js can call it if needed
window.updateCartBadge = updateCartBadge;

// --------- Universal createCard (image/video, name, desc, price, meter, add btn) ----------
function createCard(product) {
  const col = document.createElement("div");
  col.className = "col-md-4";

  let media = "";
  if (product.images?.length) {
    media += `<img src="${product.images[0]}" class="card-img-top" alt="${escapeHtml(product.name)}">`;
  }
  if (product.video) {
    media += `<video class="w-100 mt-2" controls><source src="${product.video}"></video>`;
  }

  const id = product._id || product.id || Math.random().toString(36).slice(2);

  col.innerHTML = `
    <div class="card shadow-sm card-button">
      ${media}
      <div class="card-body">
        <h5>${escapeHtml(product.name)}</h5>
        <p class="text-muted">${escapeHtml(product.description || "")}</p>
        <p class="fw-bold">₹${Number(product.pricePerMeter||product.price||0)} / metre</p>

        <div class="d-flex align-items-center mb-2">
          <button class="btn btn-outline-secondary btn-sm" onclick="meterChange('${id}', -1)">-</button>
          <input id="meter-${id}" class="form-control mx-2" style="width:60px;" value="2" readonly>
          <button class="btn btn-outline-secondary btn-sm" onclick="meterChange('${id}', 1)">+</button>
        </div>

        <button class="btn btn-primary w-100" onclick="addToCart('${id}', '${product._id||product.id}')">Add to Cart</button>
      </div>
    </div>
  `;
  return col;
}

// small safe-escape helper
function escapeHtml(s) {
  if (!s) return "";
  return String(s)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'", "&#039;");
}

// --------- meter change (works for any product id) ----------
function meterChange(id, delta) {
  const field = document.getElementById(`meter-${id}`);
  if (!field) return;
  let v = parseInt(field.value || "1", 10);
  v = Math.max(1, Math.min(50, v + Number(delta)));
  field.value = v;
}
window.meterChange = meterChange;

// --------- load products by category ----------
async function loadProducts(category, containerId = "productsContainer", comingSoonId = "comingSoonMsg") {
  const container = document.getElementById(containerId);
  const comingSoonMsg = document.getElementById(comingSoonId);

  if (!container) {
    console.error("Products container not found:", containerId);
    return;
  }

  try {
    const res = await fetch(`/api/products/category/${encodeURIComponent(category)}`);
    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      if (comingSoonMsg) comingSoonMsg.style.display = "block";
      container.innerHTML = "";
      return;
    }

    if (comingSoonMsg) comingSoonMsg.style.display = "none";
    container.innerHTML = "";

    data.forEach(p => container.appendChild(createCard(p)));

    // update cart badge if needed
    updateCartBadge();
  } catch (err) {
    console.error("Error loading products:", err);
    if (comingSoonMsg) comingSoonMsg.style.display = "block";
  }
}
window.loadProducts = loadProducts;

// --------- Universal addToCart(productId) ----------
// The function accepts two ids because your product object id may be passed in wrapped ways.
// If backend accepts token, it will use token auth header; otherwise send email in body.
async function addToCart(fakeId, realProductId) {
  // prefer the real id (from DB) if passed
  const productId = realProductId || fakeId;
  // metres input id uses the fakeId (the unique card id), so read that
  const metresEl = document.getElementById(`meter-${fakeId}`);
  const metres = metresEl ? metresEl.value : 1;

  const user = getUser();
  if (!user) {
    alert("Please login first.");
    return;
  }

  const body = { productId, metres: Number(metres) };

  // If token available, use token header & /api/cart/add
  try {
    if (user.token) {
      const res = await fetch("/api/cart/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "auth-token": user.token
        },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (res.ok) {
        alert("Added to cart!");
        updateCartBadge();
      } else {
        alert(data.message || "Error adding to cart");
      }
      return;
    }

    // Fallback: send email in body (if backend supports it)
    if (user.email) {
      body.email = user.email;
      const res = await fetch("/api/cart/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (res.ok) {
        alert("Added to cart!");
        updateCartBadge();
      } else {
        alert(data.message || "Error adding to cart");
      }
      return;
    }

    alert("Login required");
  } catch (err) {
    console.error("Add to cart error:", err);
    alert("Failed to add to cart.");
  }
}
window.addToCart = addToCart;

// --------- Auto-run on DOM load: update badge (safe) ----------
document.addEventListener("DOMContentLoaded", () => {
  updateCartBadge();
});
