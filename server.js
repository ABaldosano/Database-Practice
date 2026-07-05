require("dotenv").config();

const express = require("express");
const { Pool } = require("pg");
const bcrypt = require("bcrypt");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidId(id) {
  return /^\d+$/.test(String(id));
}

function isValidName(name) {
  return typeof name === "string" && name.trim().length > 0 && name.trim().length <= 100;
}

function isValidEmail(email) {
  return typeof email === "string" && email.trim().length <= 255 && EMAIL_RE.test(email.trim());
}

function isValidPassword(password) {
  return typeof password === "string" && password.length >= 1 && password.length <= 72;
}

const PROFANITY_LIST = [
  "fuck", "shit", "bitch", "asshole", "bastard", "damn", "crap",
  "dick", "piss", "cunt", "slut", "whore",
];

function maskProfanity(text) {
  if (!text) return text;
  let result = String(text);
  PROFANITY_LIST.forEach((word) => {
    const pattern = new RegExp(`\\b${word}\\b`, "gi");
    result = result.replace(pattern, (match) => "*".repeat(match.length));
  });
  return result;
}

// 1. CONNECT TO POSTGRESQL (Supabase connection string)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

pool.connect((err, client, release) => {
  if (err) {
    console.error("Could not connect to PostgreSQL:", err.message);
  } else {
    console.log("Connected to PostgreSQL!");
    release();
  }
});

// 2. MIDDLEWARE
app.use(express.json({ limit: "10kb" }));
app.use(cors({
  origin: [
    "https://abaldosano.github.io",
    "http://localhost:3000",
  ],
}));

app.use(express.static(__dirname));

// 3. ROUTES (CRUD)

// READ ALL
app.get("/api/users", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, email, created_at FROM users ORDER BY id ASC"
    );
    const masked = result.rows.map((row) => ({
      ...row,
      name: maskProfanity(row.name),
      email: maskProfanity(row.email),
    }));
    res.json(masked);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// READ ONE
app.get("/api/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return res.status(400).json({ error: "Invalid user id" });
    }
    const result = await pool.query(
      "SELECT id, name, email, created_at FROM users WHERE id = $1",
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

// CREATE
app.post("/api/users", async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    if (!isValidName(name) || !isValidEmail(email) || !isValidPassword(password)) {
      return res.status(400).json({ error: "name, email, and password are required and must be valid" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (name, email, password)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, created_at`,
      [name.trim(), email.trim().toLowerCase(), hashedPassword]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ error: "Email already exists" });
    }
    console.error(err);
    res.status(500).json({ error: "Failed to create user" });
  }
});

// UPDATE
app.put("/api/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return res.status(400).json({ error: "Invalid user id" });
    }
    const { name, email, password } = req.body || {};
    const fields = [];
    const values = [];
    let idx = 1;

    if (name !== undefined) {
      if (!isValidName(name)) {
        return res.status(400).json({ error: "Invalid name" });
      }
      fields.push(`name = $${idx++}`);
      values.push(name.trim());
    }
    if (email !== undefined) {
      if (!isValidEmail(email)) {
        return res.status(400).json({ error: "Invalid email" });
      }
      fields.push(`email = $${idx++}`);
      values.push(email.trim().toLowerCase());
    }
    if (password) {
      if (!isValidPassword(password)) {
        return res.status(400).json({ error: "Invalid password" });
      }
      const hashed = await bcrypt.hash(password, 10);
      fields.push(`password = $${idx++}`);
      values.push(hashed);
    }
    if (fields.length === 0) {
      return res.status(400).json({ error: "Nothing to update" });
    }
    values.push(id);
    const result = await pool.query(
      `UPDATE users SET ${fields.join(", ")} WHERE id = $${idx} RETURNING id, name, email, created_at`,
      values
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ error: "Email already exists" });
    }
    console.error(err);
    res.status(500).json({ error: "Failed to update user" });
  }
});

// DELETE
app.delete("/api/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return res.status(400).json({ error: "Invalid user id" });
    }
    const result = await pool.query(
      "DELETE FROM users WHERE id = $1 RETURNING id, name",
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ message: `Deleted user: ${result.rows[0].name}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete user" });
  }
});



// 4. START SERVER
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});