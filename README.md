# LabReserve

LabReserve is a laboratory equipment request and management web application. Students can browse equipment, search and filter the catalogue, request available items, and manage their own requests. Administrators can manage equipment and approve, reject, or return requests.

The project is intentionally small and explainable. It demonstrates a three-tier web application using React, Express, and MySQL, including JWT authentication, bcrypt password hashing, role-based access control, and first-come-first-served equipment requesting.

## Features

- Student registration and login
- Admin login and seeded admin account
- JWT authentication and role-based authorization
- Equipment browsing, search, filtering, and details
- Admin equipment create, edit, and safe delete operations
- Student request creation, request history, and pending cancellation
- Admin request approval, rejection, and return actions
- Atomic equipment claiming so only one student can request an available item

## Architecture

### Development

```text
Browser
   |
   v
React/Vite development server (:5173)
   |
   | /api proxy
   v
Express REST API (:5000)
   |
   v
MySQL (:3306)
```

Vite serves the React application during development and proxies `/api` requests to Express. Express uses `mysql2/promise` and parameterized SQL queries to access MySQL.

### Production-like local run

```text
Browser
   |
   v
Express application
   |\
   | +-- serves client/dist
   | +-- handles /api/*
   v
MySQL
```

Vite builds the frontend into `client/dist`. When `NODE_ENV=production`, Express serves that build and continues to handle the REST API. Docker and other deployment tooling are intentionally outside the current project stage.

## Repository structure

```text
LabReserve/
├── client/              React and Vite frontend
├── database/schema.sql  MySQL database schema
├── server/              Express API and MySQL access
├── AGENTS.md            Project architecture and coding instructions
└── README.md            Project documentation
```

Important backend areas:

```text
server/
├── config/mysql.js
├── controllers/
├── middleware/
├── routes/
├── scripts/
└── server.js
```

The database contains three tables: `users`, `equipment`, and `requests`.

## Prerequisites

- Node.js and npm
- MySQL Server running locally
- A MySQL account that can create and use the LabReserve database

## Setup

From the repository root, install dependencies:

```powershell
npm.cmd --prefix server install
npm.cmd --prefix client install
```

Create the server environment file:

```powershell
Copy-Item server/.env.example server/.env
```

Edit `server/.env` with local values. A normal local configuration uses:

```dotenv
PORT=5000
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_NAME=labreserve
JWT_SECRET=replace_with_a_long_random_value
ADMIN_NAME=LabReserve Admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=replace_with_a_secure_password
```

Do not commit `server/.env` or real credentials.

## Create the database schema

The schema creates the `labreserve` database and its three tables:

```powershell
Get-Content -Raw database/schema.sql | mysql.exe -u YOUR_MYSQL_USER -p
```

The schema defines foreign keys from `requests.student_id` to `users.id` and `requests.equipment_id` to `equipment.id`. It also defines the unique email and asset-code constraints and indexes used by request queries.

## Seed data

Create the administrator configured in `server/.env`:

```powershell
npm.cmd --prefix server run seed:admin
```

Insert the twelve demonstration equipment records. Existing records with the same asset code are skipped:

```powershell
npm.cmd --prefix server run seed:equipment
```

## Run in development

Start the Express API in one terminal:

```powershell
npm.cmd --prefix server start
```

Start the Vite development server in another terminal:

```powershell
npm.cmd --prefix client run dev
```

Open the URL printed by Vite, normally `http://localhost:5173`.

The API health endpoint is:

```text
GET http://localhost:5000/api/health
```

The server performs `SELECT 1` against MySQL before it begins listening.

## Run the production-like local application

Build the React frontend:

```powershell
npm.cmd --prefix client run build
```

Start Express with production serving enabled:

```powershell
$env:NODE_ENV = 'production'
npm.cmd --prefix server start
```

Open `http://localhost:5000`. Express serves the compiled React application from `client/dist` and handles `/api/*` routes.

## Useful checks

Test the MySQL connection:

```powershell
npm.cmd --prefix server run test:mysql
```

Build the frontend:

```powershell
npm.cmd --prefix client run build
```

## Business rule

When a student requests equipment, the API uses a MySQL transaction and conditionally updates the equipment only when its status is `AVAILABLE`. The request is inserted as `PENDING` in the same transaction. If another student has already claimed the item, the update affects zero rows and the API returns `409 Conflict`. This preserves first-come-first-served behavior even when requests arrive at nearly the same time.
