-- Add ingest pipeline columns to admin_data_seeds
ALTER TABLE admin_data_seeds
  ADD COLUMN IF NOT EXISTS ingest_status TEXT NOT NULL DEFAULT 'queued'
    CHECK (ingest_status IN ('queued', 'processing', 'ready', 'failed'));

ALTER TABLE admin_data_seeds
  ADD COLUMN IF NOT EXISTS error_message TEXT;
