/**
 * LoginScreen.tsx — Login + Sign Up (single screen, two tabs)
 * ─────────────────────────────────────────────────────────────────────────────
 * Students toggle between Log In and Sign Up using the pill selector at the top.
 * After a successful login or registration, App.tsx's onAuthStateChange fires
 * automatically and RootNavigator replaces this screen with the App (tabs).
 * You never need to call navigation.navigate() after auth succeeds.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  Animated,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar }     from 'expo-status-bar';
import { Ionicons }      from '@expo/vector-icons';
import { supabase }      from '../utils/supabase';
import { T }             from '../theme';

type Mode = 'login' | 'signup';

export function LoginScreen() {
  const [mode,     setMode]     = useState<Mode>('login');
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPass]     = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const switchMode = (next: Mode) => {
    if (next === mode) return;
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 120, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
    ]).start();
    setMode(next);
    setError(null);
    setName(''); setEmail(''); setPass('');
  };

  const validate = () => {
    if (mode === 'signup' && !name.trim())
      return 'Full name is required.';
    if (!email.trim() || !email.includes('@'))
      return 'Enter a valid email address.';
    if (password.length < 6)
      return 'Password must be at least 6 characters.';
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setLoading(true);
    setError(null);

    try {
      if (mode === 'login') {
        const { error: authErr } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });
        if (authErr) throw new Error(authErr.message);
      } else {
        const { error: authErr } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
          options: { data: { name: name.trim() } },
        });
        if (authErr) throw new Error(authErr.message);
      }
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar style="dark" />
      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        enableOnAndroid
        enableAutomaticScroll
        extraScrollHeight={48}
        keyboardOpeningTime={0}
      >
            {/* ── App name ── */}
            <View style={s.header}>
              <View style={s.logoBadge}>
                <Text style={s.logoLetters}>AQ</Text>
              </View>
              <Text style={s.appName}>AnimoQuorum</Text>
              <Text style={s.tagline}>DLSL COMELEC · Student Elections</Text>
            </View>

            {/* ── Mode toggle ── */}
            <View style={s.modeToggle}>
              {(['login', 'signup'] as Mode[]).map(m => (
                <Pressable
                  key={m}
                  style={({ pressed }) => [
                    s.modeBtn,
                    mode === m && s.modeBtnActive,
                    pressed && { opacity: 0.85 },
                  ]}
                  onPress={() => switchMode(m)}
                >
                  <Text style={[s.modeBtnText, mode === m && s.modeBtnTextActive]}>
                    {m === 'login' ? 'Log In' : 'Sign Up'}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* ── Form fields ── */}
            <Animated.View style={[s.form, { opacity: fadeAnim }]}>

              {mode === 'signup' && (
                <View style={s.fieldGroup}>
                  <Text style={s.label}>Full Name</Text>
                  <View style={s.inputRow}>
                    <Ionicons name="person-outline" size={16} color={T.textMuted} style={s.inputIcon} />
                    <TextInput
                      style={s.input}
                      value={name}
                      onChangeText={setName}
                      placeholder="e.g. Juan dela Cruz"
                      placeholderTextColor={T.textMuted}
                      autoCapitalize="words"
                      returnKeyType="next"
                    />
                  </View>
                </View>
              )}

              <View style={s.fieldGroup}>
                <Text style={s.label}>School Email</Text>
                <View style={s.inputRow}>
                  <Ionicons name="mail-outline" size={16} color={T.textMuted} style={s.inputIcon} />
                  <TextInput
                    style={s.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="student@dlsl.edu.ph"
                    placeholderTextColor={T.textMuted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="next"
                  />
                </View>
              </View>

              <View style={s.fieldGroup}>
                <Text style={s.label}>Password</Text>
                <View style={s.inputRow}>
                  <Ionicons name="lock-closed-outline" size={16} color={T.textMuted} style={s.inputIcon} />
                  <TextInput
                    style={[s.input, { flex: 1 }]}
                    value={password}
                    onChangeText={setPass}
                    placeholder={mode === 'signup' ? 'At least 6 characters' : '••••••••'}
                    placeholderTextColor={T.textMuted}
                    secureTextEntry={!showPass}
                    autoCapitalize="none"
                    returnKeyType="done"
                    onSubmitEditing={handleSubmit}
                  />
                  <Pressable onPress={() => setShowPass(v => !v)} style={({ pressed }) => [s.eyeBtn, pressed && { opacity: 0.7 }]}>
                    <Ionicons
                      name={showPass ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color={T.textMuted}
                    />
                  </Pressable>
                </View>
              </View>

              {error && (
                <View style={s.errorBox}>
                  <Ionicons name="alert-circle-outline" size={15} color={T.red} />
                  <Text style={s.errorText}>{error}</Text>
                </View>
              )}

              <Pressable
                style={({ pressed }) => [s.submitBtn, loading && { opacity: 0.65 }, !loading && pressed && { opacity: 0.85 }]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={s.submitBtnText}>
                      {mode === 'login' ? 'Log In' : 'Create Account'}
                    </Text>
                }
              </Pressable>

              <Pressable
                style={({ pressed }) => [s.switchHint, pressed && { opacity: 0.75 }]}
                onPress={() => switchMode(mode === 'login' ? 'signup' : 'login')}
              >
                <Text style={s.switchHintText}>
                  {mode === 'login'
                    ? "New student? Create an account"
                    : "Already registered? Log in"}
                </Text>
              </Pressable>

            </Animated.View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: T.bg },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 28, paddingVertical: 40 },

  // Header
  header:      { alignItems: 'center', marginBottom: 36 },
  logoBadge: {
    width: 64, height: 64, borderRadius: 18,
    backgroundColor: T.green,
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
    shadowColor: T.green, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 10, elevation: 6,
  },
  logoLetters: { fontSize: 24, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  appName:     { fontSize: 24, fontWeight: '800', color: T.text, letterSpacing: -0.3 },
  tagline:     { fontSize: 11, color: T.textMuted, marginTop: 4, letterSpacing: 0.6,
                 textTransform: 'uppercase' },

  // Mode toggle
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: T.surface2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: T.border,
    padding: 4,
    marginBottom: 28,
  },
  modeBtn:           { flex: 1, paddingVertical: 9, borderRadius: 9, alignItems: 'center' },
  modeBtnActive:     { backgroundColor: T.green },
  modeBtnText:       { fontSize: 14, fontWeight: '600', color: T.textMuted },
  modeBtnTextActive: { color: '#fff', fontWeight: '700' },

  // Form
  form:       { gap: 4 },
  fieldGroup: { marginBottom: 16 },
  label:      { fontSize: 11, fontWeight: '600', color: T.textMuted, marginBottom: 7,
                textTransform: 'uppercase', letterSpacing: 0.6 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.surface,
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  inputIcon: { marginRight: 8 },
  input:     { flex: 1, color: T.text, fontSize: 15, paddingVertical: 13 },
  eyeBtn:    { padding: 6 },

  // Error
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: T.redGlow,
    borderWidth: 1,
    borderColor: 'rgba(220,38,38,0.20)',
    borderRadius: 10,
    padding: 11,
    marginBottom: 10,
  },
  errorText: { flex: 1, color: T.red, fontSize: 13, lineHeight: 18 },

  // Submit
  submitBtn: {
    backgroundColor: T.green,
    borderRadius: 13,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: T.green,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  // Switch hint
  switchHint:     { alignItems: 'center', marginTop: 20 },
  switchHintText: { color: T.textMuted, fontSize: 13 },
});