# PostgreSQL CRUD Practice App

A simple full-stack app to learn how PostgreSQL works.

## Stack

```
index.html   (browser)
    |
    | HTTP requests (fetch)
    v
server.js    (Express / Node.js)
    |
    | SQL queries (pg library)
    v
PostgreSQL   (your local DB)
```

---

## 1. Prerequisites

- [Node.js](https://nodejs.org) v18+
- [PostgreSQL](https://www.postgresql.org/download/) installed and running

---

## 2. Create the Database

Open your terminal and enter the PostgreSQL shell:

```bash
psql -U postgres
```

Then create the database and table:

```sql
CREATE DATABASE pg_crud_users;
\c pg_crud_users

CREATE TABLE users (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  email      VARCHAR(255) NOT NULL UNIQUE,
  password   TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

Type `\q` to exit psql.

---

## 3. Set Up Environment Variables

Copy the example env file and fill in your credentials:

```bash
cp .env.example .env
```

Then open `.env` and update the values:

```
PG_HOST=localhost
PG_PORT=5432
PG_DATABASE=pg_crud_users
PG_USER=postgres
PG_PASSWORD=yourpassword
```

The `.env` file is gitignored so your credentials will never be pushed to GitHub.

---

## 4. Install Dependencies and Start

```bash
npm install
node server.js
```

Then open your browser at: **http://localhost:3000**

---

## File Overview

| File            | What it does                                        |
|-----------------|-----------------------------------------------------|
| `server.js`     | Express server, all 4 CRUD routes, bcrypt hashing   |
| `index.html`    | Frontend UI, calls the API with fetch()             |
| `setup.sql`     | SQL reference file (the CREATE TABLE statement)     |
| `.env`          | Your local credentials (gitignored, never commit)   |
| `.env.example`  | Safe template to share on GitHub                    |
| `package.json`  | Node dependencies                                   |

---

## API Routes

| Method | URL              | What it does       |
|--------|------------------|--------------------|
| GET    | /api/users       | Fetch all users    |
| GET    | /api/users/:id   | Fetch one user     |
| POST   | /api/users       | Create a new user  |
| PUT    | /api/users/:id   | Update a user      |
| DELETE | /api/users/:id   | Delete a user      |

---

## Key PostgreSQL Concepts in This App

**SERIAL** - auto-increments the id on every INSERT. You never set it manually.

**UNIQUE** - PostgreSQL enforces that no two rows share the same email. Violating it throws error code `23505`.

**RETURNING** - after an INSERT or UPDATE, PostgreSQL sends back the affected row so you do not need a second SELECT query.

**Parameterized queries** - using `$1, $2` placeholders instead of string concatenation prevents SQL injection attacks.

**Pool** - instead of one connection per request, a pool keeps several connections open and reuses them for speed.
