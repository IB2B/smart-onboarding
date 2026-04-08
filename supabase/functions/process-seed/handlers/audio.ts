import { type SupabaseClient } from 'jsr:@supabase/supabase-js@2'

/**
 * Downloads an audio file from Supabase Storage and transcribes it using
 * OpenAI Whisper. Returns the transcript as a plain string.
 *
 * @param supabase  Pre-created Supabase service-role client from index.ts
 * @param storagePath  Full path in the `raw-uploads` bucket (e.g. `clientId/timestamp_file.mp3`)
 */
export async function transcribeAudio(
  supabase: SupabaseClient,
  storagePath: string,
): Promise<string> {
  if (!storagePath) {
    throw new Error('transcribeAudio: storagePath must not be empty')
  }

  const apiKey = Deno.env.get('OPENAI_API_KEY')
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set')
  }

  // Download audio blob from storage
  const { data: blob, error: downloadError } = await supabase.storage
    .from('raw-uploads')
    .download(storagePath)

  if (downloadError || !blob) {
    throw new Error(
      `Failed to download audio from storage: ${downloadError?.message ?? 'unknown error'}`,
    )
  }

  // Whisper hard limit is 25 MB
  if (blob.size > 25 * 1024 * 1024) {
    throw new Error('Audio file exceeds 25MB Whisper limit')
  }

  // Build multipart form for Whisper API
  const filename = storagePath.split('/').pop() ?? 'audio.mp3'
  const form = new FormData()
  form.append('file', blob, filename)
  form.append('model', 'whisper-1')

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(
      `Whisper API request failed (HTTP ${response.status}): ${errorBody}`,
    )
  }

  const result = (await response.json()) as { text: string }
  return result.text
}
