import type { SupabaseClient } from 'jsr:@supabase/supabase-js@2'

export interface ChatAgentRequest {
  clientId: string
  message: string
  provider: 'openai' | 'openrouter'
  requestId: string
  sessionId: string
}

export interface RagChunk {
  id: string
  content: string
  metadata: Record<string, unknown>
  similarity: number
}

export interface LlmMessage {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string | null
  tool_call_id?: string
  tool_calls?: LlmToolCall[]
  name?: string
}

export interface LlmToolCall {
  id: string
  type: 'function'
  function: {
    name: string
    arguments: string
  }
}

export interface LlmResponse {
  content: string | null
  toolCalls: LlmToolCall[] | null
  finishReason: string
}

export interface ToolResult {
  toolCallId: string
  result: string
  widgetPayload?: unknown
  snapshotDelta?: Record<string, unknown>
}

export interface ClientRow {
  id: string
  company_name: string
  contact_name: string
  contact_email: string
}

export interface OnboardingStateRow {
  id: string
  client_id: string
  phase: string
  milestones: Record<string, { status: string; data: Record<string, unknown> }>
  collected_data: Record<string, unknown>
  status: string
  last_activity: string
}

export interface SeedSummary {
  title: string
  summary: string
}

export { SupabaseClient }
