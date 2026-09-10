ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS payment_method text,
  ADD COLUMN IF NOT EXISTS access_expires_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS asaas_payment_id text;

CREATE INDEX IF NOT EXISTS subscriptions_asaas_payment_id_idx
  ON public.subscriptions (asaas_payment_id);