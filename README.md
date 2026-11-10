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

Docker Compose runs the frontend and backend in separate containers. MongoDB runs remotely (MongoDB Atlas), so it does not appear in `docker ps`:

- `frontend`: builds the React app and serves it with Nginx on `http://localhost:3000`
- `backend`: runs the Express API and connects to the remote MongoDB URL in `server/.env`
- `database`: remote MongoDB Atlas service, not a local Docker container

The frontend's Nginx server forwards `/api` requests to the backend, so the browser uses the same origin for the UI and API. Compose reads the database and JWT settings from `server/.env`.

### Start the whole project (PowerShell)

1. Start Docker Desktop and wait for it to finish starting.
2. If you do not already have `server/.env`, create it from the example and open it:

```powershell
Copy-Item .\server\.env.example .\server\.env
notepad .\server\.env
```

Set `MONGODB_URI` to your remote MongoDB connection string and set a private `JWT_SECRET`. Keep any existing admin settings that match the account in your remote database. Do not commit `server/.env`.

3. From the repository root, build and start the containers in the background:

```bash
docker compose up --build -d
```

4. Confirm the containers are running:

```bash
docker compose ps
```

You should see `frontend` and `backend`; MongoDB is remote, so it will not appear as a container. Open the student sign-in page at `http://localhost:3000` or the admin sign-in page at `http://localhost:3000/admin/login`.

To follow application logs, run:

```bash
docker compose logs -f
```

Press `Ctrl+C` to stop following logs; this does not stop the containers. To stop and remove the app containers and network, run:

```bash
docker compose down
```

To rebuild after changing application code, run `docker compose up --build -d` again. The remote MongoDB database is not stopped or changed by `docker compose down`.

## Local Setup

### 1. Install dependencies

From the project root, install the frontend and backend dependencies separately:

```bash
cd client
npm install

cd ../server
npm install
```

### 2. Configure environment variables

Create a `.env` file inside the `server/` folder with the required values:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
```

### 3. Start the backend

```bash
cd server
node server.js
```

### 4. Start the frontend

In a separate terminal:

```bash
cd client
npm run dev
```

The frontend will run using Vite, and the backend will serve the API routes under `/api`.

## Seed Data

The server includes scripts for initial setup:

```bash
cd server
npm run seed:admin
npm run seed:equipment
```

These are useful for creating an initial admin account and example equipment records during development.

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
