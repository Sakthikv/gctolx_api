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
    const { student_name,phone, emailid, department, batch } = req.body;

    if ( !student_name || !emailid || !department || !batch) {
        return res.status(400).json({ error: "All fields are required" });
    }

    // ✅ Corrected SQL Query with userid
    const sql = "INSERT INTO students ( student_name, gct_mail_id,phone_number,department, batch) VALUES (?, ?, ?, ?, ?)";
    
    db.query(sql, [student_name,emailid,phone, department, batch], (err, result) => {
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
    const sql = "SELECT * FROM students WHERE gct_mail_id = ? AND phone_number = ?";

    db.query(sql, [gct_mail_id, password], (err, result) => {
        if (err) {
            console.error("❌ Error checking user:", err);
            return res.status(500).json({ error: "Database error", details: err });
        }

        if (result.length > 0) {
            res.json({ message: "✅ Login successful", user: result[0] });
        } else {
            res.status(401).json({ error: "Invalid email or password" });
        }
    });
});


// Start Server
app.listen(3000, () => {
    console.log("🚀 Server running on port 3000");
});
