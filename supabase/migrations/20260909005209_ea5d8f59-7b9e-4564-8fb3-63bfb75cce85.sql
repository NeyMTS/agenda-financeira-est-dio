CREATE TABLE public.business_settings (
  user_id uuid NOT NULL PRIMARY KEY,
  business_name text NOT NULL DEFAULT 'Meu negócio',
  professional_name text NOT NULL DEFAULT '',
  logo text NOT NULL DEFAULT '',
  primary_color text NOT NULL DEFAULT '#B7838E',
  whatsapp text NOT NULL DEFAULT '',
  instagram text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_settings TO authenticated;
GRANT ALL ON public.business_settings TO service_role;

ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own business settings" ON public.business_settings
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE TRIGGER business_settings_updated_at
  BEFORE UPDATE ON public.business_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();