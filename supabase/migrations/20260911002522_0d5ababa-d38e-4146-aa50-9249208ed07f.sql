CREATE POLICY "service role manages login attempts"
ON public.login_attempts
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);