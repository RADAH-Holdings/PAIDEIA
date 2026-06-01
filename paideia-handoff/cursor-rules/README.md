# Cursor Rules Setup

Place `paideia.mdc` at `.cursor/rules/paideia.mdc` in your repo root.

This file has `alwaysApply: true`, so every agent session in Cursor Cloud loads it automatically as context before any task. It's a compressed version of `AGENTS.md` — the full guide stays at the repo root for when an agent needs the complete picture.

If your Cursor version uses the older single-file format, rename to `.cursorrules` (no frontmatter) and strip the YAML header.
