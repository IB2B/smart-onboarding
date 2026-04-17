-- Migration 007: Allow authenticated clients to read and create their own
-- admin_data_seeds rows for portal uploads (documents, audio, notes).
-- Also preserves admin full access after RLS is enabled.

ALTER TABLE public.admin_data_seeds ENABLE ROW LEVEL SECURITY;

-- Admins: full access (must be defined BEFORE enabling RLS causes lockout)
DROP POLICY IF EXISTS "Admins can manage all admin_data_seeds" ON public.admin_data_seeds;
CREATE POLICY "Admins can manage all admin_data_seeds"
  ON public.admin_data_seeds
  FOR ALL
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "Clients can read own admin_data_seeds" ON public.admin_data_seeds;
CREATE POLICY "Clients can read own admin_data_seeds"
  ON public.admin_data_seeds
  FOR SELECT
  USING (
    client_id IN (
      SELECT id FROM public.clients WHERE contact_email = auth.email()
    )
  );

DROP POLICY IF EXISTS "Clients can insert own admin_data_seeds" ON public.admin_data_seeds;
CREATE POLICY "Clients can insert own admin_data_seeds"
  ON public.admin_data_seeds
  FOR INSERT
  WITH CHECK (
    created_by = auth.uid()
    AND client_id IN (
      SELECT id FROM public.clients WHERE contact_email = auth.email()
    )
  );
