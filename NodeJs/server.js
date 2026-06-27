// 1. Load environment variables first so they are available for the database configuration
require("dotenv").config({ path: "./server.env" });

const express = require("express");
const mysql = require("mysql2");

const app = express();
app.use(express.json());

// 2. Create the connection pool
const pool = mysql.createPool({
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  port: process.env.MYSQLPORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// 3. Define the 'db' variable using promise wrappers so async/await works
const db = pool.promise();

// 4. Test route to check if the server is up
app.get("/", (req, res) => {
    res.send("Server is working");
});

// 5. Database query route (now 'db' and 'app' are fully defined and ready to go)
app.get("/users", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM users");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database query failed", details: err.message });
  }
});

//signUp ( Add Users )

app.post("/register", async (req, res) => {
  try {
    // Grab data from the HTML input 'name' attributes
    const { username, email, password } = req.body; 

    // SQL query pointing to your table (tbl_users)
    const sql = "INSERT INTO tbl_users (username, email, password) VALUES (?, ?, ?)";
    
    // Execute using your promise-based 'db' variable
    await db.query(sql, [username, email, password]);
    
    // Send a success response back to the browser
    res.send("Account successfully created!");
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create user", details: err.message });
  }
});

// 6. Start listening
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});