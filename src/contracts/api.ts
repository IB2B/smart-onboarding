export type ThemeId = 'aura-frost' | 'aura-slate' | 'aura-warm'
export type FontPairId = 'manrope-fraunces' | 'inter-ibmplex' | 'manrope-ibmplex' | 'jakarta-inter'
export type IconPackId = 'phosphor' | 'tabler' | 'lucide'
export type DensityId = 'comfortable' | 'balanced' | 'compact'
export type AiProvider = 'openrouter' | 'openai'
export type MilestoneKey = 'brand_identity' | 'technical_needs' | 'target_audience' | 'timeline_budget'
export type OnboardingPhase = 'welcome' | MilestoneKey | 'review' | 'complete'
export type MilestoneStatus = 'pending' | 'in_progress' | 'complete' | 'blocked'
export type OnboardingStatus = 'active' | 'paused' | 'complete'
export type SeedSourceType = 'audio' | 'document' | 'notes' | 'url'
export type IngestStatus = 'queued' | 'processing' | 'ready' | 'warning' | 'failed'
export type AlertSeverity = 'info' | 'warning' | 'critical'
export type AlertStatus = 'open' | 'resolved'

export interface SpecDecision {
  themeId: ThemeId
  fontPairId: FontPairId
  iconPackId: IconPackId
  density: DensityId
  approvedAt?: string
}

export interface ClientSummary {
  id: string
  company: string
  contactName: string
  email: string
  status: 'invited' | 'active' | 'blocked'
  phase: OnboardingPhase
  progress: number
  lastActivity: string
}

export interface MilestoneRecord {
  status: MilestoneStatus
  data: Record<string, unknown>
}

export type MilestoneMap = Record<MilestoneKey, MilestoneRecord>

export interface OnboardingState {
  id: string
  clientId: string
  phase: OnboardingPhase
  milestones: MilestoneMap
  collectedData: Record<string, unknown>
  status: OnboardingStatus
  lastActivity: string
  completedAt?: string
}

export interface AdminSeedRecord {
  id: string
  clientId: string
  title: string
  sourceType: SeedSourceType
  storagePath?: string
  rawTranscript?: string
  processedSummary?: string
  ingestStatus?: IngestStatus
  errorMessage?: string
  createdBy?: string
  createdAt: string
}

export interface SeedUploadProgress {
  seedId: string
  phase: 'uploading' | 'processing' | 'chunking' | 'embedding' | 'done' | 'error'
  percent: number
  error?: string
}

export interface AdminDocumentChunkRecord {
  id: string
  seedId: string
  clientId: string
  content: string
  chunkIndex: number
  metadata: Record<string, unknown>
  createdAt: string
}

export interface AdminIngestState {
  id: string
  clientId: string
  seedId: string
  status: IngestStatus
  progress: number
  chunkCount: number
  note: string
  updatedAt: string
}

export interface AdminAlert {
  id: string
  clientId?: string
  seedId?: string
  severity: AlertSeverity
  status: AlertStatus
  category: 'stale' | 'ingest' | 'milestone' | 'message' | 'ops'
  title: string
  description: string
  createdAt: string
}

export interface AdminDashboardSnapshot {
  generatedAt: string
  totals: {
    clients: number
    active: number
    invited: number
    blocked: number
  }
  completion: {
    average: number
    complete: number
    inProgress: number
  }
  freshness: {
    stale: number
    thresholdHours: number
  }
  ingest: {
    healthy: number
    warning: number
    failed: number
    queued: number
  }
  alerts: AdminAlert[]
}

export interface AdminClientDetailBundle {
  client: ClientSummary
  onboardingState: OnboardingState
  seeds: AdminSeedRecord[]
  ingestStates: AdminIngestState[]
  documentChunks: AdminDocumentChunkRecord[]
  messages: ThreadMessage[]
  alerts: AdminAlert[]
}

// Widget payloads ─────────────────────────────────────────────────────────────

export interface ChoicesOption {
  readonly id: string
  readonly label: string
  readonly description?: string
  readonly icon?: string
}

export interface ChoicesPayload {
  readonly type: 'choices'
  readonly prompt: string
  readonly options: readonly ChoicesOption[]
}

export interface ScalePayload {
  readonly type: 'scale'
  readonly prompt: string
  readonly min: number
  readonly max: number
  readonly step: number
  readonly minLabel: string
  readonly maxLabel: string
  readonly unit?: string
}

export interface CalendarPayload {
  readonly type: 'calendar'
  readonly prompt: string
  readonly minDate?: string
  readonly maxDate?: string
}

export interface FileDropPayload {
  readonly type: 'file-drop'
  readonly prompt: string
  readonly accept?: readonly string[]
  readonly maxFiles?: number
}

export type WidgetPayload = ChoicesPayload | ScalePayload | CalendarPayload | FileDropPayload

export interface ToolCallRecord {
  id: string
  name: string
  arguments: Record<string, unknown>
}

export interface ThreadMessage {
  id: string
  role: 'client' | 'assistant' | 'operator'
  content: string
  createdAt: string
  widget_payload?: WidgetPayload
  widget_response?: string | number
  tool_calls?: ToolCallRecord[]
  failed?: boolean
}

export interface ChatSession {
  clientId: string
  contactName: string
  companyName: string
  title: string
  messages: ThreadMessage[]
}

export interface OnboardingSnapshot {
  businessModel: string
  brandDirection: string
  targetAudience: string
  requiredIntegrations: string[]
  pendingItems: string[]
}

export interface ChatSessionResponse {
  session: ChatSession
  snapshot: OnboardingSnapshot
}

export interface ChatRequest {
  sessionId: string
  clientId: string
  requestId: string
  message: string
  provider: AiProvider
  token?: string
}

export interface ChatResponse {
  sessionId: string
  message: ThreadMessage
  snapshotDelta: Partial<OnboardingSnapshot>
}

export interface SeedFileUploadParams {
  clientId: string
  file: File
  title: string
  sourceType: SeedSourceType
}

export interface SeedNoteCreateParams {
  clientId: string
  title: string
  content: string
}

export interface SeedUrlCreateParams {
  clientId: string
  title: string
  url: string
}

export interface ApiAdapter {
  getClients(): Promise<ClientSummary[]>
  getClientThread(clientId: string): Promise<ThreadMessage[]>
  getPortalSession(token?: string): Promise<ChatSessionResponse>
  sendPortalMessage(request: ChatRequest): Promise<ChatResponse>
  persistWidgetResponse(messageId: string, value: string | number): Promise<void>
  getAdminDashboardSnapshot(): Promise<AdminDashboardSnapshot>
  getAdminClientDetailBundle(clientId: string): Promise<AdminClientDetailBundle>
  getAdminSeedRecords(clientId?: string): Promise<AdminSeedRecord[]>
  getAdminIngestStates(clientId?: string): Promise<AdminIngestState[]>
  getAdminAlerts(clientId?: string): Promise<AdminAlert[]>
  uploadSeedFile(params: SeedFileUploadParams): Promise<AdminSeedRecord>
  createNoteSeed(params: SeedNoteCreateParams): Promise<AdminSeedRecord>
  createUrlSeed(params: SeedUrlCreateParams): Promise<AdminSeedRecord>
  deleteSeed(seedId: string): Promise<void>
}
