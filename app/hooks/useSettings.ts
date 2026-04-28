// hooks/useSettings.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../utils/supabase';
import type { Database } from '../utils/database.types';

type SystemSettingsRow = Database['public']['Tables']['SystemSettings']['Row'];
type SystemSettingsUpdate = Database['public']['Tables']['SystemSettings']['Update'];

// ─── GET system settings (singleton row) ─────────────────────────────────────
// Used by VoteScreen to check voting_start_time / voting_end_time,
// and by MitingScreen to check is_miting_active.
export function useSettings() {
  return useQuery<SystemSettingsRow | null>({
    queryKey: ['settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('SystemSettings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data ?? null;
    },
    // Re-fetch every 60 seconds so voting window changes propagate
    refetchInterval: 60_000,
  });
}

// ─── UPDATE system settings (admin only) ─────────────────────────────────────
// Used by AdminSettingsScreen to toggle voting window, live results, miting.
export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (updates: SystemSettingsUpdate) => {
      // Fetch the existing row id first (singleton pattern)
      const { data: existing, error: fetchError } = await supabase
        .from('SystemSettings')
        .select('id')
        .limit(1)
        .maybeSingle();

      if (fetchError) throw fetchError;
      if (!existing) throw new Error('System settings row not found.');

      const { error } = await supabase
        .from('SystemSettings')
        .update(updates)
        .eq('id', existing.id);

      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings'] });
    },
  });
}