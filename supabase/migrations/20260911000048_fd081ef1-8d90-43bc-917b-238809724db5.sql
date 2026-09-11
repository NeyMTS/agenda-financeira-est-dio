CREATE TABLE IF NOT EXISTS public.login_attempts (
  email text PRIMARY KEY,
  failed_count integer NOT NULL DEFAULT 0,
  locked_until timestamptz,
  last_failed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

GRANT ALL ON public.login_attempts TO service_role;