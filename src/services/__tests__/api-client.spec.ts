import { beforeEach, describe, expect, it, vi } from 'vitest'

import type {
  AdminAlert,
  AdminClientDetailBundle,
  AdminDashboardSnapshot,
  AdminIngestState,
  AdminSeedRecord,
  ChatSessionResponse,
} from '@/contracts/api'

const adapterMocks = vi.hoisted(() => ({
  getClients: vi.fn(async () => [{ id: 'cl_1', company: 'Northstar Dental' }]),
  getClientThread: vi.fn(async (clientId: string) => [{ id: `thread_${clientId}`, content: 'ok' }]),
  getPortalSession: vi.fn(async (): Promise<ChatSessionResponse> => ({
    session: {
      clientId: 'cl_1',
      contactName: 'Demo User',
      companyName: 'Demo Company',
      title: 'Demo session',
      messages: [
        {
          id: 'msg_1',
          role: 'assistant',
          content: 'Welcome!',
          createdAt: new Date().toISOString(),
        },
      ],
    },
    snapshot: {
      businessModel: 'demo',
      brandDirection: 'demo',
      targetAudience: 'demo',
      requiredIntegrations: [],
      pendingItems: [],
    },
    onboardingState: null,
  })),
  sendPortalMessage: vi.fn(async (request: { requestId: string; provider: string; message: string }) => ({
    sessionId: 'session-1',
    message: {
      id: 'msg-1',
      role: 'assistant',
      content: `[${request.provider}] ${request.message}`,
      createdAt: new Date().toISOString(),
    },
    snapshotDelta: {},
  })),
  getAdminDashboardSnapshot: vi.fn(async (): Promise<AdminDashboardSnapshot> => ({
    generatedAt: '2026-04-04T00:00:00.000Z',
    totals: {
      clients: 1,
      active: 1,
      invited: 0,
      blocked: 0,
    },
    completion: {
      average: 75,
      complete: 0,
      inProgress: 1,
    },
    freshness: {
      stale: 0,
      thresholdHours: 48,
    },
    ingest: {
      healthy: 1,
      warning: 0,
      failed: 0,
      queued: 0,
    },
    alerts: [],
  })),
  getAdminClientDetailBundle: vi.fn(async (clientId: string): Promise<AdminClientDetailBundle> => ({
    client: {
      id: clientId,
      company: 'Northstar Dental',
      contactName: 'Mina Ghazali',
      email: 'mina@northstar.dental',
      status: 'active',
      phase: 'welcome',
      progress: 75,
      lastActivity: '2026-04-04T00:00:00.000Z',
    },
    onboardingState: {
      id: `state_${clientId}`,
      clientId,
      phase: 'welcome',
      milestones: {
        brand_identity: { status: 'pending', data: {} },
        technical_needs: { status: 'pending', data: {} },
        target_audience: { status: 'pending', data: {} },
        timeline_budget: { status: 'pending', data: {} },
      },
      collectedData: {},
      status: 'active',
      lastActivity: '2026-04-04T00:00:00.000Z',
    },
    seeds: [],
    ingestStates: [],
    documentChunks: [],
    messages: [],
    alerts: [],
    briefs: [],
  })),
  getAdminSeedRecords: vi.fn(async (clientId?: string): Promise<AdminSeedRecord[]> => [
    {
      id: `seed_${clientId ?? 'all'}`,
      clientId: clientId ?? 'cl_1',
      title: 'Brand notes',
      sourceType: 'notes',
      rawTranscript: 'raw',
      processedSummary: 'summary',
      createdAt: '2026-04-04T00:00:00.000Z',
    },
  ]),
  getAdminIngestStates: vi.fn(async (clientId?: string): Promise<AdminIngestState[]> => [
    {
      id: `ingest_${clientId ?? 'all'}`,
      clientId: clientId ?? 'cl_1',
      seedId: `seed_${clientId ?? 'all'}`,
      status: 'ready',
      progress: 100,
      chunkCount: 2,
      note: 'Ready',
      updatedAt: '2026-04-04T00:00:00.000Z',
    },
  ]),
  getAdminAlerts: vi.fn(async (clientId?: string): Promise<AdminAlert[]> => [
    {
      id: `alert_${clientId ?? 'all'}`,
      clientId: clientId ?? 'cl_1',
      severity: 'info',
      status: 'open',
      category: 'ops',
      title: 'Check',
      description: 'Check',
      createdAt: '2026-04-04T00:00:00.000Z',
    },
  ]),
}))

