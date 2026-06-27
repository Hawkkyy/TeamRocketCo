require("dotenv").config({ path: "./server.env" });   

const express = require("express");   
const mysql = require("mysql2");   
const cors = require("cors");   
const bcrypt = require("bcrypt");   

const app = express();   
app.use(cors());    
app.use(express.json());   
app.use(express.urlencoded({ extended: true }));   
app.use(express.static("public"));   

const pool = mysql.createPool({   
  uri: process.env.DATABASE_URL,    
  waitForConnections: true,   
  connectionLimit: 10,   
  queueLimit: 0   
});   

const db = pool.promise(); 

app.get("/", (req, res) => {   
    res.send("Server is working");   
});   

app.get("/users", async (req, res) => {   
  try {   
    const [rows] = await db.query("SELECT * FROM tbl_users");   
    res.json(rows);   
  } catch (err) {   
    console.error(err);   
    res.status(500).json({ error: "Database query failed", details: err.message });   
  }   
});   

app.post("/register", async (req, res) => {   
  try {   
    const { user, fname, lname, cont, area, pass } = req.body;    

    const hashedPassword = await bcrypt.hash(pass, 10);   

    const sql = "INSERT INTO tbl_users (username, firstname, lastname, contact_no, area_code, password_hash, role) VALUES (?, ?, ?, ?, ?, ?, ?)";   
    const defaultRole = "user";   

    await db.query(sql, [user, fname, lname, cont, area, hashedPassword, defaultRole]);   
    res.send("Account successfully created!");   
  } catch (err) {   
    console.error(err);    
    res.status(500).json({    
      error: "Failed to create user",    
      details: err.message || JSON.stringify(err)    
    });   
  }    
});   

app.post("/login", async (req, res) => {   
  try {   
    const { user, pass } = req.body;   
    console.log(`Checking login for user: ${user}`); // <-- Log 1   

    const [rows] = await db.query("SELECT * FROM tbl_users WHERE username = ?", [user]);   

    if (rows.length === 0) {   
      console.log("User not found in database"); // <-- Log 2   
      return res.status(401).send("Invalid username or password");   
    }   

    const foundUser = rows[0];   
    const match = await bcrypt.compare(pass, foundUser.password_hash);   

    if (!match) {   
      console.log("Password did not match"); // <-- Log 3   
      return res.status(401).send("Invalid username or password");   
    }   

    console.log(`Login successful! Role: ${foundUser.role}`); // <-- Log 4   
    
    if (foundUser.role === "admin") {   
      res.redirect("/adminsection/a-dashboard.html");   
    } else {   
      res.redirect("/inventory.html");   
    }   

  } catch (err) {   
    console.error("Login route error:", err);   
    res.status(500).send("Login error occurred");   
  }   
});   

app.get("/inventory", async (req, res) => {   
  try {   
    const query = `
      SELECT 
        c.card_id, 
        p.poke_name, 
        p.base_price, 
        c.stock_qty, 
        c.condition_id, 
        c.variant_id
      FROM tbl_cards c
      JOIN tbl_pokemons p ON c.poke_id = p.poke_id
    `;   
    const [rows] = await db.query(query);   
    res.json(rows);   
  } catch (err) {   
    console.error(err);   
    res.status(500).json({ error: "Failed to retrieve inventory data" });   
  }   
});   


// ========================================================
// NEW ENDPOINT: PLACING AND CONFIRMING USER TRADING ORDERS
// ========================================================
app.post("/order", async (req, res) => {
  const { cardName, orderType, qtyAdmin, qtyCust, orderTotal } = req.body;
  
  // Set fallback placeholder user ID context for processing table records
  const userId = 1; 

  try {
    // 1. Cross-reference card ID mapping parameters using user element selections
    const lookupQuery = `
      SELECT c.card_id 
      FROM tbl_cards c 
      JOIN tbl_pokemons p ON c.poke_id = p.poke_id 
      WHERE LOWER(p.poke_name) = LOWER(?) LIMIT 1
    `;
    const [cardRows] = await db.query(lookupQuery, [cardName]);

    if (cardRows.length === 0) {
      return res.status(400).json({ error: "Selected card target item matching references could not be verified." });
    }
    const cardId = cardRows[0].card_id;

    // 2. Log primary ledger record tracking attributes into tbl_transactions
    const transactionSql = "INSERT INTO tbl_transactions (user_id, order_type, order_total) VALUES (?, ?, ?)";
    const [transactionResult] = await db.query(transactionSql, [userId, orderType, orderTotal]);
    const transactionId = transactionResult.insertId; 

    // 3. Document quantitative parameters inside child mapping dataset tbl_transaction_items
    const itemSql = "INSERT INTO tbl_transaction_items (transaction_id, card_id, qty_admin, qty_cust, total_price) VALUES (?, ?, ?, ?, ?)";
    await db.query(itemSql, [transactionId, cardId, qtyAdmin, qtyCust, orderTotal]);

    // 4. Calculate dynamic updates to global stock volume configurations based on operational mode
    if (orderType === "Buy") {
      await db.query("UPDATE tbl_cards SET stock_qty = stock_qty - ? WHERE card_id = ?", [qtyAdmin, cardId]);
    } else if (orderType === "Sell") {
      await db.query("UPDATE tbl_cards SET stock_qty = stock_qty + ? WHERE card_id = ?", [qtyCust, cardId]);
    } else if (orderType === "Trade") {
      await db.query("UPDATE tbl_cards SET stock_qty = stock_qty - ? + ? WHERE card_id = ?", [qtyAdmin, qtyCust, cardId]);
    }

    res.status(200).json({ message: "Order processed and logs updated cleanly!" });

  } catch (err) {
    console.error("Order workflow execution error:", err);
    res.status(500).json({ error: "Failed to confirm transaction operation log arrays.", details: err.message });
  }
});


// Keep server listener configurations as the absolute file base element
const PORT = process.env.PORT || 3000;   
app.listen(PORT, () => {   
    console.log(`Server running on port ${PORT}`);   
});   