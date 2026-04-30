/**
 * AdminSettingsScreen.tsx — Admin profile + settings + sign out
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
import { T }            from '../../theme';

export function AdminSettingsScreen() {
  const { userProfile, session, setProfile, clear } = useAuthStore();

  const [loading,     setLoading]     = useState(!userProfile);
  const [editing,     setEditing]     = useState(false);
  const [editName,    setEditName]    = useState('');
  const [saving,      setSaving]      = useState(false);
  const [saveError,   setSaveError]   = useState<string | null>(null);
  const [signOutBusy, setSignOutBusy] = useState(false);

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
          <ActivityIndicator size="large" color={T.green} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={T.bg} />

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
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
              placeholderTextColor={T.textMuted}
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
              <Ionicons name="pencil-outline" size={15} color={T.textMuted} />
            </TouchableOpacity>
          </View>
        )}

        <Text style={s.email}>{userProfile?.email ?? session?.user.email ?? '—'}</Text>

        {/* ── Admin role badge ── */}
        <View style={s.roleBadge}>
          <Ionicons name="shield-outline" size={13} color={T.green} style={{ marginRight: 5 }} />
          <Text style={s.roleBadgeText}>Administrator</Text>
        </View>

        {/* ── Account info ── */}
        <View style={s.infoSection}>
          <InfoRow icon="business-outline"  label="Institution"    value="De La Salle Lipa" />
          <InfoRow icon="calendar-outline"  label="Election"       value="SY 2025–2026" />
          <InfoRow
            icon="checkmark-circle-outline"
            label="Account Status"
            value={userProfile?.is_active ? 'Active' : 'Inactive'}
            valueColor={userProfile?.is_active ? T.green : T.red}
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
            ? <ActivityIndicator size="small" color={T.red} />
            : <>
                <Ionicons name="log-out-outline" size={17} color={T.red} style={{ marginRight: 8 }} />
                <Text style={s.signOutText}>Sign Out</Text>
              </>
          }
        </TouchableOpacity>

        <Text style={s.version}>AnimoQuorum v1.0 · DLSL COMELEC</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ icon, label, value, valueColor }: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View style={s.infoRow}>
      <Ionicons name={icon} size={16} color={T.textMuted} style={{ marginRight: 10 }} />
      <Text style={s.infoLabel}>{label}</Text>
      <Text style={[s.infoValue, valueColor ? { color: valueColor } : null]}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: T.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { alignItems: 'center', paddingTop: 24, paddingHorizontal: 24, paddingBottom: 48 },

  screenTitle: {
    fontSize: 26, fontWeight: '800', color: T.text,
    marginBottom: 28, alignSelf: 'flex-start',
  },

  // Avatar
  avatarWrap:   { marginBottom: 16 },
  avatarCircle: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: T.greenDim,
    borderWidth: 2, borderColor: T.green,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: T.green, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.20, shadowRadius: 10, elevation: 4,
  },
  avatarText: { fontSize: 32, fontWeight: '800', color: T.green },

  // Name
  nameRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  name:     { fontSize: 22, fontWeight: '800', color: T.text },
  editIcon: {
    padding: 5, backgroundColor: T.surface2, borderRadius: 20,
    borderWidth: 1, borderColor: T.border,
  },
  email: { fontSize: 13, color: T.textMuted, marginBottom: 14 },

  // Role badge
  roleBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: T.greenLight, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6, marginBottom: 28,
    borderWidth: 1, borderColor: T.green + '44',
  },
  roleBadgeText: { fontSize: 12, fontWeight: '700', color: T.green },

  // Edit form
  editWrap:  { width: '100%', marginBottom: 4 },
  editInput: {
    backgroundColor: T.surface, borderWidth: 1.5, borderColor: T.green + '88',
    borderRadius: 12, color: T.text, fontSize: 16,
    paddingHorizontal: 14, paddingVertical: 12,
    textAlign: 'center', fontWeight: '700',
  },
  saveError:     { color: T.red, fontSize: 12, textAlign: 'center', marginTop: 6 },
  editActions:   { flexDirection: 'row', gap: 10, marginTop: 10, justifyContent: 'center' },
  cancelEditBtn: {
    flex: 1, borderWidth: 1, borderColor: T.border, borderRadius: 10,
    paddingVertical: 10, alignItems: 'center', backgroundColor: T.surface,
  },
  cancelEditText: { color: T.textMuted, fontWeight: '600' },
  saveBtn: {
    flex: 1, backgroundColor: T.green, borderRadius: 10,
    paddingVertical: 10, alignItems: 'center',
    shadowColor: T.green, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25, shadowRadius: 6, elevation: 3,
  },
  saveBtnText: { color: '#fff', fontWeight: '700' },

  // Info section
  infoSection: {
    width: '100%',
    backgroundColor: T.surface, borderRadius: 14,
    borderWidth: 1, borderColor: T.border,
    marginBottom: 24, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  infoRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: T.border,
  },
  infoLabel: { flex: 1, fontSize: 13, color: T.textSub },
  infoValue: { fontSize: 13, fontWeight: '600', color: T.text },

  // Sign out
  signOutBtn: {
    width: '100%',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: T.redGlow, borderRadius: 14,
    borderWidth: 1, borderColor: T.red + '33',
    paddingVertical: 14, marginBottom: 20,
  },
  signOutText: { color: T.red, fontSize: 15, fontWeight: '700' },

  version: { fontSize: 11, color: T.textMuted, letterSpacing: 0.4 },
});