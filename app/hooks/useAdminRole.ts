import { useMutation } from '@tanstack/react-query';
import { supabase } from '../utils/supabase';

async function grantAdminRole(email: string) {
  const normalized = email.trim();
  if (!normalized) throw new Error('Enter an email address.');

  // 1. Resolve Users.id (RPC: admin-only, bypasses flaky RLS + normalizes email match)
  const { data: userId, error: lookupError } = await supabase.rpc(
    'admin_lookup_user_id_by_email',
    { p_email: normalized },
  );

  if (lookupError) {
    if (/not authorized|42501/i.test(lookupError.message)) {
      throw new Error('You do not have permission to grant admin access.');
    }
    throw new Error('Could not look up that email. Try again.');
  }
  if (!userId) throw new Error('No student found with that email. They must sign up first.');

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
    .insert({ user_id: userId, role_id: role.id });

  if (insertError) {
    if (insertError.code === '23505') throw new Error('This student is already an admin.');
    if (insertError.code === '42501') throw new Error('You do not have permission to grant admin access.');
    throw new Error(insertError.message || 'Failed to grant admin role.');
  }
}

export function useGrantAdminRole() {
  return useMutation({ mutationFn: grantAdminRole });
}