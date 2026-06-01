# Paideia — Build Handoff Package

This package hands the Paideia MVP build to coding agents (Cursor Cloud). It is organized so an agent always has the right context in window without browsing large spec documents.

## Start Here

1. **`AGENTS.md`** — the cold-start operating guide. Every agent session reads this first. Project overview, tech stack, repo layout, canonical decisions, universal rules.
2. **`waves/README.md`** — the six-wave build plan and how waves work.
3. **`waves/wave-NN-*.md`** — the unit of work. Pick the current wave, read it fully, build its tasks + tests.
4. **`docs/`** — the source-of-truth specs in Markdown, linked from waves by requirement code.

## Installing Into Your Repo

```
your-repo/
├── AGENTS.md                       ← copy from this package root
├── .cursor/rules/paideia.mdc       ← copy from cursor-rules/paideia.mdc
├── docs/
│   ├── fsd.md                      ← copy from docs/
│   ├── tsd.md
│   └── design-system.md
├── waves/                          ← copy the whole folder
│   ├── README.md
│   └── wave-00 … wave-06 .md
├── backend/                        ← created in Wave 00
└── frontend/                       ← created in Wave 00
```

## The Linking System

Requirement codes (`SESS-03`, `REND-04`, `AGENT-09`, `AC-07`, …) connect everything:
- A wave task says *"implements `SESS-03`"*.
- Search `docs/fsd.md` for `SESS-03` → the WHAT + acceptance.
- Search `docs/tsd.md` for `SESS-03` → the HOW + interface detail.

All 76 FSD codes and all 14 acceptance criteria are preserved verbatim in the Markdown.

## Build Order (one outcome per wave)

| Wave | Outcome |
|---|---|
| 00 Foundation | Sign in → role dashboard; async proven |
| 01 Identity | Admin manages accounts; RBAC enforced |
| 02 Courses & Enrollment | Teacher owns course lifecycle + enrollment |
| 03 Agent (Isolated) | Fixture → validated Lesson + Assessment (no DB/UI) |
| 04 Core Loop | Student streams a lesson; next session adapts |
| 05 Rendering | Beautiful, secure, structured lesson + assessment |
| 06 Progress & Hardening | All 14 acceptance criteria pass; pilot-ready |

**Gates:** Wave 03 proves the agent works in isolation (cheapest place to fail). Wave 04's **AC-07 (adaptation)** proves the product hypothesis. Do not proceed past a wave until its Definition of Done is met.

## What Was Reconciled Before Handoff

The spec review surfaced issues that are already fixed in these docs and captured as **Canonical Decisions** in `AGENTS.md`: streaming via `fetch()` not EventSource; `postMessage` handshake not `onError`; injected CSP `<meta>` not the iframe `csp` attribute; 15k-char block ceiling with 8k `max_tokens`; 404-not-403 for cross-scope; nullable `teacher_id`; no `FAILED` state; canonical field names; teacher-owned enrollment. The design system (Fraunces/Geist) is canonical over the documents' internal styling.
