import { useMutation } from '@tanstack/react-query';
import { supabase } from '../utils/supabase';

async function grantAdminRole(email: string) {
  // 1. Find the user by email
  const { data: user, error: userError } = await supabase
    .from('Users')
    .select('id')
    .eq('email', email)
    .single();

  if (userError || !user) throw new Error('No student found with that email.');

  // 2. Find the Admin role ID
  const { data: role, error: roleError } = await supabase
    .from('Roles')
    .select('id')
    .eq('role_name', 'Admin')
    .single();

  if (roleError || !role) throw new Error('Admin role not found in database.');

  // 3. Insert into UserRoles (the UNIQUE constraint prevents duplicates automatically)
  const { error: insertError } = await supabase
    .from('UserRoles')
    .insert({ user_id: user.id, role_id: role.id });

  if (insertError) {
    if (insertError.code === '23505') throw new Error('This student is already an admin.');
    throw new Error('Failed to grant admin role.');
  }
}

export function useGrantAdminRole() {
  return useMutation({ mutationFn: grantAdminRole });
}