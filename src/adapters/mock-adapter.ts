import type {
  AdminAlert,
  AdminClientDetailBundle,
  AdminDashboardSnapshot,
  AdminDocumentChunkRecord,
  AdminIngestState,
  AdminSeedRecord,
  ApiAdapter,
  ChatRequest,
  ChatResponse,
  ChatSessionResponse,
  ClientSummary,
  OnboardingState,
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

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

let messageCount = 0

const STALE_THRESHOLD_HOURS = 48

const milestoneCompletionWeight: Record<string, number> = {
  pending: 0,
  in_progress: 0.5,
  complete: 1,
  blocked: 0.25,
}

const severityPriority: Record<AdminAlert['severity'], number> = {
  critical: 0,
  warning: 1,
  info: 2,
}

function getHoursSince(timestamp: string): number {
  const parsed = new Date(timestamp).getTime()
  if (!Number.isNaN(parsed)) {
    return (Date.now() - parsed) / 3_600_000
  }

  const normalized = timestamp.trim().toLowerCase()
  const hourMatch = normalized.match(/^(\d+)\s*h(?:ours?)?\s*ago$/)
  if (hourMatch) {
    return Number(hourMatch[1] ?? 0)
  }

  const dayMatch = normalized.match(/^(\d+)\s*d(?:ays?)?\s*ago$/)
  if (dayMatch) {
    return Number(dayMatch[1] ?? 0) * 24
  }

  return Number.POSITIVE_INFINITY
}

function getMilestoneCompletion(state: OnboardingState): number {
  const entries = Object.values(state.milestones)
  if (!entries.length) return 0
  const total = entries.reduce((sum, milestone) => {
    const weight = milestoneCompletionWeight[milestone.status] ?? 0
    return sum + weight
  }, 0)
  return Math.round((total / entries.length) * 100)
}

function deriveIngestStatus(seed: AdminSeedRecord, chunks: AdminDocumentChunkRecord[]): AdminIngestState['status'] {
  const chunkCount = chunks.length
  if (seed.processedSummary && chunkCount > 0) return 'ready'
  if (seed.rawTranscript && chunkCount > 0) return 'processing'
  if (seed.sourceType === 'url' && !seed.rawTranscript && !seed.processedSummary) return 'queued'
  return seed.processedSummary ? 'warning' : 'processing'
}

function deriveIngestProgress(status: AdminIngestState['status'], chunkCount: number): number {
  if (status === 'ready') return 100
  if (status === 'processing') return Math.min(88, 45 + chunkCount * 12)
  if (status === 'queued') return 15
  if (status === 'warning') return 65
  return 0
}

function buildIngestState(seed: AdminSeedRecord): AdminIngestState {
  const chunks = mockDocumentChunks.filter((chunk) => chunk.seedId === seed.id)
  const status = deriveIngestStatus(seed, chunks)
  return {
    id: `ingest_${seed.id}`,
    clientId: seed.clientId,
    seedId: seed.id,
    status,
    progress: deriveIngestProgress(status, chunks.length),
    chunkCount: chunks.length,
    note:
      status === 'ready'
        ? 'Summary ready for replay'
        : status === 'processing'
          ? 'Chunking in progress'
          : status === 'queued'
            ? 'Waiting for ingestion'
            : 'Needs review before use',
    updatedAt: seed.createdAt,
  }
}

function buildAlertsForClient(clientId: string): AdminAlert[] {
  const client = mockClients.find((item) => item.id === clientId)
  const state = mockOnboardingStates.find((item) => item.clientId === clientId)
  const seeds = mockAdminDataSeeds.filter((item) => item.clientId === clientId)
  const alerts: AdminAlert[] = []

  if (client?.status === 'blocked') {
    alerts.push({
      id: `alert_${clientId}_blocked`,
      clientId,
      severity: 'critical',
      status: 'open',
      category: 'ops',
      title: `${client.company} is blocked`,
      description: 'Admin intervention is required before the next onboarding step can continue.',
      createdAt: client.lastActivity,
    })
  }

  if (client && getHoursSince(client.lastActivity) >= STALE_THRESHOLD_HOURS) {
    alerts.push({
      id: `alert_${clientId}_stale`,
      clientId,
      severity: 'warning',
      status: 'open',
      category: 'stale',
      title: `${client.company} has gone stale`,
      description: `No activity has been recorded in more than ${STALE_THRESHOLD_HOURS} hours.`,
      createdAt: client.lastActivity,
    })
  }

  if (state && state.phase === 'welcome' && state.status === 'active') {
    alerts.push({
      id: `alert_${clientId}_welcome`,
      clientId,
      severity: 'info',
      status: 'open',
      category: 'milestone',
      title: `${client?.company ?? 'Client'} still needs first response`,
      description: 'The onboarding flow has not moved beyond the welcome phase.',
      createdAt: state.lastActivity,
    })
  }

  for (const seed of seeds) {
    const ingest = buildIngestState(seed)
    if (ingest.status === 'warning') {
      alerts.push({
        id: `alert_${seed.id}_warning`,
        clientId,
        seedId: seed.id,
        severity: 'warning',
        status: 'open',
        category: 'ingest',
        title: `${seed.title} needs review`,
        description: 'Seed content is present, but the ingest pipeline has not fully stabilized yet.',
        createdAt: seed.createdAt,
      })
    }
    if (ingest.status === 'queued') {
      alerts.push({
        id: `alert_${seed.id}_queued`,
        clientId,
        seedId: seed.id,
        severity: 'info',
        status: 'open',
        category: 'ingest',
        title: `${seed.title} is queued`,
        description: 'The ingest job is waiting for the next processing cycle.',
        createdAt: seed.createdAt,
      })
    }
  }

  return alerts.sort((left, right) => {
    const severityDelta = severityPriority[left.severity] - severityPriority[right.severity]
    if (severityDelta !== 0) return severityDelta
    return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  })
}

function getClientBundle(clientId: string): AdminClientDetailBundle | undefined {
  const client = mockClients.find((item) => item.id === clientId)
  const onboardingState = mockOnboardingStates.find((item) => item.clientId === clientId)
  if (!client || !onboardingState) return undefined

  const seeds = mockAdminDataSeeds.filter((item) => item.clientId === clientId)
  const ingestStates = seeds.map(buildIngestState)
  const documentChunks = mockDocumentChunks.filter((item) => item.clientId === clientId)
  const messages = resolveClientMessages(clientId)

  return {
    client: structuredClone(client),
    onboardingState: structuredClone(onboardingState),
    seeds: structuredClone(seeds),
    ingestStates,
    documentChunks: structuredClone(documentChunks),
    messages,
    alerts: buildAlertsForClient(clientId),
  }
}

function resolveClientMessages(clientId: string): ThreadMessage[] {
  const key = clientId as keyof typeof mockMessagesByClient
  return structuredClone(mockMessagesByClient[key] ?? mockThreadByClient[key] ?? [])
}

export class MockApiAdapter implements ApiAdapter {
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

  async getAdminDashboardSnapshot(): Promise<AdminDashboardSnapshot> {
    await wait(120)

    const onboardingStates = structuredClone(mockOnboardingStates)
    const ingestStates = mockAdminDataSeeds.map(buildIngestState)
    const alerts = mockClients.flatMap((client) => buildAlertsForClient(client.id))

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
      throw new Error('Client not found')
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
    return structuredClone(seeds.map(buildIngestState))
  }

  async getAdminAlerts(clientId?: string): Promise<AdminAlert[]> {
    await wait(120)
    const alerts = clientId ? buildAlertsForClient(clientId) : mockClients.flatMap((client) => buildAlertsForClient(client.id))
    return structuredClone(alerts)
  }
}
