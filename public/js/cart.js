// -------------------------------
// CART PAGE CONTROLLER (FINAL)
// -------------------------------

document.addEventListener("DOMContentLoaded", () => {
  loadCartPage();
});

// Get logged in user from sg_user
function getUser() {
  const raw = localStorage.getItem("sg_user");
  return raw ? JSON.parse(raw) : null;
}

async function loadCartPage() {
  const user = getUser();
  const container = document.getElementById("cartItems");
  const totalEl = document.getElementById("cartTotal");

  if (!container) return;

  // ------------------------------
  // 1️⃣ USER NOT LOGGED IN
  // ------------------------------
  if (!user) {
    container.innerHTML = `
      <h4 class="text-center mt-5">Please login to view your cart.</h4>
    `;
    if (totalEl) totalEl.textContent = "0";
    return;
  }

  // ------------------------------
  // 2️⃣ USER LOGGED IN → FETCH CART
  // ------------------------------
  try {
    const res = await fetch("https://api.suitsnglam.com/api/cart", {
      headers: { "auth-token": user.token }
    });

    const data = await res.json();

    // No items
    if (!data.items || data.items.length === 0) {
      container.innerHTML = `
        <h4 class="text-center mt-5">Your cart is empty 🛒</h4>
      `;
      if (totalEl) totalEl.textContent = "0";
      return;
    }

    // Items exist → show items
    container.innerHTML = "";
    let total = 0;

    data.items.forEach((item, index) => {
      total += item.price * item.metres;

      container.innerHTML += `
        <div class="card mb-3 p-3 shadow-sm">
          <div class="row">
            <div class="col-4">
              <img src="${item.image}" class="img-fluid rounded">
            </div>
            <div class="col-8">
              <h5>${item.title}</h5>
              <p>₹${item.price} × ${item.metres}m</p>
              <button class="btn btn-danger btn-sm" onclick="removeCartItem('${item._id}')">Remove</button>
            </div>
          </div>
        </div>
      `;
    });

    if (totalEl) totalEl.textContent = total;

  } catch (err) {
    console.error("Cart load error:", err);
    container.innerHTML = `
      <h4 class="text-center mt-5 text-danger">Error loading cart.</h4>
    `;
  }
}

// -------------------------------
// REMOVE ITEM
// -------------------------------
async function removeCartItem(id) {
  const user = getUser();
  if (!user) return;

  try {
    await fetch(`https://api.suitsnglam.com/api/cart/${id}`, {
      method: "DELETE",
      headers: { "auth-token": user.token }
    });

    loadCartPage();
    if (window.updateCartBadge) updateCartBadge();

  } catch (err) {
    console.error("Remove error", err);
  }
}
