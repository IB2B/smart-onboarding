import type {
  AdminAlert,
  AdminClientDetailBundle,
  AdminDashboardSnapshot,
  AdminIngestState,
  AdminSeedRecord,
  ChatSessionResponse,
  ClientSummary,
  ThreadMessage,
  WidgetPayload,
} from '@/contracts/api'

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function assertClientList(payload: unknown): ClientSummary[] {
  if (!Array.isArray(payload)) throw new Error('Invalid clients payload')
  return payload as ClientSummary[]
}

export function assertThreadMessages(payload: unknown): ThreadMessage[] {
  if (!Array.isArray(payload)) throw new Error('Invalid thread payload')
  return payload as ThreadMessage[]
}

export function assertChatSession(payload: unknown): ChatSessionResponse {
  const candidate = payload as ChatSessionResponse
  if (!candidate?.session?.messages || !Array.isArray(candidate.session.messages)) {
    throw new Error('Invalid chat session payload')
  }
  return candidate
}

export function assertAdminDashboardSnapshot(payload: unknown): AdminDashboardSnapshot {
  if (!isObject(payload) || !isObject(payload.totals) || !isObject(payload.completion) || !isObject(payload.ingest)) {
    throw new Error('Invalid admin dashboard payload')
  }
  return payload as unknown as AdminDashboardSnapshot
}

export function assertAdminClientDetailBundle(payload: unknown): AdminClientDetailBundle {
  if (
    !isObject(payload) ||
    !isObject(payload.client) ||
    !isObject(payload.onboardingState) ||
    !Array.isArray(payload.seeds) ||
    !Array.isArray(payload.ingestStates) ||
    !Array.isArray(payload.documentChunks) ||
    !Array.isArray(payload.messages) ||
    !Array.isArray(payload.alerts)
  ) {
    throw new Error('Invalid admin client detail payload')
  }
  return payload as unknown as AdminClientDetailBundle
}

export function assertAdminSeedRecords(payload: unknown): AdminSeedRecord[] {
  if (!Array.isArray(payload)) throw new Error('Invalid admin seeds payload')
  return payload as AdminSeedRecord[]
}

export function assertAdminIngestStates(payload: unknown): AdminIngestState[] {
  if (!Array.isArray(payload)) throw new Error('Invalid admin ingest payload')
  return payload as AdminIngestState[]
}

export function assertAdminAlerts(payload: unknown): AdminAlert[] {
  if (!Array.isArray(payload)) throw new Error('Invalid admin alerts payload')
  return payload as AdminAlert[]
}

export function isWidgetMessage(
  msg: ThreadMessage,
): msg is ThreadMessage & { widget_payload: WidgetPayload } {
  return (
    msg.widget_payload !== undefined &&
    msg.widget_payload !== null &&
    typeof (msg.widget_payload as { type?: unknown }).type === 'string'
  )
}
