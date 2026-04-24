/**
 * AdminSettingsScreen.tsx — Admin profile + settings + sign out
 * ─────────────────────────────────────────────────────────────────────────────
 * Mirrors ProfileScreen.tsx but for Admin accounts.
 * Shows admin info from authStore.userProfile.
 *
 * EDIT PROFILE (same as student):
 *   await supabase.from('Users').update({ name }).eq('id', userProfile.id);
 *
 * SIGN OUT:
 *   await supabase.auth.signOut() → onAuthStateChange fires →
 *   clear() → RootNavigator → SplashScreen → Login.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, ScrollView,
  TextInput, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons }     from '@expo/vector-icons';
import { supabase }     from '../../utils/supabase';
import { useAuthStore } from '../../stores/authStore';

// ─── Admin colour palette (blue/slate instead of green) ───────────────────────
const C = {
  bg:          '#0A0A0F',
  surface:     '#11111A',
  surface2:    '#16162A',
  border:      '#1E1E3E',
  blue:        '#1E40AF',
  blueBright:  '#60A5FA',
  blueGlow:    'rgba(96,165,250,0.10)',
  text:        '#F0F4FF',
  textSub:     '#A3B3C5',
  textMuted:   '#4B5B8B',
  error:       '#EF4444',
  errorGlow:   'rgba(239,68,68,0.10)',
};

export function AdminSettingsScreen() {
  const { userProfile, session, setProfile, clear } = useAuthStore();

  const [loading,     setLoading]     = useState(!userProfile);
  const [editing,     setEditing]     = useState(false);
  const [editName,    setEditName]    = useState('');
  const [saving,      setSaving]      = useState(false);
  const [saveError,   setSaveError]   = useState<string | null>(null);
  const [signOutBusy, setSignOutBusy] = useState(false);

  // Fetch profile if not in store (e.g. after session restore)
  useEffect(() => {
    if (userProfile || !session) { setLoading(false); return; }
    supabase
      .from('Users')
      .select('*')
      .eq('auth_id', session.user.id)
      .single()
      .then(({ data }: any) => {
        setProfile(data as any);
        setLoading(false);
      });
  }, []);

  const initials = userProfile?.name
    ? userProfile.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  // ─── Edit profile ────────────────────────────────────────────────────────
  const startEdit = () => {
    setEditName(userProfile?.name ?? '');
    setSaveError(null);
    setEditing(true);
  };

  const saveEdit = async () => {
    const name = editName.trim();
    if (!name) { setSaveError('Name cannot be empty.'); return; }
    if (!userProfile) return;
    setSaving(true);
    setSaveError(null);
    const { data, error } = await supabase
      .from('Users')
      .update({ name })
      .eq('id', userProfile.id)
      .select()
      .single();
    setSaving(false);
    if (error) { setSaveError(error.message); return; }
    setProfile(data as any);
    setEditing(false);
  };

  // ─── Sign out ─────────────────────────────────────────────────────────────
  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          setSignOutBusy(true);
          await supabase.auth.signOut();
          clear();
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.center}>
          <ActivityIndicator size="large" color={C.blueBright} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <Text style={s.screenTitle}>Settings</Text>

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
              style={s.editInput}
              value={editName}
              onChangeText={setEditName}
              placeholder="Your full name"
              placeholderTextColor={C.textMuted}
              autoFocus
              maxLength={80}
            />
            {saveError ? <Text style={s.saveError}>{saveError}</Text> : null}
            <View style={s.editActions}>
              <TouchableOpacity style={s.cancelEditBtn} onPress={() => setEditing(false)}>
                <Text style={s.cancelEditText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.saveBtn, saving && { opacity: 0.65 }]}
                onPress={saveEdit}
                disabled={saving}
              >
                {saving
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={s.saveBtnText}>Save</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={s.nameRow}>
            <Text style={s.name}>{userProfile?.name ?? '—'}</Text>
            <TouchableOpacity onPress={startEdit} style={s.editIcon}>
              <Ionicons name="pencil-outline" size={15} color={C.textMuted} />
            </TouchableOpacity>
          </View>
        )}

        {/* ── Email (read-only) ── */}
        <Text style={s.email}>{userProfile?.email ?? session?.user.email ?? '—'}</Text>

        {/* ── Admin role badge ── */}
        <View style={s.roleBadge}>
          <Ionicons name="shield-outline" size={13} color={C.blueBright} style={{ marginRight: 5 }} />
          <Text style={s.roleBadgeText}>Administrator</Text>
        </View>

        {/* ── Account info ── */}
        <View style={s.infoSection}>
          <InfoRow icon="business-outline"       label="Institution"     value="De La Salle Lipa" />
          <InfoRow icon="calendar-outline"        label="Election"        value="SY 2025–2026" />
          <InfoRow
            icon="checkmark-circle-outline"
            label="Account Status"
            value={userProfile?.is_active ? 'Active' : 'Inactive'}
            valueColor={userProfile?.is_active ? C.blueBright : C.error}
          />
        </View>

        {/* ── Sign out ── */}
        <TouchableOpacity
          style={[s.signOutBtn, signOutBusy && { opacity: 0.65 }]}
          onPress={handleSignOut}
          disabled={signOutBusy}
          activeOpacity={0.8}
        >
          {signOutBusy
            ? <ActivityIndicator size="small" color={C.error} />
            : <>
                <Ionicons name="log-out-outline" size={17} color={C.error} style={{ marginRight: 8 }} />
                <Text style={s.signOutText}>Sign Out</Text>
              </>
          }
        </TouchableOpacity>

        <Text style={s.version}>AnimoQuorum v1.0 · DLSL COMELEC</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Reusable info row ────────────────────────────────────────────────────────
