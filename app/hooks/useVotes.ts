import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../utils/supabase';

// POST /votes — server-authoritative via RPC (never write Votes directly)
export function useCastVote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      candidateId,
      positionId,
    }: {
      candidateId: string;
      positionId: string;
    }) => {
      const { data, error } = await supabase.rpc('cast_vote', {
        p_candidate_id: candidateId,
        p_position_id:  positionId,
      });
      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['votes', 'tally'] }),
  });
}

// GET /votes/tally — admin: full vote counts
export function useVoteTally() {
  return useQuery({
    queryKey: ['votes', 'tally'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_vote_tally');
      if (error) throw error;
      return data;
    },
  });
}

// GET /votes/live — students: anonymous percentages only
// Uses polling (refetchInterval) instead of Realtime to stay under the
// 200 concurrent connection free-tier limit
export function useLiveResults() {
  return useQuery({
    queryKey: ['votes', 'live'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_live_results');
      if (error) throw error;
      return data;
    },
    refetchInterval: 10_000, // poll every 10 seconds
    staleTime: 0,
  });
}

// PATCH /votes/:id/invalidate — admin only
export function useInvalidateVote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (voteId: string) => {
      const { data, error } = await supabase.rpc('invalidate_vote', {
        p_vote_id: voteId,
      });
      if (error) throw error;
      if (!data.success) throw new Error(data.error);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['votes', 'tally'] }),
  });
}