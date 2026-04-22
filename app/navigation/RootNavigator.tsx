/**
 * RootNavigator.tsx — Top-level navigation gate
 * ─────────────────────────────────────────────────────────────────────────────
 * Flow:
 *   1. App launches → SplashScreen plays (always, even if already logged in)
 *   2. SplashScreen calls onDone() after its animation finishes
 *   3. RootNavigator checks authStore:
 *      - session exists  → replace with 'App'   (bottom tabs)
 *      - no session      → replace with 'Login'
 *
 * SplashScreen drives the transition — not a timer here. This lets the
 * animation fully complete before any auth state change causes a jump.
 *
 * After login: App.tsx's onAuthStateChange sets session → this navigator
 * re-renders → 'App' screen is shown. No navigate() call needed from LoginScreen.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore }  from '../stores/authStore';
import { SplashScreen }  from '../screens/SplashScreen';
import { LoginScreen }   from '../screens/LoginScreen';
import { AppNavigator }  from './AppNavigator';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { session, role, initialized } = useAuthStore();

  // Not ready yet — keep showing Splash (it will never call replace())
  if (!initialized) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="Splash" component={SplashScreen}
          initialParams={{ redirectTo: 'Login' }} />
      </Stack.Navigator>
    );
  }

  // Auth resolved — show the right screen declaratively
  // Splash is gone; React Navigation handles the transition
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
      {session && role ? (
        <Stack.Screen name="App" component={AppNavigator} />
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
}