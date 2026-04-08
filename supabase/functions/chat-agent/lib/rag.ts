import type { SupabaseClient } from 'jsr:@supabase/supabase-js@2'
import type { RagChunk } from './types.ts'

export async function retrieveRelevantChunks(
  supabase: SupabaseClient,
  queryEmbedding: number[],
  clientId: string,
  options?: { threshold?: number; count?: number },
): Promise<RagChunk[]> {
  const { data, error } = await supabase.rpc('match_document_chunks', {
    query_embedding: queryEmbedding,
    match_client_id: clientId,
    match_threshold: options?.threshold ?? 0.3,
    match_count: options?.count ?? 5,
  })

  if (error) throw new Error(`RAG retrieval failed: ${error.message}`)
  return (data ?? []) as RagChunk[]
}
