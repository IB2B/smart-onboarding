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
  OnboardingBrief,
  OnboardingSnapshotDelta,
  OnboardingState,
  SeedFileUploadParams,
  SeedNoteCreateParams,
  SeedUrlCreateParams,
  ThreadMessage,
} from '@/contracts/api'
import { supabase } from '@/lib/supabase'
import {
  STALE_THRESHOLD_HOURS,
  buildAlertsForClient,
  buildIngestState,
  getMilestoneCompletion,
  getHoursSince,
  severityPriority,
} from './derive'
import {
  mapBriefRow,
  mapChunkRow,
  mapClientRow,
  mapMessageRow,
  mapOnboardingStateRow,
  mapSeedRow,
} from './mappers'

// ── Private helpers ──────────────────────────────────────────────────────────

function deriveClientStatus(
  stateRow: Record<string, unknown> | null,
): 'invited' | 'active' | 'blocked' {
  if (!stateRow) return 'invited'
  if (stateRow['status'] === 'paused') return 'blocked'
  return 'active'
}

function deriveClientProgress(state: OnboardingState | null): number {
  if (!state) return 0
  return getMilestoneCompletion(state)
}

function deriveLastActivity(
  stateRow: Record<string, unknown> | null,
  clientRow: Record<string, unknown>,
): string {
  const activityTs = stateRow?.['last_activity'] as string | null
  return activityTs ?? (clientRow['created_at'] as string)
}

function buildClientFromRow(
  clientRow: Record<string, unknown>,
  stateRow: Record<string, unknown> | null,
): { client: ClientSummary; mappedState: OnboardingState | null } {
  const mappedState = stateRow ? mapOnboardingStateRow(stateRow) : null
  const status = deriveClientStatus(stateRow)
  const phase = mappedState?.phase ?? 'welcome'
  const progress = deriveClientProgress(mappedState)
  const lastActivity = deriveLastActivity(stateRow, clientRow)
  const client = mapClientRow(clientRow, { status, phase, progress, lastActivity })
  return { client, mappedState }
}

async function resolveLegacyPortalClientId(token: string): Promise<string> {
  const normalizedToken = token.trim()
  if (!normalizedToken) {
    throw new Error('Portal token is missing')
  }

  // Legacy portal links used the client UUID directly in the route.
  // Until a dedicated portal_tokens table exists, explicitly verify that
  // the token maps to a real client instead of trusting it as an ID blindly.
  const { data: clientRow, error } = await supabase
    .from('clients')
    .select('id')
    .eq('id', normalizedToken)
    .maybeSingle()

  if (error) {
    throw new Error(`resolveLegacyPortalClientId: ${error.message}`)
  }
  if (!clientRow) {
    throw new Error('Invalid or expired portal link')
  }

  return (clientRow as Record<string, unknown>)['id'] as string
}

// Fetch all clients + their onboarding states in two explicit queries, then
// join in JS. This is more reliable than the embedded-join syntax
// (`select('*, onboarding_states(*)')`) which silently returns empty arrays
// when the FK relationship is not registered in the Supabase schema cache.
async function fetchClientsWithStates(): Promise<
  Array<{ clientRow: Record<string, unknown>; stateRow: Record<string, unknown> | null }>
> {
  const [clientsResult, statesResult] = await Promise.all([
    supabase.from('clients').select('*').order('created_at', { ascending: false }),
    supabase.from('onboarding_states').select('*'),
  ])

  if (clientsResult.error) throw new Error(`fetchClientsWithStates (clients): ${clientsResult.error.message}`)
  if (statesResult.error) throw new Error(`fetchClientsWithStates (states): ${statesResult.error.message}`)

  const statesById = new Map<string, Record<string, unknown>>(
    (statesResult.data ?? []).map((row) => [
      (row as Record<string, unknown>)['client_id'] as string,
      row as Record<string, unknown>,
    ]),
  )

  return (clientsResult.data ?? []).map((row) => {
    const clientRow = row as Record<string, unknown>
    return {
      clientRow,
      stateRow: statesById.get(clientRow['id'] as string) ?? null,
    }
  })
}

// ── Adapter ──────────────────────────────────────────────────────────────────

export class SupabaseApiAdapter implements ApiAdapter {
  async getClients(): Promise<ClientSummary[]> {
    const rows = await fetchClientsWithStates()
    return rows.map(({ clientRow, stateRow }) => buildClientFromRow(clientRow, stateRow).client)
  }

