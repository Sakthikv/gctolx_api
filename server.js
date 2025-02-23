const express = require("express");
const mysql = require("mysql");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// MySQL Connection
const db = mysql.createConnection({
    host: "mysql-fcabb42-sakthikolanji345-0880.h.aivencloud.com",
    user: "avnadmin",
    password: "Sakthi345@",  // Replace with correct password
    database: "gctolx",
    port: 15260
});

db.connect(err => {
    if (err) {
        console.error("Database connection failed:", err);
        return;
    }
    console.log("✅ Connected to MySQL database");
});

// 🟢 API to Insert Data (POST)
app.post("/addUser", (req, res) => {
    const { student_name,phone, emailid, department, batch,password } = req.body;

    if ( !student_name || !emailid || !department || !batch||!password) {
        return res.status(400).json({ error: "All fields are required" });
    }

    // ✅ Corrected SQL Query with userid
    const sql = "INSERT INTO students ( student_name, gct_mail_id,phone_number,department, batch,password) VALUES (?, ?, ?, ?, ?,?)";
    
    db.query(sql, [student_name,emailid,phone, department, batch,password], (err, result) => {
        if (err) {
            console.error("❌ Error inserting data:", err);
            return res.status(500).json({ error: "Database error", details: err });
        }
        res.json({ message: "✅ User added successfully" });
    });
});

// 🔵 API to Fetch Data (GET)
app.get("/getUsers", (req, res) => {
    const sql = "SELECT * FROM students";
    db.query(sql, (err, result) => {
        if (err) {
            console.error("❌ Error fetching data:", err);
            return res.status(500).json({ error: "Database error", details: err });
        }
        res.json(result);
    });
});

// 🟡 API for User Login (POST)
app.post("/login", (req, res) => {
    const { gct_mail_id, password } = req.body;

    if (!gct_mail_id || !password) {
        return res.status(400).json({ error: "Email and password are required" });
    }

    // ✅ SQL Query to Check if User Exists
    const sql = "SELECT * FROM students WHERE gct_mail_id = ? AND password = ?";

    db.query(sql, [gct_mail_id, password], (err, result) => {
        if (err) {
            console.error("❌ Error checking user:", err);
            return res.status(500).json({ error: "Database error", details: err });
        }

        if (result.length > 0) {
            res.json(result);
        } else {
            res.status(401).json({ error: "Invalid email or password" });
        }
    });
});
app.post("/addProduct", (req, res) => {
    const { student_id, product_name, product_details, product_type, cost, image } = req.body;

    if (!student_id || !product_name || !product_details || !product_type || !cost || !image) {
        return res.status(400).json({ error: "All fields including image are required" });
    }

    const sql = "INSERT INTO product_info (student_id, product_name, product_details, product_type, cost, url) VALUES (?, ?, ?, ?, ?, ?)";

    db.query(sql, [student_id, product_name, product_details, product_type, cost, image], (err, result) => {
        if (err) {
            console.error("❌ Error inserting product:", err);
            return res.status(500).json({ error: "Database error", details: err });
        }
        res.json({ message: "✅ Product added successfully" });
    });
});

// 🔵 API to Fetch Products (GET)
app.get("/getProducts", (req, res) => {
    const sql = "SELECT * FROM product_info";
    db.query(sql, (err, result) => {
        if (err) {
            console.error("❌ Error fetching products:", err);
            return res.status(500).json({ error: "Database error", details: err });
        }
        res.json(result);
    });
});

// 🔵 API to Fetch a Single Product by ID (GET)
app.get("/getProduct/:id", (req, res) => {
    const { id } = req.params;
    const sql = "SELECT * FROM product_info WHERE product_id = ?";
    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error("❌ Error fetching product:", err);
            return res.status(500).json({ error: "Database error", details: err });
        }
        res.json(result);
    });
});


// Start Server
app.listen(3000, () => {
    console.log("🚀 Server running on port 3000");
});
