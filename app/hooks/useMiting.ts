// app/hooks/useMiting.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '../utils/supabase';

// GET /miting/questions — sorted by upvotes, includes student's own pending questions
export function useMitingQuestions(studentId?: string) {
  const qc = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('miting-questions-student')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'MitingQuestions' }, () => qc.invalidateQueries({ queryKey: ['miting'] }))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'QuestionUpvotes' }, () => qc.invalidateQueries({ queryKey: ['miting'] }))
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [qc]);

  return useQuery({
    queryKey: ['miting', studentId],
    queryFn: async () => {
      let query = supabase.from('MitingQuestions').select('*');
      
      // If we know who the student is, let them see approved questions OR their own pending ones
      if (studentId) {
        query = query.or(`is_approved.eq.true,student_id.eq.${studentId}`);
      } else {
        query = query.eq('is_approved', true);
      }

      const { data, error } = await query.order('upvote_count', { ascending: false });
      if (error) throw error;
      return data || []; 
    },
  });
}

// GET /miting/upvotes — fetch the IDs of questions this student has already upvoted
export function useStudentUpvotes(studentId?: string) {
  return useQuery({
    queryKey: ['miting_upvotes', studentId],
    queryFn: async () => {
      if (!studentId) return [];
      const { data, error } = await supabase
        .from('QuestionUpvotes')
        .select('question_id')
        .eq('student_id', studentId);
        
      if (error) throw error;
      return data.map(d => d.question_id);
    },
    enabled: !!studentId,
  });
}

// POST /miting/questions
export function useSubmitQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ questionText, studentId }: { questionText: string; studentId: string }) => {
      const { data, error } = await supabase
        .from('MitingQuestions')
        .insert({ question_text: questionText, student_id: studentId })
        .select();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['miting'] }),
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