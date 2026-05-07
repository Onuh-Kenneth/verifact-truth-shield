
CREATE TABLE public.verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_text TEXT NOT NULL,
  source_name TEXT,
  summary TEXT NOT NULL,
  credibility_score INTEGER NOT NULL,
  claims JSONB NOT NULL DEFAULT '[]'::jsonb,
  domains TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_verifications_user_created ON public.verifications(user_id, created_at DESC);

ALTER TABLE public.verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own verifications"
  ON public.verifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own verifications"
  ON public.verifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own verifications"
  ON public.verifications FOR DELETE
  USING (auth.uid() = user_id);
