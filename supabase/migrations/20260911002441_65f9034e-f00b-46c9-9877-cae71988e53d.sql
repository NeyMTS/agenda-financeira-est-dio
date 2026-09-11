-- 1) ensure_subscription: switch to SECURITY INVOKER (RLS already scopes to auth.uid())
CREATE OR REPLACE FUNCTION public.ensure_subscription()
RETURNS subscriptions
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public'
AS $function$
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
$function$;

REVOKE EXECUTE ON FUNCTION public.ensure_subscription() FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.ensure_subscription() TO authenticated;

-- 2) handle_new_user: trigger-only, never callable by API roles
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, PUBLIC;

-- 3) Household membership: close the arbitrary self-join
DROP POLICY IF EXISTS "Usuários podem se associar à conta compartilhada" ON public.household_members;

CREATE POLICY "household creators can add themselves"
ON public.household_members
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.households h
    WHERE h.id = household_id
      AND h.created_by = auth.uid()
  )
);

-- join_household validates the invite code server-side before inserting
CREATE OR REPLACE FUNCTION public.join_household(_invite_code text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  target_household_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Usuária não autenticada.';
  END IF;

  SELECT id INTO target_household_id
  FROM public.households
  WHERE invite_code = upper(_invite_code)
  LIMIT 1;

  IF target_household_id IS NULL THEN
    RAISE EXCEPTION 'Código de convite inválido.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.household_members
    WHERE household_id = target_household_id AND user_id = auth.uid()
  ) THEN
    RETURN target_household_id;
  END IF;

  INSERT INTO public.household_members (household_id, user_id)
  VALUES (target_household_id, auth.uid());

  RETURN target_household_id;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.join_household(text) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.join_household(text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.create_household(text) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_household(text) TO authenticated;