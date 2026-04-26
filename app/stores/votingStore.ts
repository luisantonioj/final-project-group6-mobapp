/**
 * votingStore.ts — Local voting selection state
 * ─────────────────────────────────────────────────────────────────────────────
 * Tracks which candidate a student has selected per position BEFORE submission.
 * This state is local only — nothing is written to Supabase until VoteConfirmScreen
 * calls useCastVote() for each selection.
 *
 * USAGE IN BALLOT SCREENS:
 * ─────────────────────────────────────────────────────────────────────────────
 *   const { selectedCandidates, selectCandidate, reset } = useVotingStore();
 *
 *   // Select a candidate for a position:
 *   selectCandidate(positionId, candidateId);
 *
 *   // Check if a position already has a selection:
 *   const hasVoted = !!selectedCandidates[positionId];
 *
 *   // After successful submission in VoteConfirmScreen:
 *   reset(); // clears all selections
 *
 * NOTE: This store does NOT persist across app restarts. If the student
 * closes the app mid-voting, their selections are lost. This is intentional
 * — the UNIQUE DB constraint prevents accidental double-votes anyway.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { create } from 'zustand';

interface VotingState {
  currentPositionIndex: number;
  selectedCandidates:   Record<string, string>; // positionId → candidateId
  isSubmitting:         boolean;
  setPositionIndex:  (i: number) => void;
  selectCandidate:   (positionId: string, candidateId: string) => void;
  clearSelection:    (positionId: string) => void;
  setSubmitting:     (v: boolean) => void;
  reset:             () => void;
}

export const useVotingStore = create<VotingState>((set) => ({
  currentPositionIndex: 0,
  selectedCandidates:   {},
  isSubmitting:         false,
  setPositionIndex: (i) => set({ currentPositionIndex: i }),
  selectCandidate:  (positionId, candidateId) =>
    set((s) => ({
      selectedCandidates: { ...s.selectedCandidates, [positionId]: candidateId },
    })),
  clearSelection: (positionId) =>
    set((s) => {
      const next = { ...s.selectedCandidates };
      delete next[positionId];
      return { selectedCandidates: next };
    }),
  setSubmitting: (v) => set({ isSubmitting: v }),
  reset: () => set({ currentPositionIndex: 0, selectedCandidates: {}, isSubmitting: false }),
}));