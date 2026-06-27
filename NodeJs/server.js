const path = require("path");

require("dotenv").config({ path: "./server.env" });

const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bcrypt = require("bcrypt");
const puppeteer = require("puppeteer");

const app = express();
app.use(cors({
  origin: ['https://hawkkyy.github.io/TeamRocketCo/', 'http://localhost:3000'],
  credentials: true
}));



app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "../public")));



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



// Get all cards for the inventory page
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

// admin pages

//cust-order
//inv-prices
app.get('/inventoryprices', async (req, res) => {
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
    const [cards] = await db.execute(query);
    res.json(cards); 
});

//data-man
//add
//edit
//insert a new card
//
app.get("/download-pdf", async (req, res) => {
  let browser;
  try {
    // 1. Launch with flags required for cloud platforms like Render
    browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });
    
    const page = await browser.newPage();

    // 2. Point it to your live inventory page
    // Note: 'networkidle0' tells Puppeteer to wait until your database API fetch is totally done loading rows
    await page.goto("https://teamrocketco.onrender.com/inv-prices.html", {
      waitUntil: "networkidle0"
    });

    // 3. Generate the PDF into a binary stream (Buffer) instead of saving to disk
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true, // Crucial to keep your dark theme colors!
      margin: { top: "15mm", bottom: "15mm", left: "15mm", right: "15mm" }
    });

    // 4. Wrap the process and close the browser instance
    await browser.close();

    // 5. Send the file downstream to the user's browser as an immediate download attachment
    res.contentType("application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=inventory-report.pdf");
    res.send(pdfBuffer);

  } catch (err) {
    console.error("Puppeteer PDF generation failed:", err);
    
    // Safely kill the browser process if it crashed mid-run to save RAM
    if (browser) await browser.close();
    
    res.status(500).send("Failed to compile document ledger.");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
