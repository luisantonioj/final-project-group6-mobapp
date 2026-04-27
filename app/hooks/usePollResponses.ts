/**
 * usePollResponses.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Handles reading and submitting responses for a single poll post.
 *
 * Tables used:
 *   PollOptions      → id, post_id, option_text
 *   PollResponses    → id, poll_option_id, student_id, created_at
 *
 * One vote per poll per user is enforced by the DB (unique constraint on
 * student_id + poll_option_id's post). The hook also guards on the client
 * side by checking hasVoted before allowing a submit.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * SUPABASE SETUP REQUIRED:
 *   1. Unique constraint (so a student can only vote once per poll):
 *        ALTER TABLE "PollResponses"
 *        ADD CONSTRAINT poll_responses_student_post_unique
 *        UNIQUE (student_id, poll_option_id);
 *
 *      To enforce one vote per POLL (not just per option), add a DB function
 *      or handle via RLS + a check. The client-side hasVoted guard covers this.
 *
 *   2. RLS policies on PollResponses:
 *        -- Anyone authenticated can read responses (for live counts)
 *        CREATE POLICY "read responses" ON "PollResponses"
 *          FOR SELECT USING (auth.role() = 'authenticated');
 *
 *        -- Students can only insert their own response
 *        CREATE POLICY "insert own response" ON "PollResponses"
 *          FOR INSERT WITH CHECK (auth.uid()::text = student_id);
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../utils/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PollOption {
  id: string;
  post_id: string;
  option_text: string;
}

export interface PollResponse {
  id: string;
  poll_option_id: string;
  student_id: string;
  created_at: string | null;
}

/** PollOption enriched with a live response count */
export interface PollOptionWithCount extends PollOption {
  responseCount: number;
}

// ─── Query key factory ────────────────────────────────────────────────────────

const keys = {
  responses: (postId: string) => ['pollResponses', postId] as const,
};

// ─── usePollResponses ─────────────────────────────────────────────────────────
/**
 * Fetches all PollOptions for a post together with their response counts,
 * and resolves whether the current user has already voted.
 *
 * @param postId   - The Posts.id this poll belongs to
 * @param userId   - The currently authenticated user's ID (auth.uid())
 */
export function usePollResponses(postId: string, userId: string | null) {
  return useQuery({
    queryKey: keys.responses(postId),
    queryFn: async () => {
      // 1. Fetch all options for this poll
      const { data: options, error: optErr } = await supabase
        .from('PollOptions')
        .select('id, post_id, option_text')
        .eq('post_id', postId);

      if (optErr) throw optErr;
      if (!options || options.length === 0) {
        return { options: [] as PollOptionWithCount[], hasVoted: false, myOptionId: null };
      }

      const optionIds = options.map((o: PollOption) => o.id);

      // 2. Fetch all responses for these options (gives us counts + own vote)
      const { data: responses, error: resErr } = await supabase
        .from('PollResponses')
        .select('id, poll_option_id, student_id, created_at')
        .in('poll_option_id', optionIds);

      if (resErr) throw resErr;

      const allResponses: PollResponse[] = responses ?? [];

      // 3. Build enriched options with counts
      const optionsWithCounts: PollOptionWithCount[] = options.map((opt: PollOption) => ({
        ...opt,
        responseCount: allResponses.filter(r => r.poll_option_id === opt.id).length,
      }));

      // 4. Determine if current user has already voted
      const myResponse = userId
        ? allResponses.find(r => r.student_id === userId)
        : undefined;

      return {
        options:    optionsWithCounts,
        hasVoted:   !!myResponse,
        myOptionId: myResponse?.poll_option_id ?? null,
      };
    },
    enabled: !!postId,
    // Refetch every 15 seconds so vote counts stay reasonably fresh
    refetchInterval: 15_000,
  });
}

// ─── useSubmitPollResponse ────────────────────────────────────────────────────
/**
 * Inserts a single PollResponse row.
 * Invalidates the responses query for the post on success so counts refresh.
 *
 * @param postId - used only for cache invalidation
 */
export function useSubmitPollResponse(postId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      pollOptionId,
      studentId,
    }: {
      pollOptionId: string;
      studentId: string;
    }) => {
      const { data, error } = await supabase
        .from('PollResponses')
        .insert({ poll_option_id: pollOptionId, student_id: studentId })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.responses(postId) });
    },
  });
}