const path = require("path");

// 1. ENVIRONMENT MANIPULATION FIRST
// This loads the variables immediately before any database clusters init
require("dotenv").config({ path: path.join(__dirname, "server.env") });

const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bcrypt = require("bcrypt");
const puppeteer = require("puppeteer");

const app = express(); 

// 2. MIDDLEWARE HOOKS & STATIC ROUTING
app.use(cors({
  origin: ['https://hawkkyy.github.io', 'http://localhost:3000'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Force static files to track from the execution folder to clear local firewall errors
app.use(express.static(path.join(process.cwd(), "public")));

// 3. DATABASE SETUP
const pool = mysql.createPool({
  uri: process.env.DATABASE_URL, 
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const db = pool.promise();

// 4. CORE AUTHENTICATION ENDPOINTS
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
    console.log(`Checking login for user: ${user}`);

    const [rows] = await db.query("SELECT * FROM tbl_users WHERE username = ?", [user]);

    if (rows.length === 0) {
      console.log("User not found in database");
      return res.status(401).send("Invalid username or password");
    }

    const foundUser = rows[0];
    const match = await bcrypt.compare(pass, foundUser.password_hash);

    if (!match) {
      console.log("Password did not match");
      return res.status(401).send("Invalid username or password");
    }

    console.log(`Login successful! Role: ${foundUser.role}`);
    
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

// 5. INVENTORY MANAGEMENT ENDPOINTS
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

app.get('/inventoryprices', async (req, res) => {
  try {
    const query = `
      SELECT 
        p.poke_name, 
        c.condition_id, 
        c.variant_id, 
        c.final_price
      FROM tbl_cards c
      LEFT JOIN tbl_pokemons p ON c.poke_id = p.poke_id
      LEFT JOIN tbl_conditions o ON o.condition_id = c.condition_id
      LEFT JOIN tbl_variants v ON v.variant_id = c.variant_id;
    `;
    const [cards] = await db.query(query); 
    res.json(cards); 
  } catch (err) {
    console.error("Inventory data query error:", err);
    res.status(500).json({ error: "Failed to retrieve inventory data" });
  }
});

// 6. PUPPETEER EXPORT ROUTE
app.get("/download-pdf", async (req, res) => {
  let browser;
  try {
    const query = `
      SELECT 
        p.poke_name, 
        c.condition_id, 
        c.variant_id, 
        c.final_price
      FROM tbl_cards c
      LEFT JOIN tbl_pokemons p ON c.poke_id = p.poke_id
      LEFT JOIN tbl_conditions o ON o.condition_id = c.condition_id
      LEFT JOIN tbl_variants v ON v.variant_id = c.variant_id;
    `;
    const [cards] = await db.query(query);

    let tableRows = "";
    cards.forEach(card => {
      tableRows += `
        <tr style="border-bottom: 1px solid #333;">
          <td style="padding: 10px;"><strong>${card.poke_name || 'Unknown'}</strong></td>
          <td style="padding: 10px;">${card.condition_id || 'N/A'}</td>
          <td style="padding: 10px;">${card.variant_id || 'N/A'}</td>
          <td style="padding: 10px; color: #4caf50;">$${Number(card.final_price || 0).toFixed(2)}</td>
        </tr>
      `;
    });

    const pdfHtmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; background-color: #12121c; color: white; padding: 30px; }
            h1 { color: #ef5350; text-align: center; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background-color: #1a1924; color: white; padding: 12px; text-align: left; }
            td { padding: 12px; color: #e0e0e0; }
          </style>
        </head>
        <body>
          <h1>Team Rocket Co. - Inventory Report</h1>
          <table>
            <thead>
              <tr>
                <th>Card Name</th>
                <th>Condition</th>
                <th>Variant</th>
                <th>Price</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
        </body>
      </html>
    `;

    browser = await puppeteer.launch({
      headless: "new",
      args: [
        "--no-sandbox", 
        "--disable-setuid-sandbox",
        "--allow-file-access-from-files",
        "--disable-web-security"
      ]
    });
    
    const page = await browser.newPage();
    await page.setContent(pdfHtmlContent, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true, 
      margin: { top: "15mm", bottom: "15mm", left: "15mm", right: "15mm" }
    });

    await browser.close();

    res.contentType("application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=inventory-report.pdf");
    res.send(pdfBuffer);

  } catch (err) {
    console.error("Puppeteer PDF generation failed:", err);
    if (browser) await browser.close();
    res.status(500).send(`Failed to compile document ledger. Error: ${err.message || JSON.stringify(err) || err}`);
  }
});

// 7. WEB TRAFFIC BOUNDS
app.listen(3000, () => {
    console.log(`Server running on port 3000`);
});


//I HATE MY LIFE AND I WANNA DIE
// PASTE THIS AT THE BOTTOM OF NODEJS.TXT (RIGHT BEFORE APP.LISTEN)
app.post("/process-order", async (req, res) => {
  const { cardId, action, qty } = req.body;
  
  // Using a default fallback user_id (e.g., 1) for testing if an active session state isn't passed
  const userId = req.body.userId || 1; 

  if (!cardId || !action || !qty || qty <= 0) {
    return res.status(400).send("Invalid input data provided.");
  }

  // Format action string to match ENUM('Buy','Sell', 'Trade') casing exactly
  const orderType = action.charAt(0).toUpperCase() + action.slice(1).toLowerCase();

  // Get a connection from the pool to run a multi-step safe transaction sequence
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Step 1: Retrieve the card record and determine its price evaluation structure
    const [cards] = await connection.query(
      "SELECT c.*, p.base_price FROM tbl_cards c JOIN tbl_pokemons p ON c.poke_id = p.poke_id WHERE c.card_id = ?", 
      [cardId]
    );
    
    if (cards.length === 0) {
      await connection.rollback();
      return res.status(404).send("Card not found in database registry.");
    }

    const cardRecord = cards[0];
    const currentStock = cardRecord.stock_qty;
    // Use final_price if set, otherwise fall back to pokemon base_price
    const pricePerUnit = parseFloat(cardRecord.final_price) || parseFloat(cardRecord.base_price || 0);
    const totalPrice = pricePerUnit * qty;
    
    let updatedStock = currentStock;

    // Step 2: Validate inventory conditions based on customer action choice
    if (action.toLowerCase() === "buy") {
      if (currentStock < qty) {
        await connection.rollback();
        return res.status(400).send(`Insufficient items. Only ${currentStock} units available.`);
      }
      updatedStock = currentStock - qty;
    } else if (action.toLowerCase() === "sell") {
      updatedStock = currentStock + qty;
    } else if (action.toLowerCase() === "trade") {
      // Trade creates records but does not immediately alter quantities until review
      updatedStock = currentStock;
    }

    // Step 3: Update stock count inside tbl_cards
    await connection.query(
      "UPDATE tbl_cards SET stock_qty = ? WHERE card_id = ?", 
      [updatedStock, cardId]
    );

    // Step 4: Insert parent log inside tbl_transactions
    const [txResult] = await connection.query(
      "INSERT INTO tbl_transactions (user_id, order_type, order_date, order_total) VALUES (?, ?, NOW(), ?)",
      [userId, orderType, totalPrice]
    );
    const newTransactionId = txResult.insertId;

    // Step 5: Insert granular mapping item inside tbl_transaction_items
    await connection.query(
      "INSERT INTO tbl_transaction_items (transaction_id, card_id, qty_admin, qty_cust, total_price) VALUES (?, ?, 0, ?, ?)",
      [newTransactionId, cardId, qty, totalPrice]
    );

    // Commit all changes since everything completed successfully
    await connection.commit();
    res.status(200).send("Order confirmed successfully! Database ledger logs initialized.");

  } catch (err) {
    // If any error happens, cancel database edits to protect system integrity
    await connection.rollback();
    console.error("Transaction failed, rolled back:", err);
    res.status(500).send(`Database operation error context trace: ${err.message}`);
  } finally {
    connection.release();
  }
});