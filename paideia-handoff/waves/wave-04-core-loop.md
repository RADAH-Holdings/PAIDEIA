# Wave 04 — The Core Loop

> **Outcome:** A student opens a session, a lesson streams in live, and a SECOND session demonstrably adapts based on the first. This wave proves the MVP's central hypothesis. It wires the isolated agent (Wave 03) into real sessions, context assembly, the streaming pipeline, and history. No rich rendering yet — the lesson can display as plain streamed text; Wave 05 makes it beautiful.

**Depends on:** Wave 03 (the agent), Wave 02 (courses/enrollment), Wave 01 (users/RBAC)
**Implements (FSD):** SESS-01 → SESS-06, the full session state machine (FSD §10), context assembly + summarisation (CTX/§11, HIST-02/04), AGENT-02 (concurrent assessment), ASMT-01 → ASMT-06, HIST-01 → HIST-04 · **TSD:** §7.6, §9.3, §10 (entire), §5.1 (sessions/lessons/assessments/responses/session_history)
**Maps to:** TSD Implementation Sequence Phase 04

---

## Tasks

### T4.1 — Data models: Session, Lesson, Assessment, AssessmentResponse, SessionHistory
Per TSD §5.1. `sessions.status` enum `pending|generating|active|assessing|complete|abandoned` — **no `failed`** (Canonical Decision 8). `session_history` is **immutable** (HIST-01) — no UPDATE/DELETE in any code path. Cascade + index rules exactly per TSD §5.1 (note `ix_hist_enroll_num` — the critical read path; `ix_sess_abandoned`; lessons/assessments `ON DELETE CASCADE`; history no cascade).
- **Acceptance:** Migrations apply; the critical read-path index exists; a failed-generation path can fully delete a session and its lesson via cascade.

### T4.2 — Context Assembly (`sessions/context.py`) — HIST-04
Build the context object exactly per TSD §11.1. Apply the summarisation strategy (TSD §11.2 / FSD HIST-02): full detail for last 5 sessions; compressed (title + outcome) for 6–20 ago; title-only beyond 20. Pure function — unit-test independently of the AI. Use canonical field names (`assessment_outcome`, `key_concepts_covered`, `lesson_title`).
- **Acceptance:** Given a fixture enrollment with N history rows, produces the exact TSD §11.1 shape with correct summarisation tiers. Reads via `ix_hist_enroll_num`, never a seq scan.

### T4.3 — Session Orchestrator (`sessions/orchestrator.py`) — the state machine
Implement SESS-01 → SESS-06. Single-active-session rule (SESS-01): a non-complete session is resumed, not duplicated. Generation sequence (SESS-02): create `generating` → assemble context → stream lesson → dispatch concurrent assessment task (AGENT-02, the one-retry version from Wave 03) → on stream end parse/validate/store lesson → `active`. Failure (SESS-03): delete the session row entirely, no trace. Completion (SESS-05): write immutable history + `complete` + update `last_session_at`, atomically.
- **Acceptance:** All six SESS requirements pass their tests. The orchestrator exposes async methods only; every DB call is async ORM or `sync_to_async` (no `SynchronousOnlyOperation`).

### T4.4 — Streaming session endpoint (`POST /api/v1/enrollments/{id}/sessions`) — TSD §7.6, §10
The one async view. `StreamingHttpResponse`, `text/event-stream`, headers `Cache-Control: no-cache` + `X-Accel-Buffering: no` (the Railway proxy fix). Emits the SSE event sequence exactly per TSD §7.6: `session_started` → `lesson_meta` → `token`* → `lesson_complete` → `assessment_ready` → `done`, or `error`. Uses the incremental parser so only clean text streams as `token` events (plan/JSON suppressed). Hazards handled per TSD §10.3 (client disconnect completes generation server-side for resume; timeout = failure; double-click resumes).
- **Acceptance:** A student hits the endpoint and receives the full event sequence; first text appears within 3s; total within 30s (AC-03). Killing the connection mid-stream still stores the lesson (resumable).

### T4.5 — Lesson + assessment retrieval + answer submission
- `GET /api/v1/sessions/{id}/lesson` (TSD §7.6) — parsed block array; used for resume and (Wave 05) structured render.
- `GET /api/v1/sessions/{id}/assessment` — questions WITHOUT answers/explanations (ASMT-04); 409 if unavailable after retry (AGENT-06).
- `POST /api/v1/sessions/{id}/responses` — one answer, posted immediately (REND-06); reveals correctness + explanation for that question; final answer triggers SESS-05 completion + history write; outcome computed per ASMT-05 (`strong|adequate|needs_reinforcement|not_taken`).
- **Acceptance:** Answer submission reveals per-question; final answer completes the session and writes the correct `assessment_outcome` + `concepts_missed`.

### T4.6 — Cleanup cron (SESS-06)
Django management command + Railway cron, daily: ABANDONED >24h → `complete` with `not_taken`; GENERATING >1h (orphaned) → deleted (consistent with SESS-03).
- **Acceptance:** Seeded stale rows of both kinds are swept correctly.

### T4.7 — Minimal student lesson surface (plain)
A student can trigger a session and see the lesson as streamed text + take the assessment. Styling minimal — parchment canvas + Fraunces title is enough; Wave 05 adds the block renderer and interactive frames. The point is the loop works, visibly.
- **Acceptance:** A student completes a full session end to end in the browser.

---

## Unit Tests

- Context summarisation: 3 / 7 / 25-session fixtures produce correct tier splits and exact §11.1 shape.
- State machine: each transition (pending→generating→active→assessing→complete; →abandoned); single-active-session resume; failure deletes row; no `failed` status reachable.
- Outcome computation: 4/4→strong, 3/4→adequate, ≤2/4→needs_reinforcement (+ populates `concepts_missed`), no-assessment→not_taken.
- History immutability: any attempted UPDATE/DELETE on `session_history` is rejected by code path (assert no such path exists / raises).
- SSE event framing: correct event order and JSON shapes for a happy path (mock the agent).

## Integration Tests

- **Full session (AC-03):** student → stream → read → 4-question assessment → completion + history write. Real agent (or recorded stream). Proves Wave 04 integrates Wave 03's agent + Wave 02's enrollment.
- **Adaptation (AC-07) — the hypothesis test:** seed session N with ≤2/4 on concept X → run session N+1 → assert the new lesson's context included X in `concepts_missed` AND the generated lesson revisits X. This is THE test that proves the product works.
- **No-repeat (AC-06):** 5 sequential sessions produce 5 distinct lesson titles / concept sets (independent review assertion + automated distinctness check).
- **Failure path (AC-09):** force an agent error → SSE `error` → session row absent → session count not incremented → student returned to course home.
- **Resume (AC-08, SESS-04):** disconnect mid-stream → reconnect → same lesson replayed, not regenerated; disconnect mid-assessment → answered questions preserved.
- **Concurrent assessment (AGENT-02):** assessment is ready by `assessment_ready` without adding latency after lesson completion.
- **Async safety:** run the session endpoint under concurrent requests; assert no `SynchronousOnlyOperation` and no worker exhaustion.

## Definition of Done

FSD **AC-03, AC-06, AC-07, AC-08, AC-09** pass. The adaptation test (AC-07) is green — the system demonstrably tailors lesson N+1 from session N's performance. The streaming pipeline works through Railway's proxy. This wave is the product; treat AC-07 as the gate.

**Demo:** "A student streams a generated lesson; the next session adapts to how they did."
