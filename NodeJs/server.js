const path = require("path");

// 1. Standard Node environment loader (Bypasses dotenvx completely)
require("dotenv").config({ path: path.resolve(__dirname, "server.env") });

const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bcrypt = require("bcrypt");
const puppeteer = require("puppeteer");

const app = express(); 

// 2. MIDDLEWARE HOOKS
app.use(cors({
    origin: function (origin, callback) {
        const allowedOrigins = ['https://hawkkyy.github.io', 'http://localhost:3000', 'http://127.0.0.1:5500'];
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    preflightContinue: false,   // Automatically handles and stops the OPTIONS request here
    optionsSuccessStatus: 204   // Answers browser preflights with a 204 No Content status
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Use path.resolve to calculate an absolute path to your public folder
app.use(express.static(path.resolve(__dirname, "../public")));

// 3. DATABASE SETUP (Using explicit variables)
const pool = mysql.createPool({
  uri: "mysql://root:fuhQNRpZgjCyLcstrfarECeQyzDSpNvE@reseau.proxy.rlwy.net:23677/railway", 
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: {
    rejectUnauthorized: false // Bypasses cloud SSL validation restrictions during local testing
  }
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
    res.send("<script>alert('Account successfully created!'); window.location.href='/login.html';</script>");  } catch (err) {
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

app.post("/transaction", async (req, res) => {
    const { userId, cardId, orderType, qty, totalPrice } = req.body;

    if (!userId || !cardId || !orderType || !qty) {
        return res.status(400).send("Missing mandatory transaction details.");
    }

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Fetch current stock figures from tbl_cards 
        const [cardRows] = await connection.query(
            "SELECT stock_qty FROM tbl_cards WHERE card_id = ?", 
            [cardId]
        );

        if (cardRows.length === 0) {
            throw new Error("Target card record was not found in database.");
        }

        const dbStock = cardRows[0].stock_qty;
        let updatedStock = dbStock;

        // 2. Adjust inventory balances according to the transaction type
        if (orderType === "BUY") {
            if (dbStock < qty) {
                return res.status(400).send(`Insufficient card shop inventory stock. Available: ${dbStock}`);
            }
            updatedStock = dbStock - qty; // Customer buys -> Shop loses stock
        } else if (orderType === "SELL") {
            updatedStock = dbStock + qty; // Customer sells -> Shop gains stock
        } else if (orderType === "TRADE") {
            updatedStock = dbStock; // Trade doesn't change catalog item total balance automatically
        } else {
            throw new Error("Invalid transaction type processed.");
        }

        // 3. Update stock inside tbl_cards
        await connection.query(
            "UPDATE tbl_cards SET stock_qty = ? WHERE card_id = ?", 
            [updatedStock, cardId]
        );

        // 4. Save details inside tbl_transactions (Matches Data Dictionary)
        const [txResult] = await connection.query(
            "INSERT INTO tbl_transactions (user_id, order_type, order_date, order_total) VALUES (?, ?, NOW(), ?)",
            [userId, orderType, totalPrice]
        );
        
        const newTransactionId = txResult.insertId;

        // 5. Save breakdown inside tbl_transaction_items (Matches Data Dictionary columns)
        // Passes 0 for qty_admin, and customer quantity into qty_cust
        await connection.query(
            "INSERT INTO tbl_transaction_items (transaction_id, card_id, qty_admin, qty_cust, total_price) VALUES (?, ?, 0, ?, ?)",
            [newTransactionId, cardId, qty, totalPrice]
        );

        await connection.commit();
        res.status(200).send(`Transaction (${orderType}) registered successfully!`);

    } catch (err) {
        await connection.rollback();
        console.error("Transaction failed, execution rolled back:", err);
        res.status(500).send(`System error processing order logs: ${err.message}`);
    } finally {
        connection.release();
    }
});

app.get('/location', async (req, res) => {
  try {
    const query = `
      SELECT 
        l.area_code,
        l.city
      FROM tbl_location l
    `;
    const [locs] = await db.query(query); 
    res.json(locs); 
  } catch (err) {
    console.error("Location data query error:", err);
    res.status(500).json({ error: "Failed to retrieve location data" });
  }
});

app.get('/elements', async (req, res) => {
  try {
    const query = `
      SELECT 
        e.element_id,
        e.elements
      FROM tbl_elements e
    `;
    const [elements] = await db.query(query); 
    res.json(elements); 
  } catch (err) {
    console.error("Elements data query error:", err);
    res.status(500).json({ error: "Failed to retrieve element data" });
  }
});
app.get('/conditions', async (req, res) => {
  try {
    const query = `
      SELECT 
        c.condition_id,
        c.conditions,
        c.condition_discount
      FROM tbl_conditions c
    `;
    const [cond] = await db.query(query); 
    res.json(cond); 
  } catch (err) {
    console.error("Condition data query error:", err);
    res.status(500).json({ error: "Failed to retrieve condition data" });
  }
});
app.get('/variants', async (req, res) => {
  try {
    const query = `
      SELECT 
        v.variant_id,
        v.variants,
        v.variant_multiplier
      FROM tbl_variants v
    `;
    const [vars] = await db.query(query); 
    res.json(vars); 
  } catch (err) {
    console.error("Variants data query error:", err);
    res.status(500).json({ error: "Failed to retrieve variant data" });
  }
});



app.get("/adminsection/inv-prices.html", (req, res) => {
    res.sendFile(path.resolve(__dirname, "../public/inv-prices.html"));
});

app.get("/adminsection/a-dashboard.html", (req, res) => {
    res.sendFile(path.resolve(__dirname, "../public/a-dashboard.html"));
});


// 7. WEB TRAFFIC BOUNDS
app.listen(3000, () => {
    console.log(`Server running on port 3000`);
});






// INVENTORY MANAGEMENT ENDPOINTS
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
        c.card_id,
        p.poke_name, 
        c.condition_id, 
        c.variant_id, 
        c.final_price,
        c.stock_qty
      FROM tbl_cards c
      LEFT JOIN tbl_pokemons p ON c.poke_id = p.poke_id
    `;
    const [cards] = await db.query(query); 
    res.json(cards); 
  } catch (err) {
    console.error("Inventory data query error:", err);
    res.status(500).json({ error: "Failed to retrieve inventory data" });
  }
});

app.get('/orders', async (req, res) => {
  try {
    const query = `
      SELECT 
        t.transaction_id,
        t.user_id, 
        u.username,
        CONCAT(u.firstname, ' ', u.lastname) AS full_name,
        t.order_type, 
        t.order_total,
        t.order_date
      FROM tbl_transactions t
      LEFT JOIN tbl_users u ON t.user_id = u.user_id
    `;
    const [orders] = await db.query(query); 
    res.json(orders); 
  } catch (err) {
    console.error("Orders data query error:", err);
    res.status(500).json({ error: "Failed to retrieve transaction data" });
  }
});

app.get('/userlist', async (req, res) => {
  try {
    const query = `
      SELECT 
        u.user_id,
        u.username,
        CONCAT(u.firstname, ' ', u.lastname) AS full_name,
        u.contact_no,
        u.area_code,
        l.city,
        u.role,
        u.created_at,
        u.updated_at
      FROM tbl_users u
      LEFT JOIN tbl_location l ON u.area_code = l.area_code
    `;
    const [users] = await db.query(query); 
    res.json(users); 
  } catch (err) {
    console.error("Users data query error:", err);
    res.status(500).json({ error: "Failed to retrieve user data" });
  }
});

// PUT: Update an existing user's profile details
app.put('/update-user/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const { username, full_name, contact_no, city } = req.body;

    // Validate that basic details were sent
    if (!username || !full_name) {
      return res.status(400).json({ error: "Username and Full Name are required fields." });
    }

    // Split Full Name back into firstname and lastname for your tbl_users schema structure
    const nameParts = full_name.trim().split(" ");
    const firstname = nameParts[0];
    const lastname = nameParts.slice(1).join(" ") || ""; // Fallback if no last name provided

    // Update query targeting the correct 'tbl_users' table layout
    const sql = `
      UPDATE tbl_users 
      SET username = ?, firstname = ?, lastname = ?, contact_no = ?, updated_at = NOW() 
      WHERE user_id = ?
    `;

    const [result] = await db.query(sql, [username, firstname, lastname, contact_no, userId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "User profile record not found." });
    }

    res.json({ message: "User profile updated successfully!" });
  } catch (err) {
    console.error("Failed to update user profile records:", err);
    res.status(500).json({ error: "Database transaction failed", details: err.message });
  }
});

 //     LEFT JOIN tbl_conditions o ON o.condition_id = c.condition_id
//LEFT JOIN tbl_variants v ON v.variant_id = c.variant_id;

// CARDS //

// INSERT: Add a new card to the inventory
app.post("/inventory/add", async (req, res) => {
  try {
    const { poke_id, condition_id, variant_id, stock_qty, final_price } = req.body;

    // Validate that required fields exist
    if (!poke_id || !condition_id || !variant_id) {
      return res.status(400).json({ error: "Missing required card fields" });
    }

    const sql = `
      INSERT INTO tbl_cards (poke_id, condition_id, variant_id, stock_qty, final_price) 
      VALUES (?, ?, ?, ?, ?)
    `;

    await db.query(sql, [
      poke_id, 
      condition_id, 
      variant_id, 
      stock_qty || 0, 
      final_price || 0.00
    ]);

    res.status(201).json({ message: "Card successfully added to inventory!" });
  } catch (err) {
    console.error("Failed to insert card:", err);
    res.status(500).json({ error: "Failed to add card", details: err.message });
  }
});

// DELETE: Remove a card from the inventory by its ID
app.delete("/inventory/delete/:id", async (req, res) => {
  try {
    const cardId = req.params.id;

    const sql = "DELETE FROM tbl_cards WHERE card_id = ?";
    const [result] = await db.query(sql, [cardId]);

    // Check if a row was actually deleted
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Card not found or already deleted" });
    }

    res.json({ message: `Card ID ${cardId} successfully deleted!` });
  } catch (err) {
    console.error("Failed to delete card:", err);
    res.status(500).json({ error: "Failed to delete card", details: err.message });
  }
});
