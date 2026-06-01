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
5. After first deploy: open a **shell** on the backend service and run:
   ```bash
   python manage.py seed_admin
   ```
   `SEED_*` variables only supply defaults to that command — they do **not** create a user on their own.

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

**`POST /api/v1/auth/login` returns 500** — The app reached Django but something failed server-side. Common causes:

1. **Migrations not applied** — Run pre-deploy `python manage.py migrate --noinput`, or in a shell: `python manage.py migrate`. Without tables, login raises a database error (500).
2. **No admin user** — Run `python manage.py seed_admin` once in a Railway shell (with `SEED_*` set if you want custom email/password).
3. **`DATABASE_URL` missing or wrong** — Backend service must reference the Postgres plugin; check Variables.

Check **Deploy logs** (runtime) or open a shell and run `python manage.py showmigrations accounts` — all should show `[X]`.

**`//api/v1/...` returns 404** — Frontend `NEXT_PUBLIC_API_URL` has a **trailing slash**. Use:

`https://<api-host>/api/v1` (no slash at the end)

Wrong: `https://<api-host>/api/v1/`
