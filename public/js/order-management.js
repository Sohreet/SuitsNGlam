// order-management.js

const API_BASE = "https://api.suitsnglam.com/api";
const ADMIN_EMAILS = ["sohabrar10@gmail.com"];

// Check admin access
document.addEventListener("DOMContentLoaded", () => {
  const email = localStorage.getItem("userEmail");
  if (!email || !ADMIN_EMAILS.includes(email)) {
    alert("Admin access only!");
    window.location.href = "index.html";
    return;
  }

  loadOrders();
});

// Logout
document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.clear();
  window.location.href = "index.html";
});

// Load all orders
async function loadOrders() {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API_BASE}/orders/all`, {
    headers: { "auth-token": token }
  });

  const orders = await res.json();

  const table = document.getElementById("ordersTable");
  table.innerHTML = "";

  orders.forEach(o => {
    const tr = document.createElement("tr");

    const itemsHTML = o.items
      .map(i => 
        `<div class="order-item-box">
          <strong>${i.title}</strong> — ${i.metres}m  
        </div>`
      )
      .join("");

    tr.innerHTML = `
      <td>${o._id}</td>
      <td>${o.user.name}<br>${o.user.email}</td>
      <td>${itemsHTML}</td>
      <td>₹${o.totalAmount}</td>
      <td>${o.status}</td>
      <td>${new Date(o.createdAt).toLocaleString()}</td>
      <td>
        <select class="form-select" onchange="updateStatus('${o._id}', this.value)">
          <option value="Pending" ${o.status === "Pending" ? "selected" : ""}>Pending</option>
          <option value="Shipped" ${o.status === "Shipped" ? "selected" : ""}>Shipped</option>
          <option value="Delivered" ${o.status === "Delivered" ? "selected" : ""}>Delivered</option>
        </select>
      </td>
    `;

    table.appendChild(tr);
  });
}

// Update order status
async function updateStatus(id, status) {
  const token = localStorage.getItem("token");

  await fetch(`${API_BASE}/orders/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "auth-token": token
    },
    body: JSON.stringify({ status })
  });

  alert("Status updated!");
  loadOrders();
}
