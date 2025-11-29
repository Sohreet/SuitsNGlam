// ordertracking.js
// Displays order history + tracking status

document.addEventListener("DOMContentLoaded", () => {
  const orders = JSON.parse(localStorage.getItem("orders") || "[]");
  const container = document.getElementById("ordersList");

  if (!container) return;

  if (orders.length === 0) {
    container.innerHTML = `<h4 class="text-center mt-5">No orders found.</h4>`;
    return;
  }

  container.innerHTML = "";

  orders.forEach(order => {
    container.innerHTML += `
      <div class="order-card">
        <h5>Order ID: ${order.id}</h5>
        <p><strong>Date:</strong> ${order.date}</p>
        <p><strong>Total:</strong> ₹${order.total}</p>
        <p><strong>Status:</strong> 
          <span class="order-status ${statusClass(order.status)}">
            ${order.status}
          </span>
        </p>

        <h6 class="mt-3">Items:</h6>
        <ul>
          ${order.items.map(item => `<li>${item.title} — ₹${item.price}</li>`).join("")}
        </ul>
      </div>
    `;
  });

});

// Convert status → CSS class
function statusClass(status) {
  switch (status) {
    case "Confirmed": return "status-confirmed";
    case "Shipped": return "status-shipped";
    case "Out for Delivery": return "status-outfor";
    case "Delivered": return "status-delivered";
    default: return "status-confirmed";
  }
}