function InfoRow({ icon, label, value, valueColor }: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View style={s.infoRow}>
      <Ionicons name={icon} size={16} color={C.textMuted} style={{ marginRight: 10 }} />
      <Text style={s.infoLabel}>{label}</Text>
      <Text style={[s.infoValue, valueColor ? { color: valueColor } : null]}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: C.bg },
  center:      { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll:      { alignItems: 'center', paddingTop: 24, paddingHorizontal: 24, paddingBottom: 48 },

  screenTitle: { fontSize: 26, fontWeight: '800', color: C.text, marginBottom: 28, alignSelf: 'flex-start' },

  // Avatar
  avatarWrap:   { marginBottom: 16 },
  avatarCircle: { width: 90, height: 90, borderRadius: 45,
                  backgroundColor: C.surface2, borderWidth: 2, borderColor: C.blueBright,
                  alignItems: 'center', justifyContent: 'center' },
  avatarText:   { fontSize: 32, fontWeight: '800', color: C.blueBright },

  // Name
  nameRow:       { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  name:          { fontSize: 22, fontWeight: '800', color: C.text },
  editIcon:      { padding: 5, backgroundColor: C.surface2, borderRadius: 20,
                   borderWidth: 1, borderColor: C.border },
  email:         { fontSize: 13, color: C.textMuted, marginBottom: 14 },

  // Role badge
  roleBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.blueGlow, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6, marginBottom: 28,
    borderWidth: 1, borderColor: C.blueBright + '44',
  },
  roleBadgeText: { fontSize: 12, fontWeight: '700', color: C.blueBright },

  // Edit form
  editWrap:      { width: '100%', marginBottom: 4 },
  editInput: {
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.blueBright + '77',
    borderRadius: 12, color: C.text, fontSize: 16,
    paddingHorizontal: 14, paddingVertical: 12,
    textAlign: 'center', fontWeight: '700',
  },
  saveError:     { color: C.error, fontSize: 12, textAlign: 'center', marginTop: 6 },
  editActions:   { flexDirection: 'row', gap: 10, marginTop: 10, justifyContent: 'center' },
  cancelEditBtn: { flex: 1, borderWidth: 1, borderColor: C.border, borderRadius: 10,
                   paddingVertical: 10, alignItems: 'center' },
  cancelEditText:{ color: C.textMuted, fontWeight: '600' },
  saveBtn:       { flex: 1, backgroundColor: C.blue, borderRadius: 10,
                   paddingVertical: 10, alignItems: 'center' },
  saveBtnText:   { color: '#fff', fontWeight: '700' },

  // Info section
  infoSection: {
    width: '100%',
    backgroundColor: C.surface, borderRadius: 14,
    borderWidth: 1, borderColor: C.border,
    marginBottom: 24, overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  infoLabel: { flex: 1, fontSize: 13, color: C.textSub },
  infoValue: { fontSize: 13, fontWeight: '600', color: C.text },

  // Sign out
  signOutBtn: {
    width: '100%',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.errorGlow, borderRadius: 14,
    borderWidth: 1, borderColor: C.error + '44',
    paddingVertical: 14, marginBottom: 20,
  },
  signOutText: { color: C.error, fontSize: 15, fontWeight: '700' },

  version: { fontSize: 11, color: C.textMuted, letterSpacing: 0.4 },
});