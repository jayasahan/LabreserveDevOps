# LabReserve Run Guide

This guide explains how to start and stop LabReserve on Windows using PowerShell and Docker Desktop.

## What runs

Docker Compose starts:

- **Frontend:** the website at `http://localhost:3000`
- **Backend:** the API used by the website
- **Database:** local MongoDB, saved in a Docker volume
- **Database initializer:** a one-time task that copies a database from Atlas the first time the local database is empty

After the copy, the app uses the local database. It does not keep syncing with Atlas. The local MongoDB port for tools such as MongoDB Compass is `27018`.

## First-time setup

### 1. Start Docker Desktop

Open Docker Desktop and wait for it to finish starting.

### 2. Open PowerShell in the project folder

```powershell
cd "C:\Users\jayas\Desktop\MY PROJECTS\LabreserveDevOps"
```

### 3. Check Docker

```powershell
docker version
docker compose version
```

Both commands should show version information without an error.

### 4. Set up the environment file

The file `server\.env` contains private settings. If it does not exist, create it from the example:

```powershell
Copy-Item .\server\.env.example .\server\.env
```

Open it:

```powershell
notepad .\server\.env
```

For the first import from Atlas, set these values:

```env
MONGODB_URI=mongodb://localhost:27018/labreserve
MONGODB_SOURCE_URI=your_Atlas_connection_string
MONGODB_SOURCE_DATABASE=your_Atlas_database_name
PORT=5000
JWT_SECRET=your_private_secret
```

Replace the example values with your own. `MONGODB_SOURCE_DATABASE` is the database name in Atlas. Keep any existing `ADMIN_*` settings. Save the file and close Notepad.

In Atlas, make sure the database user can read the selected database and that Atlas Network Access allows your current IP address.

**Never share or commit `server\.env`. Do not paste its contents into chat.**

### 5. Build and start the application

Run these commands from the project folder:

```powershell
docker compose config -q
docker compose up --build -d
```

The first startup waits for local MongoDB, imports the configured Atlas database, and then starts the backend and frontend. It can take a few minutes.

### 6. Check that it started

```powershell
docker compose ps -a
docker compose logs database-init
Invoke-RestMethod http://localhost:3000/api/health
```

The `database-init` service should show `Exited (0)` after a successful import. That is normal; it is a one-time task. Its log should say `Initial remote database copy completed`. MongoDB and the backend should show as healthy, and the health check should return `status: ok`.

Open the website at:

```text
http://localhost:3000
```

## Start the application next time

The local database is already initialized, so there is no need to re-import from Atlas for normal use.

1. Start Docker Desktop.
2. Open PowerShell and go to the project folder:

   ```powershell
   cd "C:\Users\jayas\Desktop\MY PROJECTS\LabreserveDevOps"
   ```

3. Start the app:

   ```powershell
   docker compose up -d
   ```

4. Check it and open the website:

   ```powershell
   docker compose ps
   Invoke-RestMethod http://localhost:3000/api/health
   ```

   Go to `http://localhost:3000` in your browser.

Use `docker compose up --build -d` instead if you changed the application code and need Docker to rebuild the images.

## Stop the application

From the project folder, run:

```powershell
docker compose down
```

This stops and removes the LabReserve containers and network. **It keeps the local MongoDB data.** Start it again later with `docker compose up -d`.

## Useful commands

Show service status:

```powershell
docker compose ps -a
```

Show logs:

```powershell
docker compose logs
```

Follow logs while the app runs. Press `Ctrl+C` to stop viewing logs; this does not stop the app:

```powershell
docker compose logs -f
```

Show logs for one service:

```powershell
docker compose logs database
docker compose logs database-init
docker compose logs backend
docker compose logs frontend
```

Rebuild and restart after changing code:

```powershell
docker compose up --build -d
```

## Import a fresh copy from Atlas

Only do this if you intentionally want to erase the local database and copy Atlas again.

> **Warning:** The next command permanently deletes LabReserve's local MongoDB data. It does not delete or change the Atlas database.

```powershell
docker compose down -v
docker compose up --build -d
```

The new startup performs the initial Atlas copy again. Do not use `down -v` just to stop the app.

## Troubleshooting

### Docker is not running

Start Docker Desktop, wait until it is ready, then check:

```powershell
docker version
```

### Port 3000 is already in use

Another app is using the website port. Stop that app or change the frontend port mapping in `compose.yaml`.

### Port 27018 is already in use

Another app is using the optional local MongoDB port. The app containers communicate with MongoDB over Docker's private network, but the current Compose setup also publishes MongoDB on the host. Stop the other app or change the published port in `compose.yaml`.

### The import fails

Read the initializer and database logs:

```powershell
docker compose logs database-init
docker compose logs database
```

Check that `MONGODB_SOURCE_URI` and `MONGODB_SOURCE_DATABASE` in `server\.env` are correct. In Atlas, check the database user's permissions and Network Access IP allowlist. Do not share logs or settings that contain passwords or connection strings.

### The app is not responding

Check service status and backend logs:

```powershell
docker compose ps -a
docker compose logs backend
docker compose logs frontend
```

## Running without Docker

For local development without the frontend and backend containers, the backend expects MongoDB at `mongodb://localhost:27018/labreserve`. Start the Docker MongoDB service first:

```powershell
docker compose up -d database
```

Then, in separate PowerShell windows:

```powershell
Set-Location "C:\Users\jayas\Desktop\MY PROJECTS\LabreserveDevOps\server"
node server.js
```

```powershell
Set-Location "C:\Users\jayas\Desktop\MY PROJECTS\LabreserveDevOps\client"
npm run dev
```

The Vite development website address is printed in the client terminal. To stop the local database afterward, return to the project folder and run `docker compose down`.
