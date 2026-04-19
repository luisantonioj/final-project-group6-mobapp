import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';

import { useAuthStore } from '../stores/authStore';
import { AuthNavigator }    from './AuthNavigator';
import { StudentNavigator } from './StudentNavigator';
import { AdminNavigator }   from './AdminNavigator';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { session, role, initialized } = useAuthStore();

  // Show a spinner only while App.tsx is waiting for getSession() to resolve.
  // Once initialized = true, we know the real auth state and can route correctly.
  // This prevents the login screen from flashing on app launch for logged-in users,
  // and also prevents the spinner from showing forever when the user is logged out.
  if (!initialized) {
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