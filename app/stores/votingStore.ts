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