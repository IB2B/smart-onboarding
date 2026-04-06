import { describe, expect, it } from 'vitest'

import { MockApiAdapter } from '@/adapters/mock-adapter'
import {
  assertAdminAlerts,
  assertAdminClientDetailBundle,
  assertAdminDashboardSnapshot,
  assertAdminIngestStates,
  assertAdminSeedRecords,
  assertChatSession,
  assertClientList,
  assertThreadMessages,
  isWidgetMessage,
} from '@/contracts/guards'
import { mockClients, mockPortalSession, mockThreadByClient } from '@/contracts/mock-data'

describe('contracts guards', () => {
  it('accepts the existing client, thread, and session payloads', () => {
    expect(assertClientList(mockClients)).toHaveLength(mockClients.length)
    expect(assertThreadMessages(mockThreadByClient.cl_1)).toHaveLength(mockThreadByClient.cl_1.length)
    expect(assertChatSession(mockPortalSession)).toMatchObject({
      session: {
        clientId: 'cl_1',
      },
    })
  })

  it('rejects malformed payloads', () => {
    expect(() => assertClientList({})).toThrow('Invalid clients payload')
    expect(() => assertThreadMessages({})).toThrow('Invalid thread payload')
    expect(() => assertChatSession({ session: { messages: null } })).toThrow('Invalid chat session payload')
  })

  it('detects widget-bearing thread messages', () => {
    const withWidget = {
      id: 'msg_widget',
      role: 'assistant',
      content: 'Pick one',
      createdAt: new Date().toISOString(),
      widget_payload: {
        type: 'choices',
        prompt: 'Pick one',
        options: [],
      },
    }

    const withoutWidget = {
      id: 'msg_plain',
      role: 'assistant',
      content: 'No widget',
      createdAt: new Date().toISOString(),
    }

    expect(isWidgetMessage(withWidget as never)).toBe(true)
    expect(isWidgetMessage(withoutWidget as never)).toBe(false)
  })
})

describe('admin contract guards', () => {
  it('accepts the admin dashboard snapshot shape from the mock adapter', async () => {
    const adapter = new MockApiAdapter()
    const snapshot = assertAdminDashboardSnapshot(await adapter.getAdminDashboardSnapshot())

    expect(snapshot.totals.clients).toBe(3)
    expect(snapshot.totals.active).toBe(1)
    expect(snapshot.totals.invited).toBe(1)
    expect(snapshot.totals.blocked).toBe(1)
    expect(snapshot.completion.average).toBeGreaterThan(0)
    expect(snapshot.alerts.length).toBeGreaterThan(0)
  })

  it('accepts the admin detail bundle shape from the mock adapter', async () => {
    const adapter = new MockApiAdapter()
    const bundle = assertAdminClientDetailBundle(await adapter.getAdminClientDetailBundle('cl_1'))

    expect(bundle.client.id).toBe('cl_1')
    expect(bundle.seeds).toHaveLength(2)
    expect(bundle.ingestStates).toHaveLength(2)
    expect(bundle.documentChunks).toHaveLength(2)
    expect(bundle.messages).toHaveLength(3)
  })

  it('accepts the admin seed, ingest, and alert collections', async () => {
    const adapter = new MockApiAdapter()

    expect(assertAdminSeedRecords(await adapter.getAdminSeedRecords('cl_1'))).toHaveLength(2)
    expect(assertAdminIngestStates(await adapter.getAdminIngestStates('cl_1'))).toHaveLength(2)
    expect(assertAdminAlerts(await adapter.getAdminAlerts('cl_2'))).toHaveLength(2)
  })

  it('rejects malformed admin payloads', () => {
    expect(() => assertAdminDashboardSnapshot({})).toThrow('Invalid admin dashboard payload')
    expect(() => assertAdminClientDetailBundle({})).toThrow('Invalid admin client detail payload')
    expect(() => assertAdminSeedRecords({})).toThrow('Invalid admin seeds payload')
    expect(() => assertAdminIngestStates({})).toThrow('Invalid admin ingest payload')
    expect(() => assertAdminAlerts({})).toThrow('Invalid admin alerts payload')
  })
})
