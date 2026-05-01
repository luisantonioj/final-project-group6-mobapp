/**
 * ProfileScreen.tsx — Student profile + sign out
 */
import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, Pressable, StyleSheet,
  ActivityIndicator, Alert,
  TextInput, StatusBar,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons }      from '@expo/vector-icons';
import { supabase }      from '../../utils/supabase';
import { useAuthStore }  from '../../stores/authStore';
import { useThemeColors, ThemeColors } from '../../theme';
import { useThemeStore } from '../../stores/themeStore';

export function ProfileScreen() {
  const C      = useThemeColors();
  const isDark = useThemeStore(s => s.isDark);
  const s      = useMemo(() => makeStyles(C), [C]);

  const { userProfile, session, role, setProfile, setActiveRole, clear } = useAuthStore();

  const [loading,     setLoading]     = useState(!userProfile);
  const [editing,     setEditing]     = useState(false);
  const [editName,    setEditName]    = useState('');
  const [saving,      setSaving]      = useState(false);
  const [saveError,   setSaveError]   = useState<string | null>(null);
  const [signOutBusy, setSignOutBusy] = useState(false);

  useEffect(() => {
    if (userProfile || !session) { setLoading(false); return; }
    supabase
      .from('Users').select('*').eq('auth_id', session.user.id).single()
      .then(({ data }: any) => { setProfile(data as any); setLoading(false); });
  }, []);

  const initials = userProfile?.name
    ? userProfile.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  const startEdit = () => { setEditName(userProfile?.name ?? ''); setSaveError(null); setEditing(true); };

  const saveEdit = async () => {
    const name = editName.trim();
    if (!name) { setSaveError('Name cannot be empty.'); return; }
    if (!userProfile) return;
    setSaving(true); setSaveError(null);
    const { data, error } = await supabase
      .from('Users').update({ name }).eq('id', userProfile.id).select().single();
    setSaving(false);
    if (error) { setSaveError(error.message); return; }
    setProfile(data as any); setEditing(false);
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => {
          setSignOutBusy(true);
          await supabase.auth.signOut();
          clear();
        },
      },
    ]);
  };

  const handleSwitchToAdmin = () => {
    Alert.alert(
      'Switch to Admin View',
      'You will be taken back to the admin screens.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Switch', onPress: () => setActiveRole('Admin') },
      ],
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.center}>
          <ActivityIndicator size="large" color={C.green} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={C.bg} />
      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid
        enableAutomaticScroll
        viewIsInsideTabBar
        extraScrollHeight={32}
        keyboardOpeningTime={0}
      >

        {/* ── Avatar ── */}
        <View style={s.avatarWrap}>
          <View style={s.avatarCircle}>
            <Text style={s.avatarText}>{initials}</Text>
          </View>
        </View>

        {/* ── Name ── */}
        {editing ? (
          <View style={s.editWrap}>
            <TextInput
              style={s.editInput} value={editName} onChangeText={setEditName}
              placeholder="Your full name" placeholderTextColor={C.textMuted}
              autoFocus maxLength={80}
            />
            {saveError ? <Text style={s.saveError}>{saveError}</Text> : null}
            <View style={s.editActions}>
              <Pressable
                style={({ pressed }) => [s.cancelEditBtn, pressed && { opacity: 0.75 }]}
                onPress={() => setEditing(false)}
              >
                <Text style={s.cancelEditText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [s.saveBtn, saving && { opacity: 0.65 }, !saving && pressed && { opacity: 0.85 }]}
                onPress={saveEdit}
                disabled={saving}
              >
                {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={s.saveBtnText}>Save</Text>}
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={s.nameRow}>
            <Text style={s.name}>{userProfile?.name ?? '—'}</Text>
            <Pressable onPress={startEdit} style={({ pressed }) => [s.editIcon, pressed && { opacity: 0.75 }]}>
              <Ionicons name="pencil-outline" size={15} color={C.textMuted} />
            </Pressable>
          </View>
        )}

        {/* ── Email ── */}
        <Text style={s.email}>{userProfile?.email ?? session?.user.email ?? '—'}</Text>

        {/* ── Role badge ── */}
        <View style={s.roleBadge}>
          <Ionicons name="shield-checkmark-outline" size={13} color={C.greenBright} style={{ marginRight: 5 }} />
          <Text style={s.roleBadgeText}>Registered Voter</Text>
        </View>

        {/* ── Info rows ── */}
        <View style={s.infoSection}>
          <InfoRow icon="school-outline"         label="Institution"    value="De La Salle Lipa" />
          <InfoRow icon="calendar-outline"        label="Election"       value="SY 2025–2026" />
          <InfoRow
            icon="checkmark-circle-outline"
            label="Account Status"
            value={userProfile?.is_active ? 'Active' : 'Inactive'}
            valueColor={userProfile?.is_active ? C.greenBright : C.red}
          />
        </View>

        {/* ── Switch to Admin (only shown to users who are actually admins) ── */}
        {role === 'Admin' && (
          <Pressable
            style={({ pressed }) => [s.switchAdminBtn, pressed && { opacity: 0.85 }]}
            onPress={handleSwitchToAdmin}
          >
            <Ionicons name="shield-checkmark-outline" size={17} color={C.greenBright} style={{ marginRight: 8 }} />
            <Text style={s.switchAdminText}>Switch as Admin</Text>
          </Pressable>
        )}

        {/* ── Sign out ── */}
        <Pressable
          style={({ pressed }) => [s.signOutBtn, signOutBusy && { opacity: 0.65 }, !signOutBusy && pressed && { opacity: 0.85 }]}
          onPress={handleSignOut}
          disabled={signOutBusy}
        >
          {signOutBusy
            ? <ActivityIndicator size="small" color={C.red} />
            : <>
                <Ionicons name="log-out-outline" size={17} color={C.red} style={{ marginRight: 8 }} />
                <Text style={s.signOutText}>Sign Out</Text>
              </>
          }
        </Pressable>

        <Text style={s.version}>AnimoQuorum v1.0 · DLSL COMELEC</Text>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ icon, label, value, valueColor }: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string; value: string; valueColor?: string;
}) {
  const C = useThemeColors();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border }}>
      <Ionicons name={icon} size={16} color={C.textMuted} style={{ marginRight: 10 }} />
      <Text style={{ flex: 1, fontSize: 13, color: C.textSub }}>{label}</Text>
      <Text style={{ fontSize: 13, fontWeight: '600', color: valueColor ?? C.text }}>{value}</Text>
    </View>
  );
}

