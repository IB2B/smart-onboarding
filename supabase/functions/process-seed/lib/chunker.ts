/**
 * Text chunker (Wave 3 stub).
 *
 * Splits `text` into overlapping chunks suitable for embedding.
 * Replace with a proper recursive character splitter in Wave 3.
 *
 * Current naive implementation: splits on double-newlines so that the
 * pipeline is end-to-end testable without external dependencies.
 */

const DEFAULT_CHUNK_SIZE = 1_000 // characters
const DEFAULT_OVERLAP = 200 // characters

export function chunkText(
  text: string,
  chunkSize: number = DEFAULT_CHUNK_SIZE,
  overlap: number = DEFAULT_OVERLAP,
): string[] {
  if (overlap >= chunkSize) {
    throw new Error(`overlap (${overlap}) must be less than chunkSize (${chunkSize})`)
  }

  if (!text || text.trim().length === 0) {
    return []
  }

  const chunks: string[] = []
  let start = 0
  const step = chunkSize - overlap

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length)
    chunks.push(text.slice(start, end))
    start += step
  }

  return chunks
}
