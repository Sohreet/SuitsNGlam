// js/order-management.js — admin guard & minimal load
document.addEventListener("DOMContentLoaded", async () => {
  const raw = localStorage.getItem("sg_user");
  if (!raw) {
    alert("Please login first");
    window.location.href = "index.html";
    return;
  }
  const user = JSON.parse(raw);
  const admins = ["sohabrar10@gmail.com","suitsnglam01@gmail.com"];
  if (!admins.includes(user.email)) {
    alert("Admin access only");
    window.location.href = "index.html";
    return;
  }

  // load orders from API or localStorage (fallback)
  const out = document.getElementById("ordersTable");
  const orders = JSON.parse(localStorage.getItem("orders")||"[]");
  if (!orders.length) out.innerHTML = "<p>No orders yet.</p>";
  else {
    out.innerHTML = orders.map(o => `<tr>
      <td>${o.id}</td><td>${o.user?.name||'N/A'}<br>${o.user?.email||''}</td>
      <td>₹${o.total}</td><td>${o.status||'Pending'}</td>
      <td>${new Date(o.date).toLocaleString()}</td>
    </tr>`).join("");
  }
});
