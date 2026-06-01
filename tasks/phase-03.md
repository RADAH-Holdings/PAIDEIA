# Wave 3 — Courses & Enrollment

> **Goal:** A teacher can create a course brief, activate it, and enroll students;
> an admin can do the same and reassign a course when a teacher is deactivated.

**Realises:** FSD `BRIEF-01`–`BRIEF-07`, `ENROL-01`–`ENROL-05`, `ACC-05`, `ACC-06`, `PROG-01` (read scope) · TSD §5.1 (courses/enrollments tables + indices), §7.4, §7.5, §8.2 · DS §9 (course cards), §16 (subject taxonomy), §18 (teacher interface)
**Depends on:** Wave 2 (roles, `IsCourseOwnerOrAdmin`, `IsSameSchool`).
**Feeds:** Wave 5 (the session loop reads the course brief + enrollment).

---

## Scope

### In
- `courses` app: `Course` and `Enrollment` models + migration, with the indices and cascade rules from TSD §5.1 (nullable `teacher_id` with `ON DELETE SET NULL`; enrollment `ON DELETE RESTRICT`; unique `(course_id, student_id)`).
- Course brief CRUD: create (draft), edit (with active-session warning flag), activate (validates required fields), archive.
- `teacher_id` immutability on edit (`BRIEF-07`); only the reassign endpoint can change it.
- Enrollment: enroll (one or many students), unenroll (soft — `status=unenrolled`), re-enroll reactivates (`ENROL-05`), course roster.
- Admin course reassignment (`ACC-06`) + wiring the W2 deactivate hook to return real `affected_courses`.
- The subject taxonomy applied to course cards (DS §16).
- Teacher interface: course sidebar, brief editor, roster (DS §18).

### Out
- Sessions, lessons, the agent (W4+). A course can be activated but no lessons exist yet.
- Progress tables beyond the course list (full progress view in W5/W8).

---

## Backend deliverables
- `courses/models.py` — `Course` (status: draft/active/archived; nullable `teacher_id`), `Enrollment` (status: active/unenrolled). All TSD §5.1 indices + cascade rules.
- `courses/views.py` — `POST/GET/PATCH /api/v1/courses`, `POST /courses/{id}/activate`, `POST /courses/{id}/archive`, `POST /courses/{id}/enrollments`, `GET /courses/{id}/enrollments`, `DELETE /enrollments/{id}`, `POST /admin/courses/{id}/reassign`.
- Queryset scoping: teachers see only their own courses; admins see the whole school.
- Update `accounts` deactivate to return real `affected_courses` for a teacher.

## Frontend deliverables
- `app/teacher/courses/*` — course list (sidebar grouped by status), brief editor (long-form, serif-friendly inputs per DS §10), roster view.
- `app/admin/courses/*` — all-school course list, reassign action, unassigned-course indicator.
- Course card component (DS §9) with subject pill + tint (DS §16).
- `lib/schemas.ts` — zod for course + enrollment shapes.

---

## Unit tests
| ID | Asserts |
|---|---|
| `T-W3-01` | Course is created as `draft`; `teacher_id` is set to the requester and cannot be set to another user (`BRIEF-07`). |
| `T-W3-02` | Activate rejects (422) when required brief fields fail min-length validation (`BRIEF-01`); succeeds when they pass. |
| `T-W3-03` | Editing an active course surfaces the `has_active_sessions` warning flag (`BRIEF-03`). |
| `T-W3-04` | Enroll creates rows; re-enrolling an unenrolled student reactivates the existing row, no duplicate (`ENROL-05`, unique constraint). |
| `T-W3-05` | Unenroll is a soft delete (`status=unenrolled`), history retained. |
| `T-W3-06` | A teacher requesting another teacher's course gets 404 (not 403) — out of scope (`AC-13`). |
| `T-W3-07` | Reassign changes `teacher_id` to another active teacher; the new teacher gains access, the old loses it (`ACC-06`). |
| `T-W3-08` | Deactivating a teacher leaves their courses intact with `teacher_id` nullable, and returns them as `affected_courses` (`ACC-05`). |

## Integration seam — Wave 2 → Wave 3
`T-SEAM-W3`: an admin (W2) creates a teacher and students; the teacher logs in,
creates a course, activates it, and enrolls the students — all authorised purely
by the W2 permission classes. Then the admin deactivates the teacher and reassigns
the course to a second teacher, who can now see its roster. Proves RBAC + ownership
+ the nullable-`teacher_id` decision hold end-to-end.

## Manual demo
As a teacher: write a Biology brief, activate it, enroll three students. As admin:
deactivate that teacher — see the course flagged unassigned — reassign it to another
teacher, who now sees the roster. Student home shows the course they're enrolled in.

## Exit criteria
- [ ] All `T-W3-*` + `T-SEAM-W3` green.
- [ ] Cross-course reads return 404; cascade rules enforced at the DB (not just app).
- [ ] A teacher can take a course from draft → active → enrolled on staging.
- [ ] Reassignment after deactivation works end-to-end on staging.
