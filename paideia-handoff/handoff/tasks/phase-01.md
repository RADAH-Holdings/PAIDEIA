# Wave 1 — Skeleton & Identity

> **Goal (one sentence):** Prove the deployment topology and the Django-issued-JWT
> login flow end-to-end, so every later wave can assume both work.

**Realises:** FSD `AUTH-01`, `AUTH-02`, `AUTH-03`, `AUTH-04`, `AUTH-06`, `AC-01` (partial) · TSD §2, §4, §6, §7.2, §8, §16 · DS §17–19 (role shells)
**Depends on:** nothing (first wave)
**Feeds:** Wave 2 (Accounts & RBAC) consumes the `User` model, the auth classes, and `/me`.

---

## Scope

### In
- Railway project: 3 services (Next.js, Django, Postgres) with private networking.
- ASGI deploy verified — an async hello-world view confirms Uvicorn workers actually run async.
- `accounts` app: `School` and `User` models + first migration. `User` carries `email`, `name`, `role`, `school`, `is_active`, `force_password_change`, and a Django-managed password hash (TSD §5.1).
- simplejwt configured as the DRF default auth class.
- `POST /api/v1/auth/login`, `POST /api/v1/auth/refresh`, `GET /api/v1/me` (TSD §7.2).
- A seed management command to create one School + one admin User (so login has something to authenticate against).
- Next.js shell: a Paideia-styled `/sign-in` page, a token-storage auth context, route-guard middleware, three empty role layouts (`admin/`, `teacher/`, `student/`).

### Out (do NOT build yet)
- Any account-creation UI (Wave 2).
- Business logic — courses, enrollments, sessions (later waves).
- Permission classes beyond `IsAuthenticated` (Wave 2 adds real RBAC).
- The full CI pipeline (end of Wave 2).
- Production environment — staging only.
- Password-reset email flow (Wave 2 with account creation; `AUTH-06` reset can stub here).

---

## Backend deliverables
- `backend/paideia/{settings,asgi,urls}.py` — env-driven settings, no hardcoded secrets. simplejwt access/refresh lifetimes from env.
- `Procfile` → `web: gunicorn paideia.asgi:application -k uvicorn.workers.UvicornWorker`
- Pre-deploy command: `python manage.py migrate --noinput`.
- `accounts/models.py` — `School`, `User` (extends `AbstractBaseUser`, `USERNAME_FIELD = 'email'`), all NOT NULL columns per TSD §5.1; `ix_users_email` unique index.
- `accounts/authentication.py` — simplejwt `JWTAuthentication` as default; `/auth/login`, `/auth/refresh` views. Login returns `{access, refresh, force_password_change}`; generic 401 on bad credentials or `is_active=False` (never reveal whether the email exists).
- `accounts/views.py` — `GET /api/v1/me` returning the exact TSD §7.2 shape.
- `accounts/management/commands/seed_admin.py` — create a School + admin User.

## Frontend deliverables
- `app/(auth)/sign-in/page.tsx` — Paideia-styled login (Fraunces title, parchment canvas, ink-blue primary button). Calls `/auth/login`, stores tokens.
- `lib/auth.ts` — auth context: holds user + tokens, attaches Bearer header, refreshes on 401.
- `middleware.ts` — redirect tokenless requests on protected routes to `/sign-in`.
- `app/{admin,teacher,student}/layout.tsx` — empty role shells, each reading role from `/me` and redirecting on mismatch.

---

## Unit tests
| ID | Asserts |
|---|---|
| `T-W1-01` | `User` model: email is unique, `force_password_change` defaults True, password is hashed (never stored plaintext). |
| `T-W1-02` | `/auth/login` with correct credentials returns access + refresh tokens. |
| `T-W1-03` | `/auth/login` with wrong password returns 401 with a generic message (no email-existence leak). |
| `T-W1-04` | `/auth/login` for an `is_active=False` user returns 401. |
| `T-W1-05` | `/auth/refresh` with a valid refresh token returns a new access token; invalid → 401. |
| `T-W1-06` | `/me` with a valid access token returns the exact §7.2 shape; with no token → 401. |
| `T-W1-07` | An async hello-world view returns under the Uvicorn worker without `SynchronousOnlyOperation`. |

## Integration seam — (none; first wave)
Instead, the **deployment seam**: a CI job hits the deployed staging `/me` with a
seeded admin token over real HTTPS and asserts 200 + correct shape. Proves the
3-service topology + private DB networking + ASGI all hold together.
`T-SEAM-W1`: login → receive token → call `/me` → correct admin profile, end-to-end on staging.

## Manual demo
Open staging `/sign-in`, log in as the seeded admin, land on the (empty) admin
shell. Refresh the page — you stay logged in. Open `/teacher` manually — you're
redirected because your role is admin.

## Exit criteria (all must pass before Wave 2)
- [ ] All `T-W1-*` unit tests green in CI.
- [ ] `T-SEAM-W1` passes against deployed staging.
- [ ] Async hello-world confirms Uvicorn workers (not sync fallback).
- [ ] No secret is hardcoded; all config is env-driven.
- [ ] Logging in as the seeded admin works in a real browser on staging.
