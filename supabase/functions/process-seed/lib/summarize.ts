const MAX_INPUT_CHARS = 8_000 // keep well within gpt-4o-mini context

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface ChatCompletionChoice {
  message: ChatMessage
}

interface ChatCompletionResponse {
  choices: ChatCompletionChoice[]
  error?: { message: string }
}

/**
 * Calls the OpenAI Chat Completions API (gpt-4o-mini) to produce a concise
 * summary of `text`, suitable for storing in `admin_data_seeds.processed_summary`.
 *
 * Input is truncated to 8 000 chars before sending to avoid token-limit errors.
 */
export async function generateSummary(text: string): Promise<string> {
  const apiKey = Deno.env.get('OPENAI_API_KEY')
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set')
  }

  const truncated = text.slice(0, MAX_INPUT_CHARS)

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'Summarize the following text for use as context in an onboarding assistant. Be concise and focus on key facts, decisions, and action items.',
        },
        {
          role: 'user',
          content: truncated,
        },
      ],
      max_tokens: 500,
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(
      `OpenAI Chat Completions request failed (HTTP ${response.status}): ${errorBody}`,
    )
  }

  const data = (await response.json()) as ChatCompletionResponse

  if (data.error) {
    throw new Error(`OpenAI API error: ${data.error.message}`)
  }

  const content = data.choices[0]?.message?.content
  if (!content) {
    throw new Error('OpenAI returned an empty summary response')
  }

  return content
}
