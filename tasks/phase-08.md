# Wave 8 — Hardening & Pilot

> **Goal:** Every acceptance criterion (`AC-01`–`AC-14`) passes; the system is
> resilient, observable, and ready for a supervised pilot at one school.

**Realises:** FSD `AC-01`–`AC-14` (all), `PROG-01`/`PROG-03` (teacher views), `SESS-06` (cleanup), NFRs (security, logging, performance) · TSD §14 (full error matrix), §15 (security layers), §16 (deployment), §17 (observability), §18 (all three flows) · DS §18/§19 (teacher + admin polish)
**Depends on:** Waves 1–7 (the full vertical slice exists and works).
**Feeds:** the pilot.

---

## Scope

### In
- Teacher progress dashboard (`PROG-01`): per-student session count, last-session date, latest outcome badge, sortable/filterable.
- Teacher diagnostic lesson review (`PROG-03`): the same renderer plus a footer showing the agent `plan` + `prompt_context` (TSD §17 — the "why this lesson" data); returns 404 for non-owned courses.
- Abandoned-session cleanup (`SESS-06`): daily Django management command + Railway cron — close old `ABANDONED` as COMPLETE/`not_taken`, delete stale `GENERATING` rows.
- The full error matrix (TSD §14.3) verified end-to-end: every failure path produces the right envelope/event and the right user-facing state.
- Observability (TSD §17): structured AI-call log (tokens, latency, model + prompt version, outcome), auth-event log, error log, the lesson diagnostic fields persisted on every lesson.
- Security pass (TSD §15): CORS locked to the Next.js origin, no secrets in logs, private DB networking confirmed, sandbox + CSP verified, generic auth errors.
- Production environment on Railway (staging → prod promotion is a manual gate).
- A single end-to-end suite hitting the real model (dedicated low-cost key) covering all three TSD §18 flows.
- Pilot readiness: seed the pilot school's admin, confirm the pre-build checklist items are satisfied.

### Out
- Anything on the post-MVP roadmap (content moderation layer, SSO, mobile, multi-tier billing). Note them; don't build them.

---

## Backend deliverables
- `sessions/management/commands/cleanup_sessions.py` + Railway cron.
- Teacher progress + diagnostic endpoints (`GET /courses/{id}/progress`, lesson review with diagnostic footer data).
- `common/` — finalized error envelope handler, structured logger, request log.
- Production Railway environment + its own Anthropic key + its own `ANTHROPIC_MODEL_VERSION`.

## Frontend deliverables
- `app/teacher/courses/[id]/progress` — the progress table (DS §18).
- Teacher lesson-review view with the diagnostic footer.
- Admin polish: deactivation-confirm modal listing affected courses + reassignment picker (DS §19); empty-state onboarding card.
- All error/empty/loading states across the student, teacher, and admin surfaces.

---

## Tests — the acceptance sweep
Every acceptance criterion gets a named end-to-end test. Map exactly to FSD `AC-01`–`AC-14`:
| ID | Asserts |
|---|---|
| `T-W8-AC01`..`T-W8-AC14` | One test per acceptance criterion, each driving the real user journey for that AC and asserting its stated outcome. `AC-13` asserts 404 (not 403) for cross-course reads. `AC-03` asserts first text < 3s. `AC-11` asserts the diagnostic fields reproduce a lesson. `AC-12` asserts interactive-failure fallback. (Full AC text: `docs/fsd.md`.) |
| `T-W8-SEC-01` | CORS rejects a non-Next.js origin. |
| `T-W8-SEC-02` | No secret appears in any log line. |
| `T-W8-SEC-03` | The interactive sandbox cannot reach the parent (no `allow-same-origin`); CSP blocks a non-whitelisted script. |
| `T-W8-OBS-01` | Every AI call writes a structured log line with tokens, latency, model + prompt version, outcome. |
| `T-W8-CLEAN-01` | The cleanup command closes an old ABANDONED session and deletes a stale GENERATING row (`SESS-06`). |

## End-to-end live suite (opt-in, real model)
`T-E2E-FLOW-A` (student takes a streamed, adaptive session through to summary),
`T-E2E-FLOW-B` (teacher creates → activates → enrolls), `T-E2E-FLOW-C` (admin
deactivates a teacher mid-term → reassigns → a student's session still works) —
the three TSD §18 flows, against the real model.

## Integration seam — Wave 7 → Wave 8
`T-SEAM-W8`: the complete system runs all three §18 flows end-to-end on the
production-shaped environment with observability on — proving the hardened system
behaves as the earlier per-wave seams promised, now under real conditions.

## Manual demo
Run the full pilot rehearsal: admin sets up the school and accounts; a teacher
builds and enrolls a course; several students each take multiple adaptive sessions;
the teacher reviews progress and diagnoses a lesson; the admin deactivates and
reassigns a teacher without disrupting students. Watch the logs show the full
"why this lesson" trail.

## Exit criteria (ship gate)
- [ ] `T-W8-AC01`..`AC14` all green — every acceptance criterion passes.
- [ ] Security, observability, and cleanup tests green.
- [ ] The three live end-to-end flows pass against the real model.
- [ ] `T-SEAM-W8` passes on the production-shaped environment.
- [ ] The pre-build checklist (below / `AGENTS.md`) is fully satisfied for the pilot school.
- [ ] A human has run the full pilot rehearsal and signed off on lesson quality.

---

## Pre-pilot checklist (confirm before go-live)
- [ ] Anthropic production key set, with a spend alert; `ANTHROPIC_MODEL_VERSION` chosen.
- [ ] Pilot school committed: admin contact, subjects, year level, real briefs.
- [ ] Email backend (welcome + reset) configured and tested.
- [ ] Domain + SSL for frontend and API.
- [ ] Error monitoring decision made (Railway logs vs Sentry free tier).
- [ ] Open UX decisions resolved: assessment-resume display, end-of-course behaviour at "session ~N of N", thin-brief handling.
