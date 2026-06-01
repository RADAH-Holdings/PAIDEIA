# Paideia

Content-less LMS where an AI agent generates the curriculum one lesson at a time. See [`AGENTS.md`](AGENTS.md) for stack decisions, repo layout, and rules.

## Build waves

Eight waves, each a vertical slice ending in a **demonstrable, testable outcome**. Each wave's exit criteria must pass before the next wave's first commit.

| Wave | Outcome | Spine? |
|---|---|---|
| [01 — Skeleton & Identity](tasks/phase-01.md) | Services deploy; a user logs in via Django JWT; `/me` works end-to-end. | |
| [02 — Accounts & RBAC](tasks/phase-02.md) | Admin creates accounts; forced password change; the four permission classes enforce role + school. | |
| [03 — Courses & Enrollment](tasks/phase-03.md) | Teacher creates/activates a course and enrolls students; admin reassigns on deactivation. | |
| [04 — The Agent, in Isolation](tasks/phase-04.md) | The agent reliably produces validated Lessons + Assessments from fixtures. No DB. | **spine** |
| [05 — The Sync Session Loop](tasks/phase-05.md) | A real student takes a real session; a second session adapts from the first. | **spine** |
| [06 — Streaming Delivery](tasks/phase-06.md) | The lesson builds live; persistence identical to the sync path. | |
| [07 — The Rendering Engine](tasks/phase-07.md) | Text+math+code, callouts, and sandboxed interactive blocks render to the design system. | |
| [08 — Hardening & Pilot](tasks/phase-08.md) | All `AC-01`–`AC-14` pass; resilient, observable, pilot-ready. | |

Full wave index: [`tasks/README.md`](tasks/README.md).

## Specs

| Document | Purpose |
|---|---|
| [`docs/fsd.md`](docs/fsd.md) | Functional requirements and acceptance criteria |
| [`docs/tsd.md`](docs/tsd.md) | Architecture, API contract, data model |
| [`docs/design-system.md`](docs/design-system.md) | Visual tokens and component specs |

## Dependency chain

```
W1 ─▶ W2 ─▶ W3 ──────────────▶ W5 ─▶ W6 ─▶ W7 ─▶ W8
                  W4 ──────────▶ ╯
              (independent)   (W5 needs W3 + W4)
```

W4 runs independently of W1–W3 (pure, no DB) and can be built in parallel. **W5 is where W3 and W4 converge** — that seam is the product spine.
