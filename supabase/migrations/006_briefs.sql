-- Migration 006: briefs table for post-onboarding brief generation
-- Stores LLM-generated technical and non-technical onboarding briefs

CREATE TABLE IF NOT EXISTS public.briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  brief_type TEXT NOT NULL CHECK (brief_type IN ('technical', 'non_technical')),
  content TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'generating'
    CHECK (status IN ('generating', 'ready', 'client_approved', 'complete')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.briefs ENABLE ROW LEVEL SECURITY;

-- Admins: full access to all briefs
CREATE POLICY "admin_briefs_all" ON public.briefs
  FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Clients: read only their own non-technical brief
CREATE POLICY "client_briefs_read" ON public.briefs
  FOR SELECT TO authenticated
  USING (
    brief_type = 'non_technical'
    AND client_id IN (
      SELECT id FROM public.clients WHERE contact_email = auth.email()
    )
  );

-- Clients: approve their own non-technical brief
CREATE POLICY "client_briefs_approve" ON public.briefs
  FOR UPDATE TO authenticated
  USING (
    brief_type = 'non_technical'
    AND client_id IN (
      SELECT id FROM public.clients WHERE contact_email = auth.email()
    )
  )
  WITH CHECK (status = 'client_approved');
