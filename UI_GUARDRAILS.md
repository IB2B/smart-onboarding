# UI Guardrails (Global For This Repo)

These rules are mandatory for all future UI work in this codebase.

## 1) Flat Web App Only

- Build a web interface, not a desktop mock window.
- No outer "app card" wrapping the full application.
- No fake browser/OS chrome around the app.
- No wallpaper stage that frames the whole app as a floating panel.

## 2) Layout Pattern

- Full viewport canvas.
- Left sidebar rail.
- Main content/chat area in the center.
- Clean top utility row when needed.

## 3) Visual Style

- Use approved stack: `aura-frost + inter-ibmplex + phosphor + balanced`.
- Keep depth subtle (minimal shadows, light borders).
- Prefer flat surfaces and neutral backgrounds.

## 4) Component Rules

- Use daisyUI components as the base.
- Extend with utilities, but do not re-introduce desktop framing.
- Preserve keyboard accessibility and visible focus states.

## 5) QA Check Before Merge

- Ask: "Does this still look like a flat web app?"
- If answer is no, refactor before shipping.
