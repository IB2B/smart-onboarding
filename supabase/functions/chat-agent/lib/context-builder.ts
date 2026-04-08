import type { LlmMessage, OnboardingStateRow, RagChunk, SeedSummary, ClientRow } from './types.ts'

const MILESTONE_ORDER = ['brand_identity', 'technical_needs', 'target_audience', 'timeline_budget'] as const

function formatMilestones(milestones: OnboardingStateRow['milestones']): string {
  return MILESTONE_ORDER.map((key) => {
    const m = milestones[key]
    const status = m?.status ?? 'pending'
    return `  - ${key}: ${status}`
  }).join('\n')
}

function formatCollectedData(data: Record<string, unknown>): string {
  if (Object.keys(data).length === 0) return '  (none yet)'
  return Object.entries(data)
    .map(([k, v]) => `  ${k}: ${JSON.stringify(v)}`)
    .join('\n')
}

function formatSeedSummaries(summaries: SeedSummary[]): string {
  if (summaries.length === 0) return '  (no documents uploaded yet)'
  return summaries
    .map((s) => `Source: ${s.title}\n${s.summary}`)
    .join('\n\n')
}

function formatRagChunks(chunks: RagChunk[]): string {
  if (chunks.length === 0) return '  (no relevant excerpts found)'
  return chunks
    .map((c) => `---\n${c.content}\n(relevance: ${(c.similarity * 100).toFixed(0)}%)`)
    .join('\n\n')
}

export function buildSystemPrompt(params: {
  client: ClientRow
  state: OnboardingStateRow
  seedSummaries: SeedSummary[]
  ragChunks: RagChunk[]
}): string {
  const { client, state, seedSummaries, ragChunks } = params
  const firstName = client.contact_name.split(' ')[0] ?? client.contact_name

  return `<ROLE>
You are an onboarding concierge for ${client.company_name}. Your role is to guide ${firstName} through a structured onboarding process, collecting information about their business, brand direction, technical needs, target audience, and timeline/budget. You are warm, professional, and proactive. Always use the client's first name (${firstName}).
</ROLE>

<CLIENT_CONTEXT>
Company: ${client.company_name}
Contact: ${client.contact_name} (${client.contact_email})
</CLIENT_CONTEXT>

<ONBOARDING_STATE>
Current phase: ${state.phase}
Milestones:
${formatMilestones(state.milestones)}
Collected data so far:
${formatCollectedData(state.collected_data)}
</ONBOARDING_STATE>

<SEED_KNOWLEDGE>
${formatSeedSummaries(seedSummaries)}
</SEED_KNOWLEDGE>

<RAG_CONTEXT>
The following excerpts from uploaded documents may be relevant to the current conversation:
${formatRagChunks(ragChunks)}
</RAG_CONTEXT>

<INSTRUCTIONS>
1. Guide ${firstName} through the current onboarding phase (${state.phase}). Stay focused on collecting information needed for this phase.
2. When you have gathered sufficient information for a milestone, call mark_milestone to record progress and advance to the next phase.
3. Use render_widget when a structured input widget would be clearer than free-form text (e.g., multiple-choice options, rating scales, date pickers).
4. Use update_collected_data to persist specific structured facts the client shares (e.g., their business model, brand direction, preferred tech stack).
5. You have access to uploaded knowledge about this client in the SEED_KNOWLEDGE and RAG_CONTEXT sections above. Always use this information to answer questions about their project, website, brand, goals, integrations, or any details they have shared. Never say you don't have information if it appears in either of those sections.
6. Do not fabricate information about the client's project that is not present in the context. If a question is genuinely not covered, say so briefly and ask the client to share that detail.
7. Keep responses concise — 2 to 4 short paragraphs maximum. Avoid lengthy bullet lists unless presenting clear options.
8. When all four milestones are marked complete, transition the conversation naturally to the review phase.
9. Respond in Markdown format — use bold, lists, and headings where appropriate to improve readability.
</INSTRUCTIONS>`
}

export function buildConversationMessages(
  history: Array<{ role: string; content: string; tool_calls?: unknown; tool_call_id?: string }>,
  systemPrompt: string,
  currentMessage: string,
): LlmMessage[] {
  const messages: LlmMessage[] = [{ role: 'system', content: systemPrompt }]

  // Map DB role names to LLM role names
  const roleMap: Record<string, LlmMessage['role']> = {
    client: 'user',
    user: 'user',
    assistant: 'assistant',
    operator: 'assistant',
    tool: 'tool',
    system: 'system',
  }

  for (const msg of history) {
    const role = roleMap[msg.role] ?? 'user'
    messages.push({
      role,
      content: msg.content,
    })
  }

  messages.push({ role: 'user', content: currentMessage })
  return messages
}

// Rough token estimator: ~4 chars per token
export function estimateTokens(messages: LlmMessage[]): number {
  return messages.reduce((sum, m) => sum + Math.ceil((m.content?.length ?? 0) / 4), 0)
}

export function trimToTokenBudget(
  messages: LlmMessage[],
  budget: number,
): LlmMessage[] {
  if (estimateTokens(messages) <= budget) return messages

  // Always keep system (index 0) and last user message
  const system = messages[0]!
  const last = messages[messages.length - 1]!
  const middle = messages.slice(1, -1)

  // Drop oldest history messages until under budget
  while (middle.length > 0 && estimateTokens([system, ...middle, last]) > budget) {
    middle.shift()
  }

  return [system, ...middle, last]
}
