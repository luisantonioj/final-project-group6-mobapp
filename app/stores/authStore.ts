// /**
//  * authStore.ts — Zustand global auth state
//  * ─────────────────────────────────────────────────────────────────────────────
//  * Central store for authentication. Every screen that needs to know who is
//  * logged in (or whether anyone is logged in) reads from here.
//  *
//  * STATE FIELDS:
//  *   session       — The raw Supabase Session object. Non-null = someone is
//  *                   logged in. session.user.id is the auth.users UUID.
//  *   userProfile   — The Users table row for the logged-in student/admin.
//  *                   Set this after login by querying the Users table with
//  *                   auth_id = session.user.id.
//  *   role          — 'Admin' | 'Student' | null. Drives which navigator tree
//  *                   RootNavigator mounts. Set this from UserRoles after login.
//  *   initialized   — Starts false. Flipped to true by App.tsx after
//  *                   supabase.auth.getSession() resolves (even if no session).
//  *                   RootNavigator shows a spinner until this is true.
//  *
//  * HOW TO USE IN SCREENS:
//  *   const { session, role, userProfile } = useAuthStore();
//  *
//  * HOW TO SIGN OUT (from ProfileScreen or any screen):
//  *   const { clear } = useAuthStore();
//  *   await supabase.auth.signOut();  // triggers onAuthStateChange in App.tsx
//  *   // clear() is called automatically by App.tsx's onAuthStateChange handler
//  *   // RootNavigator will switch to Auth stack automatically — no navigate() needed
//  *
//  * ROLE LOADING FLOW:
//  *   1. LoginScreen calls supabase.auth.signInWithPassword()
//  *   2. App.tsx's onAuthStateChange fires → setSession(session)
//  *   3. Fetch role: supabase.from('Users').select('UserRoles(Roles(role_name))')
//  *   4. Call setRole('Admin') or setRole('Student')
//  *   5. RootNavigator sees role change and mounts the correct navigator tree
//  * ─────────────────────────────────────────────────────────────────────────────
//  */
// import { create } from 'zustand';
// import type { Session } from '@supabase/supabase-js';
// import type { Database } from '../utils/database.types';

// type UserRow = Database['public']['Tables']['Users']['Row'];

// interface AuthState {
//   session:        Session | null;
//   userProfile:    UserRow | null;
//   role:           'Admin' | 'Student' | null;
//   initialized:    boolean;
//   setSession:     (session: Session | null) => void;
//   setProfile:     (profile: UserRow | null) => void;
//   setRole:        (role: 'Admin' | 'Student' | null) => void;
//   setInitialized: (v: boolean) => void;
//   clear:          () => void;
//   splashReady:    boolean;
//   setSplashReady: (v: boolean) => void;
//   activeRole: 'Admin' | 'Student' | null;
//   setActiveRole: (role: 'Admin' | 'Student' | null) => void;
// }

// export const useAuthStore = create<AuthState>((set) => ({
//   session:        null,
//   userProfile:    null,
//   role:           null,
//   activeRole:     null,
//   initialized:    false,
//   setSession:     (session)     => set({ session }),
//   setProfile:     (userProfile) => set({ userProfile }),
//   setRole:        (role)        => set({ role }),
//   setInitialized: (v)           => set({ initialized: v }),
//   setActiveRole: (activeRole)   => set({ activeRole }),
//   // clear() resets everything except initialized — the app stays mounted,
//   // only the auth state is wiped. RootNavigator switches to Auth stack.
//   splashReady:    false,
//   setSplashReady: (v) => set({ splashReady: v }),
//   clear: () => set({ session: null, userProfile: null, role: null, activeRole: null }),
// }));

/**
 * authStore.ts — Zustand global auth state (Clerk edition)
 * ─────────────────────────────────────────────────────────────────────────────
 * session is now a lightweight { user: { id, email } } derived from Clerk,
 * NOT a Supabase Session. RootNavigator, ProfileScreen, and AdminSettingsScreen
 * all just check session truthiness or access session.user.id / session.user.email
 * — all of which still work with this shape.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { create } from 'zustand';
import type { Database } from '../utils/database.types';

type UserRow = Database['public']['Tables']['Users']['Row'];

// Matches the subset of Supabase Session used across screens
type ClerkSession = { user: { id: string; email?: string | null } };

interface AuthState {
  session:        ClerkSession | null;
  userProfile:    UserRow | null;
  role:           'Admin' | 'Student' | null;
  initialized:    boolean;
  setSession:     (session: ClerkSession | null) => void;
  setProfile:     (profile: UserRow | null) => void;
  setRole:        (role: 'Admin' | 'Student' | null) => void;
  setInitialized: (v: boolean) => void;
  clear:          () => void;
  splashReady:    boolean;
  setSplashReady: (v: boolean) => void;
  activeRole:     'Admin' | 'Student' | null;
  setActiveRole:  (role: 'Admin' | 'Student' | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session:        null,
  userProfile:    null,
  role:           null,
  activeRole:     null,
  initialized:    false,
  setSession:     (session)     => set({ session }),
  setProfile:     (userProfile) => set({ userProfile }),
  setRole:        (role)        => set({ role }),
  setInitialized: (v)           => set({ initialized: v }),
  setActiveRole:  (activeRole)  => set({ activeRole }),
  splashReady:    false,
  setSplashReady: (v)           => set({ splashReady: v }),
  clear: () => set({ session: null, userProfile: null, role: null, activeRole: null }),
}));