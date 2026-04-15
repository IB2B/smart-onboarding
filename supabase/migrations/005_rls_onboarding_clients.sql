-- ──────────────────────────────────────────────────────────────────────────────
-- Migration 005: RLS policies for onboarding_states + clients tables
--                + realtime publication enrollment
-- ──────────────────────────────────────────────────────────────────────────────

-- ── onboarding_states ─────────────────────────────────────────────────────────

ALTER TABLE onboarding_states REPLICA IDENTITY FULL;
ALTER TABLE onboarding_states ENABLE ROW LEVEL SECURITY;

-- Enroll in realtime publication (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'onboarding_states'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE onboarding_states;
  END IF;
END;
$$;

-- Admin: full read access
DROP POLICY IF EXISTS "Admins can read all onboarding_states" ON onboarding_states;
CREATE POLICY "Admins can read all onboarding_states"
  ON onboarding_states
  FOR SELECT
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- Admin: full write access (for status updates, provisioning)
DROP POLICY IF EXISTS "Admins can write all onboarding_states" ON onboarding_states;
CREATE POLICY "Admins can write all onboarding_states"
  ON onboarding_states
  FOR ALL
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- Client: read own row (matched by email in clients table)
DROP POLICY IF EXISTS "Clients can read own onboarding_state" ON onboarding_states;
CREATE POLICY "Clients can read own onboarding_state"
  ON onboarding_states
  FOR SELECT
  USING (
    client_id IN (
      SELECT id FROM clients WHERE contact_email = auth.email()
    )
  );

-- Client: update own row (chat-agent writes on their behalf via service role,
--         but a client session can still read/update its own state)
DROP POLICY IF EXISTS "Clients can update own onboarding_state" ON onboarding_states;
CREATE POLICY "Clients can update own onboarding_state"
  ON onboarding_states
  FOR UPDATE
  USING (
    client_id IN (
      SELECT id FROM clients WHERE contact_email = auth.email()
    )
  );

-- ── clients ───────────────────────────────────────────────────────────────────

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Admin: full read access
DROP POLICY IF EXISTS "Admins can read all clients" ON clients;
CREATE POLICY "Admins can read all clients"
  ON clients
  FOR SELECT
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- Admin: full write access
DROP POLICY IF EXISTS "Admins can write all clients" ON clients;
CREATE POLICY "Admins can write all clients"
  ON clients
  FOR ALL
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- Client: read own row
DROP POLICY IF EXISTS "Clients can read own client row" ON clients;
CREATE POLICY "Clients can read own client row"
  ON clients
  FOR SELECT
  USING (
    contact_email = auth.email()
  );
