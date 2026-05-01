/**
 * useElections.ts
 * Hooks for creating, updating, archiving, and listing elections.
 * Used by AdminDashboardScreen (schedule editor, archive button)
 * and AdminResultsScreen (election picker for historical results).
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../utils/supabase';
import type { Database } from '../utils/database.types';

// ─── Types ────────────────────────────────────────────────────────────────────

export type Election       = Database['public']['Tables']['Elections']['Row'];
export type ElectionInsert = Database['public']['Tables']['Elections']['Insert'];
export type ElectionUpdate = Database['public']['Tables']['Elections']['Update'];

const QK_ALL    = ['elections'] as const;
const QK_ACTIVE = ['elections', 'active'] as const;

// ─── LIST ALL (admin: history picker) ────────────────────────────────────────

export function useElections() {
  return useQuery<Election[]>({
    queryKey: QK_ALL,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('Elections')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 60_000,
  });
}

// ─── ACTIVE ELECTION ──────────────────────────────────────────────────────────

/** Fetches the currently active election by joining through SystemSettings. */
export function useActiveElection() {
  return useQuery<Election | null>({
    queryKey: QK_ACTIVE,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('SystemSettings')
        .select('Elections:active_election_id(*)')
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return (data?.Elections as unknown as Election) ?? null;
    },
    staleTime: 30_000,
  });
}

// ─── CREATE ───────────────────────────────────────────────────────────────────

export function useCreateElection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ElectionInsert) => {
      const { data, error } = await supabase
        .from('Elections')
        .insert({ ...payload, status: 'active' })
        .select()
        .single();
      if (error) throw error;

      // Wire it as the active election in SystemSettings
      const { error: settingsError } = await supabase
        .from('SystemSettings')
        .update({ active_election_id: data.id })
        .neq('id', '00000000-0000-0000-0000-000000000000'); // update the singleton row

      if (settingsError) throw settingsError;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK_ALL });
      qc.invalidateQueries({ queryKey: QK_ACTIVE });
      qc.invalidateQueries({ queryKey: ['settings'] });
    },
  });
}

// ─── UPDATE SCHEDULE ──────────────────────────────────────────────────────────

/** Edit the label, voting_start, or voting_end of any election. */
export function useUpdateElection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: ElectionUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('Elections')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK_ALL });
      qc.invalidateQueries({ queryKey: QK_ACTIVE });
      qc.invalidateQueries({ queryKey: ['settings'] });
    },
  });
}

// ─── ARCHIVE ──────────────────────────────────────────────────────────────────

/** Archives the current active election via the server-side RPC.
 *  Optionally starts a new election in the same call. */
export function useArchiveElection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (newLabel?: string) => {
      const { data, error } = await supabase.rpc('archive_election', {
        p_new_label: newLabel ?? null,
      });
      if (error) throw error;
      const result = data as { success: boolean; error?: string };
      if (!result.success) throw new Error(result.error ?? 'Archive failed');
      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK_ALL });
      qc.invalidateQueries({ queryKey: QK_ACTIVE });
      qc.invalidateQueries({ queryKey: ['settings'] });
      qc.invalidateQueries({ queryKey: ['candidates'] });
    },
  });
}
