# Wave 05 — The Rendering Engine

> **Outcome:** Lessons render beautifully and correctly — markdown with equations, sandboxed interactive visuals, and the full assessment state machine — all on the design system's signature Lesson Card. The plain text view from Wave 04 is replaced by the real, structured, three-renderer experience.

**Depends on:** Wave 04 (sessions stream + `GET /sessions/{id}/lesson` returns the block array; assessment endpoints exist)
**Implements (FSD):** REND-01 → REND-07, the block schema render (§13), interactive sandbox (§13.4), assessment engine UI (§13.5) · **TSD:** §11.2 (stream client), §12 (entire rendering engine), §13-B1 · **Design system:** §13 Lesson Card, §14 Interactive Frame, §15 Assessment Engine
**Maps to:** TSD Implementation Sequence Phase 05

---

## Tasks

### T5.1 — Stream client (`lib/stream.ts`) — Canonical Decision 2
`fetch()` + `ReadableStream` reader for the POST session endpoint (NOT EventSource). Decodes SSE frames, exposes a typed event stream (`session_started`, `lesson_meta`, `token`, `lesson_complete`, `assessment_ready`, `error`, `done`) per TSD §11.2.
- **Acceptance:** Consumes the Wave 04 stream; each event maps to the documented frontend reaction (TSD §11.2 table).

### T5.2 — Block router (`LessonRenderer.tsx`) — REND-01
Iterates `blocks`, dispatches by `type` to the three renderers. Unknown types skipped silently (forward-compatibility).
- **Acceptance:** A mixed block array (text/interactive/callout + an unknown type) renders correctly with the unknown skipped.

### T5.3 — Renderer 1: Text & Callout — REND-07
`react-markdown` + `remark-math` + `rehype-katex` + `rehype-highlight` + `remark-gfm`. KaTeX CSS loaded globally in the root layout (REND-07 — no lazy load, no flash of unstyled math). Callout variants (definition/note/example/warning) styled per design-system §13.
- **Acceptance:** A lesson with an inline equation renders it correctly on first paint; tables, lists, code, and callouts render per design tokens.

### T5.4 — Renderer 2: Interactive Sandbox — REND-02, Canonical Decisions 3 & 4
`InteractiveBlock.tsx` per design-system §14 and FSD §13.4: `srcDoc` iframe, `sandbox="allow-scripts"` (no `allow-same-origin`). Failure detection is the `postMessage` ready-handshake with a 4s timeout → text fallback (NOT `onError`). The CSP `<meta>` and ready-bootstrap were injected server-side in Wave 03; the client just listens for `paideia:ready`. Header bar with ochre dot + mono label per design-system §14.
- **Acceptance:** A valid interactive renders and is interactive; a block that never posts `paideia:ready` falls back to the text message within 4s; the rest of the lesson is unaffected. Verify in-browser that `window.parent.document` access from inside the iframe throws (AC-04).

### T5.5 — Progressive render + block swap — REND-03, REND-04
On `lesson_meta`: render the Lesson Card header (title, read time, key-concepts preview, context line) immediately (REND-03 + the FSD PROG-06 context line). During `token` events: render streamed text progressively in the live markdown view. On `lesson_complete`: fetch `GET /sessions/{id}/lesson` and swap the live view for the structured block render including interactive iframes (REND-04 — text streams live, interactive appears on completion).
- **Acceptance:** Student sees header instantly, text building live, then interactive visuals appearing on completion. Matches the single streaming model exactly.

### T5.6 — Renderer 3: Assessment Engine — REND-05, REND-06
`AssessmentEngine.tsx` as a `useReducer` state machine (IDLE→ANSWERING→REVEALED→COMPLETE) per design-system §15 / FSD §13.5. "Start Assessment" sticky/visible during reading (REND-05). Each answer POSTed immediately on confirm (REND-06); reveal correctness + explanation; final → session summary (score, per-concept breakdown, outcome badge, continue CTA).
- **Acceptance:** Full assessment runs question-by-question with immediate reveal; close-and-resume preserves answered questions (ties to SESS-04); summary shows correct outcome.

### T5.7 — Lesson Card surface — Design system §13
Assemble the signature Lesson Card: parchment context, `--surface` card, `--r-lg`, `--shadow-3`, generous padding, ochre mono eyebrow, Fraunces title (one-word italic emphasis allowed), italic context line, concept tags, 720px reading measure. This is the product's hero surface — match the design system precisely.
- **Acceptance:** The rendered Lesson Card is visually faithful to design-system §13: fonts, colors, spacing, shadow, reading measure.

---

## Unit Tests

- Block router: each type → correct component; unknown type → null, logged.
- Text renderer: markdown with `$...$` math → KaTeX output; GFM table → table; code fence → highlighted.
- Interactive: handshake received → `ready`; no handshake in 4s → `failed`/fallback; component never grants parent access (jsdom assertion on sandbox attrs).
- Assessment reducer: each state transition; answer posts on confirm; cannot change a confirmed answer; cannot skip.
- Stream client: each SSE frame parsed into the correct typed event.

## Integration Tests

- **Interactive sandbox security (AC-04):** render a real lesson with an interactive block; assert the iframe has `sandbox="allow-scripts"` and no `allow-same-origin`; assert an attempt to reach `window.parent` from generated content throws.
- **Fallback (AC-12):** feed a block whose generated HTML never posts `paideia:ready` → the block shows the fallback, the rest of the lesson renders intact, failure logged.
- **End-to-end render:** Wave 04 stream → progressive text → block swap → interactive appears → assessment runs → summary. Full visual path on the Lesson Card.
- **Resume render (with SESS-04):** mid-assessment reload restores the engine to the first unanswered question with prior answers preserved.
- **Equation first-paint (REND-07):** a lesson whose first text block contains an equation renders it without a flash of unstyled math.

## Definition of Done

FSD **AC-04, AC-12** pass; the lesson now renders as the full Lesson Card with live text streaming, interactive sandboxed visuals (with secure isolation proven), equations, and the complete assessment flow — all faithful to the design system. The Wave 04 plain view is fully replaced.

**Demo:** "A lesson with an interactive visual renders beautifully and securely; the assessment runs to a summary."
