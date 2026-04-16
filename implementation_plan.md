# Smart Onboarding Codex - Tracked Implementation Plan

Last updated: 2026-04-15

This file is the living project plan. It should describe the repo as it exists today, not an older intended architecture.

## Product Snapshot

Smart Onboarding Codex is a Vue 3 single-page app with two main surfaces:

- Admin surface: invite clients, monitor progress, review alerts, inspect seeds, replay chat, review briefs
- Client surface: authenticated portal chat, milestone progress, post-onboarding review, attachments, audio input

## Locked Decisions

- UI must remain a flat web app
- No desktop window framing, fake browser chrome, or floating app-card shell
- Current visual lock in code:
  - Theme: `aura-frost`
  - Font pair: `jakarta-inter`
  - Icon pack: `phosphor`
  - Density: `balanced`
- Provider direction: OpenAI is the intended primary provider

## Current Architecture

### Frontend

- Vue 3 + Vite + TypeScript
- Vue Router 5
- Pinia 3
- Tailwind CSS 4 + daisyUI 5
- Fontsource-managed fonts

### Routing

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

### Data and integration model

- `src/services/api-client.ts` still supports adapter swapping by env
- `VITE_API_ADAPTER=mock` is still the default in `.env.example`
- Auth is already Supabase-backed even when the app is using the mock adapter
- Supabase functions already exist for:
  - `chat-agent`
  - `process-seed`
  - `generate-brief`

## Status By Workstream

### 1. UI foundation

Status: done

Implemented:

- `AppShell`
- `AdminShellFrame`
- `AuraLogo`
- `FloatingComposer`
- `ProfileDock`
- `ThreadBlock`
- `StatusChip`
- `SkeletonBlock`
- `SpotlightSearch`

Guardrail reminder:

- The current shell structure follows the flat web app rule and should remain the baseline for future UI work

### 2. Client portal

Status: partially complete, core flow exists

Implemented:

- `ClientChatView`
- welcome state
- conversation state
- loading skeletons
- typing indicator
- attachment upload path for documents
- voice upload path
- `PortalProgressBar`
- `PostOnboardingView`
- widget components:
  - `ChoiceCard`
  - `RatingSlider`

Still missing or not fully wired:

- calendar widget component
- file-drop widget component rendered inline in chat
- full milestone sidebar experience described in older plan
- streaming response UX and stop-generation control
- remove remaining hardcoded demo-style portal links from admin views

### 3. Admin experience

Status: largely implemented, needs consolidation and cleanup

Implemented:

- `AdminMonitorView`
- `AdminClientsView`
- `AdminClientDetailView`
- `AdminAlertsView`
- `AdminAccountView`
- `ClientProvisionModal`
- `AdminClientCardGrid`
- `AdminSeedUploadCard`
- client detail tabs:
  - info
  - seeds
  - alerts
  - chat
  - brief
- realtime seed status updates via `useSeedRealtime`

Notes:

- The repo moved from the older "single monitor view with panels" concept toward dedicated admin routes plus reusable tabbed detail components
- The tracked plan should use current component names, not older placeholders like `SeedUploader` or `ClientDetailPanel`

### 4. Backend and Supabase integration

Status: implemented in repo, not future work anymore

Implemented:

- Supabase adapter
- auth store using Supabase session state
- migrations for onboarding, realtime, widgets, RLS, briefs
- file upload flow to Supabase Storage
- seed ingestion function
- RAG-oriented chat agent function
- brief generation function

Still needs hardening:

- cleaner separation between true mock mode and Supabase-dependent behavior
- clearer local setup docs for running with Supabase end to end
- consistency around provider selection

### 5. AI provider and model direction

Status: mixed, needs cleanup

Current reality:

- Frontend still sends `provider: 'openrouter'` in `ClientChatView`
- contracts and tests still allow `openrouter`
- `chat-agent` supports both `openai` and `openrouter`, then normalizes at runtime
- `generate-brief` still has OpenRouter fallback logic

Planned direction:

- standardize product-facing flows on OpenAI
- treat OpenRouter support as legacy compatibility until intentionally removed

### 6. Quality and delivery

Status: mixed

Current state:

- `npm run build` passes
- unit tests are failing in `src/adapters/__tests__/mock-adapter.spec.ts`
- failures are due to drift between the current mock payloads and older test expectations

## Current Priorities

1. Make the tracked docs match the real repo state
2. Standardize on OpenAI naming and usage across app code, functions, tests, and docs
3. Fix failing unit tests around the mock adapter
4. Remove hardcoded `/portal/chat/demo-token` links where the app now expects authenticated portal access
5. Resolve product naming drift in the UI and docs

## Naming Lock And Drift

This area is not settled yet and must be cleaned up intentionally.

Currently used names in the repo:

- `Smart Onboarding`
- `Aura Smart Onboarding`
- `IntelligentB2B`

Rule for now:

- Use `Smart Onboarding` as the product name in planning and docs unless a rebrand decision is made
- Treat `IntelligentB2B` as current UI copy that still needs confirmation or replacement

## Known Conflicts

These conflicts are real and should stay visible until resolved:

- Design lock conflict:
  - docs previously said `inter-ibmplex`
  - code lock in `src/stores/spec-lab.ts` is `jakarta-inter`
- Route conflict:
  - docs previously said `/` redirects to `/portal/chat/demo-token`
  - router currently redirects `/` to `/admin/login`
- Architecture conflict:
  - older plan described Supabase as future work
  - Supabase integration is already present across auth, adapters, migrations, and functions
- Provider conflict:
  - product direction appears to be OpenAI
  - runtime code and tests still contain OpenRouter-specific paths
- Portal access conflict:
  - several admin links still point to `/portal/chat/demo-token`
  - current portal flow also supports auth-based access without a token
- Naming conflict:
  - the project, docs, and UI do not yet use one canonical brand/product name

## Working Rules For Future Plan Updates

- Update this file whenever architecture, route flow, provider strategy, or design lock changes
- Do not mark backend items as future work once code exists in the repo
- Do not introduce placeholder component names if the actual implemented component name differs
- If a conflict exists between docs and code, record it here until it is resolved
