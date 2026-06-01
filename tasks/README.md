# Paideia Build — Wave Overview

Eight waves, each a vertical slice ending in a **demonstrable, testable outcome**.
Each wave's exit criteria must pass before the next wave's first commit. Waves are
outcome-boxes, not time-boxes.

| Wave | Outcome | Spine? |
|---|---|---|
| [01 — Skeleton & Identity](phase-01.md) | Services deploy; a user logs in via Django JWT; `/me` works end-to-end. | |
| [02 — Accounts & RBAC](phase-02.md) | Admin creates accounts; forced password change; the four permission classes enforce role + school. | |
| [03 — Courses & Enrollment](phase-03.md) | Teacher creates/activates a course and enrolls students; admin reassigns on deactivation. | |
| [04 — The Agent, in Isolation](phase-04.md) | The agent reliably produces validated Lessons + Assessments from fixtures. No DB. | **spine** |
| [05 — The Sync Session Loop](phase-05.md) | A real student takes a real session; a second session adapts from the first. | **spine** |
| [06 — Streaming Delivery](phase-06.md) | The lesson builds live; persistence identical to the sync path. | |
| [07 — The Rendering Engine](phase-07.md) | Text+math+code, callouts, and sandboxed interactive blocks render to the design system. | |
| [08 — Hardening & Pilot](phase-08.md) | All `AC-01`–`AC-14` pass; resilient, observable, pilot-ready. | |

## The dependency chain

```
W1 ─▶ W2 ─▶ W3 ──────────────▶ W5 ─▶ W6 ─▶ W7 ─▶ W8
                  W4 ──────────▶ ╯
              (independent)   (W5 needs W3 + W4)
```

W4 runs independently of W1–W3 (it's pure, no DB) and can be built in parallel.
**W5 is where W3 (domain) and W4 (agent) converge** — that convergence is the
build's spine. If W4's exit and W5's exit both pass, the product's central
hypothesis is proven and everything after is engineering over a validated core.

## Why two waves are over-weighted
- **W4** is the highest-unknown wave — prompt + parser quality must converge before any session work wraps around it. Debug it against fixtures where it's cheapest.
- **W5** proves the hypothesis without streaming complexity. If the loop fails here, streaming won't save it; W6 then wraps streaming around a known-good loop.

## Cross-wave test strategy (three tiers, continuous from W1)

| Tier | Scope | Where |
|---|---|---|
| **Unit** | One module, no I/O, boundaries mocked; real ORM/serializers/permissions within a wave. | `backend/*/tests/test_*.py` · `frontend/**/*.test.ts` |
| **Integration** | One Django app vs a real test Postgres; one Next route vs a boundary-mocked API (MSW). | `backend/*/tests/test_integration_*.py` · `frontend/**/*.test.ts` |
| **Seam** | The wave N → N−1 handoff. Proves wave N drives the prior wave's components. **Gates the next wave.** | `backend/tests/seam/test_w{n}.py` |

**Hermetic always:** no real Anthropic key (except W4's opt-in live suite and W8's
end-to-end suite, both with a dedicated low-cost key), no non-test database. The
Anthropic boundary is mocked everywhere else.

Test IDs are traceable: `T-W{n}-{nn}` (unit), `T-SEAM-W{n}` (seam),
`T-W8-AC{nn}` (acceptance). Every seam test is named in its wave file.

## How an agent should pick up a wave
1. Read [`AGENTS.md`](../AGENTS.md) (once per session) and this file.
2. Open the wave file; read its Goal, Scope In/Out, and Exit Criteria first.
3. For each requirement code, look it up in [`docs/fsd.md`](../docs/fsd.md); for shapes/architecture, [`docs/tsd.md`](../docs/tsd.md); for visuals, [`docs/design-system.md`](../docs/design-system.md).
4. Build the deliverables, write the listed tests (by ID), make the seam pass.
5. Do not start the next wave until every exit criterion is checked off.
