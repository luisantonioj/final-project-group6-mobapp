/**
 * useSettings.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Fetches the single SystemSettings row and subscribes to real-time changes.
 * Used by:
 *   - VotingCountdown  → voting_start_time, voting_end_time
 *   - LiveVotingBoard  → show_live_results
 *
 * Table: SystemSettings
 *   id, voting_start_time, voting_end_time,
 *   is_miting_active, show_live_results, updated_at
 *
 * SUPABASE RLS REQUIRED:
 * ─────────────────────────────────────────────────────────────────────────────
 *   CREATE POLICY "read settings" ON "SystemSettings"
 *     FOR SELECT USING (auth.role() = 'authenticated');
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../utils/supabase';

// =============================================================================
// TYPES
// =============================================================================

export interface SystemSettings {
  id: string;
  voting_start_time: string | null;
  voting_end_time: string | null;
  is_miting_active: boolean;
  show_live_results: boolean;
  updated_at: string | null;
}

export type VotingStatus =
  | 'not_started' // before voting_start_time
  | 'active'      // between start and end
  | 'ended'       // after voting_end_time
  | 'unconfigured'; // no times set yet

interface UseSettingsReturn {
  settings: SystemSettings | null;
  votingStatus: VotingStatus;
  isLoading: boolean;
  isError: boolean;
  error: string | null;
}

// =============================================================================
// HELPERS
// =============================================================================

function getVotingStatus(settings: SystemSettings | null): VotingStatus {
  if (!settings?.voting_start_time || !settings?.voting_end_time) return 'unconfigured';
  const now   = Date.now();
  const start = new Date(settings.voting_start_time).getTime();
  const end   = new Date(settings.voting_end_time).getTime();
  if (now < start) return 'not_started';
  if (now > end)   return 'ended';
  return 'active';
}

// =============================================================================
// HOOK
// =============================================================================

export function useSettings(): UseSettingsReturn {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError]     = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      setIsError(false);
      setError(null);

      const { data, error: err } = await supabase
        .from('SystemSettings')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (err) throw err;
      setSettings(data as SystemSettings);
    } catch (e: any) {
      setIsError(true);
      setError(e?.message ?? 'Failed to load settings.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();

    // Real-time: re-fetch whenever the admin updates SystemSettings
    const channel = supabase
      .channel(`system-settings-${Date.now()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'SystemSettings' },
        () => fetchSettings(),
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchSettings]);

  return {
    settings,
    votingStatus: getVotingStatus(settings),
    isLoading,
    isError,
    error,
  };
}