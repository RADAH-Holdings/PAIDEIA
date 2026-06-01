# Wave 7 — The Rendering Engine

> **Goal:** The lesson looks and feels complete — text with math/code, callouts, and
> the signature sandboxed interactive blocks, all rendered to the design system.

**Realises:** FSD `REND-01`–`REND-07`, the rendering acceptance criteria · TSD §12 (the three renderers + block router), §12.3 (the sandbox, CSP, postMessage handshake) · DS §12/§13/§14 (concept tags, Lesson Card, Interactive Frame)
**Depends on:** Wave 6 (the stream delivers blocks; the block fetch returns the structured array).
**Feeds:** Wave 8 hardens and pilots the finished experience.

---

## Scope

### In
- `LessonRenderer.tsx` — the block router: maps each block by `type` to its renderer; unknown types skipped silently (`REND-01`, forward-compat).
- `TextBlock.tsx` — react-markdown with the fixed plugin chain: `remark-math` + `rehype-katex` (equations), `rehype-highlight` (code), `remark-gfm` (tables). KaTeX CSS loaded globally in the root layout, never lazily (`REND-07`).
- `CalloutBlock.tsx` — variant-styled container (definition/note/example/warning) wrapping the markdown renderer.
- `InteractiveBlock.tsx` — the sandboxed iframe (`srcDoc`, `sandbox="allow-scripts"`, no `allow-same-origin`); CSP already injected as a `<meta>` tag by the W4 validator; failure via the `paideia:ready` `postMessage` handshake + 4s timeout → text fallback (`REND-02`). **Never `onError`.**
- The Lesson Card and concept tags to the DS §12/§13 spec (Fraunces title, ochre eyebrow, italic context line, parchment surface, Level-3 shadow).
- The Interactive Frame chrome (DS §14): header bar with the ochre dot + mono label, fallback state.

### Out
- Teacher diagnostic lesson review (W8 — same renderer, plus the plan/context footer).
- Any new block types beyond text/callout/interactive (the router tolerates unknowns; new types are post-MVP).

---

## Backend deliverables
- None new (the block schema + validation + CSP/bootstrap injection were built in W4; this wave consumes them). Confirm `GET /sessions/{id}/lesson` returns the structured block array per TSD §7.6.

## Frontend deliverables
- `components/lesson/LessonRenderer.tsx`, `TextBlock.tsx`, `CalloutBlock.tsx`, `InteractiveBlock.tsx`.
- Root layout: global KaTeX CSS.
- The CDN whitelist mirrored in the injected CSP (kept in sync with the W4 validator allowlist + the prompt whitelist — all three move together).

---

## Component tests
| ID | Asserts |
|---|---|
| `T-W7-01` | The block router renders text/callout/interactive to the right component and skips an unknown `type` without crashing (`REND-01`). |
| `T-W7-02` | A text block with `$...$` math renders KaTeX; a fenced code block highlights; a markdown table renders (`REND-07`). |
| `T-W7-03` | The interactive iframe has `sandbox="allow-scripts"` and does **not** have `allow-same-origin`. |
| `T-W7-04` | When no `paideia:ready` message arrives within 4s, the block shows the text fallback; the rest of the lesson is unaffected (`REND-02`). |
| `T-W7-05` | A `paideia:ready` message from the iframe flips the block to the ready state (handshake works). |
| `T-W7-06` | The Lesson Card matches DS §13 anatomy: Fraunces title, ochre mono eyebrow, italic context line, concept tags above body, parchment surface. |
| `T-W7-07` | KaTeX CSS is present at first paint (no flash of unstyled math) — loaded in the root layout, not lazily. |

## Integration seam — Wave 6 → Wave 7
`T-SEAM-W7`: a streamed session (W6) reaches `lesson_complete`; the client fetches
the structured block array and the renderer produces the full lesson — text builds
live during streaming, then interactive blocks appear on completion (`REND-04`'s
single streaming model). A lesson containing one valid interactive block and one
oversized/invalid one renders the valid one in its sandbox and the invalid one as a
text fallback, with all text blocks intact.

## Manual demo
Take a real Science session that includes an interactive simulation. Watch the text
build live; on completion the simulation appears in its framed sandbox and is
interactive. Force a broken interactive (test fixture) — the lesson still reads
fine with a graceful fallback in that block's place. Equations and code render
correctly in a Math/CS lesson.

## Exit criteria
- [ ] All `T-W7-*` + `T-SEAM-W7` green.
- [ ] On staging, a real interactive block runs inside the sandbox and cannot reach the parent page (verify no `allow-same-origin`).
- [ ] A broken interactive degrades to fallback without breaking the lesson.
- [ ] Math, code, callouts, and tables all render to the design system.
