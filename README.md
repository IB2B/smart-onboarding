# Smart Onboarding Codex

Vue 3 + daisyUI app for Aura Smart Onboarding with:
- Client portal (`/portal/chat/:magicToken?`, `/portal/resume`)
- Admin portal (`/admin/monitor`)

Current route behavior:
- `/` redirects to `/admin/login`
- portal access supports authenticated sessions and optional `:magicToken`

Current design lock in code:
- Theme: `aura-frost`
- Font pair: `jakarta-inter`
- Icon pack: `phosphor`
- Density: `balanced`

## Non-Negotiable UI Rule

This project is a **flat web app**.

- Do: full-canvas web layout with sidebar + main content.
- Do not: desktop-window framing, outer rounded app card, fake OS chrome, or wallpaper-like stage wrappers.
- Keep visuals clean, modern, and web-native.

See [UI_GUARDRAILS.md](./UI_GUARDRAILS.md) before any UI changes.
See [implementation_plan.md](./implementation_plan.md) for the tracked current-state plan and known conflicts.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

### Run Unit Tests with [Vitest](https://vitest.dev/)

```sh
npm run test:unit
```

### Run End-to-End Tests with [Playwright](https://playwright.dev)

```sh
# Install browsers for the first run
npx playwright install

# When testing on CI, must build the project first
npm run build

# Runs the end-to-end tests
npm run test:e2e
# Runs the tests only on Chromium
npm run test:e2e -- --project=chromium
# Runs the tests of a specific file
npm run test:e2e -- tests/example.spec.ts
# Runs the tests in debug mode
npm run test:e2e -- --debug
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```
