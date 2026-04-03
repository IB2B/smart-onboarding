import type { ChatSessionResponse, ClientSummary, ThreadMessage, WidgetPayload } from '@/contracts/api'

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

export function isWidgetMessage(
  msg: ThreadMessage,
): msg is ThreadMessage & { widget_payload: WidgetPayload } {
  return (
    msg.widget_payload !== undefined &&
    msg.widget_payload !== null &&
    typeof (msg.widget_payload as { type?: unknown }).type === 'string'
  )
}
