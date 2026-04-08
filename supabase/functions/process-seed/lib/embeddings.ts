interface EmbeddingObject {
  index: number
  embedding: number[]
}

interface EmbeddingsResponse {
  data: EmbeddingObject[]
  error?: { message: string }
}

/**
 * Generates embedding vectors for an array of text chunks using the
 * OpenAI Embeddings API (text-embedding-3-large).
 *
 * Returns one `number[]` per input chunk, in the same order as the input.
 * Returns `null` entries if the API omits a particular index (defensive).
 *
 * @param chunks  Array of text strings to embed (batched in a single API call)
 */
const EMBED_BATCH_SIZE = 100

async function embedBatch(batch: string[], apiKey: string): Promise<(number[] | null)[]> {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'text-embedding-3-large',
      input: batch,
      dimensions: 1536,
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`OpenAI Embeddings request failed (HTTP ${response.status}): ${errorBody}`)
  }

  const data = (await response.json()) as EmbeddingsResponse

  if (data.error) {
    throw new Error(`OpenAI API error: ${data.error.message}`)
  }

  const sorted = [...data.data].sort((a, b) => a.index - b.index)
  return sorted.map((item) => item.embedding)
}

export async function generateEmbeddings(chunks: string[]): Promise<(number[] | null)[]> {
  if (chunks.length === 0) {
    return []
  }

  const apiKey = Deno.env.get('OPENAI_API_KEY')
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set')
  }

  const results: (number[] | null)[] = []
  for (let i = 0; i < chunks.length; i += EMBED_BATCH_SIZE) {
    const batch = chunks.slice(i, i + EMBED_BATCH_SIZE)
    const batchResults = await embedBatch(batch, apiKey)
    results.push(...batchResults)
  }
  return results
}
