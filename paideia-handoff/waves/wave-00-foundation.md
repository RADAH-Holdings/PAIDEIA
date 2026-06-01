# Wave 00 — Foundation

> **Outcome:** A deployed three-service skeleton on Railway where a user can sign in via Clerk and reach a role-correct empty dashboard. The async backend is proven to actually run async. Nothing else works yet — and that is correct.

**Depends on:** nothing (this is the first wave)
**Implements (FSD):** AUTH-01, AUTH-02, AUTH-03 (identity bridge only) · **TSD:** §2, §3, §4, §6.2, §6.3, §8, §16
**Maps to:** TSD Implementation Sequence Phase 01

---

## Why This Wave Exists

The single biggest deployment risk in this system is the async model silently failing — Uvicorn workers misconfigured so async views run synchronously, or psycopg2 installed instead of psycopg3. If that happens it won't show up until Wave 04 under load, by which point it's expensive to diagnose. This wave proves the async path works end to end before any feature depends on it.

---

## Tasks

### T0.1 — Monorepo + Railway scaffolding
Create the repo structure (`backend/`, `frontend/`) per TSD §4. Create three Railway services: Next.js, Django, PostgreSQL 16, with private networking between Django and Postgres.
- **Acceptance:** All three services deploy. Django service reachable at its public URL returning a JSON health check. Postgres reachable from Django over private network only (no public endpoint).

### T0.2 — Django ASGI skeleton with verified async
Set up Django 5 project configured API-only (no user-facing templates; Django admin may stay). Install `psycopg[binary]`, `djangorestframework`, `django-cors-headers`. Procfile uses `gunicorn paideia.asgi:application -k uvicorn.workers.UvicornWorker`.
Add a throwaway async probe view that does `await asyncio.sleep(0.1)` then an `await Model.objects.acount()` against a trivial model, returning timing.
- **Acceptance (CRITICAL):** The probe view executes asynchronously under the deployed Uvicorn worker config and the async ORM call succeeds without `SynchronousOnlyOperation`. This is the gate for the entire project. Implements the TSD §16.1 "run command is non-negotiable" note.
- Remove the probe view before the wave is marked done (it was a proof, not a feature).

### T0.3 — Settings & environment
All config env-driven per TSD §6.3. Set every variable in Railway: `DJANGO_SECRET_KEY`, `DATABASE_URL`, `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL_VERSION`, `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`, `CORS_ALLOWED_ORIGINS`, `ALLOWED_HOSTS`, `AGENT_TIMEOUT_SECONDS`, `LOG_LEVEL`. CORS scoped to the Next.js URL only.
- **Acceptance:** App boots with zero hardcoded secrets. A missing required env var fails loudly at startup, not at first use.

### T0.4 — Clerk integration + identity bridge
Configure the Clerk project (email/password, forced password reset on first login, `public_metadata` schema carrying `role` + `school_id`). Build `ClerkJWTAuthentication` (DRF default auth class) per FSD AUTH-02/03 and TSD §8. On first valid JWT, upsert the local `User` populating ALL NOT NULL columns from claims (`name`, `email` from identity; `role`, `school_id` from public_metadata) — per the AUTH-03 fix.
- **Acceptance:** A request with a valid Clerk JWT resolves to a local `User`; an invalid/missing JWT returns 401 with the standard error envelope. A brand-new Clerk user gets a local row with all fields populated — no NOT NULL violation.

### T0.5 — `GET /api/v1/me` endpoint
Return the current user's profile (TSD §7.2): `id, name, email, role, school{id,name}, is_active`.
- **Acceptance:** Returns the correct profile for an authenticated user; 401 otherwise.

### T0.6 — Next.js shell + Clerk + role routing
Next.js 14 App Router with `@clerk/nextjs`. Middleware protects all routes except `(auth)/*`. Three route groups: `admin/*`, `teacher/*`, `student/*`, each with a layout that reads role from `/me` and redirects on mismatch. Apply the design system base: parchment canvas, Fraunces/Geist fonts loaded, token CSS variables defined per `docs/design-system.md`.
- **Acceptance:** Sign in → land on a role-correct empty dashboard styled with the design system (parchment canvas, correct fonts). Wrong-role route access redirects.

### T0.7 — `lib/api.ts` typed client + `lib/schemas.ts`
The single API client wrapping boundary B2 (TSD §11.1). Attaches the Clerk JWT, validates responses against zod schemas. Seed `schemas.ts` with the `Me` schema.
- **Acceptance:** `/me` is fetched through the typed client and validated by zod; a shape mismatch throws in development.

---

## Unit Tests

- `ClerkJWTAuthentication`: valid token → user; expired token → 401; missing token → 401; new user → row created with all NOT NULL fields populated. (Mock Clerk verification.)
- Permission class stubs `IsAdmin`, `IsTeacher`, `IsSameSchool`, `IsCourseOwnerOrAdmin` exist and return correct booleans against fixture users (full behavior tested in later waves).
- Error envelope serializer: any DRF exception renders as `{ "error": { code, message, detail } }`.
- Settings: app refuses to boot if a required env var is absent.

## Integration Tests

- **Auth round-trip:** issue a test JWT → `GET /me` through the real DRF stack → correct profile JSON, validated against the zod schema (run the schema in a small node test or mirror it in a python assertion).
- **Async path:** the probe view (before removal) returns successfully under the deployed worker class, proving async ORM works. Capture this as a one-off integration check; document the result in the wave PR even after the probe is removed.
- **CORS:** a request from a disallowed origin is rejected; from the Next.js origin is allowed.

## Definition of Done

A reviewer can: deploy all three services, sign in as each of the three roles (seeded manually via Clerk dashboard + a one-off Django shell command to set `public_metadata`), and land on three visually-distinct, design-system-styled empty dashboards. The async probe passed. No secrets in source. CI runs lint + the unit tests above and passes.

**Demo:** "A user signs in and is routed to a role-correct empty dashboard."
