/* -------------------------------------------------------
   ADMIN AUTH CHECK (FINAL FIXED VERSION)
------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  // Google login sets: localStorage.setItem("isAdmin", "true")
  const isAdmin = localStorage.getItem("isAdmin");

  if (isAdmin !== "true") {
    alert("Admin access denied!");
    window.location.href = "index.html";
    return;
  }

  loadProducts();

  document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem("isAdmin");
    localStorage.removeItem("sg_user"); // optional
    window.location.href = "index.html";
  });
});

// Backend on same server
const BASE_URL = "";


/* -------------------------------------------------------
   FORM SUBMIT (ADD or UPDATE PRODUCT)
------------------------------------------------------- */
const form = document.getElementById("productForm");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const productId = document.getElementById("productId").value;

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
  if (video) formData.append("video", video);

  const url = productId
    ? `/api/products/${productId}`
    : `/api/products`;

  const method = productId ? "PUT" : "POST";

  const response = await fetch(url, {
    method,
    body: formData,
  });

  const result = await response.json();
  alert(result.message || "Saved!");

  form.reset();
  document.getElementById("productId").value = "";

  loadProducts();
});


/* -------------------------------------------------------
   LOAD ALL PRODUCTS
------------------------------------------------------- */
async function loadProducts() {
  const res = await fetch(`/api/products`);
  const data = await res.json();

  const tbody = document.getElementById("productsTable");
  tbody.innerHTML = "";

  data.forEach((p) => {
    const imageUrl = p.images?.[0]
      ? `${p.images[0]}`
      : "img/noimg.png";

    tbody.innerHTML += `
      <tr>
        <td><img src="${imageUrl}" style="width:60px;height:60px;object-fit:cover;border-radius:6px;"></td>
        <td>${p.title}</td>
        <td>₹${p.price}</td>
        <td>${p.category}</td>
        <td>${p.isBestDeal ? "✔" : "✖"}</td>
        <td>${p.isSale ? "✔" : "✖"}</td>
        <td>
          <button onclick="editProduct('${p._id}')" class="btn btn-sm btn-primary">
            <i class="bi bi-pencil-square"></i>
          </button>

          <button onclick="deleteProduct('${p._id}')" class="btn btn-sm btn-danger">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      </tr>
    `;
  });
}


/* -------------------------------------------------------
   EDIT PRODUCT
------------------------------------------------------- */
async function editProduct(id) {
  const res = await fetch(`/api/products/${id}`);
  const p = await res.json();

  document.getElementById("productId").value = p._id;
  document.getElementById("title").value = p.title;
  document.getElementById("price").value = p.price;
  document.getElementById("description").value = p.description;
  document.getElementById("category").value = p.category;
  document.getElementById("isBestDeal").checked = p.isBestDeal;
  document.getElementById("isSale").checked = p.isSale;
  document.getElementById("minMetres").value = p.minMetres;
  document.getElementById("maxMetres").value = p.maxMetres;
  document.getElementById("stock").value = p.stock;

  window.scrollTo({ top: 0, behavior: "smooth" });
}


/* -------------------------------------------------------
   DELETE PRODUCT
------------------------------------------------------- */
async function deleteProduct(id) {
  if (!confirm("Delete this product?")) return;

  const res = await fetch(`/api/products/${id}`, {
    method: "DELETE",
  });

  const result = await res.json();
  alert(result.message || "Deleted!");

  loadProducts();
}
