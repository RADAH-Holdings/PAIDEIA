# Paideia — Agent Operating Guide

> **Read this file first, every session.** It tells you what Paideia is, how the
> repo is organised, which spec to consult for which question, and the rules that
> are easy to get wrong. When in doubt, the specs in `docs/` are authoritative.

---

## 1. What Paideia Is

Paideia is a **content-less Learning Management System where an AI agent IS the
curriculum.** A school licenses it; a teacher writes a plain-language course brief;
the AI agent generates lessons **one at a time** as each student progresses,
adapting each lesson to that student's accumulated session history.

The product's entire bet is one hypothesis:

> An AI agent, given only a teacher's brief and a student's session history, can
> generate coherent, sequential, personalised lessons — including interactive
> visual blocks — that constitute a complete course over time.

Everything in the build serves proving that loop. The loop and its rendering are
the product; the surrounding CRUD is plumbing.

There are **three human roles** (Admin, Teacher, Student) and **one AI Agent** actor.

---

## 2. Canonical Decisions (do not re-litigate)

These were settled during specification. Do not "improve" them without an explicit
instruction — they have cross-cutting consequences.

| Decision | Value |
|---|---|
| **Auth** | Django `django.contrib.auth` + `djangorestframework-simplejwt`. **NOT Clerk.** The `User` model IS the identity. JWT access + refresh, sent as `Authorization: Bearer`. |
| **Backend** | Django 5 + DRF, **API-only** (no user-facing HTML; Django admin allowed for internal use). ASGI under Uvicorn workers. |
| **Async** | Only the session-generation endpoint is an async view. Everything else is sync DRF. |
| **Streaming transport** | `fetch()` + `ReadableStream` reader. **NEVER `EventSource`** (it's GET-only; the session endpoint is POST). |
| **DB** | PostgreSQL 16. `psycopg` v3 (`psycopg[binary]`). **NOT psycopg2.** JSONB for lesson blocks + assessment questions. |
| **AI** | Anthropic Python SDK, `AsyncAnthropic`. Model version from `ANTHROPIC_MODEL_VERSION` env var — never hardcoded. |
| **Frontend** | Next.js 14 App Router, TypeScript, Tailwind. |
| **Interactive sandbox** | `<iframe srcDoc=... sandbox="allow-scripts">` with **no** `allow-same-origin`. CSP via an injected `<meta http-equiv="Content-Security-Policy">` tag (NOT the non-standard iframe `csp` attribute). Failure detection via a `postMessage` `paideia:ready` handshake with a 4s timeout (NOT `onError` — it doesn't fire for srcDoc). |
| **Token budget** | Lesson `max_tokens` = 8000. Interactive block ceiling = 15,000 chars. These two are coordinated — never change one without the other. |
| **Session states** | `PENDING → GENERATING → ACTIVE → ASSESSING → COMPLETE` (+ `ABANDONED`). **There is no `FAILED` state** — a failed generation deletes the session row. |
| **Cross-scope reads** | Return **404**, not 403, for resources outside the user's scope (anti-enumeration). 403 is only for forbidden actions on visible resources. |
| **Deployment** | Railway, 3 services (Next.js, Django, Postgres), one monorepo. |

## 3. Design System (canonical aesthetic)

The visual system is **"modern classical"** — do not substitute a generic look.

| Token group | Value |
|---|---|
| **Display / headings** | `Fraunces` (variable serif). **NOT** Syne, NOT Playfair. |
| **Body / UI** | `Geist` (sans). **NOT** Inter as the named face. |
| **Mono / metadata** | `JetBrains Mono`. |
| **Canvas** | Warm parchment `#FAF6EE` — **never pure white** for page backgrounds. |
| **Primary** | Ink-blue `#1C2A4A`. |
| **Accent** | Ochre `#B8862C` — used sparingly. |
| **Subjects** | Warm earth palette (terracotta/sage/plum/sienna/dusty-blue/mustard/rose/teal). **No bright primaries.** |
| **Button radius** | 6px (rectangles, not pills). **Card radius** 10px. |

Full token table: `docs/design-system.md`. The **Lesson Card** (§13) is the signature
surface — when unsure of visual tone, match it.

---

## 4. Which Doc Answers Which Question

| If you need to know… | Read |
|---|---|
| What a feature does, the requirement codes (`AUTH-*`, `SESS-*`, `AGENT-*`, `REND-*`, `ACC-*`, `ENROL-*`, `BRIEF-*`, `PROG-*`, `ASMT-*`, `HIST-*`), acceptance criteria (`AC-01`..`AC-14`) | `docs/fsd.md` |
| How it's built — architecture, the API contract (every endpoint + shape), data model + indices, the four interface boundaries, auth flow, streaming pipeline, error envelope | `docs/tsd.md` |
| Colours, type, spacing, component anatomy, the Lesson Card / Interactive Frame / Assessment Engine visual specs, role-surface treatments | `docs/design-system.md` |
| What to build right now, in what order, with what tests | `tasks/phase-0N.md` (the wave files) |

Requirement codes are the lingua franca. When a task says "realises `SESS-04`",
open `docs/fsd.md`, find `SESS-04`, build exactly that.

---

## 5. Repo Layout

```
backend/                      Django API — Railway Service 2
  paideia/                    project root (settings, asgi, urls)
  accounts/                   M1+M2 — School, User, auth (simplejwt), /auth views, permissions, passwords
  courses/                    M3+M4 — Course, Enrollment
  agent/                      M7 — Anthropic client, prompts, parsers, validators, schemas (PURE: no Django imports)
  sessions/                   M5+M6 — Session/Lesson/Assessment models, orchestrator, context assembler, async stream view
  common/                     shared — error envelope, pagination, logging
frontend/                     Next.js — Railway Service 1
  app/                        (auth)/ admin/ teacher/ student/ route groups
  components/lesson/          M8 — LessonRenderer + TextBlock/InteractiveBlock/CalloutBlock/AssessmentEngine
  lib/                        api.ts (typed client), stream.ts (fetch reader), schemas.ts (zod mirrors of API)
docs/                         the specs (fsd / tsd / design-system)
tasks/                        the wave task files
```

**Monorepo rule:** when an API response shape changes, the Django serializer AND
the matching `zod` schema in `frontend/lib/schemas.ts` change in the **same commit**.
They are two halves of one contract.

---

## 6. The `agent` App Is Pure

`backend/agent/` imports **nothing** from `accounts`, `courses`, or `sessions`.
It takes a plain context dict and returns a validated `Lesson` / `Assessment`
pydantic object. No Django models, no HTTP, no DB. This is what lets the agent be
tested against fixtures with no database (Wave 4). Keep it pure.

---

## 7. Testing Rules

- **Unit:** one module, no I/O, boundaries mocked. Real ORM models/serializers/permission classes *within* a wave.
- **Integration:** one Django app against a real test Postgres; one Next route against a boundary-mocked API (MSW).
- **Seam:** the wave-to-wave handoff test. Proves wave N drives wave N−1's components. Gates the next wave's start.
- **Hermetic always:** no real Anthropic key (except the Wave 8 smoke suite with a dedicated low-cost key), no non-test database.
- Anthropic is mocked **everywhere except Wave 4** and the single Wave 8 end-to-end suite.
- Every test has an ID for traceability: `T-W{wave}-{nn}` (unit), `T-SEAM-W{n}` (seam).

A wave is **done** only when its exit criteria pass. The next wave does not start
on the back of unfinished tests.

---

## 8. Easy-to-Get-Wrong List (read before coding)

1. `psycopg` is **v3**, installed `psycopg[binary]`. A sync ORM call inside the async session view raises `SynchronousOnlyOperation` — use `aget`/`asave`/`sync_to_async`.
2. The streaming endpoint must run under the **Uvicorn worker** (`-k uvicorn.workers.UvicornWorker`). Under the default sync worker it silently blocks a worker for 30s.
3. Set `X-Accel-Buffering: no` on the streaming response or Railway's proxy buffers the whole stream.
4. The agent's raw output is tagged JSON (`<plan>`, `<blocks>`, `<meta>`). The server **incrementally parses** it and streams outward **only clean text-block content** — the plan and JSON scaffolding are never sent to the client. Interactive blocks arrive via the block fetch after `lesson_complete`, not as live tokens.
5. A failed/malformed generation **deletes the session row** (no FAILED state). Assessment generation gets **exactly one retry** before being marked `not_taken`.
6. Login must never reveal whether an email exists — generic 401.
7. Accounts are admin-created with a temp password + `force_password_change`; the API blocks all other actions from such a user until the password is changed.
8. No browser storage (`localStorage`/`sessionStorage`) in any artifact-style code path; tokens in memory + HttpOnly refresh cookie where the deployment allows.
