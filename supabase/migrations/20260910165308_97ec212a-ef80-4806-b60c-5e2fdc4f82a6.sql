ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS asaas_checkout_id TEXT;
CREATE INDEX IF NOT EXISTS subscriptions_asaas_checkout_id_idx ON public.subscriptions (asaas_checkout_id);