CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  plan text,
  status text NOT NULL DEFAULT 'trialing',
  trial_start timestamptz NOT NULL DEFAULT now(),
  trial_end timestamptz NOT NULL DEFAULT (now() + interval '14 days'),
  subscription_start timestamptz,
  subscription_end timestamptz,
  asaas_customer_id text,
  asaas_subscription_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own subscription select" ON public.subscriptions
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own subscription insert" ON public.subscriptions
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "own subscription update" ON public.subscriptions
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX subscriptions_asaas_subscription_id_idx ON public.subscriptions (asaas_subscription_id);
CREATE INDEX subscriptions_asaas_customer_id_idx ON public.subscriptions (asaas_customer_id);

CREATE OR REPLACE FUNCTION public.ensure_subscription()
RETURNS public.subscriptions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  result public.subscriptions;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Usuária não autenticada.';
  END IF;

  SELECT * INTO result FROM public.subscriptions WHERE user_id = uid;

  IF result.id IS NULL THEN
    INSERT INTO public.subscriptions (user_id, status, trial_start, trial_end)
    VALUES (uid, 'trialing', now(), now() + interval '14 days')
    ON CONFLICT (user_id) DO NOTHING;

    SELECT * INTO result FROM public.subscriptions WHERE user_id = uid;
  END IF;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.ensure_subscription() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ensure_subscription() TO authenticated;