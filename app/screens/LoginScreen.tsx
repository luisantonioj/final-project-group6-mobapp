/**
 * LoginScreen.tsx — Login + Sign Up (single screen, two tabs)
 * ─────────────────────────────────────────────────────────────────────────────
 * Students toggle between Log In and Sign Up using the pill selector at the top.
 * After a successful login or registration, App.tsx's onAuthStateChange fires
 * automatically and RootNavigator replaces this screen with the App (tabs).
 * You never need to call navigation.navigate() after auth succeeds.
 *
 * SUPABASE — LOG IN:
 *   const { error } = await supabase.auth.signInWithPassword({ email, password });
 *
 * SUPABASE — SIGN UP:
 *   const { data, error } = await supabase.auth.signUp({
 *     email, password, options: { data: { name: fullName } },
 *   });
 *   if (data.user) {
 *     await supabase.from('Users').insert({
 *       auth_id: data.user.id,
 *       name:    fullName,
 *       email:   email.trim().toLowerCase(),
 *     });
 *     // Assign Student role in UserRoles (look up Student role_id first)
 *   }
 *
 * ROLE FETCH (after login — required for RootNavigator to show correct tabs):
 *   const { data } = await supabase
 *     .from('Users')
 *     .select('id, UserRoles(Roles(role_name))')
 *     .eq('auth_id', session.user.id)
 *     .single();
 *   const roleName = data?.UserRoles?.[0]?.Roles?.role_name;
 *   useAuthStore.getState().setRole(roleName === 'Admin' ? 'Admin' : 'Student');
 *   useAuthStore.getState().setProfile(data);
 * ─────────────────────────────────────────────────────────────────────────────
 */
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
  ScrollView,
  Animated,
} from 'react-native';
import { SafeAreaView }  from 'react-native-safe-area-context';
import { StatusBar }     from 'expo-status-bar';
import { Ionicons }      from '@expo/vector-icons';
import { supabase }      from '../utils/supabase';
import { useAuthStore }  from '../stores/authStore';

// ─── Design tokens (shared with other screens) ────────────────────────────────
const C = {
  bg:       '#0A0F0A',
  surface:  '#111811',
  border:   '#1E2E1E',
  green:    '#0F6E56',
  greenBright: '#22C55E',
  text:     '#F0FFF0',
  textSub:  '#A3C5A3',
  textMuted:'#4B6B4B',
  error:    '#EF4444',
};

type Mode = 'login' | 'signup';

