// admin.js

const API_BASE = "https://api.suitsnglam.com/api";

// ADMIN EMAILS
const ADMIN_EMAILS = ["sohabrar10@gmail.com", "suitsnglam01@gmail.com"];

// ---------------------------------------------
// CHECK ADMIN ACCESS
// ---------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  const user = JSON.parse(localStorage.getItem("sg_user"));

  if (!user || !ADMIN_EMAILS.includes(user.email)) {
    alert("Access denied. Admins only.");
    window.location.href = "index.html";
    return;
  }

  loadProducts();
});

// LOGOUT
document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.clear();
  window.location.href = "index.html";
});


// ---------------------------------------------
// LOAD ALL PRODUCTS IN TABLE
// ---------------------------------------------
async function loadProducts() {
  try {
    const res = await fetch(`${API_BASE}/products`);
    const products = await res.json();

    const table = document.getElementById("productsTable");
    table.innerHTML = "";

    products.forEach((p) => {
      const row = document.createElement("tr");

      row.innerHTML = `
        <td><img src="https://api.suitsnglam.com/${p.images[0]}" /></td>
        <td>${p.title}</td>
        <td>₹${p.price}</td>
        <td>${p.category || "-"}</td>
        <td>${p.isBestDeal ? "✔" : "—"}</td>
        <td>${p.isSale ? "✔" : "—"}</td>

        <td>
          <button class="btn btn-sm btn-primary me-2" onclick="editProduct('${p._id}')">Edit</button>
          <button class="btn btn-sm btn-danger" onclick="deleteProduct('${p._id}')">Delete</button>
        </td>
      `;

      table.appendChild(row);
    });

  } catch (err) {
    console.error("Product Load Error:", err);
  }
}


// ---------------------------------------------
// EDIT PRODUCT — Load in form
// ---------------------------------------------
async function editProduct(id) {
  const res = await fetch(`${API_BASE}/products/${id}`);
  const p = await res.json();

  document.getElementById("productId").value = p._id;
  document.getElementById("title").value = p.title;
  document.getElementById("price").value = p.price;
  document.getElementById("description").value = p.description;
  document.getElementById("category").value = p.category || "";
  document.getElementById("isBestDeal").checked = p.isBestDeal;
  document.getElementById("isSale").checked = p.isSale;
  document.getElementById("minMetres").value = p.minMetres;
  document.getElementById("maxMetres").value = p.maxMetres;
  document.getElementById("stock").value = p.stock;

  window.scrollTo({ top: 0, behavior: "smooth" });
}


// ---------------------------------------------
// DELETE PRODUCT
// ---------------------------------------------
async function deleteProduct(id) {
  if (!confirm("Delete this product?")) return;

  const user = JSON.parse(localStorage.getItem("sg_user"));

  await fetch(`${API_BASE}/products/${id}`, {
    method: "DELETE",
    headers: { "auth-token": user.token }
  });

  loadProducts();
}


// ---------------------------------------------
// CREATE / UPDATE PRODUCT
// ---------------------------------------------
document.getElementById("productForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const id = document.getElementById("productId").value;
  const user = JSON.parse(localStorage.getItem("sg_user"));

  const formData = new FormData();
  formData.append("title", document.getElementById("title").value);
  formData.append("price", document.getElementById("price").value);
  formData.append("description", document.getElementById("description").value);
  formData.append("category", document.getElementById("category").value);
  formData.append("isBestDeal", document.getElementById("isBestDeal").checked);
  formData.append("isSale", document.getElementById("isSale").checked);
  formData.append("minMetres", document.getElementById("minMetres").value);
  formData.append("maxMetres", document.getElementById("maxMetres").value);
  formData.append("stock", document.getElementById("stock").value);

  // Images
  const images = document.getElementById("images").files;
  for (let i = 0; i < images.length; i++) {
    formData.append("images", images[i]);
  }

  // Video
  const video = document.getElementById("video").files[0];
  if (video) {
    formData.append("video", video);
  }

  let method = "POST";
  let url = `${API_BASE}/products`;

  if (id) {
    method = "PUT";
    url = `${API_BASE}/products/${id}`;
  }

  const res = await fetch(url, {
    method,
    headers: {
      "auth-token": user.token
    },
    body: formData
  });

  await res.json();

  alert("Product saved successfully!");
  document.getElementById("productForm").reset();
  document.getElementById("productId").value = "";
  loadProducts();
});
