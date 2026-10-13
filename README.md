# LabReserve

LabReserve is a laboratory equipment request and management web application built with React, Express, and MySQL. Students browse equipment and request available items. The administrator manages equipment and approves, rejects, or marks requests as returned.

This guide takes you from a fresh clone to a working local application. **Complete steps 1–8 once. For later runs, use “Start again later”.**

The commands below use **Windows PowerShell**. Open PowerShell from the Start menu, or open a PowerShell terminal in VS Code. Run each command separately and check that it succeeds before continuing. Do not type the surrounding code-block backticks.

## 1. Install the required software

| Software | Why it is needed | Installation |
| --- | --- | --- |
| Git | Clones the repository | [Git for Windows](https://git-scm.com/install/windows) |
| Node.js 24 LTS, including npm | Runs the backend and frontend tools; npm installs their packages | [Node.js downloads](https://nodejs.org/en/download) — choose Node.js 24 LTS and the installer for your OS |
| MySQL Community Server | Stores users, equipment, and requests | [MySQL Community Server downloads](https://dev.mysql.com/downloads/mysql/) — MySQL 8.4 LTS is a suitable local setup |
| Web browser | Opens the application | Chrome, Edge, Firefox, or another modern browser |
| Text editor | Edits local configuration | Notepad is sufficient; VS Code is optional |
| MySQL Workbench (optional) | Runs SQL through a graphical interface | [MySQL Workbench downloads](https://dev.mysql.com/downloads/workbench/) |

**Install and configure MySQL Server, not only Workbench.** Workbench is a database client; it does not replace the running server.

During MySQL installation/configuration:

1. Configure a local standalone server with TCP/IP enabled on port **3306**.
2. Set a password for the MySQL `root` account and keep it available. This is your database password, not your LabReserve login password.
3. Configure MySQL as a Windows service, preferably starting automatically. The service name depends on your installation (for example, `MySQL84` or `MySQL97`).
4. Finish configuration and ensure the service is running. See the [official Windows service instructions](https://dev.mysql.com/doc/refman/8.4/en/windows-start-service.html) if needed.

After installing Git and Node.js, close and reopen the terminal so it sees the updated PATH. Check:

```powershell
git --version
node --version
npm.cmd --version
```

Each command should print a version. Node.js 24 is recommended for this guide. The installed Vite package requires Node.js `^20.19.0 || >=22.12.0`; older versions such as Node.js 18 will not work.

No global React, Vite, or Express installation is needed. Docker, Nginx, and a separate web server are not required.

### Project dependencies

These packages are declared in the two `package.json` files. Step 3 installs them automatically; do not install them individually.

| Area | Packages | Purpose |
| --- | --- | --- |
| Frontend | `react`, `react-dom`, `react-router-dom` | UI rendering and page routing |
| Frontend development | `vite`, `@vitejs/plugin-react` | Development server and frontend build |
| Backend | `express`, `mysql2`, `bcryptjs`, `jsonwebtoken`, `cors`, `dotenv` | REST API, database queries, password hashing, authentication tokens, cross-origin support, and environment configuration |

MySQL Server is installed separately: the `mysql2` npm package only connects to it.

## 2. Clone the repository and open its root folder

In PowerShell, move to a folder where you want to keep the project, then run:

```powershell
git clone https://github.com/jayasahan/LabreserveDevOps.git
cd LabreserveDevOps
```

If you already cloned the repository, open a terminal in that existing folder instead. You do not need to clone again.

Check the contents:

```powershell
Get-ChildItem
```

You should see `client`, `server`, `database`, and `README.md`. This folder is the **repository root**. Unless a section says otherwise, run the following PowerShell commands from here.

To return to this folder from another terminal, use `cd` with your actual clone path. Quote paths containing spaces, for example:

```powershell
cd "C:\Projects\LabreserveDevOps"
```

There is no root-level `package.json`, so plain `npm start` at the repository root will not start this project.

## 3. Install frontend and backend packages

With an internet connection, run:

```powershell
npm.cmd --prefix server ci
npm.cmd --prefix client ci
```

`--prefix` selects the project folder. `ci` installs the versions recorded in each committed `package-lock.json`, creating separate `server/node_modules` and `client/node_modules` folders. Wait for both commands to finish successfully.

This guide uses `npm.cmd` to avoid PowerShell execution-policy errors involving `npm.ps1`.

## 4. Create and configure `server/.env`

The repository includes a template, but does not include your private configuration or database. On a fresh clone, run:

```powershell
Copy-Item server/.env.example server/.env
notepad server/.env
```

**If `server/.env` already exists, edit it instead of copying over it.** Replace the template contents with the following, change the placeholder values, and save:

```dotenv
PORT=5000

DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD="replace_with_your_mysql_root_password"
DB_NAME=labreserve

JWT_SECRET="replace_with_a_generated_random_value"

ADMIN_NAME="LabReserve Admin"
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD="replace_with_your_chosen_admin_password"
```

| Variable | What to enter |
| --- | --- |
| `PORT` | Keep `5000`; the frontend proxy uses this backend port. |
| `DB_HOST`, `DB_PORT` | Keep `127.0.0.1` and `3306` for a default local installation. If you configured another database port, use it here and in your database client. |
| `DB_USER`, `DB_PASSWORD` | Your MySQL account and its password. This guide uses `root` for simple local setup. An existing account with permissions to use the database also works. |
| `DB_NAME` | Keep `labreserve`, the database created by `database/schema.sql`. |
| `JWT_SECRET` | A private random string used to sign login tokens. Generate it below. |
| `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` | The application administrator created in step 6. Choose and remember its login password. |

Generate a JWT secret in PowerShell:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the printed value into `JWT_SECRET`. Do not use placeholder text as your secret or password. Quoted `.env` values allow spaces and `#` characters. The examples use double quotes, so avoid an unescaped double quote inside those values.

The MySQL password and admin password serve different purposes. There is **no built-in default admin password**. No `client/.env` is needed for this local setup: the frontend uses `/api` through Vite's proxy.

Keep `server/.env` private. It is ignored by Git; never commit credentials or share this file. Restart the backend after changing its configuration.

## 5. Create the database and tables

Make sure MySQL Server is running. On Windows, press `Win+R`, enter `services.msc`, find your MySQL service, and start it if stopped.

Choose **one** method below to execute `database/schema.sql` using a MySQL account allowed to create databases and tables. The examples use `root`.

### Option A — MySQL Workbench

1. Open Workbench and connect to your local server. If needed, create a connection with hostname `127.0.0.1`, port `3306`, username `root`, and the MySQL password set during installation.
2. In that connection's SQL editor, choose **File → Open SQL Script** and open this repository's `database/schema.sql`.
3. Run the **entire script** with the execute-script lightning button. Do not select only one statement. Check the Action Output panel for errors.
4. Refresh the Schemas panel. You should see `labreserve` with the `users`, `equipment`, and `requests` tables.

### Option B — MySQL command-line client

From PowerShell, connect:

```powershell
mysql.exe -h 127.0.0.1 -P 3306 -u root -p
```

Enter your **MySQL password** when prompted. It is not shown as you type. If `mysql.exe` is not recognized, use the MySQL Command Line Client from the Start menu, use Workbench, or invoke the executable with its full path. For example (adjust the version/path to your installation):

```powershell
& "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe" -h 127.0.0.1 -P 3306 -u root -p
```

At the `mysql>` prompt, run the following with the **actual absolute path** to your cloned schema. Use forward slashes, including when the folder contains spaces:

```sql
SOURCE C:/Projects/LabreserveDevOps/database/schema.sql;
SHOW TABLES FROM labreserve;
```

These are MySQL commands, not PowerShell commands. `SHOW TABLES` should list `equipment`, `requests`, and `users`. Type `exit;` to return to PowerShell.

The schema creates the database and three tables, including unique emails/asset codes, request foreign keys, and indexes. **It does not insert accounts or equipment.** Its `IF NOT EXISTS` statements preserve existing tables and data when rerun; they do not migrate an older table structure.

From the repository root, test the application configuration:

```powershell
npm.cmd --prefix server run test:mysql
```

Expected output includes:

```text
MySQL connection successful
```

This checks connectivity, not whether every table exists. Resolve any failure before seeding or starting the app.

## 6. Seed the administrator and demonstration equipment

“Seeding” means inserting initial records into the database. Run these commands **after** creating the schema and configuring `server/.env`. The application does not need to be running while you seed it.

### Create the administrator

```powershell
npm.cmd --prefix server run seed:admin
```

On a fresh database, expected output includes:

```text
Admin account created
```

The script reads `ADMIN_NAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` from `server/.env`, normalizes the email to lowercase, hashes the password with bcrypt, and inserts a user with role `ADMIN`. Sign in using that email and the original password.

If that email already belongs to an admin, it prints `Admin account already exists` and leaves the account unchanged. **Editing `ADMIN_PASSWORD` and rerunning the seed does not reset an existing password.** There is no password-reset command in this project. Keep the password used when the account was first created.

If that email belongs to a student, seeding fails instead of promoting the student. Use an unused email for the initial admin setup; keep one conceptual administrator. Changing the configured email can create a separate account rather than updating the existing one.

All three admin variables must be supplied. If it prints `Admin seed failed`, check those values, the database connection, the `users` table, and whether the email already belongs to a student. The script intentionally prints a generic failure message.

### Insert equipment

```powershell
npm.cmd --prefix server run seed:equipment
```

On a fresh database, expected output includes:

```text
Equipment seed complete: 12 created, 0 skipped
```

The seed inserts these items, all initially `AVAILABLE`:

| Equipment | Category | Asset code |
| --- | --- | --- |
| Digital Oscilloscope | Electronics | `LAB-OSC-001` |
| Digital Multimeter | Electronics | `LAB-DMM-001` |
| Function Generator | Electronics | `LAB-FG-001` |
| DC Power Supply | Electronics | `LAB-PSU-001` |
| Arduino Uno | Embedded Systems | `LAB-ARD-001` |
| Raspberry Pi 4 | Embedded Systems | `LAB-RPI-001` |
| ESP32 Development Board | Embedded Systems | `LAB-ESP-001` |
| Cisco Router | Networking | `LAB-RTR-001` |
| Cisco Switch | Networking | `LAB-SW-001` |
| Logic Analyzer | Electronics | `LAB-LA-001` |
| Breadboard Kit | Tools | `LAB-BBK-001` |
| Crimping Tool Kit | Tools | `LAB-CRP-001` |

Existing asset codes are skipped. If all twelve are present, rerunning prints `Equipment seed complete: 0 created, 12 skipped`. A partial database produces a mix of created/skipped counts.

Existing descriptions, categories, and statuses are not overwritten: rerunning does not make borrowed equipment available again. If it prints `Equipment seed failed`, check the connection and that the `equipment` table exists. Seeding runs item by item, so after fixing a failure, rerun it to insert any missing items.

The equipment seed is optional if you want to add your own equipment through the admin UI, but recommended for trying the project immediately.

### Verify the results

In Workbench or at a MySQL prompt, run:

```sql
USE labreserve;
SELECT id, name, email, role FROM users;
SELECT name, category, asset_code, status FROM equipment ORDER BY id;
SELECT COUNT(*) AS request_count FROM requests;
```

Immediately after setup on a fresh database, expect **one admin, twelve equipment items, and zero requests**. Existing databases may have more records or different statuses.

No student accounts or requests are seeded. Students register through the app in step 8. Do not insert plaintext passwords into `users`: registration and the admin seed perform the required hashing.

## 7. Start the application in development

Keep MySQL running and open **two PowerShell terminals**, both at the repository root.

**Terminal 1 — Express backend:**

```powershell
npm.cmd --prefix server start
```

Expected output includes:

```text
MySQL connected
LabReserve API running on port 5000
```

**Terminal 2 — React/Vite frontend:**

```powershell
npm.cmd --prefix client run dev
```

Open the URL printed by Vite, normally **[http://localhost:5173](http://localhost:5173)**. Keep both terminals open and running. If port 5173 is busy, Vite may print another port; use that URL.

Check these addresses in your browser:

| URL | Expected result |
| --- | --- |
| `http://localhost:5173` | LabReserve login page |
| `http://localhost:5000/api/health` | `{"status":"ok","app":"LabReserve API"}` |
| `http://localhost:5173/api/health` | Same JSON through Vite's proxy (use Vite's actual port if different) |

In development, port **5173** serves the UI and **5000** serves the API. The backend checks MySQL before listening. Its health endpoint does not check table contents or continuously retest database connectivity.

## 8. Sign in and try the workflow

1. Sign in at the login page with the `ADMIN_EMAIL` and `ADMIN_PASSWORD` used for the first successful admin seed. You should reach the admin dashboard and be able to view the equipment catalogue.
2. Log out. Choose **New student? Create an account**, or visit `/register`. Enter a name, valid email, and password of at least six characters. Registration creates a `STUDENT` account and signs it in.
3. As the student, request an available item. Equipment becomes `REQUESTED` and the request appears as `PENDING` in My Requests. Another student cannot request the same item while it is claimed.
4. Log out and sign in as admin. Approve it in request management: equipment becomes `BORROWED` and the request becomes `APPROVED`.
5. Mark it returned as admin: the request becomes `RETURNED` and equipment becomes `AVAILABLE` again.

The admin can also reject a pending request, or the owning student can cancel it while pending. Either releases the equipment. Students cannot choose the admin role during registration.

## Start again later

After initial setup, you do **not** need to recreate `.env`, rerun the schema, reinstall packages, or reseed every time.

1. Ensure MySQL Server is running.
2. Open two terminals at the repository root.
3. Run `npm.cmd --prefix server start` in the first.
4. Run `npm.cmd --prefix client run dev` in the second.
5. Open the URL printed by Vite, normally `http://localhost:5173`.

Press `Ctrl+C` in each application terminal to stop its server. MySQL keeps your data between runs. If package files change after pulling updates, repeat the two dependency-install commands. The backend uses plain Node.js, so restart it after backend code changes; Vite normally refreshes frontend changes automatically.

## Optional: production-like local run

This serves the built frontend and API from Express at one address. MySQL and the same database/environment setup are still required.

Stop any existing backend first to free port 5000. From the repository root:

```powershell
npm.cmd --prefix client run build
$env:NODE_ENV = 'production'
npm.cmd --prefix server start
```

Open **[http://localhost:5000](http://localhost:5000)**. Vite does not need to run in this mode. Express serves `client/dist`, handles `/api/*`, and supports React page routes. Rebuild after frontend changes.

After stopping Express with `Ctrl+C`, switch that terminal back to development before starting the normal two-server setup:

```powershell
Remove-Item Env:NODE_ENV -ErrorAction SilentlyContinue
```

## Troubleshooting

| Problem | What to check or do |
| --- | --- |
| `git`, `node`, or `npm.cmd` not recognized | Install the software with PATH support, then reopen your terminal. |
| `npm.ps1` cannot be loaded | Use `npm.cmd` as shown above. |
| npm cannot find the root `package.json` | Use `--prefix server` or `--prefix client`; check you are in the repository root. |
| Missing module/package or Vite not found | Complete both dependency-install commands. |
| Unsupported Node engine or Vite fails on startup | Check `node --version` and install Node.js 24 LTS. |
| `mysql.exe` not recognized | Use Workbench, the Start-menu MySQL client, or its full executable path. |
| MySQL client says `Access denied` | Check your MySQL credentials. These are not your LabReserve login credentials. |
| `MySQL connection failed` | Check the running MySQL service, host/port/credentials, and that `labreserve` exists. Ensure the file is `server/.env`, not `.env.txt`. Retry `test:mysql`. |
| Connection passes, but seeding or catalogue fails | Connectivity does not create tables. Execute the entire schema and confirm all three tables exist. |
| Admin cannot log in | Confirm the seed succeeded and use its original password; rerunning does not update it. Check `JWT_SECRET` and restart Express after `.env` changes. |
| Empty equipment catalogue | Run the equipment seed against the same database used by the backend. |
| `EADDRINUSE` on port 5000 | A process already uses the port. Stop your previous backend terminal with `Ctrl+C`. Keep port 5000 for the existing proxy. |
| API proxy error / frontend cannot reach API | Ensure Express started successfully on port 5000; check its direct health URL. Changing `PORT` alone does not update `client/vite.config.js`. |
| Login/register cannot complete | Check database tables and `JWT_SECRET`, restart Express, and retry. |
| `localhost:5000` does not show the login page | Use Vite's URL in development, or build and enable production mode as above. |
| Production mode cannot find `index.html` | Complete the frontend build so `client/dist/index.html` exists. |

### macOS or Linux equivalents

The setup order, `.env` contents, SQL commands, and seed behavior are the same. Install Git, Node.js 24, and MySQL Server for your OS and start MySQL using its service manager. Use `npm` instead of `npm.cmd`, and `mysql` instead of `mysql.exe`. Use your own absolute clone path.

Create the environment file with `cp server/.env.example server/.env` (only if it does not already exist), then edit it with your preferred editor. For the optional production run, use `NODE_ENV=production npm --prefix server start` instead of PowerShell's environment assignment. That sets the mode for that command only.

## Architecture and repository

```text
LabreserveDevOps/
├── client/              React, React Router, CSS, and Vite
├── database/schema.sql  Database and table definitions
├── server/              Express REST API and explicit MySQL queries
│   ├── config/          MySQL connection pool
│   ├── controllers/     Authentication, equipment, and request logic
│   ├── middleware/      Authentication and admin authorization
│   ├── routes/          /api/auth, /api/equipment, /api/requests
│   ├── scripts/         Seeds and MySQL connection test
│   ├── .env.example     Configuration template without credentials
│   └── server.js        Application entry point
├── AGENTS.md            Project rules
└── README.md
```

Development: **browser → Vite (:5173) → `/api` proxy → Express (:5000) → MySQL (:3306)**.

Production-like local run: **browser → Express (built React files and REST API) → MySQL**. Vite builds the frontend; Express is the application server.

The three tables are `users`, `equipment`, and `requests`. Passwords are hashed with bcrypt. JWT tokens authenticate API requests, and backend authorization enforces student/admin access.

The backend enforces first-come-first-served requesting: a MySQL transaction conditionally claims equipment only when it is `AVAILABLE`, checks the affected-row count, and inserts its `PENDING` request in the same transaction. An already-claimed item returns `409 Conflict`. A failed claim or insert is rolled back.
