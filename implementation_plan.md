# Smart Onboarding Codex — Implementation Plan

> **Vue 3 + Supabase + OpenRouter** | Design-first, then backend, then AI

---

## Product Overview

Two surfaces:
- **Admin Console** — team seeds client context, monitors progress, replays conversations
- **Client Portal** — AI agent guides the client through onboarding like a concierge, not a form wizard

**Design lock:** `aura-frost` theme · `inter-ibmplex` fonts · `phosphor` icons · `balanced` density

---

## Architecture

```
Vue 3 SPA (Vite)
  └── Vue Router            /admin/*, /portal/*
  └── Pinia stores          spec-lab (design), session, onboarding state
  └── ApiAdapter interface  swap mock ↔ real Supabase without touching views
  └── contracts/api.ts      single source of truth for all shared types

Supabase (future)
  └── PostgreSQL + pgvector  clients, seeds, chunks, messages, onboarding_states
  └── Auth                   magic-link (clients), email+password (admins)
  └── Storage                raw uploads (audio, PDF, docs)
  └── Realtime               ingest pipeline status badge

OpenRouter (future)
  └── LLM gateway            GPT-4o (agent), GPT-4o-mini (summaries)
  └── Embeddings             text-embedding-3-large via OpenAI
  └── Audio                  Whisper (transcription)
```

---

## Phase 1 — UI & Design (Current Focus)

All work uses the mock adapter. No backend needed yet.

### 1.1 Client Portal — `ClientChatView`

| Component | Status | Notes |
|-----------|--------|-------|
| `AppShell` layout | ✅ Done | Sidebar + main, responsive |
| `AuraLogo` | ✅ Done | |
| `FloatingComposer` | ✅ Done | Message input |
| `ThreadBlock` | ✅ Done | Message bubble renderer |
| `ProfileDock` | ✅ Done | |
| Welcome screen | ⬜ Todo | Greeting hero, single CTA, fades into chat |
| `MilestoneSidebar` | ⬜ Todo | Collapsible panel, phase progress rail |
| Timeline chat layout | ⬜ Todo | Left-rail timeline, status dots, slide-up animation |
| Inline widget host | ⬜ Todo | Renders widget based on `message.widget_payload.type` |
| `ChoiceCard` widget | ⬜ Todo | 2–4 option grid, hover glow, selects on click |
| `InlineDatePicker` | ⬜ Todo | Hand-rolled calendar, accent ring on selection |
| `GlassmorphicDropZone` | ⬜ Todo | Blur glass, drag states, file chip after upload |
| `RatingSlider` | ⬜ Todo | Budget/priority scale, glowing thumb, live label |
| Typing indicator | ⬜ Todo | 3-dot wave while `sending === true` |
| Stop-stream button | ⬜ Todo | Send button morphs to stop mid-response |

### 1.2 Admin Console — `AdminMonitorView`

| Component | Status | Notes |
|-----------|--------|-------|
| `AppShell` layout | ✅ Done | |
| Client table | ✅ Done | Company, contact, status, progress |
| `StatusChip` | ✅ Done | |
| Thread replay panel | ✅ Done | Read-only `ThreadBlock` list |
| `ClientProvisionModal` | ⬜ Todo | Slide-in drawer, create client + copy magic link |
| `ClientDetailPanel` | ⬜ Todo | Split: client info + milestone status + seeds list |
| `SeedUploader` | ⬜ Todo | 4 tabs: Notes · Audio · Document · URL |
| `IngestStatusBadge` | ⬜ Todo | Pipeline status chip (mock states for now) |
| Sortable/filterable table | ⬜ Todo | Search bar, column sort |

### 1.3 Shared / System Components

| Component | Status | Notes |
|-----------|--------|-------|
| `StatusChip` | ✅ Done | |
| `ThreadBlock` | ✅ Done | |
| Milestone dividers in thread | ⬜ Todo | Phase marker injected between messages |
| Skeleton loading states | ⬜ Todo | Shimmer placeholders, no spinners |
| Toast/notification system | ⬜ Todo | Slide-in from edge, used for copy-link confirmation |

---

## Phase 2 — Backend Foundation

> Prerequisite: Phase 1 UI complete and approved.

### 2.1 Supabase Setup
- Create project, configure `.env` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
- Write and apply all SQL migrations (see schema below)
- Verify RLS policies via Supabase dashboard
- `src/adapters/supabase-adapter.ts` implementing `ApiAdapter` — drop-in replacement for mock

### 2.2 Auth
- Admin: email + password, `role = 'admin'` in JWT
- Client: magic link / OTP, scoped to their `client_id` via RLS
- Auth guard in `src/router/index.ts` — redirect unauthenticated users

