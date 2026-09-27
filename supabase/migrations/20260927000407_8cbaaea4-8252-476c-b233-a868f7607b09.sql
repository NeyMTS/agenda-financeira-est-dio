CREATE OR REPLACE FUNCTION public.touch_last_access()
RETURNS timestamptz
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  touched_at timestamptz := now();
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Usuária não autenticada.';
  END IF;

  INSERT INTO public.profiles (id, display_name, last_access_at)
  VALUES (uid, '', touched_at)
  ON CONFLICT (id) DO UPDATE
  SET last_access_at = EXCLUDED.last_access_at
  WHERE profiles.last_access_at IS NULL
     OR profiles.last_access_at < EXCLUDED.last_access_at - interval '5 minutes';

  RETURN touched_at;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.touch_last_access() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.touch_last_access() TO authenticated;
