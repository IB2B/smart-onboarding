-- Phase 4: RAG infrastructure
-- Run in Supabase Dashboard > SQL Editor

-- Vector similarity search function
DROP FUNCTION IF EXISTS match_document_chunks(vector,uuid,double precision,integer);
CREATE OR REPLACE FUNCTION match_document_chunks(
  query_embedding  VECTOR(1536),
  match_client_id  UUID,
  match_threshold  FLOAT DEFAULT 0.5,
  match_count      INT DEFAULT 5
) RETURNS TABLE (
  id         UUID,
  content    TEXT,
  metadata   JSONB,
  similarity FLOAT
) AS $$
  SELECT
    dc.id,
    dc.content,
    dc.metadata,
    1 - (dc.embedding <=> query_embedding) AS similarity
  FROM document_chunks dc
  WHERE dc.client_id = match_client_id
    AND dc.embedding IS NOT NULL
    AND 1 - (dc.embedding <=> query_embedding) > match_threshold
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
$$ LANGUAGE sql STABLE;

-- HNSW vector index (no training phase needed, good for small-to-medium datasets)
CREATE INDEX IF NOT EXISTS document_chunks_embedding_idx
  ON document_chunks
  USING hnsw (embedding vector_cosine_ops);

-- Ensure messages table has widget_response and tool_calls columns
ALTER TABLE messages ADD COLUMN IF NOT EXISTS widget_response TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS tool_calls JSONB;