  async getClientThread(clientId: string): Promise<ThreadMessage[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: true })

    if (error) throw new Error(`getClientThread: ${error.message}`)
    if (!data) return []

    return data.map((row) => mapMessageRow(row as Record<string, unknown>))
  }

  async getPortalSession(token?: string): Promise<ChatSessionResponse> {
    // Resolve client ID from either the magic token (legacy/demo) or the authenticated user's email
    let clientId: string

    if (token) {
      clientId = await resolveLegacyPortalClientId(token)
    } else {
      // No token — resolve via authenticated user's email (magic link flow)
      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError || !userData.user) throw new Error('getPortalSession: not authenticated')

      const email = userData.user.email
      if (!email) throw new Error('getPortalSession: authenticated user has no email')

      const { data: clientRow, error: clientLookupError } = await supabase
        .from('clients')
        .select('id')
        .eq('contact_email', email)
        .maybeSingle()

      if (clientLookupError) throw new Error(`getPortalSession (email lookup): ${clientLookupError.message}`)
      if (!clientRow) throw new Error(`getPortalSession: no client found for email ${email}`)

      clientId = (clientRow as Record<string, unknown>)['id'] as string
    }

    const [clientResult, stateResult, messagesResult] = await Promise.all([
      supabase.from('clients').select('*').eq('id', clientId).maybeSingle(),
      supabase.from('onboarding_states').select('*').eq('client_id', clientId).maybeSingle(),
      supabase
        .from('messages')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: true }),
    ])

    if (clientResult.error) throw new Error(`getPortalSession (client): ${clientResult.error.message}`)
    if (!clientResult.data) throw new Error('Client not found for portal session')
    if (stateResult.error) throw new Error(`getPortalSession (state): ${stateResult.error.message}`)
    if (messagesResult.error) throw new Error(`getPortalSession (messages): ${messagesResult.error.message}`)

    const clientRow = clientResult.data as Record<string, unknown>
    const messages = (messagesResult.data ?? []).map((row) =>
      mapMessageRow(row as Record<string, unknown>),
    )

    const collectedData =
      stateResult.data
        ? ((stateResult.data as Record<string, unknown>)['collected_data'] as Record<string, unknown> | null) ?? {}
        : {}

    const snapshot = {
      businessModel: (collectedData['businessModel'] as string) ?? '',
      brandDirection: (collectedData['brandDirection'] as string) ?? '',
      targetAudience: (collectedData['targetAudience'] as string) ?? '',
      requiredIntegrations: (collectedData['requiredIntegrations'] as string[]) ?? [],
      pendingItems: (collectedData['pendingItems'] as string[]) ?? [],
    }

    const onboardingState = stateResult.data
      ? mapOnboardingStateRow(stateResult.data as Record<string, unknown>)
      : null

    return {
      session: {
        clientId: clientRow['id'] as string,
        contactName: (clientRow['contact_name'] as string) ?? '',
        companyName: (clientRow['company_name'] as string) ?? '',
        title: `${clientRow['company_name'] as string} onboarding session`,
        messages,
      },
      snapshot,
      onboardingState,
    }
  }

  async sendPortalMessage(request: ChatRequest): Promise<ChatResponse> {
    const { data, error } = await supabase.functions.invoke('chat-agent', {
      body: {
        clientId: request.clientId,
        message: request.message,
        provider: request.provider,
        requestId: request.requestId,
        sessionId: request.sessionId,
      },
    })

    if (error) throw new Error(`sendPortalMessage: ${error.message}`)

    // The Edge Function returns the raw DB message row — map it to ThreadMessage
    const rawMessage = data.message as Record<string, unknown>

    return {
      sessionId: data.sessionId as string,
      message: mapMessageRow(rawMessage),
      snapshotDelta: (data.snapshotDelta as Partial<OnboardingSnapshotDelta>) ?? {},
    }
  }

  async persistWidgetResponse(messageId: string, value: string | number): Promise<void> {
    const { error } = await supabase
      .from('messages')
      .update({ widget_response: String(value) })
      .eq('id', messageId)

    if (error) throw new Error(`persistWidgetResponse: ${error.message}`)
  }

  async getAdminDashboardSnapshot(): Promise<AdminDashboardSnapshot> {
    // TODO(phase-3): add server-side pagination — document_chunks can be very large at scale
    const [clientsWithStates, seedsResult, chunksResult] = await Promise.all([
      fetchClientsWithStates(),
      supabase.from('admin_data_seeds').select('*'),
      supabase
        .from('document_chunks')
        .select('id, seed_id, client_id, chunk_index, metadata, content, created_at'),
    ])

    if (seedsResult.error) throw new Error(`getAdminDashboardSnapshot (seeds): ${seedsResult.error.message}`)
    if (chunksResult.error) throw new Error(`getAdminDashboardSnapshot (chunks): ${chunksResult.error.message}`)

    const seeds = (seedsResult.data ?? []).map((row) => mapSeedRow(row as Record<string, unknown>))
    const chunks = (chunksResult.data ?? []).map((row) => mapChunkRow(row as Record<string, unknown>))

    const clientEntries = clientsWithStates.map(({ clientRow, stateRow }) =>
      buildClientFromRow(clientRow, stateRow),
    )

    const clients = clientEntries.map((e) => e.client)
    const mappedStates = clientEntries.map((e) => e.mappedState).filter((s): s is OnboardingState => s !== null)

    const ingestStates = seeds.map((seed) => buildIngestState(seed, chunks))

    const alerts = clients
      .flatMap((client, idx) => {
        const state = clientEntries[idx]?.mappedState ?? undefined
        const clientSeeds = seeds.filter((s) => s.clientId === client.id)
        return buildAlertsForClient(client, state, clientSeeds, chunks)
      })
      .sort((a, b) => {
        const severityDelta = severityPriority[a.severity] - severityPriority[b.severity]
        if (severityDelta !== 0) return severityDelta
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })

    const totalStates = mappedStates.length
    const averageCompletion =
      totalStates > 0
        ? Math.round(
            mappedStates.reduce((sum, state) => sum + getMilestoneCompletion(state), 0) / totalStates,
          )
        : 0

    return {
      generatedAt: new Date().toISOString(),
      totals: {
        clients: clients.length,
        active: clients.filter((c) => c.status === 'active').length,
        invited: clients.filter((c) => c.status === 'invited').length,
        blocked: clients.filter((c) => c.status === 'blocked').length,
      },
      completion: {
        average: averageCompletion,
        complete: mappedStates.filter((s) => s.status === 'complete').length,
        inProgress: mappedStates.filter((s) => s.status === 'active').length,
      },
      freshness: {
        stale: clients.filter((c) => getHoursSince(c.lastActivity) >= STALE_THRESHOLD_HOURS).length,
        thresholdHours: STALE_THRESHOLD_HOURS,
      },
      ingest: {
        healthy: ingestStates.filter((s) => s.status === 'ready').length,
        warning: ingestStates.filter((s) => s.status === 'warning').length,
        failed: ingestStates.filter((s) => s.status === 'failed').length,
        queued: ingestStates.filter((s) => s.status === 'queued').length,
      },
      alerts,
    }
  }

  async getAdminClientDetailBundle(clientId: string): Promise<AdminClientDetailBundle> {
    const [clientResult, stateResult, seedsResult, chunksResult, messagesResult, briefsResult] = await Promise.all([
      supabase.from('clients').select('*').eq('id', clientId).single(),
      supabase.from('onboarding_states').select('*').eq('client_id', clientId).maybeSingle(),
      supabase.from('admin_data_seeds').select('*').eq('client_id', clientId),
      supabase
        .from('document_chunks')
        .select('id, seed_id, client_id, chunk_index, metadata, content, created_at')
        .eq('client_id', clientId),
      supabase
        .from('messages')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: true }),
      supabase.from('briefs').select('*').eq('client_id', clientId).order('created_at'),
    ])

    if (clientResult.error) throw new Error(`getAdminClientDetailBundle (client): ${clientResult.error.message}`)
    if (stateResult.error) throw new Error(`getAdminClientDetailBundle (state): ${stateResult.error.message}`)
    if (seedsResult.error) throw new Error(`getAdminClientDetailBundle (seeds): ${seedsResult.error.message}`)
    if (chunksResult.error) throw new Error(`getAdminClientDetailBundle (chunks): ${chunksResult.error.message}`)
    if (messagesResult.error) throw new Error(`getAdminClientDetailBundle (messages): ${messagesResult.error.message}`)
    // briefs failure is non-fatal — admin dashboard degrades gracefully

    const clientRow = clientResult.data as Record<string, unknown>
    const stateRow = stateResult.data ? (stateResult.data as Record<string, unknown>) : null
    const { client, mappedState } = buildClientFromRow(clientRow, stateRow)

    const defaultState: OnboardingState = {
      id: `default_${clientId}`,
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
      lastActivity: new Date().toISOString(),
    }

    const onboardingState = mappedState ?? defaultState

    const seeds = (seedsResult.data ?? []).map((row) => mapSeedRow(row as Record<string, unknown>))
    const chunks = (chunksResult.data ?? []).map((row) => mapChunkRow(row as Record<string, unknown>))
    const messages = (messagesResult.data ?? []).map((row) =>
      mapMessageRow(row as Record<string, unknown>),
    )
    const briefs = (briefsResult.data ?? []).map((row) => mapBriefRow(row as Record<string, unknown>))

    return {
      client,
      onboardingState,
      seeds,
      ingestStates: seeds.map((seed) => buildIngestState(seed, chunks)),
      documentChunks: chunks,
      messages,
      briefs,
      alerts: buildAlertsForClient(client, onboardingState, seeds, chunks),
    }
  }

  async getAdminSeedRecords(clientId?: string): Promise<AdminSeedRecord[]> {
    let query = supabase.from('admin_data_seeds').select('*').order('created_at', { ascending: false })
    if (clientId) query = query.eq('client_id', clientId)

    const { data, error } = await query

    if (error) throw new Error(`getAdminSeedRecords: ${error.message}`)
    if (!data) return []

    return data.map((row) => mapSeedRow(row as Record<string, unknown>))
  }

  async getAdminIngestStates(clientId?: string): Promise<AdminIngestState[]> {
    const [seedsResult, chunksResult] = await Promise.all([
      (() => {
        let q = supabase.from('admin_data_seeds').select('*')
        if (clientId) q = q.eq('client_id', clientId)
        return q
      })(),
      (() => {
        let q = supabase
          .from('document_chunks')
          .select('id, seed_id, client_id, chunk_index, metadata, content, created_at')
        if (clientId) q = q.eq('client_id', clientId)
        return q
      })(),
    ])

    if (seedsResult.error) throw new Error(`getAdminIngestStates (seeds): ${seedsResult.error.message}`)
    if (chunksResult.error) throw new Error(`getAdminIngestStates (chunks): ${chunksResult.error.message}`)

    const seeds = (seedsResult.data ?? []).map((row) => mapSeedRow(row as Record<string, unknown>))
    const chunks = (chunksResult.data ?? []).map((row) => mapChunkRow(row as Record<string, unknown>))

    return seeds.map((seed) => buildIngestState(seed, chunks))
  }

  async getAdminAlerts(clientId?: string): Promise<AdminAlert[]> {
    if (clientId) {
      const [clientResult, stateResult, seedsResult, chunksResult] = await Promise.all([
        supabase.from('clients').select('*').eq('id', clientId).single(),
        supabase.from('onboarding_states').select('*').eq('client_id', clientId).maybeSingle(),
        supabase.from('admin_data_seeds').select('*').eq('client_id', clientId),
        supabase
          .from('document_chunks')
          .select('id, seed_id, client_id, chunk_index, metadata, content, created_at')
          .eq('client_id', clientId),
      ])

      if (clientResult.error) throw new Error(`getAdminAlerts (client): ${clientResult.error.message}`)
      if (stateResult.error) throw new Error(`getAdminAlerts (state): ${stateResult.error.message}`)
      if (seedsResult.error) throw new Error(`getAdminAlerts (seeds): ${seedsResult.error.message}`)
      if (chunksResult.error) throw new Error(`getAdminAlerts (chunks): ${chunksResult.error.message}`)

      const clientRow = clientResult.data as Record<string, unknown>
      const stateRow = stateResult.data ? (stateResult.data as Record<string, unknown>) : null
      const { client, mappedState } = buildClientFromRow(clientRow, stateRow)

      const seeds = (seedsResult.data ?? []).map((row) => mapSeedRow(row as Record<string, unknown>))
      const chunks = (chunksResult.data ?? []).map((row) => mapChunkRow(row as Record<string, unknown>))

      return buildAlertsForClient(client, mappedState ?? undefined, seeds, chunks)
    }

    // TODO(phase-3): add server-side pagination — unbounded query will degrade at scale
    const [clientsWithStates, seedsResult, chunksResult] = await Promise.all([
      fetchClientsWithStates(),
      supabase.from('admin_data_seeds').select('*'),
      supabase
        .from('document_chunks')
        .select('id, seed_id, client_id, chunk_index, metadata, content, created_at'),
    ])

    if (seedsResult.error) throw new Error(`getAdminAlerts (seeds): ${seedsResult.error.message}`)
    if (chunksResult.error) throw new Error(`getAdminAlerts (chunks): ${chunksResult.error.message}`)

    const seeds = (seedsResult.data ?? []).map((row) => mapSeedRow(row as Record<string, unknown>))
    const chunks = (chunksResult.data ?? []).map((row) => mapChunkRow(row as Record<string, unknown>))

    return clientsWithStates
      .flatMap(({ clientRow, stateRow }) => {
        const { client, mappedState } = buildClientFromRow(clientRow, stateRow)
        const clientSeeds = seeds.filter((s) => s.clientId === client.id)
        return buildAlertsForClient(client, mappedState ?? undefined, clientSeeds, chunks)
      })
      .sort((a, b) => {
        const severityDelta = severityPriority[a.severity] - severityPriority[b.severity]
        if (severityDelta !== 0) return severityDelta
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })
  }

  async uploadSeedFile(params: SeedFileUploadParams): Promise<AdminSeedRecord> {
    // Sanitize filename to prevent path traversal attacks
    const safeName = params.file.name
      .replace(/.*[\\/]/, '')            // strip any path separators
      .replace(/[^a-zA-Z0-9._-]/g, '_') // allow only safe characters
    const path = `${params.clientId}/${Date.now()}_${safeName}`

    const { error: uploadError } = await supabase.storage.from('raw-uploads').upload(path, params.file)
    if (uploadError) throw new Error(`Storage upload failed: ${uploadError.message}`)

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) throw new Error('uploadSeedFile: not authenticated')

    const { data: row, error: insertError } = await supabase
      .from('admin_data_seeds')
      .insert({
        client_id: params.clientId,
        title: params.title,
        source_type: params.sourceType,
        storage_path: path,
        ingest_status: 'queued',
        created_by: user?.id,
      })
      .select()
      .single()

    if (insertError) throw new Error(`Failed to create seed record: ${insertError.message}`)

    supabase.functions.invoke('process-seed', { body: { seedId: (row as Record<string, unknown>)['id'] } }).catch(() => undefined)

    return mapSeedRow(row as Record<string, unknown>)
  }

  async createNoteSeed(params: SeedNoteCreateParams): Promise<AdminSeedRecord> {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) throw new Error('createNoteSeed: not authenticated')

    const { data: row, error } = await supabase
      .from('admin_data_seeds')
      .insert({
        client_id: params.clientId,
        title: params.title,
        source_type: 'notes',
        raw_transcript: params.content,
        ingest_status: 'queued',
        created_by: user?.id,
      })
      .select()
      .single()

    if (error) throw new Error(`Failed to create note seed: ${error.message}`)

    supabase.functions.invoke('process-seed', { body: { seedId: (row as Record<string, unknown>)['id'] } }).catch(() => undefined)

    return mapSeedRow(row as Record<string, unknown>)
  }

  async deleteSeed(seedId: string): Promise<void> {
    // Fetch storage path before deletion so we can clean up the file
    const { data: seedRow } = await supabase
      .from('admin_data_seeds')
      .select('storage_path')
      .eq('id', seedId)
      .maybeSingle()

    const storagePath = (seedRow as Record<string, unknown> | null)?.['storage_path'] as string | null

    const { error } = await supabase.from('admin_data_seeds').delete().eq('id', seedId)
    if (error) throw new Error(`deleteSeed: ${error.message}`)

    // Best-effort storage cleanup (skip URLs — they aren't stored as files)
    if (storagePath && !storagePath.startsWith('http')) {
      await supabase.storage.from('raw-uploads').remove([storagePath])
    }
  }

  async getClientBriefs(clientId: string): Promise<OnboardingBrief[]> {
    const { data, error } = await supabase
      .from('briefs')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at')

    if (error) throw new Error(`getClientBriefs: ${error.message}`)
    return (data ?? []).map((row) => mapBriefRow(row as Record<string, unknown>))
  }

  async approveBrief(briefId: string): Promise<void> {
    const { error } = await supabase
      .from('briefs')
      .update({ status: 'client_approved', updated_at: new Date().toISOString() })
      .eq('id', briefId)

    if (error) throw new Error(`approveBrief: ${error.message}`)
  }

  async completeOnboarding(clientId: string): Promise<void> {
    const { error } = await supabase
      .from('onboarding_states')
      .update({
        phase: 'complete',
        status: 'complete',
        completed_at: new Date().toISOString(),
        last_activity: new Date().toISOString(),
      })
      .eq('client_id', clientId)

    if (error) throw new Error(`completeOnboarding: ${error.message}`)
  }

  async createUrlSeed(params: SeedUrlCreateParams): Promise<AdminSeedRecord> {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) throw new Error('createUrlSeed: not authenticated')

    const { data: row, error } = await supabase
      .from('admin_data_seeds')
      .insert({
        client_id: params.clientId,
        title: params.title,
        source_type: 'url',
        storage_path: params.url,
        ingest_status: 'queued',
        created_by: user?.id,
      })
      .select()
      .single()

    if (error) throw new Error(`Failed to create URL seed: ${error.message}`)

    supabase.functions.invoke('process-seed', { body: { seedId: (row as Record<string, unknown>)['id'] } }).catch(() => undefined)

    return mapSeedRow(row as Record<string, unknown>)
  }
}
