# Paideia Build Waves — Index

Six waves take Paideia from empty repo to pilot-ready MVP. Each wave has ONE testable outcome, depends only on prior waves, and is gated by integration tests that prove it interfaces correctly with what came before. **Do not start a wave until the previous wave's Definition of Done is met.**

| Wave | Outcome | Proves | Key ACs |
|---|---|---|---|
| **00 — Foundation** | Sign in → role-correct empty dashboard; async path proven | The infrastructure runs, async actually works | — |
| **01 — Identity** | Admin manages accounts; RBAC enforced | Identity + authorization are solid | AC-01 |
| **02 — Courses & Enrollment** | Teacher owns course lifecycle + enrollment | Everything that must exist before a session | AC-02, AC-14 (groundwork) |
| **03 — Agent (Isolated)** | Fixture context → validated Lesson + Assessment, no DB/UI | **The product hypothesis is buildable** | AGENT-* |
| **04 — Core Loop** | Student streams a lesson; next session adapts | **The product works** | AC-03, AC-06, AC-07, AC-08, AC-09 |
| **05 — Rendering** | Beautiful, secure, structured lesson + assessment | The experience is real | AC-04, AC-12 |
| **06 — Progress & Hardening** | Progress views, failure matrix, all ACs pass | **Pilot-ready** | AC-01 → AC-14 (all) |

## The Two Highest-Stakes Waves

- **Wave 03** proves the single biggest unknown — can the agent generate good lessons — in isolation, cheaply, before anything depends on it. Its tests matter most.
- **Wave 04** is the product. **AC-07 (adaptation)** is the gate: session N+1 must demonstrably adapt to session N's performance. If AC-07 is green, the core hypothesis is validated.

## The Seam Between Waves

Each wave's **Integration Tests** section is the seam. It verifies the new wave interfaces correctly with prior waves:
- Wave 01 ↔ 00: account creation flows through the auth bridge to role routing.
- Wave 02 ↔ 01: course/enrollment ownership uses the RBAC layer; reassignment uses the account layer.
- Wave 03 ↔ 02: fixture contexts use the `prompt_context` snapshot shape; agent stays import-isolated.
- Wave 04 ↔ 03: the orchestrator wires the isolated agent into real streaming; the parser drives the SSE.
- Wave 05 ↔ 04: the renderer consumes the stream + block array the loop produces.
- Wave 06 ↔ all: the full acceptance sweep + three sequence flows confirm the assembled system.

## How an Agent Should Use a Wave File

1. Read `AGENTS.md` (root) for project context + canonical decisions.
2. Read the wave file fully before starting any task.
3. For each task, resolve its FSD/TSD codes in `docs/` to get the exact requirement + implementation.
4. Build the task AND its tests together.
5. Run the wave's unit + integration tests. All green before moving on.
6. Meet the Definition of Done before starting the next wave.
