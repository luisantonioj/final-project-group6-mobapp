-- Resolve Users.id by email for the "grant admin" flow. Direct table SELECT can return
-- no rows under RLS even for admins; this runs as definer only after an admin check.
CREATE OR REPLACE FUNCTION public.admin_lookup_user_id_by_email(p_email text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF NOT public.has_role('Admin') THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  SELECT u.id INTO v_id
  FROM public."Users" u
  WHERE lower(trim(u.email)) = lower(trim(p_email))
  LIMIT 1;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_lookup_user_id_by_email(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_lookup_user_id_by_email(text) TO authenticated;
