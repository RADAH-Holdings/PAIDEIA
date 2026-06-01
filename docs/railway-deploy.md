# Railway deployment (Paideia monorepo)

The repository root is **not** deployable by itself. Nixpacks needs a service **Root Directory** of `backend` or `frontend`.

Create **three** Railway resources:

| Resource | Type | Root Directory |
|----------|------|----------------|
| Postgres | Database plugin | — |
| `paideia-api` | Web service | `backend` |
| `paideia-web` | Web service | `frontend` |

Optional: leave **Config file path** empty, or point at `/railway.toml` (Nixpacks builder only).

## Backend service (`paideia-api`)

1. **Settings → Root Directory:** `backend` (not repo root)
2. **Settings → Pre-deploy command** (single line): `python manage.py migrate --noinput`
3. **Start command:** from `Procfile` (Gunicorn + Uvicorn workers) — Railway detects this automatically when Root Directory is `backend`
4. **Variables** (minimum):
   - `DJANGO_SECRET_KEY` — generate a strong secret
   - `DATABASE_URL` — reference the Railway Postgres plugin
   - `CORS_ALLOWED_ORIGINS` — public URL of the frontend (e.g. `https://paideia-web-production.up.railway.app`)
   - `DJANGO_ALLOWED_HOSTS` — API hostname (e.g. `paideia-api-production.up.railway.app`)
5. After first deploy: open a shell and run `python manage.py seed_admin` (or set `SEED_*` env vars before seeding)

## Frontend service (`paideia-web`)

1. **Settings → Root Directory:** `frontend`
2. **Variables**:
   - `NEXT_PUBLIC_API_URL` — `https://<your-api-host>/api/v1` (must be set before build)
3. Nixpacks runs `npm run build`; start with `npm start` (or Railway’s detected Next.js start)

## Networking

- Reference the API’s public URL in `NEXT_PUBLIC_API_URL`.
- Reference the web app’s public URL in backend `CORS_ALLOWED_ORIGINS`.
- Prefer Railway private networking for `DATABASE_URL` (plugin reference), not a public Postgres URL.

## Common errors

**Nixpacks cannot generate a build plan** — Root Directory is empty or `/` (repo root). Set it to `backend` or `frontend`.

**`preDeployCommand: Array must contain at most 1 element`** — Do not put a multi-element array in `railway.toml`. Use the dashboard **Pre-deploy command** as one string: `python manage.py migrate --noinput`.
