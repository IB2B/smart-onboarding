import type {
  AdminDocumentChunkRecord,
  AdminSeedRecord,
  BriefStatus,
  BriefType,
  ClientSummary,
  IngestStatus,
  MilestoneMap,
  OnboardingBrief,
  OnboardingPhase,
  OnboardingState,
  OnboardingStatus,
  SeedSourceType,
  ThreadMessage,
  ToolCallRecord,
  WidgetPayload,
} from '@/contracts/api'

export function mapClientRow(
  row: Record<string, unknown>,
  options: {
    status: 'invited' | 'active' | 'blocked'
    phase: OnboardingPhase
    progress: number
    lastActivity: string
  },
): ClientSummary {
  return {
    id: row['id'] as string,
    company: row['company_name'] as string,
    contactName: row['contact_name'] as string,
    email: row['contact_email'] as string,
    status: options.status,
    phase: options.phase,
    progress: options.progress,
    lastActivity: options.lastActivity,
  }
}

export function mapOnboardingStateRow(row: Record<string, unknown>): OnboardingState {
  return {
    id: row['id'] as string,
    clientId: row['client_id'] as string,
    phase: row['phase'] as OnboardingPhase,
    milestones: row['milestones'] as MilestoneMap,
    collectedData: row['collected_data'] as Record<string, unknown>,
    status: row['status'] as OnboardingStatus,
    lastActivity: row['last_activity'] as string,
    completedAt: (row['completed_at'] as string | null) ?? undefined,
  }
}

export function mapSeedRow(row: Record<string, unknown>): AdminSeedRecord {
  return {
    id: row['id'] as string,
    clientId: row['client_id'] as string,
    title: row['title'] as string,
    sourceType: row['source_type'] as SeedSourceType,
    storagePath: (row['storage_path'] as string | null) ?? undefined,
    rawTranscript: (row['raw_transcript'] as string | null) ?? undefined,
    processedSummary: (row['processed_summary'] as string | null) ?? undefined,
    ingestStatus: (row['ingest_status'] as IngestStatus | null) ?? undefined,
    errorMessage: (row['error_message'] as string | null) ?? undefined,
    createdBy: (row['created_by'] as string | null) ?? undefined,
    createdAt: row['created_at'] as string,
  }
}

export function mapChunkRow(row: Record<string, unknown>): AdminDocumentChunkRecord {
  return {
    id: row['id'] as string,
    seedId: row['seed_id'] as string,
    clientId: row['client_id'] as string,
    content: row['content'] as string,
    chunkIndex: Number(row['chunk_index']),
    metadata: (row['metadata'] as Record<string, unknown> | null) ?? {},
    createdAt: row['created_at'] as string,
  }
}

const roleMap: Record<string, ThreadMessage['role']> = {
  user: 'client',
  client: 'client',
  assistant: 'assistant',
  operator: 'operator',
}

export function mapBriefRow(row: Record<string, unknown>): OnboardingBrief {
  return {
    id: row['id'] as string,
    clientId: row['client_id'] as string,
    briefType: row['brief_type'] as BriefType,
    content: (row['content'] as string) ?? '',
    status: row['status'] as BriefStatus,
    createdAt: row['created_at'] as string,
    updatedAt: row['updated_at'] as string,
  }
}

export function mapMessageRow(row: Record<string, unknown>): ThreadMessage {
  const rawRole = row['role'] as string
  const role = roleMap[rawRole] ?? 'client'

  return {
    id: row['id'] as string,
    role,
    content: row['content'] as string,
    createdAt: row['created_at'] as string,
    widget_payload: (row['widget_payload'] as WidgetPayload | null) ?? undefined,
    widget_response: (row['widget_response'] as string | number | null) ?? undefined,
    tool_calls: (row['tool_calls'] as ToolCallRecord[] | null) ?? undefined,
  }
}
