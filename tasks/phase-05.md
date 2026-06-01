# Wave 5 — The Sync Session Loop

> **Goal:** Prove the MVP's central hypothesis without streaming complexity — a real
> student takes a real generated session, and a **second** session demonstrably
> adapts from the first's stored history.

**Realises:** FSD `SESS-01`–`SESS-06`, `HIST-01`–`HIST-04`, `PROG-02`/`PROG-05`/`PROG-06`, `AGENT-02` (concurrent assessment) · TSD §5.1 (sessions/lessons/assessments/history tables), §9.3, §10.2 (the non-stream path), §18 (Flow A) · DS §13/§15 (lesson card + assessment engine, non-streamed)
**Depends on:** Wave 3 (course brief + enrollment) and Wave 4 (the validated agent).
**Feeds:** Wave 6 wraps streaming around this exact loop.

> **The W4→W5 boundary is the spine.** When W5's exit passes, the product's core
> question is answered. Everything after is engineering over a validated core.

---

## Scope

### In
- `sessions` app: `Session`, `Lesson`, `Assessment`, `AssessmentResponse`, `SessionHistory` models + migrations, with the state machine (no `FAILED`), indices, cascade rules, and immutable history per TSD §5.1.
- `context.py` — the `ContextAssembler`: reads the course brief + summarised `session_history` for the enrollment, builds the exact context dict shape Wave 4's agent consumes.
- `orchestrator.py` — the session state machine + sequencing; creates the session, calls the agent (non-streamed: collect the full generation), parses/validates/stores, dispatches the concurrent assessment task (`AGENT-02`), writes immutable history on completion.
- Endpoints (sync, non-streaming for now): start/resume session, fetch parsed lesson blocks, fetch assessment, submit answer (reveals correctness per question), session summary.
- A failed generation deletes the session row (`SESS-03`); assessment failure → one retry → `not_taken` (`AGENT-06`); single-active-session rule.
- Student lesson view + assessment engine rendering the **stored** blocks (no live streaming yet — fetch the finished lesson and render it).

### Out
- Streaming / live token delivery (W6) — here the student waits for the full lesson, then it appears.
- The interactive-iframe renderer polish (W7) — render interactive blocks minimally or as fallback; full sandbox treatment is W7.
- Teacher progress dashboard polish (W8).

---

## Backend deliverables
- `sessions/models.py` — all five models per TSD §5.1; history immutable (no UPDATE/DELETE path).
- `sessions/context.py` — `ContextAssembler.build(enrollment) -> context dict` (the W4 fixture shape, now from real data).
- `sessions/orchestrator.py` — `run_generation` (sync variant): create session → assemble context → agent generate (await full) → parse/validate/store → dispatch assessment task → on completion write history + set COMPLETE.
- `sessions/views.py` — `POST /enrollments/{id}/sessions` (sync JSON for now, returns the finished lesson), `GET /sessions/{id}/lesson`, `GET /sessions/{id}/assessment`, `POST /sessions/{id}/responses`, summary in the final response.

## Frontend deliverables
- `app/student/courses/[id]/page.tsx` — start/continue → loading state → render the finished Lesson Card (DS §13) from `GET /sessions/{id}/lesson`.
- `components/lesson/AssessmentEngine.tsx` — the `useReducer` state machine (IDLE→ANSWERING→REVEALED→COMPLETE), posts each answer immediately (DS §15).
- `app/student/progress` — ordered past sessions with outcome badges (`PROG-02`/`PROG-05`).

---

## Unit tests
| ID | Asserts |
|---|---|
| `T-W5-01` | `ContextAssembler` produces the exact context dict shape Wave 4's agent accepts (assert against the W4 fixture schema). |
| `T-W5-02` | Starting a session creates a `GENERATING` row; a successful generation moves it to `ACTIVE`; there is no `FAILED` value reachable. |
| `T-W5-03` | A failed generation (mocked agent raises) **deletes** the session row — no orphan, no FAILED (`SESS-03`). |
| `T-W5-04` | The single-active-session rule: a second start while one is non-complete resumes the existing session, no duplicate. |
| `T-W5-05` | Submitting the final answer writes an immutable `SessionHistory` row and sets `COMPLETE`; history has no UPDATE/DELETE code path (`HIST-01`, `SESS-05`). |
| `T-W5-06` | The assessment task is dispatched concurrently and survives one retry before `not_taken` (`AGENT-02`, `AGENT-06`). |
| `T-W5-07` | Session N+1's assembled context includes session N's outcome and concepts (`HIST-04` — the adaptation input). |
| `T-W5-08` | `context_line` / meta reflects prior performance so adaptation is visible to the student (`PROG-06`). |

## Integration seam — Wave 4 → Wave 5 (the spine seam)
`T-SEAM-W5`: with a **mocked agent returning a fixture lesson**, a real enrolled
student (W3) starts a session; the orchestrator assembles real context, the lesson
+ assessment persist, the student answers, history is written. Then a **second**
session is started and the assembled context provably contains the first session's
outcome. This proves the agent contract (W4) and the domain (W3) compose into a
working, adaptive loop — without depending on live model output.

A second seam, `T-SEAM-W5-LIVE` (opt-in, real API): the same journey end-to-end
against the real model, confirming a genuinely generated session round-trips.

## Manual demo
As a student: open an enrolled course, start a session, wait for the lesson, read
it, take the 4-question assessment, see the summary. Start a second session —
confirm the context line / lesson references your first session's performance.

## Exit criteria
- [ ] All `T-W5-*` + `T-SEAM-W5` green (hermetic).
- [ ] `T-SEAM-W5-LIVE` passes against the real model at least once.
- [ ] A real student can complete two sequential sessions on staging and the second adapts from the first.
- [ ] History is provably immutable (no code path mutates it).
- [ ] **Hypothesis checkpoint:** the team agrees the generated sessions are coherent and adaptive. If not, stop and iterate on Wave 4 prompts before proceeding.
