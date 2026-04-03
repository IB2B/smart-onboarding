import type { ApiAdapter, ChatRequest, ChatResponse, ChatSessionResponse, ClientSummary, ThreadMessage, WidgetPayload } from '@/contracts/api'
import { mockClients, mockPortalSession, mockThreadByClient } from '@/contracts/mock-data'

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

let messageCount = 0

export class MockApiAdapter implements ApiAdapter {
  async getClients(): Promise<ClientSummary[]> {
    await wait(180)
    return structuredClone(mockClients)
  }

  async getClientThread(clientId: string): Promise<ThreadMessage[]> {
    await wait(140)
    return structuredClone(mockThreadByClient[clientId] ?? [])
  }

  async getPortalSession(_token?: string): Promise<ChatSessionResponse> {
    await wait(160)
    return structuredClone(mockPortalSession)
  }

  async sendPortalMessage(request: ChatRequest): Promise<ChatResponse> {
    await wait(280)

    messageCount++
    let widget_payload: WidgetPayload | undefined

    if (messageCount % 5 === 0) {
      widget_payload = {
        type: 'scale',
        prompt: 'How would you rate the importance of this feature?',
        min: 1,
        max: 10,
        step: 1,
        minLabel: 'Low priority',
        maxLabel: 'Must have',
      }
    } else if (messageCount % 3 === 0) {
      widget_payload = {
        type: 'choices',
        prompt: 'Which option best fits your needs?',
        options: [
          { id: 'opt_a', label: 'Option A', description: 'Fast and lightweight' },
          { id: 'opt_b', label: 'Option B', description: 'Feature-rich' },
          { id: 'opt_c', label: 'Option C', description: 'Custom solution' },
        ],
      }
    }

    return {
      sessionId: request.sessionId,
      message: {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: widget_payload
          ? 'Here is something for you to fill in:'
          : `[${request.provider === 'openrouter' ? 'OpenRouter' : 'OpenAI'}] Got it! I've noted: "${request.message}". Let's keep going.`,
        createdAt: new Date().toISOString(),
        widget_payload,
      },
      snapshotDelta: {
        pendingItems: ['Confirm launch date', 'Upload logo source files'],
      },
    }
  }
}
