/**
 * App.tsx — AnimoQuorum root
 * ─────────────────────────────────────────────────────────────────────────────
 * Responsibilities:
 *   1. Restore persisted Supabase session on launch
 *   2. Listen for sign-in / sign-out events
 *   3. Request push notification permissions once
 *   4. Wire provider tree around RootNavigator
 *
 * Navigation is fully automatic:
 *   • SplashScreen reads authStore.initialized + session to decide where to go
 *   • LoginScreen never calls navigation.navigate() — onAuthStateChange handles it
 *   • ProfileScreen calls supabase.auth.signOut() → clear() → back to Login
 * ─────────────────────────────────────────────────────────────────────────────
 */
import 'react-native-gesture-handler'; // MUST be first import
import { useEffect }            from 'react';
import { NavigationContainer }  from '@react-navigation/native';
import { SafeAreaProvider }     from 'react-native-safe-area-context';
import { StatusBar }            from 'expo-status-bar';

import { QueryProvider }        from './app/providers/QueryProvider';
import { RootNavigator }        from './app/navigation/RootNavigator';
import { supabase }             from './app/utils/supabase';
import { setupNotifications }   from './app/utils/notifications';
import { useAuthStore }         from './app/stores/authStore';

export default function App() {
  const { setSession, setRole, setProfile, setInitialized, clear } = useAuthStore();

  useEffect(() => {
    // ── 1. Request notification permissions ──────────────────────────────────
    setupNotifications();

    // ── 2. Restore persisted session ─────────────────────────────────────────
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        setSession(session);
        // Fetch role + profile so RootNavigator routes to correct tab tree
        const { data } = await supabase
          .from('Users')
          .select('*, UserRoles(Roles(role_name))')
          .eq('auth_id', session.user.id)
          .single();
        const roleName = (data as any)?.UserRoles?.[0]?.Roles?.role_name;
        setRole(roleName === 'Admin' ? 'Admin' : 'Student');
        setProfile(data as any);
      }
      // MUST call even when session is null — SplashScreen waits for this
      setInitialized(true);
    });

    // ── 3. Auth state listener ────────────────────────────────────────────────
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session) setSession(session);
        else clear();
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <QueryProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </QueryProvider>
    </SafeAreaProvider>
  );
}
