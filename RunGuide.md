# LabReserve Run Guide

Run commands below in PowerShell from the repository root. See [README.md](README.md#docker-setup) for environment setup, seed accounts, and migration details.

## First startup

1. Start Docker Desktop and wait until its engine is ready.
2. Copy `server/.env.example` to `server/.env` if needed.
3. Set the JWT secret, admin details, and student password. Keep the local MongoDB URI from the example.
4. Run:

```powershell
docker compose config -q
docker compose up --build -d --remove-orphans
docker compose ps
Invoke-RestMethod http://localhost:3000/api/health
```

Exactly three services run: frontend, backend, and database. The database uses the official MongoDB image. The backend seeds one admin, two students, and 12 equipment items from local scripts before opening the API. No remote data is used. Requests start empty.

Open http://localhost:3000. Students sign in as `student1@example.com` or `student2@example.com` with the configured `STUDENT_PASSWORD`. Admin login is http://localhost:3000/admin/login using your `ADMIN_EMAIL` and `ADMIN_PASSWORD`.

## Normal use

```powershell
docker compose up -d
docker compose logs -f backend
docker compose down
```

Press Ctrl+C to stop following logs. Shutdowns keep the local data. Use `docker compose up --build -d` after code changes. The seed completion marker prevents restarts from resetting records.

## Fresh seed

This permanently deletes the current local database, including all changes made through the app:

```powershell
docker compose down -v
docker compose up --build -d
```

The next start seeds from the repository again. The new `local_mongo_data` volume is separate from the old setup's detached `mongo_data` volume.

## Troubleshooting

- Docker connection error: start Docker Desktop and check `docker version`.
- Backend unhealthy: check `docker compose logs backend database`. Ensure all seed settings are supplied and passwords are at least six characters. Admin and sample student emails must differ.
- Port conflict: free port 3000 or 27018, or adjust the host mapping in `compose.yaml`. If changing 27018, update the host-run backend URI too.
- Old database URL: the backend rejects remote hosts. Use `mongodb://localhost:27018/labreserve` for host development; Compose supplies its own local URI.

For host development and explicit admin password changes, follow [README.md](README.md#local-development).
