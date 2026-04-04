import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../utils/supabase';

// GET /candidates — list (no credentials/platform — avoid large egress)
export function useCandidates() {
  return useQuery({
    queryKey: ['candidates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('Candidates')
        .select('id, name, partylist, position_id, photo_url, Positions(position_name)')
        .order('position_id');
      if (error) throw error;
      return data;
    },
    staleTime: Infinity,
  });
}

// GET /candidates/:id — full profile including credentials and platform
export function useCandidate(id: string) {
  return useQuery({
    queryKey: ['candidates', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('Candidates')
        .select('*, Positions(position_name)')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

// DELETE /candidates/:id — admin only (uses RPC for atomic audit log)
export function useDeleteCandidate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (candidateId: string) => {
      const { data, error } = await supabase.rpc('delete_candidate', {
        p_candidate_id: candidateId,
      });
      if (error) throw error;
      if (!data.success) throw new Error(data.error);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['candidates'] }),
  });
}