import 'react-native-gesture-handler'; // MUST be the very first import
import { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { QueryProvider } from './app/providers/QueryProvider';
import { RootNavigator } from './app/navigation/RootNavigator';
import { supabase } from './app/utils/supabase';
import { useAuthStore } from './app/stores/authStore';

export default function App() {
  const { setSession, clear } = useAuthStore();

  useEffect(() => {
    // Restore session on app launch — same logic as the old _layout.tsx
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Listen for sign-in / sign-out events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session) setSession(session);
        else clear();
      }
    );

    return () => subscription.unsubscribe();
  }, [clear, setSession]);

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