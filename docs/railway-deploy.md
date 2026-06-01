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
2. **Settings → Pre-deploy command** (single line — use the Nixpacks venv Python):
   ```bash
   /opt/venv/bin/python manage.py migrate --noinput
   ```
3. **Start command:** from `Procfile` (Gunicorn + Uvicorn workers) — Railway detects this automatically when Root Directory is `backend`
4. **Variables** (minimum):
   - `DJANGO_SECRET_KEY` — generate a strong secret
   - `DATABASE_URL` — reference the Railway Postgres plugin
   - `CORS_ALLOWED_ORIGINS` — public URL of the frontend (e.g. `https://paideia-web-production.up.railway.app`)
   - `PAIDEIA_WEB_ORIGIN` — same frontend URL (for password-reset links in email), **no extra quotes** at the end
   - `ZEPTOMAIL_SEND_MAIL_TOKEN` — Send Mail token from ZeptoMail (paste the token only — **not** wrapped in `<` `>`)
   - `ZEPTOMAIL_FROM_EMAIL` — must match a verified sender/domain in ZeptoMail (e.g. `noreply@eval.i4nnova.com`)
   - `ZEPTOMAIL_HOSTED_REGION` — optional; default `zeptomail.zoho.com` (use your region if different)
   - `DJANGO_ALLOWED_HOSTS` — API hostname (e.g. `paideia-api-production.up.railway.app`), not `*` in production
   - Leave `JWT_SIGNING_KEY` **unset** entirely. An **empty** variable (`JWT_SIGNING_KEY=""`) breaks login.
5. After first deploy: `railway ssh` into the backend (or use the dashboard shell) and run:
   ```bash
   /opt/venv/bin/python manage.py migrate --noinput
   /opt/venv/bin/python manage.py seed_admin
   ```
   Plain `python` in SSH often hits the system interpreter (no Django). Nixpacks installs deps under `/opt/venv`.

   Or activate the venv first: `source /opt/venv/bin/activate`, then `python manage.py …`.

   `SEED_*` variables only supply defaults to `seed_admin` — they do **not** create a user on their own.

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

**`preDeployCommand: Array must contain at most 1 element`** — Do not put a multi-element array in `railway.toml`. Use the dashboard **Pre-deploy command** as one string: `/opt/venv/bin/python manage.py migrate --noinput`.

**`ModuleNotFoundError: No module named 'django'` in SSH** — Use `/opt/venv/bin/python`, not bare `python`. Same for pre-deploy if migrations never ran.

**`jwt.exceptions.InvalidKeyError: HMAC key must not be empty`** — `JWT_SIGNING_KEY` is defined in Railway but empty. Delete that variable (JWTs will use `DJANGO_SECRET_KEY`) or set it to a long random string. Redeploy after changing variables.

**`POST /api/v1/auth/login` returns 500** — The app reached Django but something failed server-side. Common causes:

1. **Migrations not applied** — Run `/opt/venv/bin/python manage.py migrate --noinput` (pre-deploy or SSH). Without tables, login raises a database error (500).
2. **No admin user** — Run `/opt/venv/bin/python manage.py seed_admin` once in SSH (with `SEED_*` set if you want custom email/password).
3. **`DATABASE_URL` missing or wrong** — Backend service must reference the Postgres plugin; check Variables.

Check **Deploy logs** (runtime) or in SSH run `/opt/venv/bin/python manage.py showmigrations accounts` — all should show `[X]`.

**`//api/v1/...` returns 404** — Frontend `NEXT_PUBLIC_API_URL` has a **trailing slash**. Use:

`https://<api-host>/api/v1` (no slash at the end)

Wrong: `https://<api-host>/api/v1/`

## Transactional email (ZeptoMail)

Set on the **backend** service (no angle brackets or extra quotes around values):

| Variable | Example |
|----------|---------|
| `ZEPTOMAIL_SEND_MAIL_TOKEN` | Paste the Send Mail token from ZeptoMail (raw secret is fine; Paideia adds `Zoho-enczapikey` if missing) |
| `ZEPTOMAIL_FROM_EMAIL` | `noreply@your-verified-domain.com` — domain must be verified on your ZeptoMail Agent |
| `ZEPTOMAIL_HOSTED_REGION` | Optional. Default `zeptomail.zoho.com`. Use `zeptomail.zoho.eu` if your Zoho account is EU. |
| `PAIDEIA_WEB_ORIGIN` | `https://your-frontend.up.railway.app` — no trailing `"` |

**Do not** wrap the token in `<` `>` or `"` in Railway. Delete an empty `JWT_SIGNING_KEY` variable.

After deploy, verify from Railway SSH:

```bash
/opt/venv/bin/python manage.py send_test_email you@example.com
```

If ZeptoMail rejects the send, the command exits with an error (previously the API could return 200 while nothing was delivered).

**Resend welcome** sends to the user’s **account email** in the database — update the user’s email in Admin → Users if they should receive mail at a different address.

Check spam and ZeptoMail → Reports for bounces. Rotate the send token if it was ever pasted into chat or logs.
