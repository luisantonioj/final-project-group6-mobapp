// hooks/useLikes.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../utils/supabase';

// ─── Local type matching the Likes table schema ───────────────────────────────
interface LikeRow {
  id:         string;
  post_id:    string;
  student_id: string;
  created_at: string;
}

export function useLikes(postId: string, userId: string | null) {
  return useQuery({
    queryKey: ['likes', postId, userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('Likes')
        .select('id, student_id')
        .eq('post_id', postId);

      if (error) throw error;

      // ✅ Cast to our local type — fixes "student_id does not exist" error
      const likes = (data ?? []) as Pick<LikeRow, 'id' | 'student_id'>[];

      const count    = likes.length;
      const hasLiked = userId ? likes.some(l => l.student_id === userId) : false;
      const myLikeId = userId ? (likes.find(l => l.student_id === userId)?.id ?? null) : null;

      return { count, hasLiked, myLikeId };
    },
    enabled: !!postId,
  });
}

export function useToggleLike(postId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      studentId,
      hasLiked,
      myLikeId,
    }: {
      studentId: string;
      hasLiked:  boolean;
      myLikeId:  string | null;
    }) => {
      if (hasLiked && myLikeId) {
        const { error } = await supabase
          .from('Likes')
          .delete()
          .eq('id', myLikeId);

        if (error) throw error;
      } else {
        // ✅ Cast insert payload — fixes "post_id not assignable" error
        const { error } = await supabase
          .from('Likes')
          .insert({ post_id: postId, student_id: studentId } as any);

        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['likes', postId] }),
  });
}