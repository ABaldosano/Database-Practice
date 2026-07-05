# PostgreSQL CRUD Practice App

A full stack CRUD app for practicing how PostgreSQL, Express, and a plain HTML frontend work together. Started as a local only exercise, now deployed as a live demo.

Please do not put your real information into the live demo. It is a public practice database.

## Live demo

Frontend: hosted on GitHub Pages
Backend: hosted on Railway
Database: hosted on Supabase (managed PostgreSQL)

## How the pieces connect

```
index.html   (browser, GitHub Pages)
    |
    | HTTP requests (fetch)
    v
server.js    (Express / Node.js, Railway)
    |
    | SQL queries (pg library, parameterized)
    v
PostgreSQL   (Supabase)
```

## Security

- All queries use parameterized placeholders ($1, $2, ...) instead of string concatenation, so user input can never be interpreted as SQL.
- Server side validation on every route: numeric id checks, email format checks, and length limits on name, email, and password, rejected before they ever reach a query.
- Passwords are hashed with bcrypt before storage. Plaintext passwords are never saved or returned.
- CORS is locked to specific allowed origins instead of accepting requests from anywhere.
- Request body size is capped to prevent oversized payloads.

## Accessibility and UI

- Every form field has a proper label tied to its input.
- Feedback messages use a live region so screen readers announce success or error states.
- The users table has a caption, column scope attributes, and a dedicated scrollable region for small screens, without letting the scroll spill into the rest of the page.
- Visible focus outlines on all interactive elements for keyboard navigation.
- Responsive layout that stacks into a single column on narrower screens instead of squeezing the two panel layout.
- Respects prefers reduced motion for people sensitive to animation.

## Running it locally

### 1. What you need installed

- Node.js v18 or newer, from nodejs.org
- PostgreSQL, from postgresql.org/download
- pgAdmin, which usually installs automatically together with PostgreSQL on Windows

### 2. Open the project folder in your terminal

Windows Powershell splits a folder path at every space if it is not wrapped in quotes, so always use quotes if your folder name has spaces in it.

```
cd "C:\path\to\Database Practice"
```

Replace the path above with wherever you saved this folder.

### 3. Log into PostgreSQL

On Windows, typing just `psql` will try to log in using your Windows username, which usually does not exist as a database role and will fail. Always specify the postgres user directly.

```
psql -U postgres
```

Enter the postgres password you set during installation.

### 4. Create the database

While still inside the psql prompt, run:

```sql
CREATE DATABASE pg_crud_users;
```

Then exit psql:

```
\q
```

### 5. Create the users table

Run this from your terminal, inside the project folder, not inside psql:

```
psql -U postgres -d pg_crud_users -f setup.sql
```

This reads the setup.sql file already included in this project and creates the users table for you.

### 6. Set your environment variables

Create a `.env` file in the project folder with your own values:

```
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/pg_crud_users
NODE_ENV=development
PORT=3000
```

The `.env` file is already listed in `.gitignore`, so your password never gets pushed to GitHub.

### 7. Install dependencies

```
npm install
```

### 8. Start the server

```
npm start
```

You should see two lines in your terminal confirming it worked:

```
Connected to PostgreSQL!
Server running at http://localhost:3000
```

### 9. Open the app

Go to this address in your browser:

```
http://localhost:3000
```

Every time you create, edit, or delete a user through the form, the request goes to server.js, which runs the SQL query, which updates the actual users table in PostgreSQL.

### 10. Viewing your table visually

You do not need the terminal to look at your data. Open pgAdmin, then follow this path in the left sidebar:

```
Servers > PostgreSQL > Databases > pg_crud_users > Schemas > public > Tables > users
```

Right click on users, then choose View/Edit Data, then All Rows. This opens a spreadsheet style view of every row in the table.

If you prefer the terminal instead, connect with psql and run:

```sql
SELECT * FROM users;
```

## Project structure

| File or folder         | What it does                                            |
|-------------------------|----------------------------------------------------------|
| server.js               | Express server with all CRUD routes, validation, and bcrypt hashing |
| index.html              | Page structure, links to the css and js files below       |
| assets/css/global.css   | All page styling, responsive layout, accessibility states |
| assets/js/app.js        | All frontend logic, handles fetch calls to the API         |
| setup.sql               | Creates the users table                                    |
| .env                     | Your local database credentials, never pushed to GitHub    |
| package.json             | Node dependencies                                           |

## API routes

| Method | URL             | What it does      |
|--------|-----------------|--------------------|
| GET    | /api/users      | Fetch all users    |
| GET    | /api/users/:id  | Fetch one user     |
| POST   | /api/users      | Create a new user  |
| PUT    | /api/users/:id  | Update a user      |
| DELETE | /api/users/:id  | Delete a user      |

## Key PostgreSQL concepts used in this app

SERIAL automatically increments the id on every insert, so you never set it manually.

UNIQUE makes sure no two rows can share the same email. Trying to insert a duplicate throws error code 23505, which the app catches and shows as a normal error message instead of a crash.

RETURNING sends back the row that was just inserted or updated, so the app does not need to run a second query to fetch it again.

Parameterized queries, meaning placeholders like $1 and $2 instead of pasting values directly into the SQL string, prevent SQL injection.

Pool keeps a small set of database connections open and reuses them across requests, instead of opening and closing a new connection every time.

## Troubleshooting

If psql says password authentication failed, you are probably logging in as your Windows username instead of postgres. Run psql -U postgres directly instead of just psql.

If psql says setup.sql no such file or directory, your terminal is not inside the project folder. Use cd with the full folder path in quotes first.

If npm start shows could not connect to PostgreSQL, check that the DATABASE_URL in your .env file matches your actual postgres credentials, and that the PostgreSQL service is running.