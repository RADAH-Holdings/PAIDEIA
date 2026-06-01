# Paideia — Coding-Agent Handoff Package

This directory is the **agent-readable** working copy of the Paideia build. Hand the
whole folder to your coding agents (e.g. drop it at the repo root for Cursor).

## What's here

```
AGENTS.md                  ← read first, every session: project, stack, rules, doc map
.cursor/rules/paideia.mdc  ← Cursor always-on rule (mirrors the AGENTS.md essentials)
docs/
  fsd.md                   ← Functional Spec — what & why, all requirement codes + AC
  tsd.md                   ← Technical Spec — architecture, API contract, data model, boundaries
  design-system.md         ← Design System — colours, type, components, role surfaces
tasks/
  README.md                ← wave overview + dependency chain + test strategy
  phase-01.md … phase-08.md← the eight waves, each with tests + seam + exit criteria
```

The styled HTML masters live alongside this folder (`paideia-mvp-fsd-v2.html`,
`paideia-tsd.html`, `paideia-design-system.html`). The Markdown in `docs/` is the
agent working reference; the HTML is the visual master for humans.

## The four things that were settled before this handoff
1. **Auth is Django + simplejwt, not Clerk.** The User model is the identity.
2. **Design system is canonical:** Fraunces / Geist / JetBrains Mono, parchment canvas, ink-blue + ochre. (The earlier "Syne / IBM Plex" draft is dead — ignore it.)
3. **Specs are in Markdown** here in `docs/`, navigable by section.
4. **Work is mapped to eight waves** in `tasks/`, each with a testable outcome and an integration seam to the wave before it.

## Suggested first move for the agents
Start with `tasks/phase-01.md`. Don't let an agent jump ahead — each wave's exit
criteria gate the next. W4 (the pure agent) may be built in parallel with W1–W3
by a separate agent, since it has no dependency on them.
