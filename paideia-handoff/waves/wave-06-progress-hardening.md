# Wave 06 — Progress, Resilience & Hardening

> **Outcome:** The system is pilot-ready. Teachers and students have their progress views; every failure mode in the matrix is handled; observability logging is in place; and ALL fourteen FSD acceptance criteria pass. This is the wave that turns a working core loop into a shippable product.

**Depends on:** Waves 00–05 (everything)
**Implements (FSD):** PROG-01 → PROG-06, the full failure matrix, observability/logging NFRs, security NFRs, ALL acceptance criteria AC-01 → AC-14 · **TSD:** §14 (error handling, entire), §15 (security architecture), §17 (observability), §18 (sequence flows as integration checks)
**Maps to:** TSD Implementation Sequence Phase 06

---

## Tasks

### T6.1 — Teacher progress views — PROG-01, PROG-02, PROG-03
- `GET /api/v1/courses/{id}/progress` (PROG-01) — per-student row: name, sessions completed, last session date, most recent outcome. 404 if not the course owner (Canonical Decision 6 / AC-13).
- Drill-in (PROG-02) — ordered session list per student.
- Lesson diagnostic view (PROG-03) — teacher reads any delivered lesson in their course; renders the Lesson Card + a diagnostic footer (agent plan, prompt_context) per design-system §18. Cross-course → 404.
- UI per design-system §18: progress table with outcome badges, sortable; subject-tinted row grouping.
- **Acceptance:** Teacher sees only their courses' progress; drill-in and lesson review work; cross-course returns 404.

### T6.2 — Student progress views — PROG-04, PROG-05, PROG-06
- `GET /api/v1/students/me/courses` (PROG-04) — enrolled active courses, session counter, last session date.
- Per-course session list (PROG-05) — re-readable past lessons (render via Wave 05 Lesson Card), not re-assessable.
- Context line (PROG-06) — the "Today's lesson revisits X" / "Session N of ~M" line, generated from session metadata (no extra AI call), shown at the top of each lesson. (Renderer built in Wave 05; this wave wires the data.)
- UI per design-system §17.
- **Acceptance:** Student home shows courses + counters; past lessons re-readable; the context line is correct for both reinforcement and normal-progression sessions.

### T6.3 — Error handling completion — TSD §14
The standard error envelope on every non-streaming error (§14.1). SSE errors via the `error` event (§14.2). Implement the full failure matrix (§14.3): every row's detection point and user-visible result. 404-over-403 policy consistently applied (§14.1, Canonical Decision 6).
- **Acceptance:** Each failure-matrix row reproducible in a test produces the documented response. No bare strings, no stack traces, no HTML errors ever reach a client.

### T6.4 — Observability — TSD §17
Structured JSON logging. AI-call log per call: timestamp, session_id, enrollment_id, model version, prompt version, prompt+completion token counts, latency, outcome (90-day retention). Lesson diagnostics already stored on the row (prompt_context, agent_plan, raw_response) — verify retrievable by session_id (AC-11). Auth/account events logged. Error + request logs.
- **Acceptance:** The "why this lesson" query (TSD §17) works: given a session_id, an engineer retrieves prompt_context + agent_plan + raw_response to fully reconstruct a generation (AC-11).

### T6.5 — Security hardening pass — TSD §15
Verify every layer of the §15 table: HTTPS everywhere; JWT on every endpoint; permission classes + queryset scoping universal; CORS scoped; interactive content sandbox + injected CSP + server-side validation; secrets in env only; school data isolation; private DB networking; audit logging. Add a `// SECURITY:` reviewed note where each layer is enforced.
- **Acceptance:** A security review checklist (one row per §15 layer) is all-green. Cross-student data access attempt returns 403/404 appropriately (AC-10).

### T6.6 — Full acceptance-criteria sweep — AC-01 → AC-14
Write an integration test (or documented manual script) for each of the 14 FSD acceptance criteria. This is the definition-of-done for the entire MVP.
- **Acceptance:** All 14 pass. Specifically re-verify the ones owned by earlier waves now that the full system is assembled (AC-01 accounts, AC-02 course flow, AC-03 session, AC-04 sandbox, AC-06 no-repeat, AC-07 adaptation, AC-08 resume, AC-09 failure, AC-10 isolation, AC-11 reproducibility, AC-12 fallback, AC-13 cross-course 404, AC-14 teacher-deactivation continuity).

### T6.7 — Pilot readiness
Empty states for "no courses", "no students enrolled", "lesson generating" (design-system §23 notes these as the highest-value polish). Daily DB backup verified (FSD NFR). A documented, tested restore procedure. Staging vs production env separation confirmed.
- **Acceptance:** The three empty states render per design system; a backup/restore has been performed successfully on staging.

---

## Unit Tests

- Progress endpoints: correct scoping (own courses only), correct aggregates (session counts, last dates, outcomes).
- Context-line generator: reinforcement session → "revisits X"; normal → "Session N of ~M". Pure function, no AI call.
- Error envelope: every error code in §14.1 renders correctly; 404-vs-403 decision matrix.
- AI-call logger: emits all required fields per §17.

## Integration Tests (these ARE the acceptance criteria)

- **Each AC-01 → AC-14** as an automated test or a documented, repeatable manual script. The full sweep is the MVP gate.
- **Sequence Flow A (TSD §18.1):** full student session across all six boundaries.
- **Sequence Flow B (TSD §18.2):** teacher creates + populates a course.
- **Sequence Flow C (TSD §18.3):** teacher deactivation without disruption + reassignment (AC-14) — proves the nullable `teacher_id` decision holds end to end.
- **Cross-student isolation (AC-10):** authenticated student A cannot reach student B's lessons/history/responses — 403/404 via direct API calls.
- **Reproducibility (AC-11):** pull any session by id from logs and reconstruct its generation.

## Definition of Done

All 14 FSD acceptance criteria pass. All three TSD sequence flows pass. The failure matrix is fully handled. Observability lets an engineer reconstruct any lesson. The security checklist is green. Empty states and backup/restore are done. **The MVP is pilot-ready** — a real school can be onboarded.

**Demo:** "Every acceptance criterion passes; the system is ready for the pilot school."
