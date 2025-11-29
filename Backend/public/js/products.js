// products.js
// Fetch products from backend & filter by category

const API = "https://api.suitsnglam.com/api/products";

async function loadProducts(category) {
  const container = document.getElementById("productsContainer");
  const comingMsg = document.getElementById("comingSoonMsg");

  if (!container) return;

  container.innerHTML = `<p class="text-center mt-4">Loading...</p>`;

  try {
    const res = await fetch(API);
    const all = await res.json();

    let list = all;

    if (category !== "all") {
      list = all.filter(p => p.category === category);
    }

    if (list.length === 0) {
      if (comingMsg) comingMsg.style.display = "block";
      container.innerHTML = "";
      return;
    }

    container.innerHTML = "";

    list.forEach(p => {
      container.innerHTML += `
        <div class="col-md-4">
          <div class="card card-button p-2">
            <img src="${p.image}" class="card-img-top">
            <div class="card-body">
              <h5>${p.title}</h5>
              <p>₹${p.price}</p>
              <button class="btn btn-dark btn-sm" onclick='addToCart(${JSON.stringify(p)})'>
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      `;
    });

  } catch (e) {
    console.error("Error loading products", e);
    container.innerHTML = `<p class="text-center text-danger">Failed to load products</p>`;
  }
}
