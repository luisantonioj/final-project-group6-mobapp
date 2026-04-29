// hooks/useComments.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../utils/supabase';

// =============================================================================
// TYPES
// =============================================================================

export interface Comment {
  id: string;
  post_id: string;
  parent_id: string | null;
  student_id: string;
  content: string;
  created_at: string;
  // Derived on the client — always 'Anonymous' until names are wired
  authorName: string;
  authorInitials: string;
  replies: Comment[];
}

interface RawComment {
  id: string;
  post_id: string;
  parent_id: string | null;
  student_id: string;
  content: string;
  created_at: string;
}

// =============================================================================
// HELPERS
// =============================================================================

/** Nest flat comment rows into a tree (one level of replies only) */
function nestComments(rows: RawComment[]): Comment[] {
  const map = new Map<string, Comment>();

  // First pass — build all nodes
  rows.forEach(row => {
    map.set(row.id, {
      ...row,
      authorName:     'Anonymous',
      authorInitials: 'AN',
      replies:        [],
    });
  });

  const roots: Comment[] = [];

  // Second pass — attach replies to parents
  rows.forEach(row => {
    const node = map.get(row.id)!;
    if (row.parent_id && map.has(row.parent_id)) {
      map.get(row.parent_id)!.replies.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}

// =============================================================================
// HOOK: READ COMMENTS
// =============================================================================

export function useComments(postId: string) {
  return useQuery({
    queryKey: ['comments', postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('Comments')
        .select('id, post_id, parent_id, student_id, content, created_at')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return nestComments((data ?? []) as RawComment[]);
    },
    enabled: !!postId,
  });
}

// =============================================================================
// HOOK: CREATE COMMENT / REPLY
// =============================================================================

export function useCreateComment(postId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      content,
      studentId,
      parentId = null,
    }: {
      content: string;
      studentId: string;
      parentId?: string | null;
    }) => {
      const { data, error } = await supabase
        .from('Comments')
        .insert({ post_id: postId, parent_id: parentId, student_id: studentId, content })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comments', postId] });
    },
  });
}

// =============================================================================
// HOOK: DELETE COMMENT
// =============================================================================

export function useDeleteComment(postId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase
        .from('Comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comments', postId] });
    },
  });
}