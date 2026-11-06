const express = require("express");
const initSqlJs = require("sql.js");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(__dirname));

async function startServer() {

    const SQL = await initSqlJs();

    const dbPath = path.join(__dirname, "cafe.db");

    let db;

    if (fs.existsSync(dbPath)) {
        const file = fs.readFileSync(dbPath);
        db = new SQL.Database(file);
    } else {
        db = new SQL.Database();
    }

    db.run(`
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            price REAL NOT NULL,
            stock INTEGER NOT NULL
        )
    `);

    function saveDatabase() {
        const data = db.export();
        fs.writeFileSync(dbPath, Buffer.from(data));
    }

    function getProducts() {
        const result = db.exec("SELECT * FROM products");

        if (!result.length) return [];

        return result[0].values.map(row => ({
            id: row[0],
            name: row[1],
            category: row[2],
            price: row[3],
            stock: row[4]
        }));
    }

    app.get("/api/products", (req, res) => {
        res.json(getProducts());
    });

    app.post("/api/products", (req, res) => {
        const { name, category, price, stock } = req.body;

        if (
            typeof name !== "string" || !name.trim() ||
            typeof category !== "string" || !category.trim() ||
            typeof price !== "number" || !Number.isFinite(price) ||
            typeof stock !== "number" || !Number.isInteger(stock) ||
            price < 0 || stock < 0
        ) {
            return res.status(400).json({
                error: "Invalid product information"
            });
        }

        db.run(
            `INSERT INTO products (name, category, price, stock)
             VALUES (?, ?, ?, ?)`,
            [name.trim(), category.trim(), price, stock]
        );

        saveDatabase();

        res.status(201).json({
            message: "Product added successfully"
        });
    });

    app.put("/api/products/:id", (req, res) => {
        const { name, category, price, stock } = req.body;

        if (
            typeof name !== "string" || !name.trim() ||
            typeof category !== "string" || !category.trim() ||
            typeof price !== "number" || !Number.isFinite(price) ||
            typeof stock !== "number" || !Number.isInteger(stock) ||
            price < 0 || stock < 0
        ) {
            return res.status(400).json({
                error: "Invalid product information"
            });
        }

        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id < 1) {
            return res.status(400).json({
                error: "Invalid product ID"
            });
        }

        db.run(
            `UPDATE products
             SET name = ?, category = ?, price = ?, stock = ?
             WHERE id = ?`,
            [name.trim(), category.trim(), price, stock, id]
        );

        if (db.getRowsModified() === 0) {
            return res.status(404).json({
                error: "Product not found"
            });
        }

        saveDatabase();

        res.json({
            message: "Product updated successfully"
        });
    });

    app.delete("/api/products/:id", (req, res) => {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id < 1) {
            return res.status(400).json({
                error: "Invalid product ID"
            });
        }

        db.run(
            "DELETE FROM products WHERE id = ?",
            [id]
        );

        if (db.getRowsModified() === 0) {
            return res.status(404).json({
                error: "Product not found"
            });
        }

        saveDatabase();

        res.json({
            message: "Product deleted successfully"
        });
    });

    app.listen(PORT, "0.0.0.0", () => {
        console.log(
            `Cafe Noir dashboard is running at http://localhost:${PORT}`
        );
    });
}

startServer().catch(error => {
    console.error("Server startup failed:", error);
});