export function LoginScreen() {
  const { setSession, setRole, setProfile } = useAuthStore();

  const [mode,     setMode]    = useState<Mode>('login');
  const [name,     setName]    = useState('');
  const [email,    setEmail]   = useState('');
  const [password, setPass]    = useState('');
  const [showPass, setShowPass]= useState(false);
  const [loading,  setLoading] = useState(false);
  const [error,    setError]   = useState<string | null>(null);

  // Subtle fade when switching modes
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
        // ── Log In ────────────────────────────────────────────────────────────
        const { data, error: authErr } = await supabase.auth.signInWithPassword({
            email: email.trim().toLowerCase(),
            password,
        });
        if (authErr) throw new Error(authErr.message);

        if (data.session) {
            const { data: userRow } = await supabase
            .from('Users')
            .select('*, UserRoles(Roles(role_name))')
            .eq('auth_id', data.session.user.id)
            .single();

            const roleName = (userRow as any)?.UserRoles?.[0]?.Roles?.role_name;
            setRole(roleName === 'Admin' ? 'Admin' : 'Student');
            setProfile(userRow as any);
            setSession(data.session);
        }

        } else {
        // ── Sign Up ───────────────────────────────────────────────────────────
        const { data, error: authErr } = await supabase.auth.signUp({
            email: email.trim().toLowerCase(),
            password,
            options: { data: { name: name.trim() } },
        });
        if (authErr) throw new Error(authErr.message);

        // Wait half a second to let the Supabase trigger finish building the profile
        await new Promise(resolve => setTimeout(resolve, 500));

        if (data.session) {
            // Fetch the fully built profile that the database trigger just created!
            const { data: userRow } = await supabase
            .from('Users')
            .select('*, UserRoles(Roles(role_name))')
            .eq('auth_id', data.session.user.id)
            .single();

            setRole('Student'); 
            setProfile(userRow as any);
            setSession(data.session);
        }
        }
    } catch (err: any) {
        setError(err.message ?? 'Something went wrong. Please try again.');
    } finally {
        setLoading(false);
    }
    };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <ScrollView
            contentContainerStyle={s.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
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
                <TouchableOpacity
                  key={m}
                  style={[s.modeBtn, mode === m && s.modeBtnActive]}
                  onPress={() => switchMode(m)}
                >
                  <Text style={[s.modeBtnText, mode === m && s.modeBtnTextActive]}>
                    {m === 'login' ? 'Log In' : 'Sign Up'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* ── Form fields ── */}
            <Animated.View style={[s.form, { opacity: fadeAnim }]}>

              {/* Full name — signup only */}
              {mode === 'signup' && (
                <View style={s.fieldGroup}>
                  <Text style={s.label}>Full Name</Text>
                  <View style={s.inputRow}>
                    <Ionicons name="person-outline" size={16} color={C.textMuted} style={s.inputIcon} />
                    <TextInput
                      style={s.input}
                      value={name}
                      onChangeText={setName}
                      placeholder="e.g. Juan dela Cruz"
                      placeholderTextColor={C.textMuted}
                      autoCapitalize="words"
                      returnKeyType="next"
                    />
                  </View>
                </View>
              )}

              {/* Email */}
              <View style={s.fieldGroup}>
                <Text style={s.label}>School Email</Text>
                <View style={s.inputRow}>
                  <Ionicons name="mail-outline" size={16} color={C.textMuted} style={s.inputIcon} />
                  <TextInput
                    style={s.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="student@dlsl.edu.ph"
                    placeholderTextColor={C.textMuted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="next"
                  />
                </View>
              </View>

              {/* Password */}
              <View style={s.fieldGroup}>
                <Text style={s.label}>Password</Text>
                <View style={s.inputRow}>
                  <Ionicons name="lock-closed-outline" size={16} color={C.textMuted} style={s.inputIcon} />
                  <TextInput
                    style={[s.input, { flex: 1 }]}
                    value={password}
                    onChangeText={setPass}
                    placeholder={mode === 'signup' ? 'At least 6 characters' : '••••••••'}
                    placeholderTextColor={C.textMuted}
                    secureTextEntry={!showPass}
                    autoCapitalize="none"
                    returnKeyType="done"
                    onSubmitEditing={handleSubmit}
                  />
                  <TouchableOpacity onPress={() => setShowPass(v => !v)} style={s.eyeBtn}>
                    <Ionicons
                      name={showPass ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color={C.textMuted}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Error message */}
              {error && (
                <View style={s.errorBox}>
                  <Ionicons name="alert-circle-outline" size={15} color={C.error} />
                  <Text style={s.errorText}>{error}</Text>
                </View>
              )}

              {/* Submit button */}
              <TouchableOpacity
                style={[s.submitBtn, loading && { opacity: 0.65 }]}
                onPress={handleSubmit}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={s.submitBtnText}>
                      {mode === 'login' ? 'Log In' : 'Create Account'}
                    </Text>
                }
              </TouchableOpacity>

              {/* Switch mode hint */}
              <TouchableOpacity
                style={s.switchHint}
                onPress={() => switchMode(mode === 'login' ? 'signup' : 'login')}
              >
                <Text style={s.switchHintText}>
                  {mode === 'login'
                    ? "New student? Create an account"
                    : "Already registered? Log in"}
                </Text>
              </TouchableOpacity>

            </Animated.View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: C.bg },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 28, paddingVertical: 40 },

  // Header
  header:      { alignItems: 'center', marginBottom: 36 },
  logoBadge:   { width: 64, height: 64, borderRadius: 18, backgroundColor: C.green,
                 alignItems: 'center', justifyContent: 'center', marginBottom: 14,
                 borderWidth: 1.5, borderColor: C.greenBright },
  logoLetters: { fontSize: 24, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  appName:     { fontSize: 24, fontWeight: '800', color: C.text, letterSpacing: -0.3 },
  tagline:     { fontSize: 11, color: C.textMuted, marginTop: 4, letterSpacing: 0.6,
                 textTransform: 'uppercase' },

  // Mode toggle
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: C.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    padding: 4,
    marginBottom: 28,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 9,
    alignItems: 'center',
  },
  modeBtnActive:     { backgroundColor: C.green },
  modeBtnText:       { fontSize: 14, fontWeight: '600', color: C.textMuted },
  modeBtnTextActive: { color: '#fff', fontWeight: '700' },

  // Form
  form:       { gap: 4 },
  fieldGroup: { marginBottom: 16 },
  label:      { fontSize: 11, fontWeight: '600', color: C.textMuted, marginBottom: 7,
                textTransform: 'uppercase', letterSpacing: 0.6 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  inputIcon: { marginRight: 8 },
  input: {
    flex: 1,
    color: C.text,
    fontSize: 15,
    paddingVertical: 13,
  },
  eyeBtn: { padding: 6 },

  // Error
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.25)',
    borderRadius: 10,
    padding: 11,
    marginBottom: 10,
  },
  errorText: { flex: 1, color: C.error, fontSize: 13, lineHeight: 18 },

  // Submit
  submitBtn: {
    backgroundColor: C.green,
    borderRadius: 13,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 8,
  },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  // Switch hint
  switchHint:     { alignItems: 'center', marginTop: 20 },
  switchHintText: { color: C.textMuted, fontSize: 13 },
});
