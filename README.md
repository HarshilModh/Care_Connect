# care_connect_final

A small full-stack project (frontend + backend) configured to run with Docker Compose.

## What this repo contains

- `backend/` — Node/Express API
- `frontend/` — Vite + React app
- `docker-compose.yml` — brings up API, frontend (dev server), MongoDB and Redis

## Prerequisites

- Docker & Docker Compose (desktop on macOS)
- (Optional) Node.js/npm/yarn for local development without Docker

## Quick start (recommended — Docker)

From the project root:

```bash
# stop any previous run
docker compose down

# build and start all services
docker compose up --build
```

This will:
- Build and run the `api` service on container port 3000 (host mapped to 3000)
- Start the frontend dev server on container port 5173 (host mapped to 5173)
- Run MongoDB and Redis containers

Frontend will use the environment variable `VITE_API_URL` configured in `docker-compose.yml` (by default: `http://localhost:3000/api`).

## Local development (without Docker)

Backend (from `backend/`):

```bash
cd backend
npm install
npm run dev # or npm start depending on package.json scripts
```

Frontend (from `frontend/`):

```bash
cd frontend
npm install
npm run dev
```

When running locally, make sure to set the frontend's API base URL (for Vite) — e.g. create `.env` with `VITE_API_URL=http://localhost:3000/api` or set it in your dev environment.

## Ports

- API: http://localhost:3000
- Frontend: http://localhost:5173
- MongoDB: 27017 (container mapped to host 27017 by default)
- Redis: 6379 (container mapped to host 6379 by default)

## Redis port conflict (common issue)

If you see an error like:

```
Bind for 0.0.0.0:6379 failed: port is already allocated
```

That means something on your host is already listening on port 6379 (commonly a local Redis server). You have two main options:

1) Stop the host Redis service (macOS Homebrew example):

```bash
# check brew services
brew services list
# stop redis if it's running via brew
brew services stop redis
```

Or find and kill the process directly:

```bash
# find process using port 6379
lsof -iTCP:6379 -sTCP:LISTEN -n -P
# kill the PID shown (use cautiously)
sudo kill -9 <PID>
```

2) Change the host port mapping in `docker-compose.yml` to avoid colliding with host 6379. Example — map host 6380 to container 6379:

```yaml
services:
  redis:
    image: redis:7
    ports:
      - "6380:6379"
```

After changing the port mapping, update any code/config that connects to Redis from the host (if needed). Containers can still talk to each other using the container port `6379` (no host mapping required for inter-container communication).

Alternatively, if you don't need external access to Redis from the host, you can remove the `ports:` mapping for Redis entirely — containers will still be able to connect internally via the service name `redis:6379`.

## Notes about volumes and node_modules

The Compose file mounts the project directories into `/app` and uses a separate `node_modules` volume path (`/app/node_modules`) to avoid host/guest permission issues. If you face strange permissions or differences between host and container node modules, consider using a named volume for node_modules or avoid mounting `node_modules` from host.

Example named volume (in `docker-compose.yml`):

```yaml
volumes:
  backend_node_modules:
```

Then use it in `api` service:

```yaml
    volumes:
      - ./backend:/app
      - backend_node_modules:/app/node_modules
```

## Troubleshooting

- If a service fails to start, run `docker compose logs <service>` to inspect output.
- To rebuild after code or Dockerfile changes: `docker compose up --build`.
- To run detached: `docker compose up -d --build` and `docker compose logs -f` to follow logs.

## Project-specific env files

The `api` service reads environment from `backend/.env` (see `docker-compose.yml`). Make sure required variables are present.

## Next steps / Improvements

- Add a healthcheck for services in `docker-compose.yml`.
- Use named volumes for `node_modules` to make developer experience smoother across platforms.

---

If you'd like, I can also:
- Add a short `Makefile` or npm scripts to simplify common Docker commands.
- Update `docker-compose.yml` to use a non-conflicting Redis host port or add named volumes.