### 2.3 Real-time API Adapter
Swap `MockApiAdapter` → `SupabaseApiAdapter` in `src/services/api-client.ts`. Views require zero changes.

---

## Phase 3 — Data Seeding Pipeline

- Admin uploads file → Supabase Storage (`raw-uploads` bucket)
- Edge Function or server route: `ingest-seed`
  - Audio → Whisper → `raw_transcript`
  - PDF/DOCX → extracted text
  - Notes/URL → raw string
- LLM summary pass (GPT-4o-mini) → `processed_summary`
- Text splitter: 512-token chunks, 64-token overlap
- Embed with `text-embedding-3-large` → `document_chunks`
- `IngestStatusBadge` subscribes to Supabase Realtime for live status

---

## Phase 4 — Agent & Chat

- `HttpApiAdapter` calls backend route `POST /api/chat` (SSE streaming)
- System prompt built per session: client info + seed summaries + current milestone state
- Per-message RAG: embed user query → `match_document_chunks` RPC → inject top-5 chunks
- Agent tools: `render_widget`, `mark_milestone_complete`, `update_collected_data`
- `ThreadBlock` updated to render `widget_payload` inline

---

## Phase 5 — Milestone State Machine

- `onboarding_states` row per client, phases: `welcome → brand_identity → technical_needs → target_audience → timeline_budget → review → complete`
- Agent calls `mark_milestone_complete` → Pinia store updates → `MilestoneSidebar` reacts
- Confetti micro-animation on milestone completion
- `ClientResumeView` renders final `collected_data` as structured summary

---

## Database Schema

### Entity Relationships

```
clients ──< client_credentials
clients ──< admin_data_seeds ──< document_chunks
clients ──1 onboarding_states
clients ──< messages
```

### Key Tables

#### `clients`
```sql
CREATE TABLE clients (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name    TEXT NOT NULL,
  contact_name    TEXT NOT NULL,
  contact_email   TEXT UNIQUE NOT NULL,
  industry        TEXT,
  meta            JSONB DEFAULT '{}',
  provisioned_by  UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_all"   ON clients FOR ALL     TO authenticated USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "client_self" ON clients FOR SELECT  TO authenticated USING (contact_email = auth.jwt() ->> 'email');
```

#### `admin_data_seeds`
```sql
CREATE TABLE admin_data_seeds (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id         UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  title             TEXT NOT NULL,
  source_type       TEXT NOT NULL CHECK (source_type IN ('audio','document','notes','url')),
  storage_path      TEXT,
  raw_transcript    TEXT,
  processed_summary TEXT,
  created_by        UUID REFERENCES auth.users(id),
  created_at        TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE admin_data_seeds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_all" ON admin_data_seeds FOR ALL TO authenticated USING (auth.jwt() ->> 'role' = 'admin');
```

#### `document_chunks` (pgvector)
```sql
CREATE EXTENSION IF NOT EXISTS vector;
CREATE TABLE document_chunks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seed_id     UUID NOT NULL REFERENCES admin_data_seeds(id) ON DELETE CASCADE,
  client_id   UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  embedding   VECTOR(1536),
  metadata    JSONB DEFAULT '{}',
  chunk_index INTEGER,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ON document_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "client_own_chunks" ON document_chunks FOR SELECT TO authenticated
  USING (client_id = (SELECT id FROM clients WHERE contact_email = auth.jwt() ->> 'email'));
CREATE POLICY "admin_all" ON document_chunks FOR ALL TO authenticated USING (auth.jwt() ->> 'role' = 'admin');
```

#### `onboarding_states`
```sql
CREATE TABLE onboarding_states (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id      UUID UNIQUE NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  phase          TEXT NOT NULL DEFAULT 'welcome'
                   CHECK (phase IN ('welcome','brand_identity','technical_needs',
                                    'target_audience','timeline_budget','review','complete')),
  milestones     JSONB NOT NULL DEFAULT '{
    "brand_identity":  {"status":"pending","data":{}},
    "technical_needs": {"status":"pending","data":{}},
    "target_audience": {"status":"pending","data":{}},
    "timeline_budget": {"status":"pending","data":{}}
  }',
  collected_data JSONB DEFAULT '{}',
  status         TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','complete')),
  last_activity  TIMESTAMPTZ DEFAULT NOW(),
  completed_at   TIMESTAMPTZ
);
ALTER TABLE onboarding_states ENABLE ROW LEVEL SECURITY;
CREATE POLICY "client_own_state" ON onboarding_states FOR ALL TO authenticated
  USING (client_id = (SELECT id FROM clients WHERE contact_email = auth.jwt() ->> 'email'));
CREATE POLICY "admin_all" ON onboarding_states FOR ALL TO authenticated USING (auth.jwt() ->> 'role' = 'admin');
```

