import { describe, expect, it, vi } from 'vitest'

import { mockClients, mockThreadByClient } from '@/contracts/mock-data'

async function createAdapter() {
  vi.resetModules()
  const { MockApiAdapter } = await import('@/adapters/mock-adapter')
  return new MockApiAdapter()
}

describe('mock adapter', () => {
  it('returns stable client list and thread payloads', async () => {
    const adapter = await createAdapter()
    const clients = await adapter.getClients()
    const firstClient = clients[0]
    expect(firstClient).toBeDefined()

    const thread = await adapter.getClientThread(firstClient!.id)
    const firstThread = thread[0]
    expect(firstThread).toBeDefined()

    expect(clients.length).toBeGreaterThan(0)
    expect(thread.length).toBeGreaterThan(0)
    expect(firstClient).toMatchSnapshot()
    expect(firstThread).toMatchSnapshot()
  })

  it('returns cloned payloads so callers cannot mutate the shared fixtures', async () => {
    const adapter = await createAdapter()

    const clientsA = await adapter.getClients()
    clientsA[0]!.company = 'Mutated company'

    const clientsB = await adapter.getClients()
    expect(clientsB[0]!.company).toBe(mockClients[0]!.company)

    const threadA = await adapter.getClientThread('cl_1')
    threadA[0]!.content = 'Mutated thread'

    const threadB = await adapter.getClientThread('cl_1')
    expect(threadB[0]!.content).toBe(mockThreadByClient.cl_1[0]!.content)
  })

  it('returns cloned session payload and provider-aware message response', async () => {
    const adapter = await createAdapter()
    const sessionA = await adapter.getPortalSession('token-a')
    sessionA.session.messages.push({
      id: 'local',
      role: 'client',
      content: 'local mutation',
      createdAt: new Date().toISOString(),
    })

    const sessionB = await adapter.getPortalSession('token-a')
    expect(sessionB.session.messages.find((item) => item.id === 'local')).toBeUndefined()

    const response = await adapter.sendPortalMessage({
      sessionId: 's1',
      clientId: 'c1',
      requestId: 'r1',
      message: 'hello',
      provider: 'openrouter',
    })
    expect(response.sessionId).toBe('s1')
    expect(response.message.content).toContain('OpenRouter')
  })

  it('cycles widget payloads in the mock response stream', async () => {
    const adapter = await createAdapter()

    const first = await adapter.sendPortalMessage({
      sessionId: 's1',
      clientId: 'c1',
      requestId: 'r1',
      message: 'first',
      provider: 'openrouter',
    })
    expect(first.message.widget_payload).toBeUndefined()

    const second = await adapter.sendPortalMessage({
      sessionId: 's1',
      clientId: 'c1',
      requestId: 'r2',
      message: 'second',
      provider: 'openrouter',
    })
    expect(second.message.widget_payload).toBeUndefined()

    const third = await adapter.sendPortalMessage({
      sessionId: 's1',
      clientId: 'c1',
      requestId: 'r3',
      message: 'third',
      provider: 'openrouter',
    })
    expect(third.message.widget_payload?.type).toBe('choices')

    const fourth = await adapter.sendPortalMessage({
      sessionId: 's1',
      clientId: 'c1',
      requestId: 'r4',
      message: 'fourth',
      provider: 'openrouter',
    })
    expect(fourth.message.widget_payload).toBeUndefined()

    const fifth = await adapter.sendPortalMessage({
      sessionId: 's1',
      clientId: 'c1',
      requestId: 'r5',
      message: 'fifth',
      provider: 'openrouter',
    })
    expect(fifth.message.widget_payload?.type).toBe('scale')
  })

  it('exposes the admin monitor methods on the adapter', async () => {
    const adapter = await createAdapter()

    const dashboard = await adapter.getAdminDashboardSnapshot()
    expect(dashboard.totals.clients).toBeGreaterThan(0)

    const bundle = await adapter.getAdminClientDetailBundle('cl_1')
    expect(bundle.client.id).toBe('cl_1')

    const seeds = await adapter.getAdminSeedRecords('cl_1')
    expect(seeds.length).toBeGreaterThan(0)

    const ingestStates = await adapter.getAdminIngestStates('cl_1')
    expect(ingestStates.length).toBeGreaterThan(0)

    const alerts = await adapter.getAdminAlerts('cl_2')
    expect(alerts.length).toBeGreaterThan(0)
  })
})
