// app/_layout.tsx
import { useEffect } from 'react';
import { Slot } from 'expo-router';
import { QueryProvider } from './providers/QueryProvider';
import { supabase } from './utils/supabase';
import { useAuthStore } from './stores/authStore';

export default function RootLayout() {
  const { setSession, clear } = useAuthStore();

  useEffect(() => {
    // Restore session on app launch
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
    // Listen for sign in / sign out
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session) setSession(session);
        else clear();
      }
    );
    return () => subscription.unsubscribe();
  }, [clear, setSession]); // Added Zustand actions to dependency array

  return (
    <QueryProvider>
      <Slot /> {/* Slot acts as the placeholder for all app screens */}
    </QueryProvider>
  );
}