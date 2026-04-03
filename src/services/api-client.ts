import type { AiProvider, ApiAdapter, ChatRequest } from '@/contracts/api'
import { MockApiAdapter } from '@/adapters/mock-adapter'
import { assertChatSession, assertClientList, assertThreadMessages } from '@/contracts/guards'

class ApiClient {
  private readonly adapter: ApiAdapter

  constructor(adapter: ApiAdapter) {
    this.adapter = adapter
  }

  getClients() {
    return this.adapter.getClients().then(assertClientList)
  }

  getClientThread(clientId: string) {
    return this.adapter.getClientThread(clientId).then(assertThreadMessages)
  }

  getPortalSession(token?: string) {
    return this.adapter.getPortalSession(token).then(assertChatSession)
  }

  sendPortalMessage(params: {
    sessionId: string
    clientId: string
    message: string
    provider?: AiProvider
    token?: string
  }) {
    const request: ChatRequest = {
      sessionId: params.sessionId,
      clientId: params.clientId,
      requestId: `req_${Date.now()}`,
      message: params.message,
      provider: params.provider ?? 'openrouter',
      token: params.token,
    }
    return this.adapter.sendPortalMessage(request)
  }
}

function createAdapter(): ApiAdapter {
  const mode = import.meta.env.VITE_API_ADAPTER ?? 'mock'
  if (mode === 'mock') {
    return new MockApiAdapter()
  }
  // Until backend phase, fallback to mock adapter if mode is unknown.
  return new MockApiAdapter()
}

export const apiClient = new ApiClient(createAdapter())
