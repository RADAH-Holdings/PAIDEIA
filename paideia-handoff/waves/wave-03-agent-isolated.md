# Wave 03 — The AI Agent, in Isolation

> **Outcome:** Given a fixture context dictionary, the `agent` module produces a validated `Lesson` object (structured blocks) and a validated `Assessment` object — with NO database, NO HTTP, NO streaming, NO Django. This is the riskiest unknown in the project, proven cheaply before the loop wraps around it.

**Depends on:** Wave 02 (the `prompt_context` snapshot shape — used to build fixture contexts; the agent itself imports nothing from courses/sessions)
**Implements (FSD):** AGENT-01, AGENT-03, AGENT-04, AGENT-05, AGENT-06, AGENT-09, lesson/assessment prompt specs (FSD §12.1, §12.2), block schema (FSD §13.2) · **TSD:** §9 (entire), §6.1 ("agent is a pure app")
**Maps to:** TSD Implementation Sequence Phase 03

---

## Why This Wave Is Isolated

The agent's output quality is the biggest unknown. Proving it against fixtures — no DB, no streaming, no UI in the way — surfaces prompt and parsing problems while they're cheap to fix. By Wave 04 the agent is a known quantity and the loop is just plumbing. The `agent` app must import nothing from `accounts`, `courses`, or `sessions` (TSD §6.1). It receives a plain dict, returns plain pydantic objects.

---

## Tasks

### T3.1 — pydantic schemas (`agent/schemas.py`)
Define `TextBlock`, `InteractiveBlock`, `CalloutBlock`, `LessonBlock` (union), `Lesson`, `Question`, `Assessment` exactly per FSD §13.2 block schema. Canonical field names: `lesson_title`, `key_concepts` (on the lesson), `estimated_read_minutes`, `has_interactive`.
- **Acceptance:** Schemas validate a hand-written valid lesson fixture and reject malformed ones.

### T3.2 — Versioned prompts (`agent/prompts.py`)
Lesson-generation and assessment-generation system prompts per FSD §12.1 / §12.2. Each prompt carries a version string. `build_lesson_prompt(context)` assembles from the context dict (course brief + summarised history). Include the interactive-block rules and the CDN whitelist verbatim (design-system §16 / FSD §13.7).
- **Acceptance:** `build_lesson_prompt` produces a complete prompt from a fixture context; the prompt version is retrievable for logging.

### T3.3 — Async client (`agent/client.py`)
Wrap `AsyncAnthropic`. `stream_lesson(context)` → async generator of raw text deltas. `generate_assessment(lesson)` → awaited parsed result. Model from `ANTHROPIC_MODEL_VERSION`. Wrap calls in `asyncio.wait_for(..., AGENT_TIMEOUT_SECONDS)` (AGENT-07). `max_tokens=8000` for lessons (AGENT-09).
- **Acceptance:** Against the live API (or a recorded fixture), `stream_lesson` yields deltas and `generate_assessment` returns parseable output. Timeout raises cleanly.

### T3.4 — Incremental parser (`agent/parsers.py`) — THE hard part
Build `IncrementalLessonParser` (referenced in TSD §10, FSD §12.3). It consumes the raw token stream and:
- detects `<plan>...</plan>` → **suppress** (never emit, store separately)
- detects text-block `content` → **emit clean markdown** outward
- detects JSON scaffolding / `<blocks>` / `<meta>` → **suppress** from the live stream
- exposes `meta` once `<meta>` is parsed
Also build `parse_lesson(full_raw)` for the final full-buffer parse into the block array, and assessment JSON parsing. This is a character-stream state machine — test it hard.
- **Acceptance:** Fed a recorded raw response, the parser emits ONLY clean text-block markdown live, suppresses the plan entirely, and `parse_lesson` returns the correct block array. Implements the single streaming model (Canonical Decision 2, FSD REND-04).

### T3.5 — Validators (`agent/validators.py`)
`validate_lesson(parsed)` against the pydantic `Lesson`. Interactive-block HTML validation (AGENT-05): complete HTML document, no `fetch()`/`XMLHttpRequest` to non-whitelisted domains, ≤ 15,000 chars. A failing interactive block is **replaced with a text fallback block** (not the whole lesson rejected) — FSD AGENT-05 / AC-12. Inject the CSP `<meta>` tag and the `postMessage` ready-bootstrap into valid interactive HTML (Canonical Decisions 3, 4).
- **Acceptance:** Valid HTML passes and emerges with CSP meta + ready-bootstrap injected; oversized/disallowed HTML is replaced by a fallback block; the lesson still validates.

### T3.6 — Assessment retry (AGENT-06)
`generate_assessment` validates JSON against the `Assessment` schema; a malformed response triggers exactly one retry; only a second failure raises `AgentError` (caller marks unavailable).
- **Acceptance:** Mocked malformed-then-valid → succeeds on retry; malformed-twice → raises.

### T3.7 — Prompt dev harness (standalone script)
A `backend/agent/devharness.py` that loads a fixture context JSON, calls the agent, and prints raw output alongside parsed result. Ship 3–5 fixture contexts: first session (empty history), mid-course, reinforcement session (prior `needs_reinforcement` with `concepts_missed`), a thin-brief case, a maths-with-equations case.
- **Acceptance:** Running the harness against each fixture produces a coherent, on-level lesson and a valid 4-question assessment. This is where prompt iteration happens.

---

## Unit Tests

- pydantic schemas: valid lesson/assessment pass; each malformation (missing field, wrong block type, 2 questions instead of 4) fails.
- `IncrementalLessonParser`: plan fully suppressed; only text-block content emitted live; meta extracted; final `parse_lesson` block array correct. Test with at least 3 recorded raw responses including one with an interactive block.
- Interactive HTML validator: complete-doc check; disallowed-call rejection; >15k rejection → fallback substitution; CSP meta + bootstrap injection present in output.
- Assessment retry: malformed→valid (one retry, succeeds); malformed→malformed (raises).
- Prompt builder: produces complete prompt; reinforcement context surfaces `concepts_missed` in the prompt text.

## Integration Tests

- **Fixture → full agent → validated objects:** for each of the 5 fixture contexts, run the real `stream_lesson` + `generate_assessment` path and assert: a valid `Lesson` with 3–5 `key_concepts`, 400–700 words of text, blocks parse; a valid `Assessment` with exactly 4 questions covering ≥3 distinct concepts. (This is FSD AGENT-level proof and the Phase-03 demo.)
- **Token budget:** a fixture that induces an interactive block stays within `max_tokens=8000` and the block ≤15k chars (AGENT-09 ↔ AGENT-05 coordination).
- **No Django imports:** a static check (grep/import-linter) asserts `agent/` imports nothing from `accounts`, `courses`, `sessions`.

## Definition of Done

The agent produces coherent, on-level lessons and valid assessments for all 5 fixture contexts, entirely in isolation. The incremental parser is proven against recorded streams. Interactive-block validation + injection works. The agent app has zero domain imports. This is the wave that proves the product hypothesis is buildable — treat its tests as the most important in the project.

**Demo:** "A fixture context produces a validated, coherent Lesson object and a valid Assessment — no database, no UI."
