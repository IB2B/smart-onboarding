import { createClient } from 'jsr:@supabase/supabase-js@2'
import { embedQuery } from './lib/embeddings.ts'
import { retrieveRelevantChunks } from './lib/rag.ts'
import {
  buildConversationMessages,
  buildSystemPrompt,
  trimToTokenBudget,
} from './lib/context-builder.ts'
import { callLlm } from './lib/llm.ts'
import { executeTool, TOOL_DEFINITIONS } from './lib/tools.ts'
import type {
  ChatAgentRequest,
  ClientRow,
  LlmMessage,
  LlmToolCall,
  OnboardingStateRow,
  SeedSummary,
} from './lib/types.ts'

// ---------------------------------------------------------------------------
// CORS
// ---------------------------------------------------------------------------

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  })
}

// ---------------------------------------------------------------------------
// Defaults for graceful degradation
// ---------------------------------------------------------------------------

function defaultStateFor(clientId: string): OnboardingStateRow {
  return {
    id: '',
    client_id: clientId,
    phase: 'welcome',
    // Pre-populate all milestone keys so progress calculation always divides by 4
    milestones: {
      brand_identity: { status: 'pending', data: {} },
      technical_needs: { status: 'pending', data: {} },
      target_audience: { status: 'pending', data: {} },
      timeline_budget: { status: 'pending', data: {} },
    },
    collected_data: {},
    status: 'active',
    last_activity: new Date().toISOString(),
  }
}

