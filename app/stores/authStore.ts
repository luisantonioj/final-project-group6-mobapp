import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import type { Database } from '../utils/database.types';

type UserRow = Database['public']['Tables']['Users']['Row'];

interface AuthState {
  session:       Session | null;
  userProfile:   UserRow | null;
  role:          'Admin' | 'Student' | null;
  initialized:   boolean;             
  setSession:    (session: Session | null) => void;
  setProfile:    (profile: UserRow | null) => void;
  setRole:       (role: 'Admin' | 'Student' | null) => void;
  setInitialized:(v: boolean) => void;
  clear:         () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session:       null,
  userProfile:   null,
  role:          null,
  initialized:   false,
  setSession:    (session)     => set({ session }),
  setProfile:    (userProfile) => set({ userProfile }),
  setRole:       (role)        => set({ role }),
  setInitialized:(v)           => set({ initialized: v }),
  clear: () => set({ session: null, userProfile: null, role: null }),
}));