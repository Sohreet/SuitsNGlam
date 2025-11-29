// orderhistory.js
// Shows previously placed orders from localStorage

document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("ordersList");
  const orders = JSON.parse(localStorage.getItem("orders") || "[]");

  if (!container) return;

  if (orders.length === 0) {
    container.innerHTML = `<h4 class="text-center mt-4">No orders yet.</h4>`;
    return;
  }

  container.innerHTML = "";

  orders.forEach(order => {
    container.innerHTML += `
      <div class="card mb-3 p-3">
        <h5>Order ID: ${order.id}</h5>
        <p>Date: ${order.date}</p>
        <p>Amount Paid: ₹${order.total}</p>
      </div>
    `;
  });
});
