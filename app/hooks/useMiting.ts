// app/hooks/useMiting.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '../utils/supabase';

// GET /miting/questions — sorted by upvote_count desc
export function useMitingQuestions() {
  const qc = useQueryClient();

  // Realtime subscription: invalidate when a question is approved or upvoted
  useEffect(() => {
    const channel = supabase
      .channel('miting-questions')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'MitingQuestions' },
        () => qc.invalidateQueries({ queryKey: ['miting'] })
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'QuestionUpvotes' },
        () => qc.invalidateQueries({ queryKey: ['miting'] })
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [qc]);

  return useQuery({
    queryKey: ['miting'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('MitingQuestions')
        .select('*')
        .eq('is_approved', true)
        .order('upvote_count', { ascending: false });
        
      if (error) throw error;
      if (!data) return []; 
      
      return data;
    },
  });
}

// POST /miting/questions/:id/upvote
export function useUpvoteQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ questionId, studentId }: { questionId: string; studentId: string }) => {
      const { error } = await supabase
        .from('QuestionUpvotes')
        .insert({ question_id: questionId, student_id: studentId });
        
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['miting'] }),
  });
}

// DELETE /miting/questions/:id/upvote
export function useRemoveUpvote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ questionId, studentId }: { questionId: string; studentId: string }) => {
      const { error } = await supabase
        .from('QuestionUpvotes')
        .delete()
        .eq('question_id', questionId)
        .eq('student_id', studentId);
        
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['miting'] }),
  });
}