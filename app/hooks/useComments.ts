// hooks/useComments.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../utils/supabase';

export interface Comment {
  id:             string;
  post_id:        string;
  parent_id:      string | null;
  student_id:     string;
  content:        string;
  created_at:     string;
  authorName:     string;
  authorInitials: string;
  replies:        Comment[];
}

interface RawCommentRow {
  id:         string;
  post_id:    string;
  parent_id:  string | null;
  student_id: string;
  content:    string;
  created_at: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

function nestComments(rows: RawCommentRow[], nameMap: Record<string, string>): Comment[] {
  const map = new Map<string, Comment>();

  rows.forEach(row => {
    const authorName = nameMap[row.student_id] ?? 'Lasallian';
    map.set(row.id, {
      ...row,
      authorName,
      authorInitials: getInitials(authorName),
      replies: [],
    });
  });

  const roots: Comment[] = [];

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

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useComments(postId: string) {
  return useQuery({
    queryKey: ['comments', postId],
    queryFn: async () => {
      // Step 1: fetch flat comment rows — no join needed
      const { data: rawData, error } = await supabase
        .from('Comments')
        .select('id, post_id, parent_id, student_id, content, created_at')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      const rows = (rawData ?? []) as RawCommentRow[];

      // Step 2: resolve author names via public.Users.auth_id
      // Comments.student_id = auth.uid, Users.auth_id = auth.uid — match on that
      const authIds = [...new Set(rows.map(r => r.student_id))];
      const nameMap: Record<string, string> = {};

      if (authIds.length > 0) {
        const { data: users } = await supabase
          .from('Users')
          .select('auth_id, name')
          .in('auth_id', authIds);

        (users ?? []).forEach((u: { auth_id: string | null; name: string }) => {
          if (u.auth_id) nameMap[u.auth_id] = u.name;
        });
      }

      // Step 3: build nested tree with resolved names
      return nestComments(rows, nameMap);
    },
    enabled: !!postId,
  });
}

export function useCreateComment(postId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      content,
      studentId,
      parentId = null,
    }: {
      content:   string;
      studentId: string;
      parentId?: string | null;
    }) => {
      const { data, error } = await supabase
        .from('Comments')
        .insert({
          post_id:    postId,
          parent_id:  parentId,
          student_id: studentId,
          content,
        } as any) // ← cast needed until types are regenerated with parent_id
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['comments', postId] }),
  });
}

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
    onSuccess: () => qc.invalidateQueries({ queryKey: ['comments', postId] }),
  });
}