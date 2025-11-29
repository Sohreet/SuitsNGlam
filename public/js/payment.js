// payment.js
// Handles Razorpay Checkout + Order Saving + Redirect

document.addEventListener("DOMContentLoaded", loadCheckoutData);

function loadCheckoutData() {
  const cart = JSON.parse(localStorage.getItem("cart") || "[]");
  const list = document.getElementById("cartList");
  const totalEl = document.getElementById("grandTotal");

  let total = 0;

  cart.forEach(item => {
    list.innerHTML += `<li>${item.title} — ₹${item.price}</li>`;
    total += item.price;
  });

  totalEl.textContent = total;
}

function startPayment() {
  // Validate fields
  const name = document.getElementById("fullName").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const address = document.getElementById("address").value.trim();
  const city = document.getElementById("city").value.trim();
  const state = document.getElementById("state").value.trim();
  const pincode = document.getElementById("pincode").value.trim();

  if (!name || !phone || !address || !city || !state || !pincode) {
    alert("Please fill all address fields.");
    return;
  }

  const amount = Number(document.getElementById("grandTotal").textContent);

  var options = {
    key: "rzp_test_123456789", // <-- Replace with your Razorpay Key
    amount: amount * 100,
    currency: "INR",
    name: "Suits N Glam",
    description: "Order Payment",
    theme: { color: "#ff3f33" },

    handler: function (response) {
      // Successful Payment → Save order
      saveOrder(amount, {
        name, phone, address, city, state, pincode
      });

      window.location.href = `success.html?amount=${amount}`;
    },

    prefill: {
      name: name,
      email: localStorage.getItem("userEmail") || "",
      contact: phone
    }
  };

  var rzp = new Razorpay(options);
  rzp.open();
}

function saveOrder(amount, shipping) {
  const cart = JSON.parse(localStorage.getItem("cart") || "[]");
  const orders = JSON.parse(localStorage.getItem("orders") || "[]");

  const newOrder = {
    id: "ORD" + Math.floor(Math.random() * 900000 + 100000),
    date: new Date().toLocaleString(),
    total: amount,
    status: "Confirmed",
    items: cart,
    shipping
  };

  orders.push(newOrder);
  localStorage.setItem("orders", JSON.stringify(orders));
}
