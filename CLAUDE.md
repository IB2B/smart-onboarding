# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server (http://localhost:5173)
npm run build        # Type-check + build for production (parallel)
npm run type-check   # vue-tsc --build only
npm run lint         # Run ESLint + Oxlint with auto-fix (sequential)
npm run format       # Prettier write on src/
npm run test:unit    # Vitest (unit tests in src/**/__tests__/)
npm run test:e2e     # Playwright (e2e/ directory, Chromium only)
```

To run a single Vitest test file:
```bash
npx vitest run src/path/to/__tests__/file.spec.ts
```

## Architecture

### Tech Stack
- **Vue 3** (Composition API) + **TypeScript ~6.0** + **Vite 8**
- **Vue Router 5** + **Pinia 3** for routing and state
- **daisyUI 5** + **Tailwind CSS 4** for styling
- **Fontsource** for self-hosted fonts (Manrope, Fraunces, Inter, IBM Plex Sans)
- **Phosphor Vue** as the canonical icon pack

### Layered Architecture

```
contracts/   →  TypeScript interfaces & type guards (no implementation)
adapters/    →  Pluggable API implementations (currently mock only)
services/    →  api-client.ts factory that wraps the active adapter
stores/      →  Pinia stores (spec-lab.ts holds fixed design system state)
views/       →  Page components (AdminMonitorView, ClientChatView, ClientResumeView)
components/  →  Reusable UI (system/ contains AppShell and core layout pieces)
```

The adapter pattern means the API layer is swappable. `src/services/api-client.ts` is the factory; `src/adapters/mock-adapter.ts` is the current default.

`src/contracts/api.ts` defines all shared types (`ThemeId`, `FontPairId`, `SpecDecision`, `ChatSession`, etc.) — define shapes here before writing implementations.

### Routes
- `/` → redirects to `/portal/chat/demo-token`
- `/portal/chat/:magicToken?` → ClientChatView
- `/portal/resume` → ClientResumeView
- `/admin/monitor` → AdminMonitorView

### Design System Lock

The design spec is locked in `src/stores/spec-lab.ts`:
- Theme: `aura-frost`
- Font pair: `inter-ibmplex`
- Icon pack: `phosphor`
- Density: `balanced`

`AppShell.vue` applies these as data attributes for CSS theme switching. Do not change this spec without explicit instruction.

## UI Guardrails (Mandatory)

This is a **flat web app** — never introduce desktop-window aesthetics:
- No outer "app card" wrapping the full application
- No fake browser/OS chrome or wallpaper stage framing
- Layout: full viewport → left sidebar rail → main content/chat area

Use daisyUI components as the base. Extend with Tailwind utilities. Preserve keyboard accessibility and visible focus states.

Before any UI merge, ask: **"Does this still look like a flat web app?"** If no, refactor first.

## Implementation Plan

See `implementation_plan.md` for the full phased roadmap. Current focus is **Phase 1 (UI & Design)** — all work uses the mock adapter, no backend needed yet. Phases 2–5 cover Supabase backend, ingest pipeline, and LLM agent in that order.

## TypeScript Configuration

Strict mode is enabled including `noUncheckedIndexedAccess: true`. Path alias `@/*` maps to `src/*`. Three tsconfig files: `tsconfig.app.json` (source), `tsconfig.node.json` (tooling), `tsconfig.vitest.json` (tests).

## Code Quality

Linting runs ESLint then Oxlint in sequence (`run-s`). Prettier uses single quotes, no semicolons, 100-char print width. Both linters auto-fix on `npm run lint`.
