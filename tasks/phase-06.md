# Wave 6 — Streaming Delivery

> **Goal:** Wrap streaming around the already-working loop — the student sees the
> lesson build live, token by token, instead of waiting for a blank screen.

**Realises:** FSD `SESS-02`, `AGENT-02`, `REND-04`, `AC-03` (first text < 3s) · TSD §7.6 (the SSE-style event sequence over a streamed POST), §10 (the full streaming pipeline + hazards), §11.2 (the stream client) · DS §13 (streaming state of the lesson card)
**Depends on:** Wave 5 (the validated sync loop — streaming must not change *what* is produced, only *how* it arrives).
**Feeds:** Wave 7 swaps the streamed text for the full structured block render.

> Streaming wraps a **known-working** loop. If W5 passed, a streaming bug can only
> break delivery, never correctness — the stored lesson is identical either way.

---

## Scope

### In
- Convert `POST /enrollments/{id}/sessions` to an **async** view returning a `StreamingHttpResponse` (`text/event-stream`), per TSD §10.2.
- The async `orchestrator.run_generation` generator: emit `session_started`, `lesson_meta`, `token` (clean text only — the `IncrementalLessonParser` from W4 suppresses plan + JSON), `lesson_complete`, `assessment_ready`, `done`, and `error`.
- Server-side incremental parse: stream outward only clean text-block content; persist the full parsed lesson on stream end (identical persistence to W5).
- `X-Accel-Buffering: no` + `Cache-Control: no-cache` on the response.
- Async ORM throughout the async path (`aget`/`asave`/`sync_to_async`) — no `SynchronousOnlyOperation`.
- The streaming hazards from TSD §10.3: client disconnect (generation still completes + stores, so resume replays), timeout → delete + `error`, double-start → resume, worker restart → stale `GENERATING` row swept later.
- `lib/stream.ts` — the `fetch()` + `ReadableStream` reader (NOT EventSource) that decodes the event frames and exposes a typed event stream.

### Out
- The full interactive-block render swap on `lesson_complete` (W7) — for now, on `lesson_complete` you may simply re-fetch and show the finished text; interactive polish is W7.
- Resume UX polish + abandoned-session cron (W8).

---

## Backend deliverables
- `sessions/views.py` — the async streaming `generate_session` view per TSD §10.2; same persistence as W5's orchestrator (refactor the shared core so sync tests still hold).
- The async orchestrator generator emitting the §7.6 event sequence.
- Confirmed Uvicorn-worker streaming on Railway with the buffering header.

## Frontend deliverables
- `lib/stream.ts` — streamed `fetch` reader, typed events.
- `app/student/courses/[id]/page.tsx` — react to events: draw the Lesson Card shell on `session_started`, render the header on `lesson_meta`, append clean markdown progressively on `token`, on `lesson_complete` fetch `GET /sessions/{id}/lesson` and swap to the stored render, enable assessment on `assessment_ready`, handle `error` → course home.

---

## Unit / component tests
| ID | Asserts |
|---|---|
| `T-W6-01` | The async view runs under the Uvicorn worker with no `SynchronousOnlyOperation` (all ORM calls awaited/wrapped). |
| `T-W6-02` | The event generator emits the §7.6 sequence in order; `token` events carry clean markdown only (no `<plan>`, no JSON) — reuses the W4 parser. |
| `T-W6-03` | On a mocked generation failure mid-stream, an `error` event is emitted and the session row is deleted (`SESS-03`). |
| `T-W6-04` | `X-Accel-Buffering: no` and `Cache-Control: no-cache` are present on the response. |
| `T-W6-05` | Client disconnect (reader closed) → generation still completes and persists server-side (resume will replay). |
| `T-W6-06` | A second start while one is `GENERATING` resumes rather than creating a duplicate (double-click hazard). |
| `T-W6-07` | `lib/stream.ts` decodes a canned event byte-stream into the correct typed event objects; it uses `fetch`, not `EventSource`. |

## Integration seam — Wave 5 → Wave 6
`T-SEAM-W6`: the **same** student journey as `T-SEAM-W5`, now over the streaming
endpoint, must persist a lesson + assessment **byte-identical** to the sync path
for the same mocked agent output. This proves streaming changed delivery only, not
correctness — the W5 guarantees still hold.

## Manual demo
As a student, start a session: text appears within ~3 seconds and visibly builds.
When it finishes, the structured lesson is shown and the assessment unlocks. Kill
the tab mid-stream, reopen — the session resumes with the already-generated lesson,
not a regeneration.

## Exit criteria
- [ ] All `T-W6-*` + `T-SEAM-W6` green; the W5 sync-path tests still pass (shared core not broken).
- [ ] On staging, first text is visible < 3s and the stream is not proxy-buffered.
- [ ] Disconnect/resume works without orphaned or duplicated sessions.
- [ ] Persisted lessons are identical between sync and streamed paths for the same input.
