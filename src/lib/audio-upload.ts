import { supabase } from '@/lib/supabase'

export interface AudioUploadResult {
  storagePath: string
}

function deriveExtension(mimeType: string): string {
  // Normalise before matching — strip codec params (e.g. "audio/webm;codecs=opus" → "audio/webm")
  const base = mimeType.split(';')[0]?.trim() ?? ''
  switch (base) {
    case 'audio/webm':
      return '.webm'
    case 'audio/mp4':
      return '.mp4'
    case 'audio/ogg':
      return '.ogg'
    default:
      return '.webm'
  }
}

export async function uploadAudioBlob(
  blob: Blob,
  clientId: string,
): Promise<AudioUploadResult> {
  const extension = deriveExtension(blob.type)
  const path = `${clientId}/${Date.now()}-voice${extension}`
  // Fall back to a valid MIME type if the blob has none (e.g. browser default MediaRecorder)
  const contentType = blob.type || 'audio/webm'

  const { error: uploadError } = await supabase.storage
    .from('raw-uploads')
    .upload(path, blob, { contentType })

  if (uploadError) {
    throw new Error(`Upload failed: ${uploadError.message}`)
  }

  return { storagePath: `raw-uploads/${path}` }
}