function defaultClientFor(clientId: string): ClientRow {
  return {
    id: clientId,
    company_name: 'Your Company',
    contact_name: 'there',
    contact_email: '',
  }
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

Deno.serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  // Only accept POST
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  // Verify the caller is an authenticated user by validating their JWT
  // (--no-verify-jwt disables gateway check; we verify properly here instead)
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return json({ error: 'Unauthorized' }, 401)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  // Validate JWT against Auth server using the caller's token
  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  })
  const {
    data: { user },
    error: authError,
  } = await callerClient.auth.getUser()
  if (authError || !user) {
    return json({ error: 'Unauthorized' }, 401)
  }

  // Parse and validate request body
  let body: ChatAgentRequest
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }

  const { clientId, message, provider, requestId, sessionId } = body

  if (!clientId || typeof clientId !== 'string') {
    return json({ error: 'Missing required field: clientId' }, 400)
  }
  if (!message || typeof message !== 'string') {
    return json({ error: 'Missing required field: message' }, 400)
  }
  // Normalise provider — fall back to 'openai' if unrecognised or OpenRouter key absent
  const resolvedProvider: 'openai' | 'openrouter' =
    provider === 'openrouter' && Deno.env.get('OPENROUTER_API_KEY')
      ? 'openrouter'
      : 'openai'
  if (!requestId || typeof requestId !== 'string') {
    return json({ error: 'Missing required field: requestId' }, 400)
  }
  if (!sessionId || typeof sessionId !== 'string') {
    return json({ error: 'Missing required field: sessionId' }, 400)
  }

  // Build Supabase admin client using the service role key
  const supabase = createClient(supabaseUrl, serviceRoleKey)

  try {
    // -----------------------------------------------------------------------
    // 1. Insert user message
    // -----------------------------------------------------------------------
    const { error: insertUserMsgError } = await supabase.from('messages').insert({
      client_id: clientId,
      role: 'user',
      content: message,
    })

    if (insertUserMsgError) {
      throw new Error(`Failed to insert user message: ${insertUserMsgError.message}`)
    }

    // -----------------------------------------------------------------------
    // 2. Embed user query for RAG
    // -----------------------------------------------------------------------
    const queryEmbedding = await embedQuery(message)

    // -----------------------------------------------------------------------
    // 3. Retrieve RAG chunks
    // -----------------------------------------------------------------------
    const ragChunks = await retrieveRelevantChunks(supabase, queryEmbedding, clientId)

    // -----------------------------------------------------------------------
    // 4. Load last 20 messages
    // -----------------------------------------------------------------------
    const { data: historyRows, error: historyError } = await supabase
      .from('messages')
      .select('role, content, tool_calls')
      .eq('client_id', clientId)
      .order('created_at', { ascending: true })
      .limit(20)

    if (historyError) {
      throw new Error(`Failed to load message history: ${historyError.message}`)
    }

    const history = (historyRows ?? []) as Array<{
      role: string
      content: string
      tool_calls?: unknown
    }>

    // -----------------------------------------------------------------------
    // 5. Load onboarding state
    // -----------------------------------------------------------------------
    const { data: stateRow } = await supabase
      .from('onboarding_states')
      .select('id, client_id, phase, milestones, collected_data, status, last_activity')
      .eq('client_id', clientId)
      .single<OnboardingStateRow>()

    const onboardingState: OnboardingStateRow = stateRow ?? defaultStateFor(clientId)

    // Auto-create onboarding_states row on first interaction so client status
    // transitions from 'invited' → 'active' in the admin dashboard
    if (!stateRow) {
      const { error: upsertError } = await supabase.from('onboarding_states').insert({
        client_id: clientId,
        phase: 'welcome',
        status: 'active',
        // Pre-populate all keys so progress is always out of 4 from day one
        milestones: {
          brand_identity: { status: 'pending', data: {} },
          technical_needs: { status: 'pending', data: {} },
          target_audience: { status: 'pending', data: {} },
          timeline_budget: { status: 'pending', data: {} },
        },
        collected_data: {},
        last_activity: new Date().toISOString(),
      })
      if (upsertError) {
        console.warn('Auto-create onboarding_states failed (non-fatal):', upsertError.message)
      }
    }

    // -----------------------------------------------------------------------
    // 6. Load client info
    // -----------------------------------------------------------------------
    const { data: clientRow } = await supabase
      .from('clients')
      .select('id, company_name, contact_name, contact_email')
      .eq('id', clientId)
      .single<ClientRow>()

    const client: ClientRow = clientRow ?? defaultClientFor(clientId)

    // -----------------------------------------------------------------------
    // 7. Load seed summaries
    // -----------------------------------------------------------------------
    const { data: seedRows } = await supabase
      .from('admin_data_seeds')
      .select('title, processed_summary')
      .eq('client_id', clientId)
      .eq('ingest_status', 'ready')

    const seedSummaries: SeedSummary[] = (seedRows ?? []).map(
      (row: { title: string; processed_summary: string | null }) => ({
        title: row.title,
        summary: row.processed_summary ?? '',
      }),
    )

    // -----------------------------------------------------------------------
    // 8. Build prompt and conversation messages
    // -----------------------------------------------------------------------
    const systemPrompt = buildSystemPrompt({
      client,
      state: onboardingState,
      seedSummaries,
      ragChunks,
    })

    const conversationMessages = buildConversationMessages(history, systemPrompt, message)
    const trimmedMessages = trimToTokenBudget(conversationMessages, 6000)

    // -----------------------------------------------------------------------
    // 9. Tool call loop (max 3 iterations)
    // -----------------------------------------------------------------------
    let llmMessages: LlmMessage[] = trimmedMessages
    let widgetPayload: unknown = undefined
    let snapshotDelta: Record<string, unknown> = {}
    let accumulatedToolCalls: LlmToolCall[] = []
    let llmResponse = await callLlm({
      messages: llmMessages,
      tools: TOOL_DEFINITIONS,
      provider: resolvedProvider,
      maxTokens: 1024,
    })

    // Track milestones in memory so tool calls in the same loop see updates
    let currentMilestones = { ...onboardingState.milestones }

    const MAX_TOOL_ITERATIONS = 3

    for (let iteration = 0; iteration < MAX_TOOL_ITERATIONS; iteration++) {
      if (llmResponse.finishReason !== 'tool_calls' || !llmResponse.toolCalls?.length) {
        break
      }

      const toolCalls = llmResponse.toolCalls

      // Append assistant message with tool_calls to the messages array
      llmMessages = [
        ...llmMessages,
        {
          role: 'assistant',
          content: llmResponse.content,
          tool_calls: toolCalls,
        },
      ]

      // Execute each tool and collect results
      const toolResultMessages: LlmMessage[] = []

      for (const toolCall of toolCalls) {
        accumulatedToolCalls = [...accumulatedToolCalls, toolCall]

        const toolResult = await executeTool(supabase, clientId, toolCall, currentMilestones)

        // Capture first widget payload
        if (toolResult.widgetPayload !== undefined && widgetPayload === undefined) {
          widgetPayload = toolResult.widgetPayload
        }

        // Merge snapshot delta
        if (toolResult.snapshotDelta) {
          snapshotDelta = { ...snapshotDelta, ...toolResult.snapshotDelta }
        }

        // Update in-memory milestones if mark_milestone was called
        if (toolCall.function.name === 'mark_milestone') {
          let args: Record<string, unknown>
          try {
            args = JSON.parse(toolCall.function.arguments) as Record<string, unknown>
          } catch {
            args = {}
          }
          const milestone = args['milestone'] as string | undefined
          if (milestone) {
            currentMilestones = {
              ...currentMilestones,
              [milestone]: {
                status: 'complete',
                data: { ...currentMilestones[milestone]?.data },
              },
            }
          }
        }

        toolResultMessages.push({
          role: 'tool',
          content: toolResult.result,
          tool_call_id: toolResult.toolCallId,
        })
      }

      // Append all tool result messages
      llmMessages = [...llmMessages, ...toolResultMessages]

      // Continue loop — only call LLM again if we haven't hit max iterations
      if (iteration < MAX_TOOL_ITERATIONS - 1) {
        llmResponse = await callLlm({
          messages: llmMessages,
          tools: TOOL_DEFINITIONS,
          provider: resolvedProvider, // must use resolved provider, not raw request value
          maxTokens: 1024,
        })
      }
    }

    // -----------------------------------------------------------------------
    // 10. Insert assistant message
    // -----------------------------------------------------------------------
    const { data: assistantRow, error: insertAssistantError } = await supabase
      .from('messages')
      .insert({
        client_id: clientId,
        role: 'assistant',
        content: llmResponse.content ?? '',
        widget_payload: widgetPayload ?? null,
        tool_calls: accumulatedToolCalls.length > 0 ? accumulatedToolCalls : null,
      })
      .select()
      .single()

    if (insertAssistantError) {
      throw new Error(`Failed to insert assistant message: ${insertAssistantError.message}`)
    }

    // -----------------------------------------------------------------------
    // 11. Update last_activity on onboarding_states
    // -----------------------------------------------------------------------
    await supabase
      .from('onboarding_states')
      .update({ last_activity: new Date().toISOString() })
      .eq('client_id', clientId)

    // -----------------------------------------------------------------------
    // 12. Return response
    // -----------------------------------------------------------------------
    return json({
      sessionId,
      message: assistantRow as Record<string, unknown>,
      snapshotDelta,
    })
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    console.error('chat-agent error:', errorMessage)
    return json({ error: errorMessage }, 500)
  }
})
