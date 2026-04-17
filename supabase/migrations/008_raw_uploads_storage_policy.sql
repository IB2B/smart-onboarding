-- Migration 008: Storage policies for the raw-uploads bucket.
-- Clients need INSERT (upload) access to seed their own files.
-- Downloads are performed server-side via service role (no client SELECT needed).

-- Admins: full access to all objects in raw-uploads
DROP POLICY IF EXISTS "Admins can manage raw-uploads" ON storage.objects;
CREATE POLICY "Admins can manage raw-uploads"
  ON storage.objects
  FOR ALL
  TO authenticated
  USING (
    bucket_id = 'raw-uploads'
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  )
  WITH CHECK (
    bucket_id = 'raw-uploads'
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- Clients: can upload files scoped to their own client directory
-- Path format: {clientId}/{timestamp}_{filename}
DROP POLICY IF EXISTS "Clients can upload to own raw-uploads path" ON storage.objects;
CREATE POLICY "Clients can upload to own raw-uploads path"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'raw-uploads'
    AND (
      SELECT id::text FROM public.clients WHERE contact_email = auth.email() LIMIT 1
    ) IS NOT NULL
    AND name LIKE (
      (SELECT id::text FROM public.clients WHERE contact_email = auth.email() LIMIT 1)
      || '/%'
    )
  );
