# Wave 2 — Accounts & RBAC

> **Goal:** An admin can create teacher and student accounts, those users can log in
> and are forced to set a password, and the four permission classes enforce
> role + school scoping on every request.

**Realises:** FSD `ACC-01`–`ACC-06`, `AUTH-05` (IsSameSchool), `AUTH-07` (passwords) · TSD §6.1, §7.3, §8.2 · DS §19 (admin interface)
**Depends on:** Wave 1 (`User` model, simplejwt, `/me`).
**Feeds:** Wave 3 (course ownership relies on the teacher role + `IsCourseOwnerOrAdmin`).

---

## Scope

### In
- Admin account-management API: create user, list users, deactivate, reassign-courses-on-deactivation hook (the reassign target lands in W3 when courses exist — here it just returns affected courses, empty for now).
- Temp-password generation + welcome email (Django email backend) + `force_password_change` enforcement (`ACC-02`).
- `POST /auth/change-password` — clears the flag; API blocks all other actions from a flagged user.
- The four permission classes: `IsAdmin`, `IsTeacher`, `IsSameSchool`, `IsCourseOwnerOrAdmin` (the last is defined here, exercised in W3).
- Queryset scoping on list endpoints (school-scoped; the second line of defence after object permissions).
- Django password-reset flow (`AUTH-06`) wired to the email backend.
- Admin UI: user table, create-user form, deactivate action (DS §19).
- CI pipeline: lint + unit + integration + `makemigrations --check` on every PR.

### Out
- Courses, enrollment (W3) — `IsCourseOwnerOrAdmin` is defined but has no course to guard yet; unit-test it against a fixture course object.
- Any session/agent logic.

---

## Backend deliverables
- `accounts/views.py` — `POST /api/v1/admin/users`, `GET /api/v1/admin/users` (paginated, `?role=`/`?status=` filters), `PATCH /api/v1/admin/users/{id}/deactivate` (returns `affected_courses`, empty list until W3).
- `accounts/passwords.py` — temp-password generation, `POST /auth/change-password`, the force-change guard (middleware or permission that rejects flagged users on non-password-change endpoints).
- `accounts/permissions.py` — `IsAdmin`, `IsTeacher`, `IsSameSchool`, `IsCourseOwnerOrAdmin`.
- `accounts/emails.py` — welcome + reset email via Django email backend.
- `.github/workflows/ci.yml` — lint, pytest (unit + integration against a test Postgres), `makemigrations --check --dry-run`.

## Frontend deliverables
- `app/admin/users/page.tsx` — user table (name/email/role/status), create-user form, deactivate action. DS §19 admin surface (deep ink sidebar).
- `app/(auth)/change-password/page.tsx` — forced on first login.
- `lib/api.ts` + `lib/schemas.ts` — typed client + zod schemas for the account endpoints.

---

## Unit tests
| ID | Asserts |
|---|---|
| `T-W2-01` | `IsAdmin`/`IsTeacher` return correct booleans for each role. |
| `T-W2-02` | `IsSameSchool.has_object_permission` denies a cross-school object (`AUTH-05`). |
| `T-W2-03` | `IsCourseOwnerOrAdmin` grants the owning teacher and any admin; denies a non-owner teacher (fixture course). |
| `T-W2-04` | Create-user writes the row with role + school, a hashed temp password, and `force_password_change=True`. |
| `T-W2-05` | A flagged user calling any non-password-change endpoint is rejected with the redirect code; calling `/auth/change-password` succeeds and clears the flag (`ACC-02`). |
| `T-W2-06` | Deactivate sets `is_active=False`; a deactivated user can no longer obtain tokens (ties to `T-W1-04`). |
| `T-W2-07` | `GET /admin/users` returns only users in the admin's school; never another school's. |
| `T-W2-08` | A non-admin calling any `/admin/*` endpoint gets 403. |

## Integration seam — Wave 1 → Wave 2
`T-SEAM-W2`: admin creates a teacher via `POST /admin/users` → the welcome path
yields a usable temp password → that teacher logs in via the Wave-1 `/auth/login`
→ is forced to `/auth/change-password` → after changing, `/me` returns the teacher
profile. This proves W2's creation flow correctly produces a W1-authenticatable user.

## Manual demo
As admin: create a teacher and a student. Log out. Log in as the teacher with the
temp password — you're forced to set a new one. After that you reach the (empty)
teacher shell. Try to open `/admin/users` as the teacher — blocked.

## Exit criteria
- [ ] All `T-W2-*` green; `T-SEAM-W2` green.
- [ ] CI pipeline runs on PRs and blocks merge on failure or a missing migration.
- [ ] Cross-school access is impossible at the API (verified by `T-W2-02`/`T-W2-07`).
- [ ] A real admin can create accounts and a created user can complete forced password change on staging.
