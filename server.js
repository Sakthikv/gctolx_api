const express = require("express");
const mysql = require("mysql");
const cors = require("cors");
const app = express();
app.use(cors());
app.use(express.json());


const admin = require("firebase-admin");
const serviceAccount = require("./google-services.json"); // Make sure path is correct

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

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
    const { student_name,phone, emailid, department, batch,password,fcmtoken } = req.body;

    if ( !student_name || !emailid || !department || !batch||!password||!fcmtoken) {
        return res.status(400).json({ error: "All fields are required" });
    }

    // ✅ Corrected SQL Query with userid
    const sql = "INSERT INTO students ( student_name, gct_mail_id,phone_number,department, batch,password,fcm_token) VALUES (?, ?, ?, ?, ?,?,?)";

    db.query(sql, [student_name,emailid,phone, department, batch,password,fcmtoken], (err, result) => {
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
        return res.status(400).json({ error: "All fields are required" });
    }

    const sql = "INSERT INTO product_info (student_id, product_name, product_details, product_type, cost, url) VALUES (?, ?, ?, ?, ?, ?)";

    db.query(sql, [student_id, product_name, product_details, product_type, cost, url], (err, result) => {
        if (err) {
            console.error("❌ Error inserting product:", err);
            return res.status(500).json({ error: "Database error", details: err });
        }

        // Use product_type for better similarity filtering than product_name
        const query = `
            SELECT DISTINCT s.fcm_token
            FROM product_cart p
            JOIN students s ON p.student_id = s.student_id
            WHERE p.product_type = ? AND s.fcm_token IS NOT NULL AND s.fcm_token != ''
        `;

        db.query(query, [product_type], (err, users) => {
            if (err) {
                console.error("❌ Error fetching users:", err);
                return res.status(500).json({ error: "Database error" });
            }

            const tokens = users.map(user => user.fcm_token).filter(Boolean);

            if (tokens.length > 0) {
                const message = {
                    notification: {
                        title: "New Product Added!",
                        body: `A new ${product_type} is available: ${product_name} for ₹${cost}`,
                    },
                    tokens: tokens,
                };

                admin.messaging().sendMulticast(message)
                    .then(response => {
                        console.log(`✅ Notifications sent to ${response.successCount} users`);
                        res.json({ message: "✅ Product added and notifications sent!" });
                    })
                    .catch(error => {
                        console.error("❌ Error sending notifications:", error);
                        res.status(500).json({ error: "Failed to send notifications" });
                    });
            } else {
                res.json({ message: "✅ Product added but no matching users with FCM tokens found." });
            }
        });
    });
});




app.get("/getProducts_except_student", (req, res) => {
    const { student_id } = req.query;
    if (!student_id) {
        return res.status(400).json({ error: "Missing student_id" });
    }

    const sql = "SELECT * FROM product_info WHERE student_id != ? ORDER BY RAND()";
    db.query(sql, [student_id], (err, result) => {
        if (err) {
            console.error("❌ Error fetching products:", err);
            return res.status(500).json({ error: "Database error", details: err });
        }
        res.json(result.length > 0 ? result : { message: "No products found" });
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

app.post("/addcart", (req, res) => {
    let { product_id, student_id, buying_student_id, product_name, product_type, cost, url } = req.body;

    // Parse numbers (optional but recommended)
    product_id = parseInt(product_id);
    student_id = parseInt(student_id);
    buying_student_id = parseInt(buying_student_id);
    cost = parseFloat(cost);

    // Validate required fields
    if (!product_id || !student_id || !product_name || !buying_student_id || !product_type || !cost || !url) {
        return res.status(400).json({ error: "All fields including image are required" });
    }

    // Step 1: Check if product_id and buying_student_id combination already exists
    const checkSql = "SELECT * FROM product_cart WHERE product_id = ? AND buying_student_id = ?";
    db.query(checkSql, [product_id, buying_student_id], (checkErr, checkResult) => {
        if (checkErr) {
            console.error("❌ Error checking product:", checkErr);
            return res.status(500).json({ error: "Database error while checking", details: checkErr });
        }

        if (checkResult.length > 0) {
            // Product already in cart for this user
            return res.status(200).json({ message: "❗ This item is already in the cart" });
        } else {
            // Step 2: Insert if not existing
            const insertSql = "INSERT INTO product_cart (product_id, student_id, buying_student_id, product_name, product_type, cost, url) VALUES (?, ?, ?, ?, ?, ?, ?)";
            db.query(insertSql, [product_id, student_id, buying_student_id, product_name, product_type, cost, url], (insertErr, insertResult) => {
                if (insertErr) {
                    console.error("❌ Error inserting product:", insertErr);
                    return res.status(500).json({ error: "Database error while inserting", details: insertErr });
                }
                res.status(200).json({ message: "✅ Product added to cart successfully" });
            });
        }
    });
});
//get cart list
app.get("/getProduct_by_buying_student_id", (req, res) => {
    const { buying_student_id_id } = req.query; // 🔹 Use req.query instead of req.params
    if (!buying_student_id_id) {
        return res.status(400).json({ error: "Missing product_id" });
    }

    const sql = "SELECT * FROM product_cart WHERE buying_student_id = ?";
    db.query(sql, [buying_student_id_id], (err, result) => {
        if (err) {
            console.error("❌ Error fetching product:", err);
            return res.status(500).json({ error: "Database error", details: err });
        }
        res.status(200).json(result || { message: "Product not found" });
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
app.delete("/deleteProduct_by_buying_id", (req, res) => {
    const { buying_id } = req.query; // Using req.query to get buying_id from URL params

    if (!buying_id) {
        return res.status(400).json({ error: "Missing buying_id" });
    }

    const sql = "DELETE FROM product_cart WHERE buying_id = ?";
    db.query(sql, [buying_id], (err, result) => {
        if (err) {
            console.error("❌ Error deleting product:", err);
            return res.status(500).json({ error: "Database error", details: err });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Product not found" });
        }

        res.status(200).json({ message: "Product deleted successfully" });
    });
});


app.get("/getProducts_student_id", (req, res) => {
    const { student_id } = req.query; // 🔹 Use req.query instead of req.params
    if (!student_id) {
        return res.status(400).json({ error: "Missing student_id" });
    }

    const sql = "SELECT * FROM product_info WHERE student_id = ?";
    db.query(sql, [student_id], (err, result) => {
        if (err) {
            console.error("❌ Error fetching products:", err);
            return res.status(500).json({ error: "Database error", details: err });
        }
        res.json(result.length > 0 ? result : { message: "No products found" });
    });
});

app.delete("/deleteProduct_by_product_id", (req, res) => {
    const {product_id } = req.query; // Using req.query to get buying_id from URL params

    if (!product_id) {
        return res.status(400).json({ error: "Missing buying_id" });
    }

    const sql = "DELETE FROM product_info WHERE product_id = ?";
    db.query(sql, [product_id], (err, result) => {
        if (err) {
            console.error("❌ Error deleting product:", err);
            return res.status(500).json({ error: "Database error", details: err });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Product not found" });
        }

        res.status(200).json({ message: "Product deleted successfully" });
    });
});


// Start Server
app.listen(3000, () => {
    console.log("🚀 Server running on port 3000");
});
