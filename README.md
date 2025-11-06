# CareConnect

CareConnect is a MERN based caregiving collaboration platform.
Families, caregivers and care recipients can coordinate care activities in one place.

---

## Repository Structure

```
/backend      Node plus Express API
/frontend     React with Vite
docker-compose.yml   Starts backend, frontend, MongoDB, Redis
```

---

## Requirements

* Docker Desktop (Mac, Windows or Linux)
* Optional: Node JS for running backend or frontend without Docker

---

## Start the entire project with Docker (recommended)

From the project root folder:

```sh
docker compose down
docker compose up --build
```

What happens

| Service     | URL or Port                                    | Description                                 |
| ----------- | ---------------------------------------------- | ------------------------------------------- |
| Backend API | [http://localhost:3000](http://localhost:3000) | Express server connected to Mongo and Redis |
| Frontend    | [http://localhost:5173](http://localhost:5173) | Vite development server with hot reload     |
| MongoDB     | 27017                                          | Data persistence through Docker volume      |
| Redis       | 6379                                           | Token caching and background processes      |

The frontend reads the API base URL from the environment variable `VITE_API_URL` set inside docker compose.

---

## Run locally without Docker (development mode)

### Backend

```sh
cd backend
npm install
npm run dev
```

Your backend `.env` should contain:

```
MONGODB_URI=mongodb://127.0.0.1:27017/care_connect_db
REDIS_URL=redis://127.0.0.1:6379
```

### Frontend

```sh
cd frontend
npm install
npm run dev
```

Create `frontend/.env`:

```
VITE_API_URL=http://localhost:3000/api
```

---

## Optional: Run MongoDB and Redis manually (useful when backend runs with nodemon)

### Start MongoDB with volume persistence

```sh
docker run -d \
  --name mongodb \
  -p 27017:27017 \
  -v mongo-data:/data/db \
  mongo:7
```

### Start Redis

```sh
docker run -d \
  --name redis \
  -p 6379:6379 \
  redis:7 --appendonly yes
```

### Stop or start later

```sh
docker stop mongodb redis
docker start mongodb redis
```

You do not need to recreate containers every time.
Just stop and start them.

---

## Redis port already in use

If Redis is already running on your machine you may see:

```
Bind for port 6379 failed: port is already allocated
```

Fix option:

Stop the local Redis service if installed via Homebrew:

```sh
brew services stop redis
```

Or change Redis port inside docker compose:

```yaml
redis:
  ports:
    - "6380:6379"
```

---

## Notes about volumes and node modules

Docker compose keeps the backend and frontend `node_modules` isolated using volumes.
This avoids permission issues between host and container.

Example in `docker-compose.yml`:

```yaml
volumes:
  backend_node_modules:
```

Then referenced in backend service:

```yaml
volumes:
  - ./backend:/app
  - backend_node_modules:/app/node_modules
```

---

## Troubleshooting

| Problem                      | Solution                        |
| ---------------------------- | ------------------------------- |
| Service is not starting      | `docker compose logs <service>` |
| Need to rebuild containers   | `docker compose up --build`     |
| Run containers in background | `docker compose up -d`          |
| Follow logs live             | `docker compose logs -f`        |

---

## Environment file locations

* Backend uses: `backend/.env`
* Frontend uses: `frontend/.env`
* Docker Compose injects both automatically

---

## Future improvements

* Add health checks for Mongo and Redis
* Add Makefile or npm scripts to simplify common Docker commands

---

If you want, I can also generate:

* a Makefile (`make up`, `make stop`, `make restart`)
* a production compose file for deployment
* a small architecture diagram for the README

Just say:

> add Makefile and architecture diagram
