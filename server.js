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

app.get("/getUser_by_id", (req, res) => {
    const { student_id } = req.query; // 🔹 Use req.query instead of req.params
    if (!student_id) {
        return res.status(400).json({ error: "Missing product_id" });
    }

    const sql = "SELECT * FROM students WHERE student_id = ?";
    db.query(sql, [student_id], (err, result) => {
        if (err) {
            console.error("❌ Error fetching product:", err);
            return res.status(500).json({ error: "Database error", details: err });
        }
        res.json(result[0] || { message: "Product not found" });
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
// 🟡 API for User Signup Email Validation (POST)
app.post("/signup_validation", (req, res) => {
    const { gct_mail_id } = req.body;

    if (!gct_mail_id) {
        return res.status(400).json({ error: "Email is required" });
    }

    // ✅ SQL Query to Check if Email Exists
    const sql = "SELECT gct_mail_id FROM students WHERE gct_mail_id = ?";

    db.query(sql, [gct_mail_id], (err, result) => {
        if (err) {
            console.error("❌ Database Error:", err);
            return res.status(500).json({ error: "Database error", details: err });
        }

        if (result.length > 0) {
            return res.status(409).json({ error: "This email is already associated with an account" });
        } else {
            res.status(200).json({ message: "Email is available for signup" });
        }
    });
});


app.post("/addProduct", (req, res) => {
    const { student_id, product_name, product_details, product_type, cost, url } = req.body;

    if (!student_id || !product_name || !product_details || !product_type || !cost || !url) {
        return res.status(400).json({ error: "All fields including image are required" });
    }

    const sql = "INSERT INTO product_info (student_id, product_name, product_details, product_type, cost, url) VALUES (?, ?, ?, ?, ?, ?)";

    db.query(sql, [student_id, product_name, product_details, product_type, cost, url], (err, result) => {
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

app.get("/getProduct_by_id", (req, res) => {
    const { product_id } = req.query; // 🔹 Use req.query instead of req.params
    if (!product_id) {
        return res.status(400).json({ error: "Missing product_id" });
    }

    const sql = "SELECT * FROM product_info WHERE product_id = ?";
    db.query(sql, [product_id], (err, result) => {
        if (err) {
            console.error("❌ Error fetching product:", err);
            return res.status(500).json({ error: "Database error", details: err });
        }
        res.json(result[0] || { message: "Product not found" });
    });
});

app.get("/getProducts_except_student", (req, res) => {
    const { student_id } = req.query; // 🔹 Use req.query instead of req.params
    if (!student_id) {
        return res.status(400).json({ error: "Missing student_id" });
    }

    const sql = "SELECT * FROM product_info WHERE student_id != ?";
    db.query(sql, [student_id], (err, result) => {
        if (err) {
            console.error("❌ Error fetching products:", err);
            return res.status(500).json({ error: "Database error", details: err });
        }
        res.json(result.length > 0 ? result : { message: "No products found" });
    });
});


app.get("/getProduct_by_type", (req, res) => {
    const { product_type } = req.query; // Use query parameters
    const sql = "SELECT * FROM product_info WHERE product_type = ?";
    db.query(sql, [product_type], (err, result) => {
        if (err) {
            console.error("❌ Error fetching products:", err);
            return res.status(500).json({ error: "Database error", details: err });
        }
        res.json(result);
    });
});
app.get("/getProduct_by_name", (req, res) => {
    const { product_name } = req.query; // Use query parameters
    const sql = "SELECT * FROM product_info WHERE product_name = ?";
    db.query(sql, [product_name], (err, result) => {
        if (err) {
            console.error("❌ Error fetching products:", err);
            return res.status(500).json({ error: "Database error", details: err });
        }
        res.json(result);
    });
});
app.get("/getProduct_by_name_or_type", (req, res) => {
    const { search_param, student_id } = req.query;

    if (!search_param) {
        return res.status(400).json({ error: "Missing search parameter" });
    }
    if (!student_id) {
        return res.status(400).json({ error: "Missing student ID" });
    }

    // Convert student_id to an integer to ensure proper comparison
    const studentIdInt = parseInt(student_id, 10);

    if (isNaN(studentIdInt)) {
        return res.status(400).json({ error: "Invalid student ID" });
    }

    const sql = `
        SELECT * FROM product_info 
        WHERE (product_name LIKE ? OR product_type LIKE ?) 
        AND student_id != ?
    `;
    const params = [`%${search_param}%`, `%${search_param}%`, studentIdInt];

    db.query(sql, params, (err, result) => {
        if (err) {
            console.error("❌ Error fetching products:", err);
            return res.status(500).json({ error: "Database error", details: err });
        }
        res.json(result);
    });
});


// Start Server
app.listen(3000, () => {
    console.log("🚀 Server running on port 3000");
});