vi.mock('@/adapters/mock-adapter', () => {
  return {
    MockApiAdapter: class {
      getClients = adapterMocks.getClients
      getClientThread = adapterMocks.getClientThread
      getPortalSession = adapterMocks.getPortalSession
      sendPortalMessage = adapterMocks.sendPortalMessage
      getAdminDashboardSnapshot = adapterMocks.getAdminDashboardSnapshot
      getAdminClientDetailBundle = adapterMocks.getAdminClientDetailBundle
      getAdminSeedRecords = adapterMocks.getAdminSeedRecords
      getAdminIngestStates = adapterMocks.getAdminIngestStates
      getAdminAlerts = adapterMocks.getAdminAlerts
    },
  }
})

import { apiClient } from '@/services/api-client'

describe('api client wiring', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.clearAllMocks()
  })

  it('delegates existing client and session requests to the adapter', async () => {
    const clients = await apiClient.getClients()
    const thread = await apiClient.getClientThread('cl_1')
    const session = await apiClient.getPortalSession()

    expect(clients).toEqual([{ id: 'cl_1', company: 'Northstar Dental' }])
    expect(thread).toEqual([{ id: 'thread_cl_1', content: 'ok' }])
    expect(session).toMatchObject({
      session: {
        clientId: 'cl_1',
      },
      snapshot: {
        businessModel: 'demo',
      },
    })
    expect(session.session.messages[0]?.content).toBe('Welcome!')
    expect(adapterMocks.getClients).toHaveBeenCalledTimes(1)
    expect(adapterMocks.getClientThread).toHaveBeenCalledWith('cl_1')
    expect(adapterMocks.getPortalSession).toHaveBeenCalledWith()
  })

  it('injects request metadata when sending portal messages', async () => {
    const now = 1_725_000_000_000
    vi.spyOn(Date, 'now').mockReturnValue(now)

    const response = await apiClient.sendPortalMessage({
      sessionId: 'session-1',
      clientId: 'cl_1',
      message: 'hello world',
      provider: 'openrouter',
    })

    expect(response.message.content).toContain('hello world')
    expect(adapterMocks.sendPortalMessage).toHaveBeenCalledWith({
      sessionId: 'session-1',
      clientId: 'cl_1',
      requestId: `req_${now}`,
      message: 'hello world',
      provider: 'openrouter',
    })
  })

  it('delegates admin dashboard requests to the adapter', async () => {
    const snapshot = await apiClient.getAdminDashboardSnapshot()

    expect(snapshot.totals.clients).toBe(1)
    expect(snapshot.ingest.healthy).toBe(1)
    expect(adapterMocks.getAdminDashboardSnapshot).toHaveBeenCalledTimes(1)
  })

  it('delegates admin detail, seeds, ingest states, and alerts requests to the adapter', async () => {
    const bundle = await apiClient.getAdminClientDetailBundle('cl_1')
    const seeds = await apiClient.getAdminSeedRecords('cl_1')
    const ingestStates = await apiClient.getAdminIngestStates('cl_1')
    const alerts = await apiClient.getAdminAlerts('cl_1')

    expect(bundle.client.id).toBe('cl_1')
    expect(seeds[0]?.clientId).toBe('cl_1')
    expect(ingestStates[0]?.seedId).toContain('seed_cl_1')
    expect(alerts[0]?.clientId).toBe('cl_1')
    expect(adapterMocks.getAdminClientDetailBundle).toHaveBeenCalledWith('cl_1')
    expect(adapterMocks.getAdminSeedRecords).toHaveBeenCalledWith('cl_1')
    expect(adapterMocks.getAdminIngestStates).toHaveBeenCalledWith('cl_1')
    expect(adapterMocks.getAdminAlerts).toHaveBeenCalledWith('cl_1')
  })
})
