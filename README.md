# Garmin Fitness Dashboard

A personal, modern fitness dashboard for Garmin data.

## Features

- Currently, mostly supports run and swim activities.
- Synchronization with Garmin Connect.
- Local SQLite database to store data.

## Docker hosting

This project is designed to run with `docker-compose` and a reverse proxy such as nginx.

### What to configure

Copy `.env.example` to `.env` and set:

- `GARMIN_EMAIL` and `GARMIN_PASSWORD`: your Garmin Connect credentials.
- `SYNC_PIN`: a private pin used to authorize manual syncs from the UI.
- `NEXT_PUBLIC_API_URL`: the public URL the browser should call for the API.
  - Local development: `http://localhost:8000/api`
  - Hosted with domain: `https://your-domain.com/api`
- `ENABLE_AUTO_SYNC`: set to `true` if you want background syncs.
- `FRONTEND_PORT` and `BACKEND_PORT`: host ports to publish.
- `API_HOST` and `API_PORT`: backend bind address and internal port. The defaults are fine for Docker.
- `DATABASE_URL` and other backend-only settings can stay in `backend/.env` if you want, but the root `.env` is enough for Docker.

### What to expose

The containers listen on:

- frontend: internal port `3000`
- backend: internal port `8000`

You usually do **not** need to expose both publicly if a reverse proxy is in front.

- If the rever proxy terminates traffic on the host, publish the containers only to localhost or keep them behind the Docker network.
- If you want direct access without a rever proxy, publish both ports and use `http://server:3000` for the frontend and `http://server:8000` for the API.

### How to deploy

1. Copy `.env.example` to `.env` and fill in the values above.
2. Build and start the stack:

   ```bash
   docker-compose up -d --build
   ```

3. Verify the frontend is reachable and can call the API through the URL in `NEXT_PUBLIC_API_URL`.
4. If you change `NEXT_PUBLIC_API_URL`, rebuild the frontend image so the new value is baked into the client bundle.

### nginx reverse proxy example

If you want one public domain, proxy the frontend and API through nginx:

```nginx
server {
    server_name your-domain.com;

    location /api/ {
        proxy_pass http://127.0.0.1:8000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

If the frontend and API are on different origins, make sure the backend CORS allowlist includes the frontend domain.
