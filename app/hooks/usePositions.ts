//app/hooks/usePositions.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../utils/supabase';

// GET /positions — sorted by display_order, used to render the ballot
export function usePositions() {
  return useQuery({
    queryKey: ['positions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('Positions')
        .select('*')
        .order('display_order');
      if (error) throw error;
      return data;
    },
    // staleTime: Infinity, // positions never change mid-election
  });
}