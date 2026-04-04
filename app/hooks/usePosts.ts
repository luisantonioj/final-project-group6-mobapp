import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../utils/supabase';

// GET /posts — feed
export function usePosts() {
  return useQuery({
    queryKey: ['posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('Posts')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

// GET /posts/:id — single post (includes PollOptions if type = 'poll')
export function usePost(id: string) {
  return useQuery({
    queryKey: ['posts', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('Posts')
        .select('*, PollOptions(*)')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}