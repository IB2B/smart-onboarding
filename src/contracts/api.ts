export type ThemeId = 'aura-frost' | 'aura-slate' | 'aura-warm'
export type FontPairId = 'manrope-fraunces' | 'inter-ibmplex' | 'manrope-ibmplex' | 'jakarta-inter'
export type IconPackId = 'phosphor' | 'tabler' | 'lucide'
export type DensityId = 'comfortable' | 'balanced' | 'compact'
export type AiProvider = 'openrouter' | 'openai'

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
  progress: number
  lastActivity: string
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

export interface ThreadMessage {
  id: string
  role: 'client' | 'assistant' | 'operator'
  content: string
  createdAt: string
  widget_payload?: WidgetPayload
  widget_response?: string | number
}

export interface ChatSession {
  clientId: string
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

export interface ApiAdapter {
  getClients(): Promise<ClientSummary[]>
  getClientThread(clientId: string): Promise<ThreadMessage[]>
  getPortalSession(token?: string): Promise<ChatSessionResponse>
  sendPortalMessage(request: ChatRequest): Promise<ChatResponse>
}
