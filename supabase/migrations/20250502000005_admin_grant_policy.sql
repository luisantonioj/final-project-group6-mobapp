CREATE POLICY "Admins can grant roles"
ON public."UserRoles"
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public."UserRoles" ur
    JOIN public."Roles" r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.role_name = 'Admin'
  )
);