ALTER TABLE public.verifications
  ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS share_slug text UNIQUE;

CREATE INDEX IF NOT EXISTS idx_verifications_share_slug ON public.verifications(share_slug) WHERE share_slug IS NOT NULL;

DROP POLICY IF EXISTS "Public verifications are readable by anyone" ON public.verifications;
CREATE POLICY "Public verifications are readable by anyone"
ON public.verifications
FOR SELECT
TO anon, authenticated
USING (is_public = true);