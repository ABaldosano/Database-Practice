require("dotenv").config();

const express = require("express");
const { Pool } = require("pg");
const bcrypt = require("bcrypt");
const cors = require("cors");

const app = express();
const PORT = 3000;

// -------------------------------------------------------
// 1. CONNECT TO POSTGRESQL
//    Pool = a group of reusable connections.
//    Instead of opening/closing a new connection on every
//    request, the pool keeps a few open and shares them.
// -------------------------------------------------------
const pool = new Pool({
  host:     process.env.PG_HOST,
  port:     process.env.PG_PORT,
  database: process.env.PG_DATABASE,
  user:     process.env.PG_USER,
  password: process.env.PG_PASSWORD,
});

// Test the connection on startup
pool.connect((err, client, release) => {
  if (err) {
    console.error("Could not connect to PostgreSQL:", err.message);
  } else {
    console.log("Connected to PostgreSQL!");
    release(); // give the connection back to the pool
  }
});

// -------------------------------------------------------
// 2. MIDDLEWARE
//    express.json() parses incoming JSON request bodies
//    cors() allows the browser to call this API
// -------------------------------------------------------
app.use(express.json());
app.use(cors());

// Serve index.html when visiting http://localhost:3000
app.use(express.static(__dirname));


// -------------------------------------------------------
// 3. ROUTES (CRUD)
// -------------------------------------------------------

// READ ALL -- GET /api/users
// SQL: SELECT all rows from users table
app.get("/api/users", async (req, res) => {
  try {
    // $1, $2, etc. are parameterized queries -- they prevent SQL injection
    const result = await pool.query(
      "SELECT id, name, email, created_at FROM users ORDER BY id ASC"
      // NOTE: we never return the password column to the frontend
    );

    // result.rows is an array of objects, one per DB row
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});


// READ ONE -- GET /api/users/:id
// SQL: SELECT a single row by primary key
app.get("/api/users/:id", async (req, res) => {
  try {
    const { id } = req.params; // pull the :id from the URL

    const result = await pool.query(
      "SELECT id, name, email, created_at FROM users WHERE id = $1",
      [id] // $1 gets replaced with this value safely
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


// CREATE -- POST /api/users
// SQL: INSERT a new row into users
app.post("/api/users", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "name, email, and password are required" });
    }

    // Hash the password before storing it
    // 10 = salt rounds (how much CPU work to do -- higher is safer but slower)
    const hashedPassword = await bcrypt.hash(password, 10);

    // RETURNING * tells PostgreSQL to send back the newly inserted row
    const result = await pool.query(
      `INSERT INTO users (name, email, password)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, created_at`,
      [name, email, hashedPassword]
    );

    res.status(201).json(result.rows[0]); // 201 = Created
  } catch (err) {
    // PostgreSQL error code 23505 = unique_violation (duplicate email)
    if (err.code === "23505") {
      return res.status(409).json({ error: "Email already exists" });
    }
    console.error(err);
    res.status(500).json({ error: "Failed to create user" });
  }
});


// UPDATE -- PUT /api/users/:id
// SQL: UPDATE an existing row
app.put("/api/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password } = req.body;

    // Build query dynamically based on which fields were sent
    const fields = [];
    const values = [];
    let idx = 1;

    if (name)     { fields.push(`name = $${idx++}`);     values.push(name); }
    if (email)    { fields.push(`email = $${idx++}`);    values.push(email); }
    if (password) {
      const hashed = await bcrypt.hash(password, 10);
      fields.push(`password = $${idx++}`);
      values.push(hashed);
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: "Nothing to update" });
    }

    values.push(id); // last value is the WHERE clause id

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


// DELETE -- DELETE /api/users/:id
// SQL: DELETE a row by primary key
app.delete("/api/users/:id", async (req, res) => {
  try {
    const { id } = req.params;

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


// -------------------------------------------------------
// 4. START SERVER
// -------------------------------------------------------
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
