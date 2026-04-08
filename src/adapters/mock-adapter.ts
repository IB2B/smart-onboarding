import type {
  AdminAlert,
  AdminClientDetailBundle,
  AdminDashboardSnapshot,
  AdminIngestState,
  AdminSeedRecord,
  ApiAdapter,
  ChatRequest,
  ChatResponse,
  ChatSessionResponse,
  ClientSummary,
  SeedFileUploadParams,
  SeedNoteCreateParams,
  SeedUrlCreateParams,
  ThreadMessage,
  WidgetPayload,
} from '@/contracts/api'
import {
  mockAdminDataSeeds,
  mockClients,
  mockDocumentChunks,
  mockMessagesByClient,
  mockOnboardingStates,
  mockPortalSession,
  mockThreadByClient,
} from '@/contracts/mock-data'
import {
  STALE_THRESHOLD_HOURS,
  buildAlertsForClient,
  buildIngestState,
  getMilestoneCompletion,
  getHoursSince,
} from './derive'

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function getClientBundle(clientId: string): AdminClientDetailBundle | undefined {
  const client = mockClients.find((item) => item.id === clientId)
  if (!client) return undefined
  const onboardingState = mockOnboardingStates.find((item) => item.clientId === clientId)
  if (!onboardingState) return undefined

  const seeds = mockAdminDataSeeds.filter((item) => item.clientId === clientId)
  const ingestStates = seeds.map((seed) => buildIngestState(seed, mockDocumentChunks))
  const documentChunks = mockDocumentChunks.filter((item) => item.clientId === clientId)
  const messages = resolveClientMessages(clientId)

  return {
    client: structuredClone(client),
    onboardingState: structuredClone(onboardingState),
    seeds: structuredClone(seeds),
    ingestStates,
    documentChunks: structuredClone(documentChunks),
    messages,
    alerts: buildAlertsForClient(
      client,
      onboardingState,
      seeds,
      mockDocumentChunks,
    ),
  }
}

function resolveClientMessages(clientId: string): ThreadMessage[] {
  const key = clientId as keyof typeof mockMessagesByClient
  return structuredClone(mockMessagesByClient[key] ?? mockThreadByClient[key] ?? [])
}

export class MockApiAdapter implements ApiAdapter {
  private messageCount = 0

  async getClients(): Promise<ClientSummary[]> {
    await wait(180)
    return structuredClone(mockClients)
  }

  async getClientThread(clientId: string): Promise<ThreadMessage[]> {
    await wait(140)
    const key = clientId as keyof typeof mockThreadByClient
    return structuredClone(mockThreadByClient[key] ?? [])
  }

  async getPortalSession(_token?: string): Promise<ChatSessionResponse> {
    await wait(160)
    return structuredClone(mockPortalSession)
  }

