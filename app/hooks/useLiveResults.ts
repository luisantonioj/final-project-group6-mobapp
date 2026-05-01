/**
 * useLiveResults.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Fetches all positions with their candidates and live vote counts.
 * Updates in real-time via a Supabase channel subscription on the Votes table.
 *
 * Tables used:
 *   Positions  → id, position_name, display_order, created_at
 *   Candidates → id, name, partylist, position_id, email, credentials
 *   Votes      → id, student_id, candidate_id, position_id, is_valid, created_at
 *
 * SUPABASE RLS REQUIRED:
 * ─────────────────────────────────────────────────────────────────────────────
 *   -- Authenticated users can read all positions
 *   CREATE POLICY "read positions" ON "Positions"
 *     FOR SELECT USING (auth.role() = 'authenticated');
 *
 *   -- Authenticated users can read all candidates
 *   CREATE POLICY "read candidates" ON "Candidates"
 *     FOR SELECT USING (auth.role() = 'authenticated');
 *
 *   -- Authenticated users can read valid votes (for count only — no student_id exposed)
 *   CREATE POLICY "read valid votes" ON "Votes"
 *     FOR SELECT USING (auth.role() = 'authenticated');
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../utils/supabase';

// =============================================================================
// TYPES
// =============================================================================

export interface LiveCandidate {
  id: string;
  name: string;
  partylist: string;
  position_id: string;
  votes: number;
}

export interface LivePosition {
  id: string;
  position_name: string;
  display_order: number;
  college?: string;
  candidates: LiveCandidate[];
  totalVotes: number;
}

interface UseLiveResultsReturn {
  positions: LivePosition[];
  isLoading: boolean;
  isError: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// =============================================================================
// HOOK
// =============================================================================

export function useLiveResults(): UseLiveResultsReturn {
  const [positions, setPositions] = useState<LivePosition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError]     = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const fetchResults = useCallback(async () => {
    try {
      setIsError(false);
      setError(null);

      // 1. Fetch all positions ordered by display_order
      const { data: posData, error: posErr } = await supabase
        .from('Positions')
        .select('id, position_name, display_order, college')
        .order('display_order', { ascending: true });

      if (posErr) throw posErr;
      if (!posData || posData.length === 0) {
        setPositions([]);
        return;
      }

      // 2. Fetch all candidates
      const { data: candData, error: candErr } = await supabase
        .from('Candidates')
        .select('id, name, partylist, position_id');

      if (candErr) throw candErr;

      // 3. Fetch all valid votes (is_valid = true only)
      const { data: voteData, error: voteErr } = await supabase
        .from('Votes')
        .select('candidate_id, position_id')
        .eq('is_valid', true);

      if (voteErr) throw voteErr;

      const allVotes = voteData ?? [];
      const allCandidates = candData ?? [];

      // 4. Build enriched positions
      const enriched: LivePosition[] = posData.map(pos => {
        const candidates: LiveCandidate[] = allCandidates
          .filter(c => c.position_id === pos.id)
          .map(c => ({
            id:          c.id,
            name:        c.name,
            partylist:   c.partylist ?? '',
            position_id: c.position_id,
            votes:       allVotes.filter(v => v.candidate_id === c.id).length,
          }))
          // Sort descending by votes
          .sort((a, b) => b.votes - a.votes);

        return {
          id:            pos.id,
          position_name: pos.position_name,
          display_order: pos.display_order,
          college:       pos.college ?? 'Executive Council',
          candidates,
          totalVotes:    candidates.reduce((sum, c) => sum + c.votes, 0),
        };
      });

      setPositions(enriched);
    } catch (e: any) {
      setIsError(true);
      setError(e?.message ?? 'Failed to load live results.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    fetchResults();

    // Real-time subscription — refetch whenever any row in Votes changes
    const channel = supabase
      .channel(`live-votes-${Date.now()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'Votes' },
        () => {
          // A vote was inserted/updated/deleted — refresh the counts
          fetchResults();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchResults]);

  return { positions, isLoading, isError, error, refetch: fetchResults };
}