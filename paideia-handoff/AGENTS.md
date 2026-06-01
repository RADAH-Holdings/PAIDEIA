# Paideia — Agent Operating Guide

> **Read this file first, every session.** It tells you what Paideia is, how the code is organized, which spec to consult for which question, and the rules that apply to all work. Do not start a task without reading the relevant wave file in `/waves/`.

---

## What Paideia Is

Paideia is a **content-less AI learning management system**. The platform ships empty — no courses, no lessons. An AI agent generates an entire course one lesson at a time, adapting to each student's performance as they progress.

**The core loop (the entire MVP):**
1. A teacher writes a plain-language course brief.
2. A student opens a session.
3. The AI agent generates one lesson, streamed live, using the brief + the student's accumulated history.
4. The student reads it, takes a 4-question assessment.
5. The result is written to history and feeds the next lesson's generation.

If that loop produces coherent, adaptive lessons, the product works. Everything else serves the loop.

**Three human roles:** Administrator (creates accounts, manages institution), Teacher (writes briefs, owns enrollment for their courses, reviews progress), Student (takes lessons). Plus the AI Agent as a system actor.

---

## Tech Stack (do not deviate without an explicit instruction)

| Layer | Choice | Notes |
|---|---|---|
| Backend | **Django 5.x + DRF** | API-only — serves NO user-facing HTML. Django admin stays for internal inspection. |
| Backend runtime | **ASGI via Uvicorn workers** | `gunicorn paideia.asgi:application -k uvicorn.workers.UvicornWorker` |
| DB driver | **psycopg 3** (`psycopg[binary]`) | NOT psycopg2. Required for async ORM. |
| Database | **PostgreSQL 16** | JSONB for lesson blocks + assessment questions. |
| AI | **Anthropic Python SDK** (`AsyncAnthropic`) | Model read from `ANTHROPIC_MODEL_VERSION` env var — never hardcode. |
| Auth | **Clerk** | Clerk owns identity; Django owns authorization. |
| Frontend | **Next.js 14 (App Router) + TypeScript** | |
| Styling | **Tailwind CSS** + design tokens | See "Design System" below. |
| Streaming | **fetch() + ReadableStream** on the client | NOT EventSource — it's GET-only, can't open the POST session endpoint. |
| Validation | **pydantic 2** (backend), **zod** (frontend) | |
| Deployment | **Railway** — 3 services (Next.js, Django, Postgres) | |

---

## Repository Layout

```
paideia/
├── AGENTS.md                  ← you are here
├── docs/
│   ├── fsd.md                 ← Functional Spec: WHAT the system does + acceptance criteria
│   ├── tsd.md                 ← Technical Spec: HOW it's built + API contract + interface contracts
│   └── design-system.md       ← Visual system: tokens, components, role surfaces
├── waves/
│   ├── wave-00-foundation.md
│   ├── wave-01-identity.md
│   ├── wave-02-courses-enrollment.md
│   ├── wave-03-agent-isolated.md
│   ├── wave-04-core-loop.md
│   ├── wave-05-rendering.md
│   └── wave-06-progress-hardening.md
├── backend/                   ← Django API (Railway Service 2)
└── frontend/                  ← Next.js (Railway Service 1)
```

---

## Which Doc Answers Which Question

| Your question | Consult |
|---|---|
| "What should this feature do? What's the acceptance test?" | `docs/fsd.md` — find the requirement code (e.g. `SESS-02`, `REND-04`, `AGENT-09`) |
| "How is this built? What's the API shape? What crosses this boundary?" | `docs/tsd.md` — API contract is §7, interface contracts §13, data model §5 |
| "What color / font / spacing / component style?" | `docs/design-system.md` — tokens and component specs |
| "What is the build order? What's in scope for my wave?" | `waves/wave-NN-*.md` |

**Requirement codes are the linking system.** When a wave task says "implements `SESS-03`", search `docs/fsd.md` for `SESS-03` to get the exact requirement, then `docs/tsd.md` for the same code to get the implementation detail. Always honor the code — do not reinterpret it.

---

## Canonical Decisions (these override any apparent ambiguity in the docs)

