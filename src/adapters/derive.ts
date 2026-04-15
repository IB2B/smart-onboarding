import type {
  AdminAlert,
  AdminDocumentChunkRecord,
  AdminIngestState,
  AdminSeedRecord,
  ClientSummary,
  IngestStatus,
  OnboardingState,
} from '@/contracts/api'

export const STALE_THRESHOLD_HOURS = 48

export const milestoneCompletionWeight: Record<string, number> = {
  pending: 0,
  in_progress: 0.5,
  complete: 1,
  blocked: 0.25,
}

export const severityPriority: Record<AdminAlert['severity'], number> = {
  critical: 0,
  warning: 1,
  info: 2,
}

export function getHoursSince(timestamp: string): number {
  const parsed = new Date(timestamp).getTime()
  if (!Number.isNaN(parsed)) {
    return (Date.now() - parsed) / 3_600_000
  }

  const normalized = timestamp.trim().toLowerCase()
  const hourMatch = normalized.match(/^(\d+)\s*h(?:ours?)?\s*ago$/)
  if (hourMatch) return Number(hourMatch[1] ?? 0)
  const dayMatch = normalized.match(/^(\d+)\s*d(?:ays?)?\s*ago$/)
  if (dayMatch) return Number(dayMatch[1] ?? 0) * 24
  return Number.POSITIVE_INFINITY
}

// Fixed 4-milestone denominator — prevents "100%" when only one milestone
// key happens to be present in the DB object.
const MILESTONE_KEYS = [
  'brand_identity',
  'technical_needs',
  'target_audience',
  'timeline_budget',
] as const

export function getMilestoneCompletion(state: OnboardingState): number {
  const total = MILESTONE_KEYS.reduce((sum, key) => {
    const milestone = state.milestones[key]
    const weight = milestoneCompletionWeight[milestone?.status ?? 'pending'] ?? 0
    return sum + weight
  }, 0)
  return Math.round((total / MILESTONE_KEYS.length) * 100)
}

export function deriveIngestStatus(
  seed: AdminSeedRecord,
  chunks: AdminDocumentChunkRecord[],
): IngestStatus {
  if (seed.ingestStatus !== undefined) return seed.ingestStatus
  const chunkCount = chunks.length
  if (seed.processedSummary && chunkCount > 0) return 'ready'
  if (seed.rawTranscript && chunkCount > 0) return 'processing'
  if (seed.sourceType === 'url' && !seed.rawTranscript && !seed.processedSummary) return 'queued'
  return seed.processedSummary ? 'warning' : 'processing'
}

export function deriveIngestProgress(status: IngestStatus, chunkCount: number): number {
  if (status === 'ready') return 100
  if (status === 'processing') return Math.min(88, 45 + chunkCount * 12)
  if (status === 'queued') return 15
  if (status === 'warning') return 65
  return 0
}

export function buildIngestState(
  seed: AdminSeedRecord,
  chunks: AdminDocumentChunkRecord[],
): AdminIngestState {
  const seedChunks = chunks.filter((chunk) => chunk.seedId === seed.id)
  const status = deriveIngestStatus(seed, seedChunks)
  return {
    id: `ingest_${seed.id}`,
    clientId: seed.clientId,
    seedId: seed.id,
    status,
    progress: deriveIngestProgress(status, seedChunks.length),
    chunkCount: seedChunks.length,
    note:
      status === 'ready' ? 'Summary ready for replay'
      : status === 'processing' ? 'Chunking in progress'
      : status === 'queued' ? 'Waiting for ingestion'
      : 'Needs review before use',
    updatedAt: seed.createdAt,
  }
}

export function buildAlertsForClient(
  client: ClientSummary,
  state: OnboardingState | undefined,
  seeds: AdminSeedRecord[],
  chunks: AdminDocumentChunkRecord[],
): AdminAlert[] {
  const alerts: AdminAlert[] = []

  if (client.status === 'blocked') {
    alerts.push({
      id: `alert_${client.id}_blocked`,
      clientId: client.id,
      severity: 'critical',
      status: 'open',
      category: 'ops',
      title: `${client.company} is blocked`,
      description: 'Admin intervention is required before the next onboarding step can continue.',
      createdAt: client.lastActivity,
    })
  }

  if (getHoursSince(client.lastActivity) >= STALE_THRESHOLD_HOURS) {
    alerts.push({
      id: `alert_${client.id}_stale`,
      clientId: client.id,
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
      id: `alert_${client.id}_welcome`,
      clientId: client.id,
      severity: 'info',
      status: 'open',
      category: 'milestone',
      title: `${client.company} still needs first response`,
      description: 'The onboarding flow has not moved beyond the welcome phase.',
      createdAt: state.lastActivity,
    })
  }

  for (const seed of seeds) {
    const ingest = buildIngestState(seed, chunks)
    if (ingest.status === 'warning') {
      alerts.push({
        id: `alert_${seed.id}_warning`,
        clientId: client.id,
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
        clientId: client.id,
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
