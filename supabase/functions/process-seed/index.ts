import { createClient } from 'jsr:@supabase/supabase-js@2'
import { transcribeAudio } from './handlers/audio.ts'
import { extractDocument } from './handlers/document.ts'
import { extractUrl } from './handlers/url.ts'
import { chunkText } from './lib/chunker.ts'
import { generateSummary } from './lib/summarize.ts'
import { generateEmbeddings } from './lib/embeddings.ts'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RequestBody {
  seedId: string
}

interface DataSeed {
  id: string
  client_id: string
  source_type: 'audio' | 'document' | 'url' | 'notes'
  raw_transcript: string | null
  storage_path: string | null
}

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
  const { data: { user }, error: authError } = await callerClient.auth.getUser()
  if (authError || !user) {
    return json({ error: 'Unauthorized' }, 401)
  }

  // Parse and validate request body
  let body: RequestBody
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }

  if (!body.seedId || typeof body.seedId !== 'string') {
    return json({ error: 'Missing required field: seedId' }, 400)
  }

  const { seedId } = body

  // Build Supabase admin client using the service role key
  const supabase = createClient(supabaseUrl, serviceRoleKey)

  // Fetch the seed row
  const { data: seed, error: fetchError } = await supabase
    .from('admin_data_seeds')
    .select('id, client_id, source_type, raw_transcript, storage_path')
    .eq('id', seedId)
    .single<DataSeed>()

  if (fetchError || !seed) {
    return json({ error: fetchError?.message ?? 'Seed not found' }, 400)
  }

  // Atomic check-and-set: only proceed if still 'queued' — prevents double-processing
  const { data: claimed, error: claimError } = await supabase
    .from('admin_data_seeds')
    .update({ ingest_status: 'processing' })
    .eq('id', seedId)
    .eq('ingest_status', 'queued')
    .select('id')

  if (claimError) {
    console.error('claim error:', claimError.message)
    return json({ error: `Failed to claim seed: ${claimError.message}` }, 500)
  }

  if (!claimed || claimed.length === 0) {
    return json({ success: true, skipped: true })
  }

  try {
    // -------------------------------------------------------------------
    // 1. Extract raw text based on source type
    // -------------------------------------------------------------------
    let rawText: string

    switch (seed.source_type) {
      case 'audio':
        rawText = await transcribeAudio(supabase, seed.storage_path ?? '')
        break

      case 'document':
        rawText = await extractDocument(supabase, seed.storage_path ?? '')
        break

      case 'url':
        rawText = await extractUrl(seed.storage_path ?? '')
        break

      case 'notes':
        // Notes are stored directly — no external call required
        if (!seed.raw_transcript) {
          throw new Error('Notes seed has no raw_transcript content')
        }
        rawText = seed.raw_transcript
        break

      default:
        throw new Error(`Unknown source_type: ${(seed as DataSeed).source_type}`)
    }

    // -------------------------------------------------------------------
    // 2. Summarise, chunk, and embed
    // -------------------------------------------------------------------
    const summary = await generateSummary(rawText)
    const chunks = chunkText(rawText)
    const embeddings = await generateEmbeddings(chunks)

    // -------------------------------------------------------------------
    // 3. Persist document_chunks
    // -------------------------------------------------------------------
    const chunkRows = chunks.map((text, index) => ({
      seed_id: seedId,
      client_id: seed.client_id,
      chunk_index: index,
      content: text,
      embedding: embeddings[index] ?? null,
    }))

    const { error: insertError } = await supabase.from('document_chunks').insert(chunkRows)

    if (insertError) {
      throw new Error(`Failed to insert document_chunks: ${insertError.message}`)
    }

    // -------------------------------------------------------------------
    // 4. Mark seed as ready
    // -------------------------------------------------------------------
    const { error: updateError } = await supabase
      .from('admin_data_seeds')
      .update({
        raw_transcript: rawText,
        processed_summary: summary,
        ingest_status: 'ready',
      })
      .eq('id', seedId)

    if (updateError) {
      throw new Error(`Failed to update seed status: ${updateError.message}`)
    }

    return json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('process-seed error:', message)

    // Best-effort: record failure on the seed row
    await supabase
      .from('admin_data_seeds')
      .update({ ingest_status: 'failed', error_message: message })
      .eq('id', seedId)

    return json({ error: message }, 500)
  }
})
