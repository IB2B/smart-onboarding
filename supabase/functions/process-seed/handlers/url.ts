const MAX_TEXT_LENGTH = 50_000 // characters — prevents massive inputs reaching the LLM

/**
 * Fetches a public URL, strips HTML boilerplate, and returns the main readable
 * text content as a plain string (truncated to 50 000 chars).
 *
 * @param url  Fully-qualified HTTP/HTTPS URL to scrape
 */
// Private/loopback hostname patterns that should never be fetched (SSRF prevention)
const PRIVATE_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^0\.0\.0\.0$/,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^169\.254\./, // link-local / AWS IMDS
  /^::1$/,       // IPv6 loopback
  /^fc00:/i,     // IPv6 unique local
]

export async function extractUrl(url: string): Promise<string> {
  if (!url) {
    throw new Error('extractUrl: url must not be empty')
  }

  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    throw new Error(`extractUrl: invalid URL — "${url}"`)
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error(`extractUrl: only http/https URLs are allowed (received: "${url}")`)
  }

  if (PRIVATE_HOST_PATTERNS.some((pattern) => pattern.test(parsed.hostname))) {
    throw new Error(`extractUrl: URL resolves to a private or internal address`)
  }

  const response = await fetch(url, {
    headers: { 'User-Agent': 'SmartOnboarding/1.0' },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch URL: HTTP ${response.status}`)
  }

  const html = await response.text()

  // Strip scripts, styles, and all remaining HTML tags; normalise whitespace
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  return text.slice(0, MAX_TEXT_LENGTH)
}
