// hooks/useSettings.ts
import { useEffect, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../utils/supabase';
import type { Database } from '../utils/database.types';

// =============================================================================
// TYPES
// =============================================================================

type SystemSettingsRow =
  Database['public']['Tables']['SystemSettings']['Row'];

type SystemSettingsUpdate =
  Database['public']['Tables']['SystemSettings']['Update'];

export type VotingStatus =
  | 'not_started'
  | 'active'
  | 'ended'
  | 'unconfigured';

// =============================================================================
// SINGLETON SUBSCRIPTION
// One shared channel regardless of how many components call useSettings().
// Reference-counted: channel opens on first subscriber, closes on last.
// =============================================================================

let subscriberCount = 0;
let channel: ReturnType<typeof supabase.channel> | null = null;
const invalidateCallbacks = new Set<() => void>();

function registerSettingsSubscriber(onInvalidate: () => void) {
  invalidateCallbacks.add(onInvalidate);
  subscriberCount += 1;

  if (subscriberCount === 1) {
    // First subscriber — open the channel
    channel = supabase
      .channel('system-settings-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'SystemSettings' },
        () => {
          invalidateCallbacks.forEach(cb => cb());
        }
      )
      .subscribe();
  }

  return () => {
    invalidateCallbacks.delete(onInvalidate);
    subscriberCount -= 1;

    if (subscriberCount === 0 && channel) {
      // Last subscriber — close the channel
      supabase.removeChannel(channel);
      channel = null;
    }
  };
}

// =============================================================================
// HELPERS
// =============================================================================

function getVotingStatus(settings: SystemSettingsRow | null): VotingStatus {
  if (!settings?.voting_start_time || !settings?.voting_end_time)
    return 'unconfigured';

  const now   = Date.now();
  const start = new Date(settings.voting_start_time).getTime();
  const end   = new Date(settings.voting_end_time).getTime();

  if (now < start) return 'not_started';
  if (now > end)   return 'ended';
  return 'active';
}

// =============================================================================
// HOOK: GET SETTINGS (WITH REALTIME)
// =============================================================================

export function useSettings() {
  const queryClient = useQueryClient();
  const queryClientRef = useRef(queryClient);
  queryClientRef.current = queryClient;

  const query = useQuery<SystemSettingsRow | null>({
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
    refetchInterval: 60_000,
  });

  // Register with the singleton — safe to call from multiple components
  useEffect(() => {
    const unregister = registerSettingsSubscriber(() => {
      queryClientRef.current.invalidateQueries({ queryKey: ['settings'] });
    });
    return unregister;
  }, []); // empty — singleton manages the actual channel lifecycle

  const votingStatus = useMemo(
    () => getVotingStatus(query.data ?? null),
    [query.data]
  );

  return {
    settings:  query.data ?? null,
    votingStatus,
    isLoading: query.isLoading,
    isError:   query.isError,
    error:     query.error as Error | null,
  };
}

// =============================================================================
// HOOK: UPDATE SETTINGS
// =============================================================================

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