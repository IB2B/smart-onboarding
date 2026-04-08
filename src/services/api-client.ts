import type {
  AdminAlert,
  AdminClientDetailBundle,
  AdminDashboardSnapshot,
  AdminIngestState,
  AdminSeedRecord,
  AiProvider,
  ApiAdapter,
  ChatRequest,
  SeedFileUploadParams,
  SeedNoteCreateParams,
  SeedUrlCreateParams,
} from '@/contracts/api'
import { MockApiAdapter } from '@/adapters/mock-adapter'
import { SupabaseApiAdapter } from '@/adapters/supabase-adapter'
import {
  assertAdminAlerts,
  assertAdminClientDetailBundle,
  assertAdminDashboardSnapshot,
  assertAdminIngestStates,
  assertAdminSeedRecord,
  assertAdminSeedRecords,
  assertChatSession,
  assertClientList,
  assertThreadMessages,
} from '@/contracts/guards'

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

  getAdminDashboardSnapshot(): Promise<AdminDashboardSnapshot> {
    return this.adapter.getAdminDashboardSnapshot().then(assertAdminDashboardSnapshot)
  }

  getAdminClientDetailBundle(clientId: string): Promise<AdminClientDetailBundle> {
    return this.adapter.getAdminClientDetailBundle(clientId).then(assertAdminClientDetailBundle)
  }

  getAdminSeedRecords(clientId?: string): Promise<AdminSeedRecord[]> {
    return this.adapter.getAdminSeedRecords(clientId).then(assertAdminSeedRecords)
  }

  getAdminIngestStates(clientId?: string): Promise<AdminIngestState[]> {
    return this.adapter.getAdminIngestStates(clientId).then(assertAdminIngestStates)
  }

  getAdminAlerts(clientId?: string): Promise<AdminAlert[]> {
    return this.adapter.getAdminAlerts(clientId).then(assertAdminAlerts)
  }

  uploadSeedFile(params: SeedFileUploadParams): Promise<AdminSeedRecord> {
    return this.adapter.uploadSeedFile(params).then(assertAdminSeedRecord)
  }

  createNoteSeed(params: SeedNoteCreateParams): Promise<AdminSeedRecord> {
    return this.adapter.createNoteSeed(params).then(assertAdminSeedRecord)
  }

  createUrlSeed(params: SeedUrlCreateParams): Promise<AdminSeedRecord> {
    return this.adapter.createUrlSeed(params).then(assertAdminSeedRecord)
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
      provider: params.provider ?? 'openai',
      token: params.token,
    }
    return this.adapter.sendPortalMessage(request)
  }

  persistWidgetResponse(messageId: string, value: string | number): Promise<void> {
    return this.adapter.persistWidgetResponse(messageId, value)
  }

  deleteSeed(seedId: string): Promise<void> {
    return this.adapter.deleteSeed(seedId)
  }
}

function createAdapter(): ApiAdapter {
  const mode = import.meta.env.VITE_API_ADAPTER ?? 'mock'
  if (mode === 'supabase') {
    return new SupabaseApiAdapter()
  }
  return new MockApiAdapter()
}

export const apiClient = new ApiClient(createAdapter())
