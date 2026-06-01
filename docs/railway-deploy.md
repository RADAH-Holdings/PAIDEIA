# Railway deployment (Paideia monorepo)

The repository root is **not** deployable by itself. Nixpacks/Railpack need a service root of `backend/` or `frontend/`.

Create **three** Railway resources:

| Resource | Type | Root Directory | Config file path |
|----------|------|----------------|------------------|
| Postgres | Database plugin | — | — |
| `paideia-api` | Web service | `backend` | `/backend/railway.toml` |
| `paideia-web` | Web service | `frontend` | `/frontend/railway.toml` |

## Backend service (`paideia-api`)

1. **Settings → Root Directory:** `backend`
2. **Settings → Config file path:** `/backend/railway.toml` (absolute from repo root)
3. **Variables** (minimum):
   - `DJANGO_SECRET_KEY` — generate a strong secret
   - `DATABASE_URL` — reference the Railway Postgres plugin
   - `CORS_ALLOWED_ORIGINS` — public URL of the frontend (e.g. `https://paideia-web-production.up.railway.app`)
   - `DJANGO_ALLOWED_HOSTS` — API hostname (e.g. `paideia-api-production.up.railway.app`)
4. **Deploy** — uses `backend/Dockerfile`; runs migrations via `preDeployCommand` in `railway.toml`
5. After first deploy: open a shell and run `python manage.py seed_admin` (or set `SEED_*` env vars before seeding)

## Frontend service (`paideia-web`)

1. **Settings → Root Directory:** `frontend`
2. **Settings → Config file path:** `/frontend/railway.toml`
3. **Variables**:
   - `NEXT_PUBLIC_API_URL` — `https://<your-api-host>/api/v1` (set at **build** time for Docker)
4. **Deploy** — uses `frontend/Dockerfile` (Next.js standalone)

## Networking

- Reference the API’s public URL in `NEXT_PUBLIC_API_URL`.
- Reference the web app’s public URL in backend `CORS_ALLOWED_ORIGINS`.
- Prefer Railway private networking for `DATABASE_URL` (plugin reference), not a public Postgres URL.

## Common error

```
Nixpacks was unable to generate a build plan for this app.
The contents of the app directory are: frontend/ backend/ docs/ ...
```

**Cause:** Root Directory is empty or `/` (repo root).

**Fix:** Set Root Directory to `backend` or `frontend` for each web service.
