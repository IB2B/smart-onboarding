-- Enable Supabase Realtime for the messages table
-- Without this, postgres_changes subscriptions on messages never fire.

-- REPLICA IDENTITY FULL ensures the full row (including all columns) is included
-- in the WAL event payload. Required for row-level filters (client_id=eq.X) to
-- work correctly on INSERT/UPDATE/DELETE events.
ALTER TABLE messages REPLICA IDENTITY FULL;

-- Add messages to the supabase_realtime publication so that Realtime picks up changes.
-- If the table is already in the publication this is a no-op.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM   pg_publication_tables
    WHERE  pubname = 'supabase_realtime'
    AND    tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE messages;
  END IF;
END;
$$;

-- ── RLS policies for messages ──────────────────────────────────────────────────
-- If RLS is not yet enabled on this table, enable it now.
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Admins (app_metadata.role = 'admin') can read all messages across all clients.
-- This is required for the admin chat-tab realtime subscription to receive events.
DROP POLICY IF EXISTS "admins_read_all_messages" ON messages;
CREATE POLICY "admins_read_all_messages" ON messages
  FOR SELECT TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Clients can read their own messages only.
-- client_id is matched against the clients row whose contact_email matches
-- the authenticated user's email (set by Supabase Auth after magic-link login).
DROP POLICY IF EXISTS "clients_read_own_messages" ON messages;
CREATE POLICY "clients_read_own_messages" ON messages
  FOR SELECT TO authenticated
  USING (
    client_id = (
      SELECT id FROM clients
      WHERE  contact_email = auth.jwt() ->> 'email'
      LIMIT  1
    )
  );

-- Note: INSERT/UPDATE on messages is handled exclusively by the chat-agent Edge
-- Function which runs with the service role key — service role bypasses RLS, so
-- no INSERT policy is needed for authenticated users.