These were resolved during spec review. If a doc seems to contradict one of these, the decision below wins:

1. **Design system is canonical.** Use **Fraunces** (serif display/headlines/lesson titles), **Geist** (sans body/UI), **JetBrains Mono** (metadata/labels). The FSD/TSD documents themselves were authored in a different display font for internal readability — ignore their typography; build the product per `docs/design-system.md`. Canvas is parchment `#FAF6EE`, never pure white. Primary is ink-blue `#1C2A4A`, accent is ochre `#B8862C`.

2. **Streaming transport is `fetch()` + `ReadableStream`**, never EventSource. (FSD/TSD corrected; if you find a stray EventSource mention it is stale — use fetch.)

3. **Interactive-block failure detection is a `postMessage` handshake** with a 4s timeout, never iframe `onError` (which doesn't fire for `srcDoc`).

4. **Interactive-block CSP is an injected `<meta http-equiv="Content-Security-Policy">` tag**, never the non-standard iframe `csp` attribute.

5. **Interactive-block size ceiling is 15,000 chars; lesson `max_tokens` is 8,000.** These are a coordinated pair (`AGENT-05` + `AGENT-09`).

6. **Cross-scope reads return `404`, not `403`** (anti-enumeration). `403` is only for forbidden actions on visible resources.

7. **`teacher_id` is nullable** on `courses` — a deactivated teacher's courses keep running unassigned until an admin reassigns.

8. **There is no `FAILED` session state.** A failed generation deletes the session row entirely.

9. **Canonical field names** (identical in DB, API, context, blocks): `lesson_title`, `estimated_read_minutes`, `key_concepts_covered`, `assessment_outcome`.

10. **Enrollment is teacher-owned** (admin is a fallback for bulk setup).

---

## Universal Rules for All Work

**Async discipline.** Inside the one async view (session generation), every DB call uses the async ORM (`aget`, `asave`, `acreate`) or is wrapped in `sync_to_async`. A single sync ORM call there raises `SynchronousOnlyOperation`. All other views are ordinary sync DRF.

**Authorization via permission classes + queryset scoping.** Never inline `if user.role ==` checks in view bodies. Use the four DRF permission classes (`IsAdmin`, `IsTeacher`, `IsSameSchool`, `IsCourseOwnerOrAdmin`) and override `get_queryset()` to scope to the user's school/courses. List endpoints must never return objects outside scope.

**Every secret is an env var.** Never hardcode API keys, model versions, or connection strings. The full env var list is in `docs/tsd.md` §6.3.

**Error envelope.** Every non-streaming error returns the standard JSON envelope (`docs/tsd.md` §14.1): `{ "error": { "code", "message", "detail" } }`. Never a bare string or stack trace.

**The contract is two-sided.** When you change an API response shape, update the Django serializer AND the matching zod schema in `frontend/lib/schemas.ts` in the same change. They are mirrors.

**Tests are part of the task, not after it.** Each wave file lists the unit and integration tests required. A task is not done until its tests pass. CI runs them; do not mark a wave complete with failing tests.

**Stay in your wave.** Do not build features from a later wave because they seem easy. Waves are sequenced so each one is fully testable before the next depends on it. Building ahead breaks the integration contract between waves.

---

## How Waves Work

Each wave file (`waves/wave-NN-*.md`) contains:
- **Outcome** — the single testable thing the wave delivers.
- **Depends on** — which prior waves must be complete.
- **Tasks** — atomic units, each with acceptance criteria and the FSD/TSD codes it implements.
- **Unit tests** — what to test in isolation.
- **Integration tests** — what to test across the boundary with prior waves.
- **Definition of done** — the demonstrable proof the wave is complete.

Work tasks in order within a wave. Run the wave's tests before declaring it done. The integration tests specifically verify that this wave interfaces correctly with the ones before it — they are the seam that keeps the system coherent.

---

## When You're Unsure

1. Search the relevant doc for the requirement code.
2. Check the Canonical Decisions list above.
3. If still ambiguous, prefer the **simpler, more testable** option and leave a `// SPEC-AMBIGUITY:` comment noting the decision you made and why. Do not silently guess on anything that affects an interface contract.
