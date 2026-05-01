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
import { useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore }   from '../stores/authStore';
import { SplashScreen }   from '../screens/SplashScreen';
import { LoginScreen }    from '../screens/LoginScreen';
import { AppNavigator }   from './AppNavigator';
import { AdminNavigator } from './AdminNavigator';
import type { RootStackParamList } from './types';
import { View } from 'react-native';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { session, role, activeRole, initialized, splashReady } = useAuthStore();

  console.log('RootNavigator:', { splashReady, initialized, role, activeRole, session: !!session });

  if (!splashReady) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
      </Stack.Navigator>
    );
  }

  if (!initialized) {
    return <View style={{ flex: 1, backgroundColor: '#0A0F0A' }} />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
          {!session || !role ? (
      <Stack.Screen name="Login" component={LoginScreen} />
    ) : activeRole === 'Admin' ? (
      <Stack.Screen name="Admin" component={AdminNavigator} />
    ) : (
      <Stack.Screen name="App"   component={AppNavigator} />
    )}
    </Stack.Navigator>
  );
}