import { type SupabaseClient } from 'jsr:@supabase/supabase-js@2'

function bytesFromBinaryString(value: string): Uint8Array {
  return Uint8Array.from(value, (char) => char.charCodeAt(0) & 0xff)
}

function decodePdfLiteralString(value: string): string {
  return value.replace(/\\([nrtbf()\\]|[0-7]{1,3})/g, (_, token: string) => {
    switch (token) {
      case 'n':
        return '\n'
      case 'r':
        return '\r'
      case 't':
        return '\t'
      case 'b':
        return '\b'
      case 'f':
        return '\f'
      case '(':
        return '('
      case ')':
        return ')'
      case '\\':
        return '\\'
      default:
        return String.fromCharCode(Number.parseInt(token, 8))
    }
  })
}

function collectPdfTextSegments(source: string): string[] {
  const segments: string[] = []
  const textBlocks = source.match(/BT[\s\S]*?ET/g) ?? [source]

  for (const block of textBlocks) {
    const literals = block.match(/\((?:\\.|[^\\()])*\)/g) ?? []
    for (const literal of literals) {
      const decoded = decodePdfLiteralString(literal.slice(1, -1))
        .replace(/\s+/g, ' ')
        .trim()
      if (decoded.length >= 2) {
        segments.push(decoded)
      }
    }
  }

  return segments
}

async function inflatePdfStream(binaryStream: string): Promise<string | null> {
  try {
    const stream = new Blob([bytesFromBinaryString(binaryStream)])
      .stream()
      .pipeThrough(new DecompressionStream('deflate'))
    const inflated = await new Response(stream).arrayBuffer()
    return new TextDecoder('latin1').decode(inflated)
  } catch {
    return null
  }
}

async function extractPdfTextFallback(buffer: Uint8Array): Promise<string> {
  const binary = new TextDecoder('latin1').decode(buffer)
  const candidates = new Set<string>([binary])
  const flateStreams = binary.matchAll(
    /<<[\s\S]*?\/Filter\s*\/FlateDecode[\s\S]*?>>\s*stream\r?\n([\s\S]*?)\r?\nendstream/g,
  )

  for (const match of flateStreams) {
    const inflated = await inflatePdfStream(match[1] ?? '')
    if (inflated) candidates.add(inflated)
  }

  const extracted = Array.from(candidates)
    .flatMap((candidate) => collectPdfTextSegments(candidate))
    .filter((segment, index, all) => all.indexOf(segment) === index)

  if (extracted.length > 0) {
    return extracted.join('\n')
  }

  throw new Error('PDF text extraction failed')
}

/**
 * Downloads a document from Supabase Storage and extracts its text content.
 * Supported formats: .pdf, .txt, .md  (.docx returns a placeholder).
 *
 * @param supabase  Pre-created Supabase service-role client from index.ts
 * @param storagePath  Full path in the `raw-uploads` bucket
 */
export async function extractDocument(
  supabase: SupabaseClient,
  storagePath: string,
): Promise<string> {
  if (!storagePath) {
    throw new Error('extractDocument: storagePath must not be empty')
  }

  // Download blob from storage
  const { data: blob, error: downloadError } = await supabase.storage
    .from('raw-uploads')
    .download(storagePath)

  if (downloadError || !blob) {
    throw new Error(
      `Failed to download document from storage: ${downloadError?.message ?? 'unknown error'}`,
    )
  }

  // Derive extension from the path (lower-cased, strip query params if any)
  const baseName = storagePath.split('/').pop() ?? ''
  const ext = baseName.split('.').pop()?.toLowerCase() ?? ''

  switch (ext) {
    case 'pdf': {
      const arrayBuffer = await blob.arrayBuffer()
      const buffer = new Uint8Array(arrayBuffer)
      let parserError = ''

      try {
        // Pin to the older parser line that is more reliable in server runtimes.
        // deno-lint-ignore no-explicit-any
        const pdfMod = await import('npm:pdf-parse@1.1.1') as any
        const pdfParse = pdfMod.default ?? pdfMod
        const result = await pdfParse(buffer)
        const text = typeof result?.text === 'string' ? result.text.trim() : ''
        if (text) return text
      } catch (error) {
        parserError = error instanceof Error ? error.message : String(error)
      }

      try {
        return await extractPdfTextFallback(buffer)
      } catch (fallbackError) {
        const fallbackMessage =
          fallbackError instanceof Error ? fallbackError.message : String(fallbackError)
        throw new Error(
          parserError
            ? `Failed to parse PDF: ${parserError}. Fallback extraction also failed: ${fallbackMessage}`
            : fallbackMessage,
        )
      }
    }

    case 'txt':
    case 'md':
      return await blob.text()

    case 'docx':
      return '[DOCX extraction not yet supported]'

    default:
      // Unknown extension — attempt to read as plain text
      return await blob.text()
  }
}
