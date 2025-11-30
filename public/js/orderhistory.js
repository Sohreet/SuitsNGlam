// js/orderhistory.js
document.addEventListener("DOMContentLoaded", () => {
  const raw = localStorage.getItem("sg_user");
  if (!raw) return;
  const orders = JSON.parse(localStorage.getItem("orders") || "[]");
  const container = document.getElementById("ordersList");
  if (!container) return;
  if (!orders.length) {
    container.innerHTML = '<h4 class="text-center mt-4">No orders yet.</h4>';
    return;
  }
  container.innerHTML = orders.map(o => `
    <div class="card mb-3 p-3">
      <h5>Order ID: ${o.id}</h5>
      <p>Date: ${o.date}</p>
      <p>Amount Paid: ₹${o.total}</p>
      <p>Status: ${o.status}</p>
    </div>
  `).join("");
});
