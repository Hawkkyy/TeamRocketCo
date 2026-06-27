//backend


const db = require("./db");

// test query
app.get("/users", async (req, res) => {
  const [rows] = await db.query("SELECT * FROM users");
  res.json(rows);
});

const express = require("express");
const app = express();

app.use(express.json());

// test route
app.get("/", (req, res) => {
    res.send("Server is working");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
