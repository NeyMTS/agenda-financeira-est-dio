ALTER TABLE public.subscriptions
  DROP COLUMN IF EXISTS asaas_customer_id,
  DROP COLUMN IF EXISTS asaas_subscription_id,
  DROP COLUMN IF EXISTS asaas_checkout_id,
  DROP COLUMN IF EXISTS asaas_payment_id;

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS kiwify_order_id text,
  ADD COLUMN IF NOT EXISTS kiwify_product_id text;

CREATE INDEX IF NOT EXISTS subscriptions_kiwify_order_id_idx ON public.subscriptions (kiwify_order_id);

CREATE TABLE IF NOT EXISTS public.kiwify_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event text,
  order_id text,
  product_id text,
  order_status text,
  payment_method text,
  user_id uuid,
  handled boolean NOT NULL DEFAULT false,
  note text,
  payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.kiwify_webhook_events TO service_role;

ALTER TABLE public.kiwify_webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service role manages kiwify events"
  ON public.kiwify_webhook_events FOR ALL TO service_role
  USING (true) WITH CHECK (true);