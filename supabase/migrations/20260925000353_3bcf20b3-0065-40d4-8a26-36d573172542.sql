CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can view own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$$;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role
FROM auth.users
WHERE lower(email) = lower('neymattos11@gmail.com')
ON CONFLICT (user_id, role) DO NOTHING;

ALTER TABLE public.profiles
  ADD COLUMN last_access_at timestamptz;

ALTER TABLE public.subscriptions
  ADD COLUMN admin_access_expires_at timestamptz,
  ADD COLUMN admin_access_permanent boolean NOT NULL DEFAULT false;

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

  UPDATE public.profiles
  SET last_access_at = touched_at
  WHERE id = uid
    AND (last_access_at IS NULL OR last_access_at < touched_at - interval '5 minutes');

  RETURN touched_at;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.touch_last_access() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.touch_last_access() TO authenticated;
