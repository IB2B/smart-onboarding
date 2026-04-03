import { describe, expect, it } from 'vitest'

import { MockApiAdapter } from '@/adapters/mock-adapter'

describe('mock adapter', () => {
  it('returns stable client list and thread payloads', async () => {
    const adapter = new MockApiAdapter()
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

  it('returns cloned session payload and provider-aware message response', async () => {
    const adapter = new MockApiAdapter()
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
})
