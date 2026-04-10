import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';

import DashboardScreen from './app/screens/DashboardScreen/DashboardScreen';
import { QueryProvider } from './app/providers/QueryProvider';
import { supabase } from './app/utils/supabase';
import { useAuthStore } from './app/stores/authStore';

export default function App() {
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
  }, [clear, setSession]);

  return (
    <SafeAreaProvider>

      {/* Ensures status bar is visible and styled */}
      <StatusBar style="light" />

      <QueryProvider>

        {/* Prevent keyboard from covering inputs */}
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >

          {/* Tap outside inputs to dismiss keyboard */}
          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <DashboardScreen />
          </TouchableWithoutFeedback>

        </KeyboardAvoidingView>

      </QueryProvider>
    </SafeAreaProvider>
  );
}