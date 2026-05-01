import 'react-native-get-random-values';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Database } from './database.types';

// ── Default anon client (used for non-auth DB calls) ──────────────────────────
export const supabase = createClient<Database>(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

// ── Clerk-authenticated Supabase client ───────────────────────────────────────
// Pass the Clerk JWT (from getToken({ template: 'supabase' })) to bypass
// Supabase's own auth and use Clerk's identity for RLS policies.
export function createAuthedClient(clerkToken: string) {
  return createClient<Database>(
    process.env.EXPO_PUBLIC_SUPABASE_URL!,
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${clerkToken}` } },
      auth: { autoRefreshToken: false, persistSession: false },
    }
  );
}