import { createClient } from 'jsr:@supabase/supabase-js@2'

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
// LLM call
// ---------------------------------------------------------------------------

async function callLlm(prompt: string): Promise<string> {
  const openaiKey = Deno.env.get('OPENAI_API_KEY')
  const openrouterKey = Deno.env.get('OPENROUTER_API_KEY')

  const useOpenRouter = !!openrouterKey
  const url = useOpenRouter
    ? 'https://openrouter.ai/api/v1/chat/completions'
    : 'https://api.openai.com/v1/chat/completions'
  const apiKey = useOpenRouter ? openrouterKey : openaiKey

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: useOpenRouter ? 'openai/gpt-4o' : 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2048,
      temperature: 0.4,
    }),
  })

  if (!res.ok) {
    throw new Error(`LLM request failed: ${res.status} ${await res.text()}`)
  }

  const data = await res.json() as { choices: Array<{ message: { content: string } }> }
  return data.choices[0]?.message?.content ?? ''
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, serviceRoleKey)

  let body: { clientId?: string }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }

  const { clientId } = body
  if (!clientId || typeof clientId !== 'string') {
    return json({ error: 'Missing required field: clientId' }, 400)
  }

  // Initialise brief rows as 'generating' so the client can show a loading state
  const briefInserts = [
    { client_id: clientId, brief_type: 'technical', status: 'generating', content: '' },
    { client_id: clientId, brief_type: 'non_technical', status: 'generating', content: '' },
  ]

  const { data: insertedBriefs, error: insertError } = await supabase
    .from('briefs')
    .upsert(briefInserts, { onConflict: 'client_id,brief_type' })
    .select()

  if (insertError) {
    console.error('generate-brief insert error:', insertError.message)
    return json({ error: insertError.message }, 500)
  }

  const technicalId = (insertedBriefs ?? []).find(
    (b: Record<string, unknown>) => b['brief_type'] === 'technical',
  )?.['id'] as string | undefined

  const nonTechnicalId = (insertedBriefs ?? []).find(
    (b: Record<string, unknown>) => b['brief_type'] === 'non_technical',
  )?.['id'] as string | undefined

  try {
    // Load onboarding context
    const [stateResult, clientResult, seedsResult] = await Promise.all([
      supabase.from('onboarding_states').select('*').eq('client_id', clientId).single(),
      supabase.from('clients').select('company_name, contact_name').eq('id', clientId).single(),
      supabase
        .from('admin_data_seeds')
        .select('title, processed_summary')
        .eq('client_id', clientId)
        .eq('ingest_status', 'ready'),
    ])

    const collectedData = (
      stateResult.data as Record<string, unknown> | null
    )?.['collected_data'] as Record<string, unknown> ?? {}

    const milestones = (
      stateResult.data as Record<string, unknown> | null
    )?.['milestones'] as Record<string, unknown> ?? {}

    const company = (clientResult.data as { company_name: string } | null)?.company_name ?? 'the client'
    const contact = (clientResult.data as { contact_name: string } | null)?.contact_name ?? ''

    const seedContext = (seedsResult.data ?? [])
      .filter((s: Record<string, unknown>) => s['processed_summary'])
      .map((s: Record<string, unknown>) => `### ${s['title'] as string}\n${s['processed_summary'] as string}`)
      .join('\n\n')

    const milestoneText = Object.entries(milestones)
      .map(([key, val]) => {
        const v = val as { status: string; data: Record<string, unknown> }
        const summary = v.data?.['summary'] as string | undefined
        return `- ${key.replace(/_/g, ' ')}: ${v.status}${summary ? ` — ${summary}` : ''}`
      })
      .join('\n')

    const dataText = Object.entries(collectedData)
      .map(([k, v]) => `- ${k}: ${JSON.stringify(v)}`)
      .join('\n')

    const contextBlock = `
Company: ${company}
Contact: ${contact}

Milestones:
${milestoneText}

Collected Data:
${dataText}

${seedContext ? `Uploaded Documents:\n${seedContext}` : ''}
    `.trim()

    const prompt = `You are a professional onboarding consultant. Based on the following client onboarding information, generate two structured briefs in valid JSON.

CONTEXT:
${contextBlock}

Return ONLY a JSON object with exactly this shape (no markdown, no explanation, raw JSON only):
{
  "technical": "<detailed technical brief in markdown>",
  "non_technical": "<plain-language client-friendly summary in markdown>"
}

Technical brief should include sections:
# Technical Onboarding Brief — ${company}
## Business Overview
## Brand & Identity Requirements
## Technical Integrations & Stack
## Target Audience
## Timeline & Budget
## Success Metrics
## Recommended Next Steps

Non-technical brief should include sections:
# Your Onboarding Summary — ${company}
## About Your Project
## What We Captured
## What Happens Next
## Your Team Contact`

    const rawResponse = await callLlm(prompt)

    // Extract JSON from response (handle potential markdown code fences)
    const jsonMatch = rawResponse.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('LLM did not return valid JSON')

    const parsed = JSON.parse(jsonMatch[0]) as { technical?: string; non_technical?: string }

    const technicalContent = parsed.technical ?? ''
    const nonTechnicalContent = parsed.non_technical ?? ''

    // Update both briefs with generated content
    const now = new Date().toISOString()

    if (technicalId) {
      await supabase
        .from('briefs')
        .update({ content: technicalContent, status: 'ready', updated_at: now })
        .eq('id', technicalId)
    }

    if (nonTechnicalId) {
      await supabase
        .from('briefs')
        .update({ content: nonTechnicalContent, status: 'ready', updated_at: now })
        .eq('id', nonTechnicalId)
    }

    return json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('generate-brief error:', message)

    // On failure, mark briefs as 'ready' with a fallback so 'generating' state doesn't persist
    const fallback = `# Brief generation failed\n\nThere was an issue generating this brief automatically. Please contact support or prepare the brief manually.\n\n**Error:** ${message}`
    const now = new Date().toISOString()

    if (technicalId) {
      await supabase
        .from('briefs')
        .update({ content: fallback, status: 'ready', updated_at: now })
        .eq('id', technicalId)
    }

    if (nonTechnicalId) {
      await supabase
        .from('briefs')
        .update({ content: fallback, status: 'ready', updated_at: now })
        .eq('id', nonTechnicalId)
    }

    return json({ error: message }, 500)
  }
})
