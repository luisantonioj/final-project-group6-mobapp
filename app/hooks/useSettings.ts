/**
 * useSettings.ts
 * Reads the SystemSettings singleton + the active Election in one query.
 * Voting schedule (start/end) now lives on Elections, not SystemSettings.
 * The realtime subscription covers both tables so any change — toggling
 * live results, editing the schedule, archiving an election — propagates
 * immediately to every connected client.
 */

import { useEffect, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../utils/supabase';
import type { Database } from '../utils/database.types';

// ─── Types ────────────────────────────────────────────────────────────────────

type SystemSettingsRow = Database['public']['Tables']['SystemSettings']['Row'];
type ElectionRow       = Database['public']['Tables']['Elections']['Row'];
type SystemSettingsUpdate = Database['public']['Tables']['SystemSettings']['Update'];

export type VotingStatus =
  | 'not_started'
  | 'active'
  | 'ended'
  | 'unconfigured';

export interface SettingsData {
  settings:      SystemSettingsRow | null;
  activeElection: ElectionRow | null;
  votingStatus:  VotingStatus;
  isLoading:     boolean;
  isError:       boolean;
  error:         Error | null;
}

// ─── Singleton realtime subscription ─────────────────────────────────────────
// One shared channel regardless of how many components call useSettings().

let subscriberCount = 0;
let channel: ReturnType<typeof supabase.channel> | null = null;
const invalidateCallbacks = new Set<() => void>();

function registerSettingsSubscriber(onInvalidate: () => void) {
  invalidateCallbacks.add(onInvalidate);
  subscriberCount += 1;

  if (subscriberCount === 1) {
    channel = supabase
      .channel('system-settings-realtime')
      .on('postgres_changes',
          { event: '*', schema: 'public', table: 'SystemSettings' },
          () => invalidateCallbacks.forEach(cb => cb()))
      .on('postgres_changes',
          { event: '*', schema: 'public', table: 'Elections' },
          () => invalidateCallbacks.forEach(cb => cb()))
      .subscribe();
  }

  return () => {
    invalidateCallbacks.delete(onInvalidate);
    subscriberCount -= 1;
    if (subscriberCount === 0 && channel) {
      supabase.removeChannel(channel);
      channel = null;
    }
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getVotingStatus(election: ElectionRow | null): VotingStatus {
  if (!election?.voting_start || !election?.voting_end) return 'unconfigured';

  const now   = Date.now();
  const start = new Date(election.voting_start).getTime();
  const end   = new Date(election.voting_end).getTime();

  if (now < start) return 'not_started';
  if (now > end)   return 'ended';
  return 'active';
}

// ─── useSettings ─────────────────────────────────────────────────────────────

export function useSettings(): SettingsData {
  const queryClient    = useQueryClient();
  const queryClientRef = useRef(queryClient);
  queryClientRef.current = queryClient;

  const query = useQuery<{ settings: SystemSettingsRow | null; activeElection: ElectionRow | null }>({
    queryKey: ['settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('SystemSettings')
        .select('*, Elections:active_election_id(*)')
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (!data) return { settings: null, activeElection: null };

      const { Elections, ...settings } = data as any;
      return {
        settings: settings as SystemSettingsRow,
        activeElection: (Elections ?? null) as ElectionRow | null,
      };
    },
    refetchInterval: 60_000,
  });

  useEffect(() => {
    const unregister = registerSettingsSubscriber(() => {
      queryClientRef.current.invalidateQueries({ queryKey: ['settings'] });
    });
    return unregister;
  }, []);

  const votingStatus = useMemo(
    () => getVotingStatus(query.data?.activeElection ?? null),
    [query.data]
  );

  return {
    settings:       query.data?.settings      ?? null,
    activeElection: query.data?.activeElection ?? null,
    votingStatus,
    isLoading: query.isLoading,
    isError:   query.isError,
    error:     query.error as Error | null,
  };
}

// ─── useUpdateSettings ────────────────────────────────────────────────────────

/** Update operational toggles: is_miting_active, show_live_results.
 *  Do NOT use this to change the voting schedule — use useUpdateElection() instead. */
export function useUpdateSettings() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (updates: SystemSettingsUpdate) => {
      const { data: existing, error: fetchError } = await supabase
        .from('SystemSettings')
        .select('id')
        .limit(1)
        .maybeSingle();

      if (fetchError) throw fetchError;
      if (!existing)  throw new Error('System settings row not found.');

      const { error } = await supabase
        .from('SystemSettings')
        .update(updates)
        .eq('id', existing.id);

      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings'] }),
  });
}
