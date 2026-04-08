import { type SupabaseClient } from 'jsr:@supabase/supabase-js@2'

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
      // Dynamic import avoids boot-time CJS/ESM incompatibility with npm:pdf-parse
      // deno-lint-ignore no-explicit-any
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pdfMod = await import('npm:pdf-parse') as any
      const pdfParse = pdfMod.default ?? pdfMod
      const result = await pdfParse(buffer)
      return result.text as string
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
