/**
 * App.tsx — AnimoQuorum root
 * ─────────────────────────────────────────────────────────────────────────────
 * Responsibilities:
 *   1. Restore persisted Supabase session on launch
 *   2. Listen for sign-in / sign-out events
 *   3. Request push notification permissions once on mount
 *   4. Wire notification tap listener (cleaned up on unmount)
 *   5. Wire provider tree around RootNavigator
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
import {
  registerForNotificationsAsync,
  addNotificationResponseReceivedListener,
} from './app/notifications/notificationService';
import { useAuthStore }         from './app/stores/authStore';

export default function App() {
  const { setSession, setRole, setProfile, setInitialized, clear } = useAuthStore();

  useEffect(() => {
    // ── 1. Request notification permissions on mount ──────────────────────────
    registerForNotificationsAsync();

    // ── 2. Handle notification tap interactions ───────────────────────────────
    const unsubscribe = addNotificationResponseReceivedListener();

    // ── 3. Restore persisted session ─────────────────────────────────────────
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        setSession(session);
        const { data } = await supabase
          .from('Users')
          .select('*, UserRoles(Roles(role_name))')
          .eq('auth_id', session.user.id)
          .single();
        const roleName = (data as any)?.UserRoles?.[0]?.Roles?.role_name;
        setRole(roleName === 'Admin' ? 'Admin' : 'Student');
        setProfile(data as any);
      }
      setInitialized(true);
    });

    // ── 4. Auth state listener ────────────────────────────────────────────────
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session) {
          setSession(session);
          const { data } = await supabase
            .from('Users')
            .select('*, UserRoles(Roles(role_name))')
            .eq('auth_id', session.user.id)
            .single();
          const roleName = (data as any)?.UserRoles?.[0]?.Roles?.role_name;
          setRole(roleName === 'Admin' ? 'Admin' : 'Student');
          setProfile(data as any);
        } else {
          clear();
        }
      }
    );

    return () => {
      unsubscribe();
      subscription.unsubscribe();
    };
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