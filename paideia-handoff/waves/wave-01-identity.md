# Wave 01 — Identity & Account Management

> **Outcome:** An administrator can create a school, create teacher and student accounts, deactivate accounts, and reassign courses (the reassign action exists even though courses don't yet — it's exercised in Wave 02). The full RBAC permission layer is live and enforced.

**Depends on:** Wave 00 (auth bridge, `/me`, permission stubs)
**Implements (FSD):** ACC-01 → ACC-06, AUTH-04, AUTH-05, AUTH-06 · **TSD:** §7.3, §8.2
**Maps to:** TSD Implementation Sequence Phase 02 (accounts half)

---

## Tasks

### T1.1 — Data models: School, User
Implement `schools` and `users` tables exactly per TSD §5.1 / §17. `users` stores `clerk_user_id` (unique), `name`, `email`, `role`, `school_id`, `is_active`. Migrations run as a Railway release-phase command (TSD §5.2), never at web-process startup.
- **Acceptance:** Migrations apply cleanly; indices `ix_users_school`, `ix_users_clerk`, `ix_users_school_role` exist.

### T1.2 — Clerk Backend API wrapper (`accounts/clerk.py`)
Wrap create-user and ban-user. Create-user sets a temp password and writes `role` + `school_id` into `public_metadata`. Atomic semantics: if the Clerk call fails, no local row is created (return 502 with envelope) — per TSD §13-B4.
- **Acceptance:** Create returns a Clerk user + local row with metadata set; a simulated Clerk failure creates no local row.

### T1.3 — Account endpoints
- `POST /api/v1/admin/users` (ACC-01) — create teacher/student.
- `GET /api/v1/admin/users` (ACC-04) — paginated, filterable by `role`/`status`.
- `PATCH /api/v1/admin/users/{id}/deactivate` (ACC-03, ACC-05) — bans Clerk user, sets `is_active=false`, returns `affected_courses` for teachers.
- `POST /api/v1/admin/courses/{id}/reassign` (ACC-06) — stub the course lookup now; full behavior verified in Wave 02. Reassign is the ONLY path that may change `teacher_id`.
- **Acceptance:** Each endpoint matches the request/response shapes in TSD §7.3. All require `IsAdmin` + `IsSameSchool`.

### T1.4 — The four permission classes (full implementation)
Implement `IsAdmin`, `IsTeacher`, `IsSameSchool`, `IsCourseOwnerOrAdmin` per TSD §8.2. Wire `IsSameSchool` as a universal object-level guard. Establish the `get_queryset()` scoping pattern (TSD §8.2 "Queryset Scoping, Not Just Object Permission").
- **Acceptance:** A user from School A cannot read, write, or infer existence of School B data — returns 404 (not 403) for cross-school per Canonical Decision 6.

### T1.5 — Admin UI: user management
Build the admin Users view per design-system §19: deep ink-primary sidebar, parchment main, paginated user table with role + status, per-row action menu (deactivate, reset password via Clerk, reassign — reassign disabled-state until Wave 02). Deactivation confirm modal at `--shadow-4` showing affected courses + student counts.
- **Acceptance:** Admin can create and deactivate users through the UI; the table renders with design tokens; deactivation modal matches the spec.

### T1.6 — First-login password reset + password reset request
Configure entirely in Clerk (AUTH-04, AUTH-05) — no Django password code (AUTH-06). Verify the flows work.
- **Acceptance:** A newly created user is forced to set a password before reaching any Paideia page; any user can request a reset.

---

## Unit Tests

- Each permission class against fixture users: admin/teacher/student × same-school/other-school × own-course/other-course. Assert exact allow/deny.
- `clerk.py` wrapper: create success path; create-failure leaves no local row; deactivate bans + flips `is_active`.
- Deactivate endpoint returns `affected_courses` for a teacher (use a fixture course once Wave 02 models exist; until then assert empty array shape).
- Serializer shapes for all four endpoints match TSD §7.3 exactly (field names, nesting).

## Integration Tests

- **Admin creates a teacher → teacher signs in → lands on teacher dashboard.** Full stack: account endpoint → Clerk → first-login reset → `/me` → role routing. This proves Wave 01 interfaces correctly with Wave 00's auth bridge.
- **Cross-school isolation:** seed two schools; an admin of School A calling `GET /admin/users` sees only School A users; calling any School B object returns 404.
- **Deactivate round-trip:** create teacher → deactivate → confirm Clerk ban prevents login AND local `is_active=false` AND data retained.

## Definition of Done

A reviewer can, as an admin, complete FSD acceptance criterion **AC-01**: create a school account, create one teacher and five student accounts, all through the admin UI without technical assistance. RBAC is enforced and cross-school isolation is proven by the integration test. CI green.

**Demo:** "Admin creates users; each can sign in and reach their role dashboard; cross-school access is impossible."
