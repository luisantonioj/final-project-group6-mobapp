import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';

import { useAuthStore } from '../stores/authStore';
import { AuthNavigator }    from './AuthNavigator';
import { StudentNavigator } from './StudentNavigator';
import { AdminNavigator }   from './AdminNavigator';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { session, role } = useAuthStore();

  // Show a spinner while Supabase resolves the persisted session.
  // session starts as null; once getSession() resolves in App.tsx
  // the store updates and this re-renders.
  const isLoading = session === null && role === null;

  // Distinguish "loading" from "truly logged out":
  // Use a short initializing flag if needed, or rely on session being
  // explicitly set to null after clear() is called.
  // For now: if no session, show Auth.
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0F6E56" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!session ? (
        // ── Not authenticated ──────────────────────────────────────────────
        <Stack.Screen name="Auth" component={AuthNavigator} />
      ) : role === 'Admin' ? (
        // ── Admin ─────────────────────────────────────────────────────────
        <Stack.Screen name="Admin" component={AdminNavigator} />
      ) : (
        // ── Student (default for any authenticated non-Admin user) ─────────
        <Stack.Screen name="Student" component={StudentNavigator} />
      )}
    </Stack.Navigator>
  );
}