import { create } from 'zustand';

interface UIState {
  activeModal:       string | null;
  selectedCandidate: string | null;  // candidateId for profile modal
  openModal:  (name: string, candidateId?: string | null) => void;
  closeModal: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeModal:       null,
  selectedCandidate: null,
  openModal:  (name, candidateId = null) =>
    set({ activeModal: name, selectedCandidate: candidateId }),
  closeModal: () => set({ activeModal: null, selectedCandidate: null }),
}));