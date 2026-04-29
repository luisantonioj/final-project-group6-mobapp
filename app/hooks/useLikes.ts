// hooks/useLikes.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../utils/supabase';

// =============================================================================
// HOOK: READ LIKES
// Returns total like count + whether the current user has liked the post
// =============================================================================

export function useLikes(postId: string, userId: string | null) {
  return useQuery({
    queryKey: ['likes', postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('Likes')
        .select('id, student_id')
        .eq('post_id', postId);

      if (error) throw error;

      const likes   = data ?? [];
      const count   = likes.length;
      const hasLiked = userId ? likes.some(l => l.student_id === userId) : false;
      const myLikeId = userId ? likes.find(l => l.student_id === userId)?.id ?? null : null;

      return { count, hasLiked, myLikeId };
    },
    enabled: !!postId,
  });
}

// =============================================================================
// HOOK: TOGGLE LIKE
// Inserts if not liked, deletes if already liked
// =============================================================================

export function useToggleLike(postId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      studentId,
      hasLiked,
      myLikeId,
    }: {
      studentId: string;
      hasLiked: boolean;
      myLikeId: string | null;
    }) => {
      if (hasLiked && myLikeId) {
        // Unlike — delete the existing row
        const { error } = await supabase
          .from('Likes')
          .delete()
          .eq('id', myLikeId);

        if (error) throw error;
      } else {
        // Like — insert a new row
        const { error } = await supabase
          .from('Likes')
          .insert({ post_id: postId, student_id: studentId });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['likes', postId] });
    },
  });
}