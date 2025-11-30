// --------------------------
// ADMIN PRODUCT SYSTEM
// --------------------------

document.addEventListener("DOMContentLoaded", () => {
    loadProducts();
    setupImageLimit();
});

// LIMIT MAX 5 IMAGES
function setupImageLimit() {
    const imageInput = document.getElementById("images");
    imageInput.addEventListener("change", () => {
        if (imageInput.files.length > 5) {
            alert("You can upload a maximum of 5 images.");
            imageInput.value = ""; // reset
        }
    });
}

// LOAD PRODUCTS FROM localStorage
function loadProducts() {
    const products = JSON.parse(localStorage.getItem("products")) || [];
    const table = document.getElementById("productsTable");
    table.innerHTML = "";

    products.forEach((p, i) => {
        table.innerHTML += `
        <tr>
            <td><img src="${p.images[0] || ""}" /></td>
            <td>${p.title}</td>
            <td>₹${p.price}</td>
            <td>${p.category}</td>
            <td>${p.isBestDeal ? "✔️" : "❌"}</td>
            <td>${p.isSale ? "✔️" : "❌"}</td>
            <td>
              <button class="btn btn-sm btn-danger" onclick="deleteProduct(${i})">
                Delete
              </button>
            </td>
        </tr>`;
    });
}

// DELETE PRODUCT
function deleteProduct(index) {
    let products = JSON.parse(localStorage.getItem("products")) || [];
    products.splice(index, 1);

    localStorage.setItem("products", JSON.stringify(products));
    loadProducts();
}

// SAVE PRODUCT
document.getElementById("productForm").addEventListener("submit", function (e) {
    e.preventDefault();

    let products = JSON.parse(localStorage.getItem("products")) || [];

    // COLLECT DATA
    const title = document.getElementById("title").value;
    const price = document.getElementById("price").value;
    const desc = document.getElementById("description").value;
    const category = document.getElementById("category").value;
    const isBestDeal = document.getElementById("isBestDeal").checked;
    const isSale = document.getElementById("isSale").checked;
    const minMetres = document.getElementById("minMetres").value;
    const maxMetres = document.getElementById("maxMetres").value;
    const stock = document.getElementById("stock").value;

    const imageFiles = document.getElementById("images").files;
    const videoFile = document.getElementById("video").files[0];

    // IMAGE LIMIT CHECK
    if (imageFiles.length > 5) {
        alert("Maximum 5 images allowed.");
        return;
    }

    // CONVERT IMAGES TO BASE64
    const imagePromises = [];
    for (let img of imageFiles) {
        imagePromises.push(convertToBase64(img));
    }

    Promise.all(imagePromises).then((imageBase64List) => {
        // CONVERT VIDEO
        if (videoFile) {
            convertToBase64(videoFile).then((videoBase64) => {
                saveFinal(
                    imageBase64List,
                    videoBase64
                );
            });
        } else {
            saveFinal(imageBase64List, null);
        }
    });

    function saveFinal(imageList, video) {
        const product = {
            id: Date.now(),
            title,
            price,
            description: desc,
            category,
            isBestDeal,
            isSale,
            minMetres,
            maxMetres,
            stock,
            images: imageList,
            video
        };

        products.push(product);

        // SAVE TO storage
        localStorage.setItem("products", JSON.stringify(products));

        alert("Product saved successfully!");
        document.getElementById("productForm").reset();

        loadProducts();
        updateCategoryPages(product);
    }
});

// Convert File → Base64
function convertToBase64(file) {
    return new Promise((resolve) => {
        let reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(file);
    });
}

// ------------------------------
// ADD PRODUCT TO CATEGORY PAGE
// ------------------------------
function updateCategoryPages(product) {
    const pageName = `${product.category}.html`;

    fetch(pageName)
        .then(res => res.text())
        .then(html => {
            let parser = new DOMParser();
            let doc = parser.parseFromString(html, "text/html");

            let container = doc.querySelector("#productList");

            if (!container) return;

            container.innerHTML += `
              <div class="col-md-4 mb-4">
                <div class="card">
                  <img src="${product.images[0]}" class="card-img-top"/>
                  <div class="card-body">
                    <h5>${product.title}</h5>
                    <p>₹${product.price}</p>
                  </div>
                </div>
              </div>
            `;

            let updatedHTML = "<!DOCTYPE html>\n" + doc.documentElement.outerHTML;

            downloadFile(pageName, updatedHTML);
        });
}

function downloadFile(filename, content) {
    const blob = new Blob([content], { type: "text/html" });
    const a = document.createElement("a");

    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
}