#### `messages`
```sql
CREATE TABLE messages (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id      UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  role           TEXT NOT NULL CHECK (role IN ('user','assistant','system','tool')),
  content        TEXT,
  widget_payload JSONB,
  tool_calls     JSONB,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX messages_client_created ON messages (client_id, created_at);
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "client_own_messages" ON messages FOR ALL TO authenticated
  USING (client_id = (SELECT id FROM clients WHERE contact_email = auth.jwt() ->> 'email'));
CREATE POLICY "admin_all" ON messages FOR ALL TO authenticated USING (auth.jwt() ->> 'role' = 'admin');
```

#### RAG retrieval function
```sql
CREATE FUNCTION match_document_chunks(
  query_embedding  VECTOR(1536),
  match_client_id  UUID,
  match_threshold  FLOAT,
  match_count      INT
) RETURNS TABLE (content TEXT, similarity FLOAT) AS $$
  SELECT content, 1 - (embedding <=> query_embedding) AS similarity
  FROM document_chunks
  WHERE client_id = match_client_id
    AND 1 - (embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
$$ LANGUAGE sql STABLE;
```

---

## Agent Tools (Phase 4)

```ts
// render_widget — tells Vue to render an interactive component inline
{ type: 'choices' | 'calendar' | 'file-drop' | 'scale', prompt, options?, ... }

// mark_milestone_complete — advances the state machine
{ milestone: 'brand_identity' | 'technical_needs' | 'target_audience' | 'timeline_budget', summary }

// update_collected_data — persists structured extraction
{ field: string, value: unknown }
```

---

## Project Structure (target)

```
src/
├── adapters/
│   ├── mock-adapter.ts          ✅ exists
│   └── supabase-adapter.ts      phase 2
├── components/
│   ├── system/                  ✅ AppShell, AuraLogo, FloatingComposer, ProfileDock, StatusChip, ThreadBlock
│   ├── chat/
│   │   ├── WelcomeScreen.vue    phase 1
│   │   ├── MilestoneSidebar.vue phase 1
│   │   └── widgets/
│   │       ├── ChoiceCard.vue       phase 1
│   │       ├── InlineDatePicker.vue phase 1
│   │       ├── DropZone.vue         phase 1
│   │       └── RatingSlider.vue     phase 1
│   └── admin/
│       ├── ClientProvisionModal.vue phase 1
│       ├── ClientDetailPanel.vue    phase 1
│       ├── SeedUploader.vue         phase 1
│       └── IngestStatusBadge.vue    phase 1
├── contracts/
│   ├── api.ts                   ✅ exists — extend with OnboardingState, MilestoneKey types
│   ├── guards.ts                ✅ exists
│   └── mock-data.ts             ✅ exists — extend with milestone/widget fixture data
├── services/
│   └── api-client.ts            ✅ exists
├── stores/
│   ├── spec-lab.ts              ✅ exists
│   ├── session.ts               phase 2
│   └── onboarding.ts            phase 4
├── views/
│   ├── AdminMonitorView.vue     ✅ exists — extend with provision + seed UI
│   ├── ClientChatView.vue       ✅ exists — extend with timeline + widgets
│   └── ClientResumeView.vue     ✅ exists
└── assets/
    └── main.css                 ✅ exists — aura-frost/slate/warm themes
```

---

## Testing

```bash
npm run test:unit   # Vitest — src/**/__tests__/
npm run test:e2e    # Playwright — e2e/ (Chromium only)
```

Unit tests live alongside their source file in `__tests__/`. Write tests for:
- Composables and stores (Vitest + jsdom)
- Adapter methods (mock data assertions)
- Type guard functions in `contracts/guards.ts`

E2E covers critical flows:
- Admin provisions client → magic link generated
- Client opens portal → welcome → chat → milestone marked complete
- Admin views conversation replay

---

## Open Questions

> **Multi-tenancy:** Schema is single-agency. If white-labelling to other agencies becomes a requirement, a `workspaces` table needs to be added before Phase 2 data is seeded — retrofitting RLS later is painful.

> **Audio size limit:** Whisper has a 25 MB file limit. Files larger than that need FFmpeg pre-processing. Decide before building `SeedUploader`.

> **Streaming:** The `ApiAdapter` interface currently returns `Promise<ChatResponse>`. For streaming, it needs a separate method returning `AsyncIterable<string>` or a `ReadableStream`. Design this before Phase 4.
