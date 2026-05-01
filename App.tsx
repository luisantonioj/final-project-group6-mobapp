/**
 * App.tsx — AnimoQuorum root (Clerk edition)
 * ─────────────────────────────────────────────────────────────────────────────
 * Auth is now handled by Clerk. After Google OAuth:
 *   1. Clerk sets isSignedIn = true
 *   2. AppContent fetches the user profile from Supabase DB via Clerk JWT
 *   3. authStore is populated → RootNavigator shows the correct screen
 * ─────────────────────────────────────────────────────────────────────────────
 */
import 'react-native-gesture-handler';
import { useEffect }             from 'react';
import { NavigationContainer }   from '@react-navigation/native';
import { SafeAreaProvider }      from 'react-native-safe-area-context';
import { StatusBar }             from 'expo-status-bar';
import { ClerkProvider, useAuth, useUser } from '@clerk/clerk-expo';
import * as SecureStore          from 'expo-secure-store';
import { QueryProvider }         from './app/providers/QueryProvider';
import { RootNavigator }         from './app/navigation/RootNavigator';
import { createAuthedClient }    from './app/utils/createAuthedClient';
import {
  registerForNotificationsAsync,
  addNotificationResponseReceivedListener,
} from './app/notifications/notificationService';
import { useAuthStore }  from './app/stores/authStore';
import { hydrateTheme }  from './app/stores/themeStore';

// ── Clerk token cache using expo-secure-store (already in project) ────────────
const tokenCache = {
  async getToken(key: string) {
    try { return await SecureStore.getItemAsync(key); } catch { return null; }
  },
  async saveToken(key: string, value: string) {
    try { await SecureStore.setItemAsync(key, value); } catch {}
  },
  async clearToken(key: string) {
    try { await SecureStore.deleteItemAsync(key); } catch {}
  },
};

// ── Root: ClerkProvider wraps everything ──────────────────────────────────────
export default function App() {
  return (
    <ClerkProvider
      publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!}
      tokenCache={tokenCache}
    >
      <AppContent />
    </ClerkProvider>
  );
}

// ── Inner app: can now use Clerk hooks ────────────────────────────────────────
function AppContent() {
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const { user } = useUser();
  const {
    setSession, setRole, setActiveRole,
    setProfile, setInitialized, clear,
  } = useAuthStore();

  // ── One-time side effects (notifications, theme) ──────────────────────────
  useEffect(() => {
    hydrateTheme();
    registerForNotificationsAsync();
    const unsubscribe = addNotificationResponseReceivedListener();
    return () => unsubscribe();
  }, []);

  // ── React to Clerk sign-in / sign-out ─────────────────────────────────────
  useEffect(() => {
    if (!isLoaded) return; // Clerk not ready yet

    if (!isSignedIn || !user) {
      clear();
      setInitialized(true);
      return;
    }

    const loadProfile = async () => {
      try {
        // 1. Get a Clerk JWT scoped for Supabase (requires "supabase" template in Clerk dashboard)
        const clerkToken = await getToken({ template: 'supabase' });
        if (!clerkToken) throw new Error('Could not retrieve auth token.');

        const db = createAuthedClient(clerkToken);
        const email = user.primaryEmailAddress?.emailAddress ?? '';

        // 2. Set the lightweight session (keeps session.user.id working in other screens)
        setSession({ user: { id: user.id, email } });

        // 3. Fetch user profile from Supabase (auth_id now stores Clerk user ID)
        const { data: userData, error: userError } = await db
          .from('Users')
          .select('*')
          .eq('auth_id', user.id)
          .single();

        if (userError || !userData) {
          // First Google sign-in — create the user row
          const { data: newUser, error: insertError } = await db
            .from('Users')
            .insert({ auth_id: user.id, email, name: user.fullName ?? email })
            .select()
            .single();

          if (insertError) throw new Error(insertError.message);
          setProfile(newUser as any);
          setRole('Student');
          setActiveRole('Student');
        } else {
          // 4. Fetch roles
          const { data: rolesData } = await db
            .from('UserRoles')
            .select('Roles(role_name)')
            .eq('user_id', userData.id);

          const roleNames  = (rolesData ?? []).map((ur: any) => ur?.Roles?.role_name);
          const roleName   = roleNames.includes('Admin') ? 'Admin' : (roleNames[0] ?? 'Student');
          setRole(roleName as 'Admin' | 'Student');
          setActiveRole(roleName as 'Admin' | 'Student');
          setProfile(userData as any);
        }
      } catch (e) {
        console.error('Auth error:', e);
        clear();
      } finally {
        setInitialized(true);
      }
    };

    loadProfile();
  }, [isLoaded, isSignedIn, user?.id]);

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