function makeStyles(C: ThemeColors) {
  return StyleSheet.create({
    safe:   { flex: 1, backgroundColor: C.bg },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    scroll: { alignItems: 'center', paddingTop: 36, paddingHorizontal: 24, paddingBottom: 48 },

    avatarWrap:   { marginBottom: 16 },
    avatarCircle: {
      width: 90, height: 90, borderRadius: 45,
      backgroundColor: C.surface2, borderWidth: 2, borderColor: C.greenBright,
      alignItems: 'center', justifyContent: 'center',
      shadowColor: C.green, shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.20, shadowRadius: 6, elevation: 3,
    },
    avatarText: { fontSize: 32, fontWeight: '800', color: C.greenBright },

    nameRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
    name:     { fontSize: 22, fontWeight: '800', color: C.text },
    editIcon: { padding: 5, backgroundColor: C.surface2, borderRadius: 20, borderWidth: 1, borderColor: C.border },
    email:    { fontSize: 13, color: C.textMuted, marginBottom: 14 },

    roleBadge: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: C.greenLight, borderRadius: 20,
      paddingHorizontal: 12, paddingVertical: 6, marginBottom: 28,
      borderWidth: 1, borderColor: C.greenBright + '44',
    },
    roleBadgeText: { fontSize: 12, fontWeight: '700', color: C.greenBright },

    editWrap:  { width: '100%', marginBottom: 4 },
    editInput: {
      backgroundColor: C.surface, borderWidth: 1, borderColor: C.greenBright + '77',
      borderRadius: 12, color: C.text, fontSize: 16,
      paddingHorizontal: 14, paddingVertical: 12, textAlign: 'center', fontWeight: '700',
    },
    saveError:      { color: C.red, fontSize: 12, textAlign: 'center', marginTop: 6 },
    editActions:    { flexDirection: 'row', gap: 10, marginTop: 10, justifyContent: 'center' },
    cancelEditBtn:  { flex: 1, borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
    cancelEditText: { color: C.textMuted, fontWeight: '600' },
    saveBtn: {
      flex: 1, backgroundColor: C.green, borderRadius: 10, paddingVertical: 10, alignItems: 'center',
      shadowColor: C.green, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 3,
    },
    saveBtnText: { color: '#fff', fontWeight: '700' },

    infoSection: {
      width: '100%', backgroundColor: C.surface, borderRadius: 14,
      borderWidth: 1, borderColor: C.border, marginBottom: 24, overflow: 'hidden',
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2,
    },

    switchAdminBtn: {
      width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      backgroundColor: C.greenLight, borderRadius: 14,
      borderWidth: 1, borderColor: C.greenBright + '55',
      paddingVertical: 14, marginBottom: 12,
      shadowColor: C.green, shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12, shadowRadius: 4, elevation: 2,
    },
    switchAdminText: { fontSize: 15, fontWeight: '700', color: C.greenBright },

    signOutBtn: {
      width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      backgroundColor: C.redGlow, borderRadius: 14,
      borderWidth: 1, borderColor: C.red + '44', paddingVertical: 14, marginBottom: 20,
    },
    signOutText: { color: C.red, fontSize: 15, fontWeight: '700' },
    version:     { fontSize: 11, color: C.textMuted, letterSpacing: 0.4 },
  });
}