# Agent Instructions (Repo-Local)

All agents working in this repository must read [UI_GUARDRAILS.md](./UI_GUARDRAILS.md) first.

Critical rule:
- This product must remain a **flat web app**, never a desktop-window style wrapper.

If a change introduces outer app framing, fake OS chrome, or floating full-app card containers, treat it as a regression and fix before completion.
