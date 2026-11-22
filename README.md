# LabReserve

LabReserve is a laboratory equipment request and management web application built for a university project. It supports a student workflow for browsing equipment, creating requests, and tracking their own request history, alongside an admin workflow for managing equipment and processing requests.


## Overview

The application is designed around a simple first-come-first-served equipment request flow:

- Students can register and log in
- Students can browse, search, and filter equipment
- Students can request equipment only when it is available
- The backend enforces that only one active request can exist for each equipment item
- Admins can add, edit, and delete equipment where safe
- Admins can approve, reject, and return requests

## Roles

The app supports exactly two roles:

- STUDENT
- ADMIN

Students cannot create equipment, approve others' requests, or access admin-only endpoints. The admin account is created separately through a controlled setup process rather than being exposed as a student option during registration.

## Tech Stack

### Frontend

- React
- Vite
- JavaScript
- React Router
- Standard CSS

### Backend

- Node.js
- Express.js
- JavaScript
- MongoDB
- Mongoose
- JWT-based authentication

## Project Structure

```text
LabReserve/
├── client/
│   ├── src/
│   ├── index.html
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   └── vite.config.js
├── server/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── scripts/
│   ├── .env.example
│   ├── package.json
│   └── server.js
├── Dockerfile
├── compose.yaml
├── README.md
└── .gitignore
```

## Core Business Rules

Some of the most important rules in the project are:

- One equipment item can have only one active request at a time
- A request follows the lifecycle: PENDING -> APPROVED -> RETURNED or PENDING -> REJECTED / CANCELLED
- Equipment status is updated by the server-side request workflow, not only by the frontend
- Students can only cancel their own pending requests
- Admin actions are protected by backend authorization checks

## Features

### Student

- Register
- Login and logout
- View equipment catalog
- Search equipment by name or asset code
- Filter equipment by category
- View equipment details
- Request available equipment
- View personal requests
- Cancel pending requests

### Admin

- Login
- View dashboard summary
- View all equipment
- Add equipment
- Edit equipment
- Delete equipment when safe
- View all requests
- Approve and reject pending requests
- Mark borrowed equipment as returned

## Docker Setup

Compose runs exactly three containers:

- `frontend`: React served by Nginx at http://localhost:3000
- `backend`: Express API; seeds local data before accepting requests
- `database`: official `mongo:8.0` image from Docker Hub, with persistent `local_mongo_data` storage

All database data originates locally. There are no remote database connections, imports, or synchronization. Internet access is only needed to download images and build dependencies the first time.

### First startup (PowerShell)

Start Docker Desktop. From the repository root, create the settings file if it does not already exist:

```powershell
Copy-Item .\server\.env.example .\server\.env
notepad .\server\.env
```

Set `JWT_SECRET`, `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `STUDENT_PASSWORD`. Passwords must contain at least six characters. Keep `MONGODB_URI=mongodb://localhost:27018/labreserve`. Compose overrides this with `mongodb://database:27017/labreserve` inside the backend. Never commit `server/.env`.

```powershell
docker compose config -q
docker compose up --build -d --remove-orphans
docker compose ps
docker compose logs backend
```

The backend waits for healthy MongoDB, seeds it, and starts the API. The frontend then starts. Open http://localhost:3000 or http://localhost:3000/admin/login.

### Moving from the previous setup

Remove obsolete source/import variables from your existing `server/.env`, replace its database URI with the local URI above, and add `STUDENT_PASSWORD`. The new `local_mongo_data` volume starts clean and never reads the previous `mongo_data` volume. `--remove-orphans` removes the obsolete initializer container. The previous volume is left detached; it is not used by this application.

### Stop or reset

```powershell
docker compose down
```

Normal shutdowns and rebuilds preserve local data. To intentionally erase the current local data and seed a fresh database:

```powershell
docker compose down -v
docker compose up --build -d
```

The reset permanently deletes the current local database volume.

## Local Development

Start only MongoDB in Docker:

```powershell
docker compose up -d database
```

Run the backend from one terminal:

```powershell
cd server
npm ci
npm start
```

Run the frontend from another terminal:

```powershell
cd client
npm ci
npm run dev
```

The backend seeds automatically in this mode too. MongoDB is accessible to local tools at `mongodb://localhost:27018/labreserve`. Only loopback hosts and the Docker `database` hostname are accepted by the connection helper.

## Seed Data

The initial seed creates:

- One ADMIN using the `ADMIN_*` settings.
- Nimal Perera (`student1@example.com`) and Amaya Silva (`student2@example.com`), both STUDENT accounts using `STUDENT_PASSWORD`.
- 12 AVAILABLE equipment items across Electronics, Networking, Embedded Systems, and Tools.

Passwords are hashed using bcrypt. Requests start empty so students can demonstrate requesting, cancellation, approval, rejection, and return through the app.

A `local-seed-v1` record in the `initialization` collection is written only after all seed steps succeed. Later starts skip seeding, preserving changed passwords, deleted equipment, and request states. If the first seed is interrupted, rerunning skips records already created and finishes the remaining work.

To run the same initial seed manually from `server/`, use `npm run seed`. To explicitly add missing sample equipment, use `npm run seed:equipment`.

To change the admin password, update `ADMIN_PASSWORD` in `server/.env`, then recreate the backend so it receives the updated environment and run the admin script:

```powershell
docker compose up -d backend
docker compose exec backend npm run seed:admin
```

For a host-run backend, run `npm run seed:admin` from `server/`. The command hashes the new password and updates the configured admin; it refuses to promote an existing student account. Changing seed settings alone does not modify already-seeded accounts.

## API Summary

The backend exposes REST routes in the `/api` namespace, including:

- `/api/auth` for register, login, and current user lookup
- `/api/equipment` for equipment CRUD and listing
- `/api/requests` for student and admin request workflows

## Notes

- This project is intentionally simple and educational rather than over-engineered.
- The backend is the security boundary; role checks and workflow validations are enforced there.


## Important Project Guidance

This repository is intended to remain aligned with the project specification in AGENTS.md. The goal is a polished but understandable MERN application that demonstrates the core fundamentals of a university-level web app without unnecessary complexity.
