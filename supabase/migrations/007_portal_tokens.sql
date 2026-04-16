-- Migration 007: portal_tokens table for secure, expiring portal access links
-- Replaces the legacy pattern of using client UUIDs directly in portal URLs

CREATE TABLE IF NOT EXISTS public.portal_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '30 days',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.portal_tokens ENABLE ROW LEVEL SECURITY;

-- Admins: full access (create tokens during client provisioning)
CREATE POLICY "admin_portal_tokens_all" ON public.portal_tokens
  FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Clients: read their own tokens (needed to resolve client_id from token during portal access)
CREATE POLICY "client_portal_tokens_read" ON public.portal_tokens
  FOR SELECT TO authenticated
  USING (
    client_id IN (
      SELECT id FROM public.clients WHERE contact_email = auth.email()
    )
  );