  async sendPortalMessage(request: ChatRequest): Promise<ChatResponse> {
    await wait(280)

    this.messageCount++
    let widget_payload: WidgetPayload | undefined

    if (this.messageCount % 5 === 0) {
      widget_payload = {
        type: 'scale',
        prompt: 'How would you rate the importance of this feature?',
        min: 1,
        max: 10,
        step: 1,
        minLabel: 'Low priority',
        maxLabel: 'Must have',
      }
    } else if (this.messageCount % 3 === 0) {
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
          : `**Got it, ${request.message.slice(0, 30)}${request.message.length > 30 ? '…' : ''}**\n\nThanks for sharing that. Let me note this down and we'll continue building out your onboarding profile.\n\n**Next steps:**\n- Confirm your brand direction\n- Upload any existing brand assets\n- Review the timeline`,
        createdAt: new Date().toISOString(),
        widget_payload,
      },
      snapshotDelta: {
        pendingItems: ['Confirm launch date', 'Upload logo source files'],
      },
    }
  }

  async getAdminDashboardSnapshot(): Promise<AdminDashboardSnapshot> {
    await wait(120)

    const onboardingStates = structuredClone(mockOnboardingStates)
    const ingestStates = mockAdminDataSeeds.map((seed) => buildIngestState(seed, mockDocumentChunks))
    const alerts = mockClients.flatMap((client) => {
      const state = mockOnboardingStates.find((s) => s.clientId === client.id)
      const seeds = mockAdminDataSeeds.filter((s) => s.clientId === client.id)
      return buildAlertsForClient(client, state, seeds, mockDocumentChunks)
    })

    return {
      generatedAt: new Date().toISOString(),
      totals: {
        clients: mockClients.length,
        active: mockClients.filter((client) => client.status === 'active').length,
        invited: mockClients.filter((client) => client.status === 'invited').length,
        blocked: mockClients.filter((client) => client.status === 'blocked').length,
      },
      completion: {
        average: Math.round(
          onboardingStates.reduce((sum, state) => sum + getMilestoneCompletion(state), 0) /
            Math.max(1, onboardingStates.length),
        ),
        complete: onboardingStates.filter((state) => state.status === 'complete').length,
        inProgress: onboardingStates.filter((state) => state.status === 'active').length,
      },
      freshness: {
        stale: mockClients.filter((client) => getHoursSince(client.lastActivity) >= STALE_THRESHOLD_HOURS).length,
        thresholdHours: STALE_THRESHOLD_HOURS,
      },
      ingest: {
        healthy: ingestStates.filter((state) => state.status === 'ready').length,
        warning: ingestStates.filter((state) => state.status === 'warning').length,
        failed: ingestStates.filter((state) => state.status === 'failed').length,
        queued: ingestStates.filter((state) => state.status === 'queued').length,
      },
      alerts,
    }
  }

  async getAdminClientDetailBundle(clientId: string): Promise<AdminClientDetailBundle> {
    await wait(150)
    const bundle = getClientBundle(clientId)
    if (!bundle) {
      throw new Error(`Client ${clientId} not found or has no onboarding state`)
    }
    return structuredClone(bundle)
  }

  async getAdminSeedRecords(clientId?: string): Promise<AdminSeedRecord[]> {
    await wait(140)
    const seeds = clientId
      ? mockAdminDataSeeds.filter((seed) => seed.clientId === clientId)
      : mockAdminDataSeeds
    return structuredClone(seeds)
  }

  async getAdminIngestStates(clientId?: string): Promise<AdminIngestState[]> {
    await wait(140)
    const seeds = clientId
      ? mockAdminDataSeeds.filter((seed) => seed.clientId === clientId)
      : mockAdminDataSeeds
    return structuredClone(seeds.map((seed) => buildIngestState(seed, mockDocumentChunks)))
  }

  async getAdminAlerts(clientId?: string): Promise<AdminAlert[]> {
    await wait(120)
    const alerts = clientId
      ? (() => {
          const client = mockClients.find((c) => c.id === clientId)
          if (!client) return []
          const state = mockOnboardingStates.find((s) => s.clientId === clientId)
          const seeds = mockAdminDataSeeds.filter((s) => s.clientId === clientId)
          return buildAlertsForClient(client, state, seeds, mockDocumentChunks)
        })()
      : mockClients.flatMap((client) => {
          const state = mockOnboardingStates.find((s) => s.clientId === client.id)
          const seeds = mockAdminDataSeeds.filter((s) => s.clientId === client.id)
          return buildAlertsForClient(client, state, seeds, mockDocumentChunks)
        })
    return structuredClone(alerts)
  }

  async persistWidgetResponse(_messageId: string, _value: string | number): Promise<void> {
    // no-op in mock mode
  }

  async uploadSeedFile(params: SeedFileUploadParams): Promise<AdminSeedRecord> {
    await new Promise((resolve) => setTimeout(resolve, 500))
    return {
      id: Date.now().toString(),
      clientId: params.clientId,
      title: params.title,
      sourceType: params.sourceType,
      storagePath: `raw-uploads/${params.clientId}/${params.file.name}`,
      ingestStatus: 'queued',
      createdBy: 'mock-admin',
      createdAt: new Date().toISOString(),
    }
  }

  async createNoteSeed(params: SeedNoteCreateParams): Promise<AdminSeedRecord> {
    await new Promise((resolve) => setTimeout(resolve, 500))
    return {
      id: Date.now().toString(),
      clientId: params.clientId,
      title: params.title,
      sourceType: 'notes',
      rawTranscript: params.content,
      ingestStatus: 'queued',
      createdBy: 'mock-admin',
      createdAt: new Date().toISOString(),
    }
  }

  async createUrlSeed(params: SeedUrlCreateParams): Promise<AdminSeedRecord> {
    await new Promise((resolve) => setTimeout(resolve, 500))
    return {
      id: Date.now().toString(),
      clientId: params.clientId,
      title: params.title,
      sourceType: 'url',
      storagePath: params.url,
      ingestStatus: 'queued',
      createdBy: 'mock-admin',
      createdAt: new Date().toISOString(),
    }
  }
}
