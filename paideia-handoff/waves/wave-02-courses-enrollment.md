# Wave 02 — Courses & Enrollment

> **Outcome:** A teacher can write a course brief, save it as draft, activate it, and enroll students directly — without admin involvement. The admin's reassignment action (built in Wave 01) now fully works against real courses. No lessons exist yet; this wave is everything that must be true *before* a student can start a session.

**Depends on:** Wave 01 (users, RBAC, reassign stub)
**Implements (FSD):** BRIEF-01 → BRIEF-07, ENROL-01 → ENROL-06, ACC-06 (now real) · **TSD:** §7.4, §7.5, §5.1 (courses, enrollments)
**Maps to:** TSD Implementation Sequence Phase 02 (courses half)

---

## Tasks

### T2.1 — Data models: Course, Enrollment
Implement per TSD §5.1. `courses.teacher_id` is **nullable** (Canonical Decision 7). `courses.status` enum is `draft|active|archived` — no other values. `enrollments` has the `UNIQUE(course_id, student_id)` constraint (ENROL-05) and `ON DELETE RESTRICT` on course. Indices per TSD §5.1.
- **Acceptance:** Migrations apply; the unique constraint and nullable `teacher_id` are real at the DB level, not just app-enforced.

### T2.2 — Course brief endpoints
Per TSD §7.4:
- `POST /api/v1/courses` (BRIEF-01) — creates `draft`, `teacher_id`=self, cannot be set to another teacher (BRIEF-07).
- `GET /api/v1/courses` — teachers see own only; admins see all in school (queryset scoping).
- `PATCH /api/v1/courses/{id}` (BRIEF-03) — edit fields; rejects `teacher_id` and `status` (dedicated endpoints); returns `has_active_sessions`.
- `POST /api/v1/courses/{id}/activate` (BRIEF-01) — validates min field lengths, `draft→active`, 422 on failure with envelope.
- `POST /api/v1/courses/{id}/archive` (BRIEF-05) — owner OR admin; `active→archived`.
- **Acceptance:** Field-length validation matches FSD §8.1 minimums. `teacher_id` immutable except via reassign. All shapes match TSD §7.4.

### T2.3 — `prompt_context` capture groundwork (BRIEF-06)
Ensure the course model exposes a clean serializable snapshot of all brief fields — this becomes part of `lessons.prompt_context` in Wave 04. Build the serialization helper now and unit-test it.
- **Acceptance:** A helper returns the full brief state as a dict matching the "course_brief" object in TSD §11.1.

### T2.4 — Enrollment endpoints
Per TSD §7.5:
- `POST /api/v1/courses/{id}/enrollments` (ENROL-01/03) — teacher (own course) or admin; bulk `student_ids`; reactivates soft-deleted enrollments (ENROL-05); returns `{enrolled, reactivated, already_enrolled}`.
- `GET /api/v1/courses/{id}/enrollments` — roster.
- `DELETE /api/v1/enrollments/{id}` (ENROL-02) — soft delete (`status=unenrolled`), history retained.
- Only `active` courses accept enrollments (ENROL-06).
- **Acceptance:** Teacher can only enroll into own courses (`IsCourseOwnerOrAdmin`); reactivation does not create duplicate rows.

### T2.5 — Admin reassignment (complete ACC-06)
Wire the Wave 01 reassign stub to real courses. Changing `teacher_id` is allowed ONLY here, only for admins, with confirmation. New teacher immediately gains progress + enrollment access.
- **Acceptance:** Reassign changes `teacher_id`; the new teacher's `GET /courses` now includes it; the old teacher's no longer does. Deactivating a teacher leaves courses running unassigned (`teacher_id=NULL`) per AC-14 groundwork.

### T2.6 — Teacher UI: brief editor + enrollment
Per design-system §18: course sidebar grouped by status; segmented tabs (Lessons/Progress/Brief/Settings — Lessons & Progress empty for now); the long-form brief editor with serif-friendly large inputs, inline field guidance, character counts (BRIEF-04), and the active-sessions edit warning callout (BRIEF-03). Enrollment picker showing all active students in the school.
- **Acceptance:** A teacher creates → activates → enrolls entirely in the UI, styled per design system. The edit warning appears when editing a course with completed sessions (will have none yet; assert the conditional renders correctly with a seeded flag).

---

## Unit Tests

- Brief field validation: each required field below minimum length → 422 with `brief_incomplete`; at/above → ok.
- `teacher_id` immutability: PATCH attempting to change it → 403/rejected; reassign endpoint → allowed for admin only.
- Enrollment reactivation: enroll → unenroll → re-enroll reuses the same row (assert row count stable).
- Status transitions: draft→active validates fields; active→archived blocks new enrollments; draft/archived rejected from enrollment picker.
- `prompt_context` snapshot helper returns the exact TSD §11.1 course_brief shape.

## Integration Tests

- **Full teacher flow (AC-02):** teacher signs in → creates brief → activates → enrolls 5 students → sees them in roster. Proves Wave 02 builds correctly on Wave 01 identity.
- **Enrollment ownership:** teacher A cannot enroll students into teacher B's course (404); admin can enroll into any course in the school.
- **Reassignment continuity (AC-14 groundwork):** create course under teacher A → deactivate teacher A → course remains `active` with `teacher_id=NULL` → admin reassigns to teacher B → teacher B sees it.
- **Cross-scope read:** teacher A requesting teacher B's course/roster/progress → 404 (Canonical Decision 6).

## Definition of Done

FSD **AC-02** passes end to end through the UI. A teacher owns their course lifecycle; admin reassignment works; enrollment is teacher-driven; cross-scope reads return 404. The `prompt_context` snapshot helper is ready for Wave 04. CI green.

**Demo:** "A teacher creates a course and populates a class; an admin reassigns a course when a teacher leaves, without disrupting it."
