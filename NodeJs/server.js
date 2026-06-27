// 1. Load environment variables first so they are available for the database configuration
require("dotenv").config({ path: "./server.env" });

const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");


const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
    const [rows] = await db.query("SELECT * FROM tbl_users");
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
    const { user, fname, lname, cont, area, pass } = req.body; 

    // SQL query pointing to your table (tbl_users)
    const sql = "INSERT INTO tbl_users (username, firstname, lastname, contact_no, area_code, password_hash, role) VALUES (?, ?, ?, ?, ?, ?, ?)";
    
    const defaultRole = "user";

    // Execute using your promise-based 'db' variable
    await db.query(sql, [ user, fname, lname, cont, area, pass, defaultRole]);
    // Send a success response back to the browser
    res.send("Account successfully created!");
  } catch (err) {
  console.error(err); // This prints it to your Render dashboard logs
  
  // FIX: This will send the full error details back to your browser screen
  res.status(500).json({ 
    error: "Failed to create user", 
    details: err.message || JSON.stringify(err) 
  });
}
};


// 6. Start listening
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});