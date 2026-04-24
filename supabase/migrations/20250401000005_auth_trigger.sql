-- Step 1: Create the function that runs when a new user registers
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert a row into your public Users table
  INSERT INTO public."Users" (auth_id, email, name, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    TRUE
  );

  -- Automatically assign the 'Student' role to every new user
  INSERT INTO public."UserRoles" (user_id, role_id)
  VALUES (
    (SELECT id FROM public."Users" WHERE auth_id = NEW.id),
    (SELECT id FROM public."Roles" WHERE role_name = 'Student')
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Attach the function to fire whenever auth.users gets a new row
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();