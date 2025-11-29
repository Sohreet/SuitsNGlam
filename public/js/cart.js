// cart.js
// Loads cart items + delete + total

document.addEventListener("DOMContentLoaded", () => {
  loadCartItems();
});

function loadCartItems() {
  const cart = JSON.parse(localStorage.getItem("cart") || "[]");
  const container = document.getElementById("productsContainer") || document.querySelector(".cart-items");
  const totalEl = document.getElementById("cartTotal");

  if (!container) return;

  container.innerHTML = "";

  if (cart.length === 0) {
    container.innerHTML = `<h4 class="text-center mt-4">Your cart is empty 🛒</h4>`;
    if (totalEl) totalEl.textContent = "0";
    return;
  }

  let total = 0;

  cart.forEach((p, index) => {
    total += p.price;

    container.innerHTML += `
      <div class="col-md-4">
        <div class="card p-2">
          <img src="${p.image}" class="card-img-top">
          <div class="card-body">
            <h5>${p.title}</h5>
            <p>₹${p.price}</p>
            <button class="btn btn-danger btn-sm" onclick="removeItem(${index})">Remove</button>
          </div>
        </div>
      </div>
    `;
  });

  if (totalEl) totalEl.textContent = total;
}

function removeItem(i) {
  const cart = JSON.parse(localStorage.getItem("cart") || "[]");
  cart.splice(i, 1);
  localStorage.setItem("cart", JSON.stringify(cart));
  loadCartItems();
  updateCartBadge();
}
