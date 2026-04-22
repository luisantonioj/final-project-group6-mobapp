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
  const { session, initialized } = useAuthStore();

  // Determine which screen to land on after splash
  const postSplash = initialized && session ? 'App' : 'Login';

  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false, animation: 'fade' }}
      initialRouteName="Splash"
    >
      {/* Splash always mounts first — it calls navigation.replace() when done */}
      <Stack.Screen
        name="Splash"
        component={SplashScreen}
        // Pass postSplash as an initialParam so SplashScreen knows where to go
        initialParams={{ redirectTo: postSplash }}
      />

      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="App"   component={AppNavigator} />
    </Stack.Navigator>
  );
}
