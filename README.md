# PostgreSQL CRUD Practice App

A simple full stack app for practicing how PostgreSQL, Express, and a plain HTML frontend work together.

This project runs locally only. It is not deployed anywhere, and it is not connected to GitHub Pages, since GitHub Pages cannot run a Node.js server or connect to a database.

## How the pieces connect

```
index.html   (browser)
    |
    | HTTP requests (fetch)
    v
server.js    (Express / Node.js)
    |
    | SQL queries (pg library)
    v
PostgreSQL   (your local database)
```

## 1. What you need installed

- Node.js v18 or newer, from nodejs.org
- PostgreSQL, from postgresql.org/download
- pgAdmin, which usually installs automatically together with PostgreSQL on Windows

## 2. Open the project folder in your terminal

Windows Powershell splits a folder path at every space if it is not wrapped in quotes, so always use quotes if your folder name has spaces in it.

```
cd "C:\path\to\Database Practice"
```

Replace the path above with wherever you saved this folder.

## 3. Log into PostgreSQL

On Windows, typing just `psql` will try to log in using your Windows username, which usually does not exist as a database role and will fail. Always specify the postgres user directly.

```
psql -U postgres
```

Enter the postgres password you set during installation.

## 4. Create the database

While still inside the psql prompt, run:

```sql
CREATE DATABASE pg_crud_users;
```

Then exit psql:

```
\q
```

## 5. Create the users table

Run this from your terminal, inside the project folder, not inside psql:

```
psql -U postgres -d pg_crud_users -f setup.sql
```

This reads the setup.sql file already included in this project and creates the users table for you.

## 6. Set your environment variables

Open the `.env` file in the project folder and fill in your real postgres password:

```
PG_HOST=localhost
PG_PORT=5432
PG_DATABASE=pg_crud_users
PG_USER=postgres
PG_PASSWORD=yourpassword
```

The `.env` file is already listed in `.gitignore`, so your password never gets pushed to GitHub.

## 7. Install dependencies

```
npm install
```

## 8. Start the server

```
npm start
```

You should see two lines in your terminal confirming it worked:

```
Connected to PostgreSQL!
Server running at http://localhost:3000
```

## 9. Open the app

Go to this address in your browser:

```
http://localhost:3000
```

Every time you create, edit, or delete a user through the form, the request goes to server.js, which runs the SQL query, which updates the actual users table in PostgreSQL.

## 10. Viewing your table visually

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

| File or folder      | What it does                                             |
|----------------------|-----------------------------------------------------------|
| server.js            | Express server with all CRUD routes and bcrypt hashing    |
| index.html           | Page structure, links to the css and js files below       |
| assets/css/styles.css | All page styling                                          |
| assets/js/app.js     | All frontend logic, handles fetch calls to the API         |
| setup.sql            | Creates the users table                                    |
| .env                  | Your local database credentials, never pushed to GitHub   |
| package.json          | Node dependencies                                          |

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

If npm start shows could not connect to PostgreSQL, check that the password in your .env file matches your actual postgres password, and that the PostgreSQL service is running.