import { QueryProvider } from './providers/QueryProvider';
import { useEffect } from 'react';
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
  }, []);

  return (
    <QueryProvider>
      {/* navigation stack goes here */}
    </QueryProvider>
  );
}