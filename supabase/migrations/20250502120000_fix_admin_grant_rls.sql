-- UserRoles.user_id references public."Users"(id), not auth.uid().
-- auth.uid() matches Users.auth_id. The previous policy never matched, so grants always failed RLS.
DROP POLICY IF EXISTS "Admins can grant roles" ON public."UserRoles";

CREATE POLICY "Admins can grant roles"
ON public."UserRoles"
FOR INSERT
TO authenticated
WITH CHECK (public.has_role('Admin'));
