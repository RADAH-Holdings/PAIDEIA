# Wave 4 — The Agent, in Isolation

> **Goal:** Prove the highest-unknown part of the product — that the AI agent,
> given a fixture context dict, reliably produces a **validated** `Lesson` and
> `Assessment`. No database, no HTTP, no streaming. Pure functions and fixtures.

**Realises:** FSD `AGENT-01`–`AGENT-09`, `REND-01`/`REND-02` (block schema + validation), `ASMT-01`–`ASMT-06` (assessment shape) · TSD §9 (agent layer), §6.1 (`agent` app is pure) · DS §13/§14 (block types the renderer expects)
**Depends on:** nothing in the app — runs independently of Waves 1–3.
**Feeds:** Wave 5 wraps the orchestrator around this agent.

> **This is the build's spine.** If this wave's exit passes, the riskiest unknown
> is retired. If lesson/assessment output can't be made to parse reliably here —
> against fixtures, where it's cheapest to debug — no later wave rescues it. Spend
> the time here.

---

## Scope

### In
- `agent` app, **pure** — imports nothing from `accounts`/`courses`/`sessions`, no Django, no DB.
- `client.py` — `AsyncAnthropic` wrapper: `stream_lesson(context)` (async generator of raw text) and `generate_assessment(lesson)` (async, returns parsed object). Model + timeout from settings/env.
- `prompts.py` — versioned lesson + assessment prompt templates. Output is tagged: `<plan>`, `<blocks>` (JSON array), `<meta>`.
- `parsers.py` — pure functions: extract the three tags; parse the assessment JSON; the `IncrementalLessonParser` that, fed raw token chunks, yields **only** clean text-block markdown (suppresses `<plan>` and JSON scaffolding).
- `validators.py` — pydantic validation of parsed output; interactive-block HTML validation (complete document, no non-whitelisted `fetch`/`XHR`, ≤15,000 chars, CDN whitelist); inject the CSP `<meta>` tag + the `paideia:ready` bootstrap into each interactive block.
- `schemas.py` — pydantic `Lesson`, `TextBlock`, `InteractiveBlock`, `CalloutBlock`, `Assessment`, `Question`.
- 3–5 fixture context dicts: first session, mid-course, reinforcement-after-poor-score, thin-brief, an interactive-heavy subject.
- A dev script/notebook: feed a fixture → show raw output + parsed result side by side.

### Out
- Any DB persistence, any HTTP endpoint, any streaming transport (W6), any orchestration (W5).

> **This is the only wave that calls the real Anthropic API in tests** (a dedicated
> low-cost key). Keep these tests in a separate, opt-in suite so the default CI run
> stays hermetic and free.

---

## Backend deliverables
- `agent/{client,prompts,parsers,validators,schemas}.py` per TSD §9.1.
- `agent/fixtures/*.json` — the fixture contexts.
- `agent/devtools/preview.py` — fixture-in, raw + parsed-out inspector.
- The `IncrementalLessonParser` with its own thorough unit suite (it's fiddly; test the state transitions hard).

## Frontend deliverables
- None. (This wave is backend-only by design.)

---

## Unit tests
| ID | Asserts |
|---|---|
| `T-W4-01` | `parse_lesson_output` extracts `<plan>`/`<blocks>`/`<meta>` from a well-formed raw fixture. |
| `T-W4-02` | Malformed/unparseable raw output raises `AgentParseError` (never returns a half-lesson) — `AGENT-04`. |
| `T-W4-03` | `IncrementalLessonParser` fed chunked raw text yields clean text-block markdown only; never emits `<plan>` content or JSON braces. |
| `T-W4-04` | An interactive block over 15,000 chars is rejected and replaced with a text fallback block; the rest of the lesson survives (`AGENT-05`, `REND-02`, `AC-12`). |
| `T-W4-05` | An interactive block with a non-whitelisted `fetch()` target is rejected. |
| `T-W4-06` | Valid interactive HTML gets the CSP `<meta>` tag and the `paideia:ready` bootstrap injected. |
| `T-W4-07` | Assessment JSON validates to the `Assessment` schema; a malformed assessment triggers exactly one retry, then marks `not_taken` (`AGENT-06`). |
| `T-W4-08` | `max_tokens` is 8000 and the interactive ceiling is 15,000 — the two coordinated constants exist and are referenced, not duplicated by magic numbers (`AGENT-09`). |
| `T-W4-09` | A generation call exceeding `AGENT_TIMEOUT_SECONDS` raises the timeout path (`AGENT-07`), mockable without the real API. |

## Live (opt-in, real API) tests
| ID | Asserts |
|---|---|
| `T-W4-LIVE-01` | Each fixture context produces a `Lesson` that passes full validation against the real model. |
| `T-W4-LIVE-02` | The reinforcement fixture (poor prior score) produces a lesson whose `<plan>` references revisiting the weak concept. |

## Integration seam — (none; isolated wave)
The seam is deferred to Wave 5, which connects this agent to a real context built
from DB data. Here, the **fixture suite is the contract**: the shapes these
functions accept and return are exactly what Wave 5 will produce and consume.

## Manual demo
Run `python -m agent.devtools.preview --fixture mid_course`. Read the generated
lesson and assessment in the terminal. Run it three times — confirm the output
parses every time and reads like a real lesson for the fixture's subject/level.

## Exit criteria
- [ ] All `T-W4-*` hermetic unit tests green in default CI.
- [ ] `T-W4-LIVE-*` green against the real model with the dedicated key (run manually, not in default CI).
- [ ] Across ~10 manual runs over the fixture set, output parses to a valid `Lesson` every time (parser robustness is the gate, not lesson taste).
- [ ] `agent/` imports nothing from `accounts`/`courses`/`sessions` (enforce with an import-lint check).
