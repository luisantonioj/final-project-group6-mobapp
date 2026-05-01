/**
 * candidateStore.ts — Zustand store for candidate UI state
 * ─────────────────────────────────────────────────────────────────────────────
 * This store manages LOCAL UI state only (selected candidates, pending votes).
 * All candidate and position DATA now comes from Supabase via hooks:
 *
 *   Departments  → useDepartments()     (app/hooks/useDepartments.ts)
 *   Positions    → usePositions()       (app/hooks/usePositions.ts)
 *   Ballot       → get_ballot_positions RPC via useBallot()
 *   Candidates   → useCandidates()      (app/hooks/useCandidates.ts — unchanged)
 *
 * The hardcoded DEPARTMENTS, EXECUTIVE_POSITIONS, DEPARTMENT_POSITIONS,
 * and POSITION_IDS constants have been removed. Do not re-add them.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { create } from 'zustand';

// ─── Types ────────────────────────────────────────────────────────────────────

/** Matches the shape returned by the get_ballot_positions RPC. */
export interface BallotCandidate {
  id:          string;
  name:        string;
  partylist:   string | null;
  photo_url:   string | null;
  email:       string | null;
  credentials: string | null;
  platform:    string | null;
}

export interface BallotPosition {
  position_id:     string;
  position_name:   string;
  is_executive:    boolean;
  display_order:   number;
  department_name: string | null;
  candidates:      BallotCandidate[] | null;
}

// ─── Store ────────────────────────────────────────────────────────────────────

interface CandidateStore {
  /** Map of position_id → candidate_id the student has selected on the ballot. */
  selections: Record<string, string>;

  /** Whether the student has submitted their ballot for the current session. */
  hasSubmitted: boolean;

  setSelection:    (positionId: string, candidateId: string) => void;
  removeSelection: (positionId: string) => void;
  clearSelections: () => void;
  markSubmitted:   () => void;
  resetSession:    () => void;
}

export const useCandidateStore = create<CandidateStore>((set) => ({
  selections:   {},
  hasSubmitted: false,

  setSelection: (positionId, candidateId) =>
    set(s => ({ selections: { ...s.selections, [positionId]: candidateId } })),

  removeSelection: (positionId) =>
    set(s => {
      const next = { ...s.selections };
      delete next[positionId];
      return { selections: next };
    }),

  clearSelections: () => set({ selections: {} }),

  markSubmitted: () => set({ hasSubmitted: true }),

  resetSession: () => set({ selections: {}, hasSubmitted: false }),
}));
