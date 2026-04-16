# CLAUDE.md

This file provides guidance to Claude Code when working in this repository.

## Commands

```bash
npm run dev          # Start dev server (http://localhost:5173)
npm run build        # Type-check + build for production
npm run type-check   # vue-tsc --build only
npm run lint         # Run ESLint + Oxlint with auto-fix
npm run format       # Prettier write on src/
npm run test:unit    # Vitest (unit tests in src/**/__tests__/)
npm run test:e2e     # Playwright (e2e/ directory, Chromium only)
```

To run a single Vitest test file:

```bash
npx vitest run src/path/to/__tests__/file.spec.ts
```

## Architecture

### Tech stack

- Vue 3 (Composition API) + TypeScript + Vite 8
- Vue Router 5 + Pinia 3
- Tailwind CSS 4 + daisyUI 5
- Fontsource for self-hosted fonts
- Phosphor Vue as the canonical icon pack

### Layered architecture

```text
contracts/   -> TypeScript interfaces and type guards
adapters/    -> Pluggable API implementations
services/    -> api-client.ts factory that wraps the active adapter
stores/      -> Pinia stores, including the fixed design spec
views/       -> Page components
components/  -> Reusable UI building blocks
```

The adapter pattern means the app data layer is swappable. `src/services/api-client.ts` is the factory and `src/adapters/mock-adapter.ts` is still the default for app data.

Important nuance: auth is already Supabase-backed through `src/stores/auth.ts`, so "mock mode" is not fully backend-free.

`src/contracts/api.ts` is the shared type source of truth for theme, provider, session, onboarding, seed, alert, and message shapes.

### Routes

- `/` -> `/admin/login`
- `/admin/login`
- `/admin/monitor`
- `/admin/clients`
- `/admin/clients/:id`
- `/admin/alerts`
- `/admin/account`
- `/portal/login`
- `/portal/auth/callback`
- `/portal/chat/:magicToken?`
- `/portal/resume`

### Design system lock

The current locked spec in `src/stores/spec-lab.ts` is:

- Theme: `aura-frost`
- Font pair: `jakarta-inter`
- Icon pack: `phosphor`
- Density: `balanced`

`AppShell.vue` and `AdminShellFrame.vue` apply these values as data attributes for theme and typography switching. Do not change this spec without explicit instruction.

### Provider direction

OpenAI is the intended primary provider direction.

OpenRouter references still exist in parts of the repo. Treat them as cleanup work or compatibility residue, not as the desired end state.

## UI Guardrails

This is a flat web app.

- No outer app card wrapping the entire application
- No fake browser or OS chrome
- No wallpaper stage that frames the app like a desktop window
- Preferred layout: full viewport, left rail, main content area

Use daisyUI components as the base. Extend with utilities, preserve keyboard accessibility, and keep focus states visible.

Before merging UI work, ask: "Does this still look like a flat web app?"

## Implementation Plan

See `implementation_plan.md` for the tracked current-state roadmap, active priorities, and unresolved conflicts. Do not rely on older phased assumptions without checking that file first.

## TypeScript configuration

Strict mode is enabled, including `noUncheckedIndexedAccess: true`.

- `tsconfig.app.json` for source
- `tsconfig.node.json` for tooling
- `tsconfig.vitest.json` for tests

Path alias:

- `@/*` maps to `src/*`

## Code quality

- Prettier uses single quotes, no semicolons, and 100 character print width
- Lint runs ESLint and Oxlint
- Both linters are configured to auto-fix when possible
