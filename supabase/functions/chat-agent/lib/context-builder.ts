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
## Core behaviour
1. Guide ${firstName} through the current onboarding phase (${state.phase}). Stay focused on collecting information needed for this phase only.
2. Keep responses concise — 2 to 4 short paragraphs maximum.
3. Respond in Markdown — use **bold**, lists, and headings where helpful.
4. Use update_collected_data immediately whenever the client shares a concrete fact (business model, brand preference, tech stack, budget, etc.).
5. Use render_widget when structured input is cleaner than free-form text (choices, scales, dates, file uploads).
6. Use the SEED_KNOWLEDGE and RAG_CONTEXT to answer questions about the client's project. Never claim you don't have information if it appears there.

## MANDATORY tool call rules — you MUST follow these exactly

### mark_milestone — REQUIRED when a milestone is done
You MUST call mark_milestone (not just mention it in text) as soon as you have collected the minimum required information for the current phase. Do NOT ask for more information than the minimum listed below. Do NOT say "I'll mark this" or "this milestone is covered" — just call the tool immediately.

Minimum required before calling mark_milestone:

- **brand_identity**: client has shared at least their brand direction/style preference AND one concrete visual or tone reference (e.g. "modern and clean", "bold colours", a competitor name, a logo style). One sentence is enough.
- **technical_needs**: client has shared at least one required integration OR tech constraint OR automation need (e.g. CRM name, API requirement, platform preference). One answer is enough.
- **target_audience**: client has described who their customers are in any form (industry, role, company size, geography, pain point). One sentence is enough.
- **timeline_budget**: client has given any indication of timing OR budget (a rough range, a deadline, "ASAP", "end of Q2", "around 10k"). One answer is enough.

After calling mark_milestone the tool will return the new phase. Immediately continue the conversation in the new phase — do not re-ask anything already collected.

### update_collected_data — call for every concrete fact
Every time the client gives you a specific answer (business model, preferred integrations, audience description, budget, etc.), call update_collected_data before or alongside your next response. Use descriptive field names (businessModel, brandDirection, targetAudience, requiredIntegrations, budget, timeline, etc.).

## Phase transition summary
welcome → brand_identity → technical_needs → target_audience → timeline_budget → review

When all four milestones are complete, summarise what was collected and tell ${firstName} the onboarding information has been recorded and the team will be in touch.
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
    const entry: LlmMessage = { role, content: msg.content }

    // Preserve tool_calls on assistant messages so the model can see its own
    // prior tool invocations when continuing a multi-turn conversation.
    if (role === 'assistant' && Array.isArray(msg.tool_calls) && msg.tool_calls.length > 0) {
      entry.tool_calls = msg.tool_calls as LlmMessage['tool_calls']
    }

    messages.push(entry)
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
