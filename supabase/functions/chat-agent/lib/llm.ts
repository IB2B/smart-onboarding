import type { LlmMessage, LlmResponse, LlmToolCall } from './types.ts'

interface OpenAIChoice {
  message: {
    content: string | null
    tool_calls?: LlmToolCall[]
  }
  finish_reason: string
}

interface OpenAIResponse {
  choices: OpenAIChoice[]
  error?: { message: string }
}

export type ToolDefinition = {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: Record<string, unknown>
  }
}

export async function callLlm(params: {
  messages: LlmMessage[]
  tools: ToolDefinition[]
  provider: 'openai' | 'openrouter'
  model?: string
  maxTokens?: number
}): Promise<LlmResponse> {
  const { messages, tools, provider, maxTokens = 1024 } = params

  let apiUrl: string
  let apiKey: string
  let model: string

  if (provider === 'openrouter') {
    apiUrl = 'https://openrouter.ai/api/v1/chat/completions'
    apiKey = Deno.env.get('OPENROUTER_API_KEY') ?? ''
    model = params.model ?? 'openai/gpt-4o'
    if (!apiKey) throw new Error('OPENROUTER_API_KEY environment variable is not set')
  } else {
    apiUrl = 'https://api.openai.com/v1/chat/completions'
    apiKey = Deno.env.get('OPENAI_API_KEY') ?? ''
    model = params.model ?? 'gpt-4o'
    if (!apiKey) throw new Error('OPENAI_API_KEY environment variable is not set')
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  }

  if (provider === 'openrouter') {
    headers['HTTP-Referer'] = 'https://smart-onboarding-codex.app'
    headers['X-Title'] = 'Smart Onboarding Codex'
  }

  const body: Record<string, unknown> = {
    model,
    messages,
    max_tokens: maxTokens,
  }

  if (tools.length > 0) {
    body['tools'] = tools
    body['tool_choice'] = 'auto'
  }

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`LLM request failed (HTTP ${response.status}): ${errorText}`)
  }

  const data = (await response.json()) as OpenAIResponse

  if (data.error) {
    throw new Error(`LLM API error: ${data.error.message}`)
  }

  const choice = data.choices[0]
  if (!choice) throw new Error('LLM returned no choices')

  return {
    content: choice.message.content,
    toolCalls: choice.message.tool_calls ?? null,
    finishReason: choice.finish_reason,
  }
}
