// js/cart.js — updated
// Provides: loadCartPage(), loadCartItems(), removeItem(), updateCartBadge()

/* helpers */
function getUserLocal() {
  const raw = localStorage.getItem("sg_user");
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

/* Update cart badge (used site-wide) */
async function updateCartBadge() {
  const badge = document.getElementById("cartCount");
  if (!badge) return;
  badge.textContent = "";
  const user = getUserLocal();
  // local fallback: read localStorage cart
  const cart = JSON.parse(localStorage.getItem("cart") || "[]");
  if (cart.length) {
    badge.textContent = cart.length;
    return;
  }
  // optionally fetch from private API if token available
  if (user?.token) {
    try {
      const res = await fetch("/api/cart", { headers: { "auth-token": user.token }});
      if (res.ok) {
        const data = await res.json();
        badge.textContent = data.items?.length || "";
      }
    } catch(e){ console.debug("badge fetch failed", e); }
  }
}

/* Load cart page (renders list + summary) */
function loadCartPage() {
  const itemsContainer = document.getElementById("cartItems");
  const emptyEl = document.getElementById("cartEmpty");
  const summaryEl = document.getElementById("cartSummary");
  const totalEl = document.getElementById("cartTotal");

  itemsContainer.innerHTML = "";
  emptyEl.style.display = "none";
  summaryEl.style.display = "none";

  // require login check already done on page; still guard
  const user = getUserLocal();
  if (!user) {
    emptyEl.style.display = "none";
    summaryEl.style.display = "none";
    return;
  }

  const cart = JSON.parse(localStorage.getItem("cart") || "[]");

  if (!cart.length) {
    emptyEl.style.display = "block";
    summaryEl.style.display = "none";
    updateCartBadge();
    return;
  }

  let total = 0;
  cart.forEach((p, idx) => {
    total += Number(p.price || 0) * (Number(p.metres || 1));
    const col = document.createElement("div");
    col.className = "col-md-4";
    col.innerHTML = `
      <div class="card p-2">
        <div class="cart-item">
          <img src="${p.image||''}" alt="${p.title||''}" style="width:100%;height:160px;object-fit:cover;border-radius:6px;">
        </div>
        <div class="card-body">
          <h5>${p.title||'Product'}</h5>
          <p>₹${p.price || 0} × ${p.metres || 1}m</p>
          <button class="btn btn-danger btn-sm" onclick="removeItem(${idx})">Remove</button>
        </div>
      </div>
    `;
    itemsContainer.appendChild(col);
  });

  totalEl.textContent = total;
  summaryEl.style.display = "block";
  updateCartBadge();
}

/* remove item */
function removeItem(index) {
  const cart = JSON.parse(localStorage.getItem("cart") || "[]");
  cart.splice(index,1);
  localStorage.setItem("cart", JSON.stringify(cart));
  // refresh view if on cart page
  if (document.getElementById("cartItems")) loadCartPage();
  updateCartBadge();
}

/* Called on simple cart page loads to show items (non-cart pages) */
function loadCartItemsOnSummary(containerId = "cartSummaryList") {
  const container = document.getElementById(containerId);
  if (!container) return;
  const cart = JSON.parse(localStorage.getItem("cart") || "[]");
  container.innerHTML = cart.map(i => `<li>${i.title} — ₹${i.price}</li>`).join("");
}

window.loadCartPage = loadCartPage;
window.removeItem = removeItem;
window.updateCartBadge = updateCartBadge;
window.loadCartItemsOnSummary = loadCartItemsOnSummary;

/* auto-run to update badge on every page */
document.addEventListener("DOMContentLoaded", () => {
  updateCartBadge();
});
