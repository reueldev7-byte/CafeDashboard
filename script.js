const API = "/api/products";

let products = [];

const form = document.getElementById("productForm");

async function loadProducts() {
    try {
        const response = await fetch(API);

        if (!response.ok) throw new Error("Failed to load products");

        products = await response.json();

        displayProducts();
        updateDashboard();

    } catch (error) {
        alert("Unable to connect to the server.");
    }
}

function displayProducts() {
    const table = document.getElementById("productTable");
    const recent = document.getElementById("recentProducts");
    const search = document.getElementById("searchInput").value.toLowerCase();

    const filtered = products.filter(product =>
        product.name.toLowerCase().includes(search) ||
        product.category.toLowerCase().includes(search)
    );

    table.innerHTML = "";

    recent.innerHTML = "";

    if (filtered.length === 0) {
        table.innerHTML = `
            <tr>
                <td colspan="5">No products found.</td>
            </tr>
        `;
    }

    filtered.forEach(product => {
        table.innerHTML += `
            <tr>
                <td>${escapeHTML(product.name)}</td>
                <td>${escapeHTML(product.category)}</td>
                <td>₱${Number(product.price).toFixed(2)}</td>
                <td>${product.stock}</td>
                <td>
                    <button class="edit-btn"
                        onclick="editProduct(${product.id})">
                        Edit
                    </button>

                    <button class="delete-btn"
                        onclick="deleteProduct(${product.id})">
                        Delete
                    </button>
                </td>
            </tr>
        `;
    });

    products.slice(-5).reverse().forEach(product => {
        recent.innerHTML += `
            <p>
                ${escapeHTML(product.name)}
                - ₱${Number(product.price).toFixed(2)}
            </p>
        `;
    });
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

function updateDashboard() {
    const totalProducts = products.length;

    const totalStock = products.reduce(
        (sum, product) => sum + Number(product.stock), 0
    );

    const totalValue = products.reduce(
        (sum, product) =>
            sum + Number(product.price) * Number(product.stock), 0
    );

    document.getElementById("totalProducts").textContent = totalProducts;

    document.getElementById("totalStock").textContent = totalStock;

    document.getElementById("totalValue").textContent =
        "₱" + totalValue.toFixed(2);
}

form.addEventListener("submit", async function(event) {
    event.preventDefault();

    const id = document.getElementById("productId").value;

    const product = {
        name: document.getElementById("productName").value.trim(),
        category: document.getElementById("productCategory").value.trim(),
        price: Number(document.getElementById("productPrice").value),
        stock: Number(document.getElementById("productStock").value)
    };

    if (!product.name || !product.category ||
        !Number.isFinite(product.price) ||
        !Number.isInteger(product.stock) ||
        product.price < 0 || product.stock < 0) {
        alert("Please enter valid product information.");
        return;
    }

    try {
        const response = await fetch(
            id ? `${API}/${id}` : API,
            {
                method: id ? "PUT" : "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(product)
            }
        );

        if (!response.ok) throw new Error("Save failed");

        form.reset();
        document.getElementById("productId").value = "";
        document.getElementById("saveButton").textContent = "Add Product";

        loadProducts();

    } catch (error) {
        alert("Unable to save product.");
    }
});

function editProduct(id) {
    const product = products.find(item => item.id === id);

    if (!product) return;

    document.getElementById("productId").value = product.id;
    document.getElementById("productName").value = product.name;
    document.getElementById("productCategory").value = product.category;
    document.getElementById("productPrice").value = product.price;
    document.getElementById("productStock").value = product.stock;

    document.getElementById("saveButton").textContent = "Update Product";

    showPage("inventory");

    window.scrollTo(0, 0);
}

async function deleteProduct(id) {
    if (!confirm("Are you sure you want to delete this product?")) {
        return;
    }

    try {
        const response = await fetch(`${API}/${id}`, {
            method: "DELETE"
        });

        if (!response.ok) throw new Error("Delete failed");

        loadProducts();

    } catch (error) {
        alert("Unable to delete product.");
    }
}

function showPage(page) {
    document.getElementById("dashboard").hidden = page !== "dashboard";
    document.getElementById("inventory").hidden = page !== "inventory";
}

document.getElementById("searchInput").addEventListener(
    "input",
    displayProducts
);

loadProducts();