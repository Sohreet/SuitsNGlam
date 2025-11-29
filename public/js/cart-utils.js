// cart-utils.js
// Basic cart functions (localStorage only)

function getCart() {
  return JSON.parse(localStorage.getItem("cart") || "[]");
}

function saveCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
}

function addToCart(product) {
  const cart = getCart();
  cart.push(product);
  saveCart(cart);

  if (window.updateCartBadge) updateCartBadge();
}

function clearCart() {
  localStorage.removeItem("cart");
  if (window.updateCartBadge) updateCartBadge();
}
