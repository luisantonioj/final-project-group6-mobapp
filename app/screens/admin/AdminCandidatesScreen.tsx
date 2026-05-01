// screens/admin/AdminCandidatesScreen.tsx
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../utils/supabase';
import { useDeleteCandidate } from '../../hooks/useCandidates';
import { uploadCandidatePhoto, isLocalFileUri } from '../../utils/storage';

import {
  useCandidateStore,
  DEPARTMENTS,
  EXECUTIVE_POSITIONS,
  DEPARTMENT_POSITIONS,
} from '../../stores/candidateStore';
import type { Candidate, Department, Position } from '../../stores/candidateStore';

import { CandidateModal } from '../../components/CandidateModal';
import type { CandidateRow } from '../../components/CandidateModal';

import {
  makeStyles,
  FONT,
  SPACE,
  RADIUS,
} from './AdminCandidatesScreen.styles';
import { useThemeColors } from '../../theme';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormState {
  name:        string;
  partylist:   string;
  department:  string; // '' | Department
  position:    string; // '' | Position
  email:       string;
  credentials: string;
  platform:    string;
  photo_uri:   string | null;
}

interface FormErrors {
  name?:      string;
  department?: string;
  position?:  string;
  email?:     string;
  duplicate?: string;
}

const EMPTY_FORM: FormState = {
  name:        '',
  partylist:   '',
  department:  '',
  position:    '',
  email:       '',
  credentials: '',
  platform:    '',
  photo_uri:   null,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0] ?? '')
    .join('')
    .toUpperCase();
}

/** Adapt new-store Candidate → CandidateRow expected by CandidateModal */
function toModalRow(c: Candidate): CandidateRow {
  return {
    id:          c.id,
    name:        c.name,
    partylist:   c.partylist || null,
    position_id: c.position_id,
    email:       c.email,
    credentials: c.credentials,
    platform:    c.platform,
    photo_url:   c.photo_url,
    Positions:   { position_name: c.position_name },
  };
}

function validateForm(
  form: FormState,
  candidates: Candidate[],
  editId: string | null,
): FormErrors {
  const errors: FormErrors = {};
  const trimmedName = form.name.trim();

  if (!trimmedName) {
    errors.name = 'Full name is required.';
  } else if (trimmedName.length < 3) {
    errors.name = 'Name must be at least 3 characters.';
  }

  if (!form.department) {
    errors.department = 'Department is required.';
  }

  if (!form.position) {
    errors.position = 'Position is required.';
  }

  if (form.email.trim()) {
    const dlslEmailRegex = /^[^\s@]+@dlsl\.edu\.ph$/i;
    if (!dlslEmailRegex.test(form.email.trim())) {
      errors.email = 'Email must be a valid @dlsl.edu.ph address.';
    }
  }

  if (trimmedName && form.department && form.position) {
    const isDuplicate = candidates.some(
      c =>
        c.id !== editId &&
        c.name.trim().toLowerCase() === trimmedName.toLowerCase() &&
        c.department === form.department &&
        c.position_name === form.position,
    );
    if (isDuplicate) {
      errors.duplicate = `"${trimmedName}" already exists under ${form.department} — ${form.position}.`;
    }
  }

  return errors;
}

// ─── Department selector (pill row) ──────────────────────────────────────────

const DepartmentSelector: React.FC<{
  selected: string;
  onChange: (dept: Department) => void;
}> = ({ selected, onChange }) => {
  const C = useThemeColors();
  const S = useMemo(() => makeStyles(C), [C]);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={S.form.positionScrollRow}
    >
      <View style={S.form.positionInnerRow}>
        {DEPARTMENTS.map(d => (
          <Pressable
            key={d}
            style={({ pressed }) => [
              S.form.positionTab,
              selected === d && S.form.positionTabActive,
              pressed && { opacity: 0.85 },
            ]}
            onPress={() => onChange(d)}
          >
            <Text style={[
              S.form.positionTabText,
              selected === d && S.form.positionTabTextActive,
            ]}>
              {d}
            </Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
};

// ─── Position pill selector ───────────────────────────────────────────────────

const PositionSelector: React.FC<{
  positions: readonly string[];
  selected:  string;
  onChange:  (pos: string) => void;
}> = ({ positions, selected, onChange }) => {
  const C = useThemeColors();
  const S = useMemo(() => makeStyles(C), [C]);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={S.form.positionScrollRow}
    >
      <View style={S.form.positionInnerRow}>
        {positions.map(p => (
          <Pressable
            key={p}
            style={({ pressed }) => [
              S.form.positionTab,
              selected === p && S.form.positionTabActive,
              pressed && { opacity: 0.85 },
            ]}
            onPress={() => onChange(p)}
          >
            <Text style={[
              S.form.positionTabText,
              selected === p && S.form.positionTabTextActive,
            ]}>
              {p}
            </Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
};

// ─── Add / Edit form bottom sheet ─────────────────────────────────────────────

const CandidateFormSheet: React.FC<{
  visible:    boolean;
  editId:     string | null;
  initial:    FormState;
  candidates: Candidate[];
  onClose:    () => void;
  onSave:     (id: string | null, data: FormState) => void;
}> = ({ visible, editId, initial, candidates, onClose, onSave }) => {
  const C = useThemeColors();
  const S = useMemo(() => makeStyles(C), [C]);

  const [form,          setFormState]    = useState<FormState>(initial);
  const [errors,        setErrors]       = useState<FormErrors>({});
  const [saveAttempted, setSaveAttempted] = useState(false);
  const [isSaving,      setIsSaving]     = useState(false);

  useEffect(() => {
    setFormState(initial);
    setErrors({});
    setSaveAttempted(false);
    setIsSaving(false);
  }, [initial, visible]);

  const setField = useCallback((field: keyof FormState, value: string | null) => {
    setFormState(prev => {
      const next: FormState = { ...prev, [field]: value ?? '' };
      // Reset position whenever department changes
      if (field === 'department') next.position = '';
      return next;
    });
  }, []);

  const availablePositions: readonly string[] = useMemo(() => {
    if (!form.department) return [];
    return form.department === 'Executive Council'
      ? EXECUTIVE_POSITIONS
      : DEPARTMENT_POSITIONS;
  }, [form.department]);

  const currentErrors = useMemo(
    () => validateForm(form, candidates, editId),
    [form, candidates, editId],
  );

  const isValid = Object.keys(currentErrors).length === 0
    && form.name.trim().length >= 3
    && !!form.department
    && !!form.position;

  const visibleErrors: FormErrors = saveAttempted ? currentErrors : {};

  const handlePickPhoto = useCallback(async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please allow access to your photo library to upload a photo.',
        );
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });
      if (!result.canceled && result.assets[0]) {
        setField('photo_uri', result.assets[0].uri);
      }
    } catch (err: any) {
      Alert.alert(
        'Could not open photo library',
        err?.message ?? 'Please try again.',
      );
    }
  }, [setField]);

  const handleRemovePhoto = useCallback(() => {
    setField('photo_uri', null);
  }, [setField]);

  const handleSave = useCallback(async () => {
    setSaveAttempted(true);
    if (!isValid) return;
    
    setIsSaving(true);
    try {
      await onSave(editId, form);
    } finally {
      setIsSaving(false);
    }
  }, [isValid, editId, form, onSave]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={S.form.overlay}>
        <KeyboardAwareScrollView
          style={S.form.sheet}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
          enableOnAndroid
          enableAutomaticScroll
          viewIsInsideTabBar
          extraScrollHeight={56}
          keyboardOpeningTime={0}
        >
            <View style={S.form.handle} />

            <Text style={S.form.title}>
              {editId ? 'Edit Candidate' : 'Add Candidate'}
            </Text>

            {/* ── Photo ─────────────────────────────────────────────────── */}
            <Text style={S.form.fieldLabel}>Photo</Text>
            <View style={{ alignItems: 'center', marginBottom: SPACE.md }}>
              <Pressable onPress={handlePickPhoto} style={({ pressed }) => pressed && { opacity: 0.85 }}>
                {form.photo_uri ? (
                  <Image
                    source={{ uri: form.photo_uri }}
                    style={{
                      width: 90, height: 90, borderRadius: 45,
                      borderWidth: 2, borderColor: C.green,
                    }}
                  />
                ) : (
                  <View style={{
                    width: 90, height: 90, borderRadius: 45,
                    backgroundColor: C.surface2,
                    borderWidth: 2, borderColor: C.greenDim,
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    {form.name.trim()
                      ? <Text style={{ fontSize: FONT.xl, fontWeight: '800', color: C.green }}>
                          {getInitials(form.name)}
                        </Text>
                      : <Text style={{ fontSize: 28, color: C.textMuted }}>📷</Text>
                    }
                  </View>
                )}
              </Pressable>
              <View style={{ flexDirection: 'row', gap: SPACE.sm, marginTop: SPACE.sm }}>
                <Pressable
                  onPress={handlePickPhoto}
                  style={({ pressed }) => ({
                    paddingHorizontal: SPACE.md,
                    paddingVertical: SPACE.xs,
                    borderRadius: RADIUS.pill,
                    borderWidth: 1,
                    borderColor: C.greenDim,
                    backgroundColor: C.surface2,
                    opacity: pressed ? 0.85 : 1,
                  })}
                >
                  <Text style={{ fontSize: FONT.sm, color: C.textSub, fontWeight: '600' }}>
                    {form.photo_uri ? 'Change Photo' : 'Upload from Gallery'}
                  </Text>
                </Pressable>
                {form.photo_uri ? (
                  <Pressable
                    onPress={handleRemovePhoto}
                    style={({ pressed }) => ({
                      paddingHorizontal: SPACE.md,
                      paddingVertical: SPACE.xs,
                      borderRadius: RADIUS.pill,
                      borderWidth: 1,
                      borderColor: 'rgba(239,68,68,0.35)',
                      backgroundColor: C.redGlow,
                      opacity: pressed ? 0.85 : 1,
                    })}
                  >
                    <Text style={{ fontSize: FONT.sm, color: C.red, fontWeight: '600' }}>
                      Remove
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            </View>

            {/* ── Full Name ─────────────────────────────────────────────── */}
            <Text style={S.form.fieldLabel}>Full Name *</Text>
            <TextInput
              style={[
                S.form.input,
                !!visibleErrors.name && { borderColor: C.red },
              ]}
              placeholder="e.g. Juan dela Cruz"
              placeholderTextColor={C.textMuted}
              value={form.name}
              onChangeText={v => setField('name', v)}
            />
            {visibleErrors.name
              ? <Text style={{ fontSize: FONT.xs, color: C.red, marginTop: 3 }}>
                  {visibleErrors.name}
                </Text>
              : null
            }

            {/* ── Partylist ─────────────────────────────────────────────── */}
            <Text style={S.form.fieldLabel}>Partylist</Text>
            <TextInput
              style={S.form.input}
              placeholder="e.g. Animo Party"
              placeholderTextColor={C.textMuted}
              value={form.partylist}
              onChangeText={v => setField('partylist', v)}
            />

            {/* ── Department ────────────────────────────────────────────── */}
            <Text style={S.form.fieldLabel}>Department *</Text>
            <DepartmentSelector
              selected={form.department}
              onChange={d => setField('department', d)}
            />
            {visibleErrors.department
              ? <Text style={{ fontSize: FONT.xs, color: C.red, marginTop: 3 }}>
                  {visibleErrors.department}
                </Text>
              : null
            }

            {/* ── Position ──────────────────────────────────────────────── */}
            <Text style={S.form.fieldLabel}>Position *</Text>
            {form.department ? (
              <PositionSelector
                positions={availablePositions}
                selected={form.position}
                onChange={p => setField('position', p)}
              />
            ) : (
              <Text style={{
                fontSize: FONT.sm, color: C.textMuted,
                fontStyle: 'italic', marginBottom: SPACE.sm,
              }}>
                Select a department first.
              </Text>
            )}
            {visibleErrors.position
              ? <Text style={{ fontSize: FONT.xs, color: C.red, marginTop: 3 }}>
                  {visibleErrors.position}
                </Text>
              : null
            }

            {/* ── Duplicate warning ─────────────────────────────────────── */}
            {visibleErrors.duplicate
              ? <View style={{
                  backgroundColor: C.redGlow,
                  borderRadius: RADIUS.md,
                  borderWidth: 1,
                  borderColor: 'rgba(239,68,68,0.35)',
                  padding: SPACE.sm,
                  marginTop: SPACE.xs,
                }}>
                  <Text style={{ fontSize: FONT.sm, color: C.red }}>
                    {visibleErrors.duplicate}
                  </Text>
                </View>
              : null
            }

            {/* ── School Email ──────────────────────────────────────────── */}
            <Text style={S.form.fieldLabel}>School Email</Text>
            <TextInput
              style={[
                S.form.input,
                !!visibleErrors.email && { borderColor: C.red },
              ]}
              placeholder="candidate@dlsl.edu.ph"
              placeholderTextColor={C.textMuted}
              value={form.email}
              onChangeText={v => setField('email', v)}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {visibleErrors.email
              ? <Text style={{ fontSize: FONT.xs, color: C.red, marginTop: 3 }}>
                  {visibleErrors.email}
                </Text>
              : null
            }

            {/* ── Credentials ───────────────────────────────────────────── */}
            <Text style={S.form.fieldLabel}>Credentials</Text>
            <TextInput
              style={[S.form.input, S.form.textArea]}
              placeholder="Academic achievements, leadership roles…"
              placeholderTextColor={C.textMuted}
              value={form.credentials}
              onChangeText={v => setField('credentials', v)}
              multiline
            />

            {/* ── Platform ──────────────────────────────────────────────── */}
            <Text style={S.form.fieldLabel}>Platform</Text>
            <TextInput
              style={[S.form.input, S.form.textArea]}
              placeholder="Key advocacies and plans for the student body…"
              placeholderTextColor={C.textMuted}
              value={form.platform}
              onChangeText={v => setField('platform', v)}
              multiline
            />

            <View style={S.form.divider} />

            <View style={S.form.btnRow}>
              <Pressable style={({ pressed }) => [S.form.btnCancel, pressed && { opacity: 0.85 }]} onPress={onClose} disabled={isSaving}>
                <Text style={S.form.btnCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  S.form.btnSave,
                  (!isValid || isSaving) && S.form.btnSaveDisabled,
                  isValid && pressed && !isSaving && { opacity: 0.88 },
                ]}
                onPress={handleSave}
                disabled={!isValid || isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={S.form.btnSaveText}>
                    {editId ? 'Save Changes' : 'Add Candidate'}
                  </Text>
                )}
              </Pressable>
            </View>

            <View style={{ height: 24 }} />
        </KeyboardAwareScrollView>
      </View>
    </Modal>
  );
};

// ─── Single candidate card ────────────────────────────────────────────────────

const CandidateCard: React.FC<{
  candidate: Candidate;
  onView:    () => void;
  onEdit:    () => void;
  onDelete:  () => void;
}> = ({ candidate, onView, onEdit, onDelete }) => {
  const C = useThemeColors();
  const S = useMemo(() => makeStyles(C), [C]);

  return (
    <View style={S.card.wrapper}>
      <View style={S.card.avatar}>
        {candidate.photo_url ? (
          <Image
            source={{ uri: candidate.photo_url }}
            style={{ width: 50, height: 50, borderRadius: 25 }}
          />
        ) : (
          <Text style={S.card.avatarText}>{getInitials(candidate.name)}</Text>
        )}
      </View>

      <View style={S.card.info}>
        <Text style={S.card.name} numberOfLines={1}>{candidate.name}</Text>
        <Text style={S.card.positionBadge} numberOfLines={1}>{candidate.position_name}</Text>
        {candidate.partylist
          ? <Text style={S.card.partylist} numberOfLines={1}>{candidate.partylist}</Text>
          : null
        }
      </View>

      <View style={S.card.actions}>
        <Pressable
          style={({ pressed }) => [S.card.actionBtn, S.card.viewBtn, pressed && { opacity: 0.75 }]}
          onPress={onView}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Text style={S.card.actionIcon}>👁</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [S.card.actionBtn, S.card.editBtn, pressed && { opacity: 0.75 }]}
          onPress={onEdit}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Text style={S.card.actionIcon}>✏️</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [S.card.actionBtn, S.card.deleteBtn, pressed && { opacity: 0.75 }]}
          onPress={onDelete}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Text style={S.card.actionIcon}>🗑️</Text>
        </Pressable>
      </View>
    </View>
  );
};

// ─── Position section header with enable/disable toggle ───────────────────────

const PositionHeader: React.FC<{
  positionName: string;
  positionId:   string;
  isDisabled:   boolean;
  onToggle:     () => void;
}> = ({ positionName, positionId: _positionId, isDisabled, onToggle }) => {
  const C = useThemeColors();

  return (
    <View style={{
      flexDirection:   'row',
      alignItems:      'center',
      justifyContent:  'space-between',
      marginTop:       SPACE.sm,
      marginBottom:    SPACE.xs,
    }}>
      <Text style={{
        fontSize:      FONT.xs,
        fontWeight:    '700',
        letterSpacing: 1.2,
        color:         isDisabled ? C.textMuted : C.textSub,
        textTransform: 'uppercase',
        flex:          1,
        marginRight:   SPACE.sm,
      }}
        numberOfLines={1}
      >
        {positionName}
      </Text>
      <Pressable
        onPress={onToggle}
        style={({ pressed }) => ({
          paddingHorizontal: SPACE.sm,
          paddingVertical:   SPACE.xs,
          borderRadius:      RADIUS.pill,
          borderWidth:       1,
          borderColor:       isDisabled ? 'rgba(239,68,68,0.35)' : C.greenDim,
          backgroundColor:   isDisabled ? C.redGlow              : C.surface2,
          opacity:           pressed ? 0.85 : 1,
        })}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      >
        <Text style={{
          fontSize:   FONT.xs,
          fontWeight: '700',
          color:      isDisabled ? C.red : C.textSub,
        }}>
          {isDisabled ? '⛔ Disabled' : '✓ Active'}
        </Text>
      </Pressable>
    </View>
  );
};

// ─── Main screen ──────────────────────────────────────────────────────────────

function AdminCandidatesScreen() {
  const C = useThemeColors();
  const S = useMemo(() => makeStyles(C), [C]);
  const queryClient = useQueryClient();

  const disabledPositions = useCandidateStore(state => state.disabledPositions);
  const togglePositionDisabled = useCandidateStore(state => state.togglePositionDisabled);

  // ─── Supabase Queries & Mutations ──────────────────────────────────────────

  const { data: dbPositions = [] } = useQuery({
    queryKey: ['positions'],
    queryFn: async () => {
      const { data, error } = await supabase.from('Positions').select('*');
      if (error) throw error;
      return data;
    }
  });

  // ✅ Fix 1: Unified Query Key
  // Using ['candidates', 'admin'] ensures it gets tracked uniquely but can be wiped out using fuzzy matching on ['candidates']
  const { data: dbCandidates = [], isLoading } = useQuery({
    queryKey: ['candidates', 'admin'], 
    queryFn: async () => {
      const { data, error } = await supabase
        .from('Candidates')
        .select('*, Positions(position_name)');
      if (error) throw error;
      return data;
    }
  });

  const deleteMutation = useDeleteCandidate();

  const addMutation = useMutation({
    mutationFn: async (payload: any) => {
      const { data, error } = await supabase.from('Candidates').insert([payload]).select();
      if (error) throw error;
      return data;
    },
    // Invalidating base ['candidates'] catches both Student view and Admin view cache
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['candidates'] }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string, payload: any }) => {
      const { data, error } = await supabase.from('Candidates').update(payload).eq('id', id).select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['candidates'] }),
  });

  // Map database entries to match the Candidate store type expected by the UI
  const candidates: Candidate[] = useMemo(() => {
    return dbCandidates.map((c: any) => {
      let dept = 'Executive Council';
      let posName = c.Positions?.position_name || '';

      // Infer department directly from position_name (e.g. 'CBEAM Governor' -> dept: 'CBEAM', posName: 'Governor')
      // DB always stores the format `${department} ${position}` (space separator) — see handleSave below.
      for (const d of DEPARTMENTS) {
        if (d !== 'Executive Council' && posName.startsWith(`${d} `)) {
          dept = d;
          posName = posName.slice(d.length + 1);
          break;
        }
      }

      return {
        id: c.id,
        name: c.name,
        partylist: c.partylist || '',
        position_id: c.position_id,
        position_name: posName as Position,
        department: dept as Department,
        photo_url: c.photo_url,
        email: c.email,
        credentials: c.credentials,
        platform: c.platform,
      };
    });
  }, [dbCandidates]);

  // ─── State ─────────────────────────────────────────────────────────────

  const [activeFilter,    setActiveFilter]    = useState<string>('all');
  const [formVisible,     setFormVisible]     = useState(false);
  const [editId,          setEditId]          = useState<string | null>(null);
  const [formInitial,     setFormInitial]     = useState<FormState>(EMPTY_FORM);
  const [viewedCandidate, setViewedCandidate] = useState<Candidate | null>(null);

  // ─── Grouped: per visible department → per position ───────────────────────
  const grouped = useMemo(() => {
    const visibleDepts: readonly string[] =
      activeFilter === 'all' ? DEPARTMENTS : [activeFilter];

    return visibleDepts.map(dept => {
      const positions: readonly string[] =
        dept === 'Executive Council' ? EXECUTIVE_POSITIONS : DEPARTMENT_POSITIONS;

      const positionGroups = positions.map(posName => {
        const expectedPosName = dept === 'Executive Council' ? posName : `${dept} ${posName}`;
        // Find the UUID from dbPositions, fallback to a dummy string if not created yet
        const posId = dbPositions.find(p => p.position_name === expectedPosName)?.id || `missing-${expectedPosName}`;

        const items = candidates.filter(
          c => c.department === dept && c.position_name === posName,
        );
        return { positionName: posName, positionId: posId, items };
      });

      return { department: dept, positionGroups };
    });
  }, [candidates, activeFilter, dbPositions]);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const openAdd = useCallback(() => {
    setEditId(null);
    setFormInitial({ ...EMPTY_FORM });
    setFormVisible(true);
  }, []);

  const openEdit = useCallback((c: Candidate) => {
    setEditId(c.id);
    setFormInitial({
      name:        c.name,
      partylist:   c.partylist   ?? '',
      department:  c.department,
      position:    c.position_name,
      email:       c.email       ?? '',
      credentials: c.credentials ?? '',
      platform:    c.platform    ?? '',
      photo_uri:   c.photo_url,
    });
    setFormVisible(true);
  }, []);

  const confirmDelete = useCallback((c: Candidate) => {
    Alert.alert(
      'Delete Candidate',
      `Remove "${c.name}" from the ballot? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: () => deleteMutation.mutate(c.id, {
            onError: (err) => Alert.alert('Deletion Failed', err.message),
          }),
        },
      ],
    );
  }, [deleteMutation]);

  const handleSave = useCallback(async (id: string | null, data: FormState) => {
    if (!data.department || !data.position) return;

    try {
      // Supabase stringifies them as either "Executive President" or "CBEAM Governor"
      const expectedPosName = data.department === 'Executive Council'
        ? data.position
        : `${data.department} ${data.position}`;

      let posId = dbPositions.find(p => p.position_name === expectedPosName)?.id;

      if (!posId) {
        // Auto-insert missing positions safely to avoid FK failures
        const { data: newPos, error } = await supabase
          .from('Positions')
          .insert([{ position_name: expectedPosName }])
          .select()
          .single();

        if (error) throw new Error(`Failed to create position: ${error.message}`);

        posId = newPos.id;
        queryClient.invalidateQueries({ queryKey: ['positions'] });
      }

      // Upload local photos to Supabase Storage. We can't persist a file:// URI
      // because that path only exists on the admin's device — every other
      // viewer (students, other admins) would see a broken image.
      let photoUrl: string | null = data.photo_uri;
      if (photoUrl && isLocalFileUri(photoUrl)) {
        try {
          photoUrl = await uploadCandidatePhoto(photoUrl, data.name);
        } catch (uploadErr: any) {
          Alert.alert(
            'Photo Upload Failed',
            uploadErr?.message ??
              'Could not upload the candidate photo. Please check your connection and try again.',
          );
          return;
        }
      }

      const payload = {
        name:          data.name.trim(),
        partylist:     data.partylist.trim()  || null,
        position_id:   posId,
        email:         data.email.trim()      || null,
        credentials:   data.credentials.trim() || null,
        platform:      data.platform.trim()    || null,
        photo_url:     photoUrl,
      };

      if (id) {
        await updateMutation.mutateAsync({ id, payload });
      } else {
        await addMutation.mutateAsync(payload);
      }

      setFormVisible(false);
    } catch (err: any) {
      Alert.alert('Save Failed', err.message || 'An unexpected error occurred.');
    }
  }, [dbPositions, addMutation, updateMutation, queryClient]);

  const renderCards = useCallback((list: Candidate[]) =>
    list.map(c => (
      <CandidateCard
        key={c.id}
        candidate={c}
        onView={() => setViewedCandidate(c)}
        onEdit={() => openEdit(c)}
        onDelete={() => confirmDelete(c)}
      />
    )),
  [openEdit, confirmDelete]);

  // ─── Main UI ───────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={S.screen.container} edges={['top', 'left', 'right']}>

      {/* Header */}
      <View style={S.screen.header}>
        <View>
          <Text style={S.screen.headerTitle}>Candidates</Text>
          <Text style={S.screen.headerSub}>
            {candidates.length} registered · {DEPARTMENTS.length} departments
          </Text>
        </View>
        <Pressable style={({ pressed }) => [S.screen.addBtn, pressed && { opacity: 0.88 }]} onPress={openAdd}>
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800', lineHeight: 18 }}>＋</Text>
          <Text style={S.screen.addBtnText}>Add</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={C.green} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={S.screen.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Department filter tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={S.filter.scrollRow}
          >
            <View style={S.filter.innerRow}>
              <Pressable
                style={({ pressed }) => [
                  S.filter.tab,
                  activeFilter === 'all' && S.filter.tabActive,
                  pressed && { opacity: 0.85 },
                ]}
                onPress={() => setActiveFilter('all')}
              >
                <Text style={[S.filter.tabText, activeFilter === 'all' && S.filter.tabTextActive]}>
                  All
                </Text>
              </Pressable>
              {DEPARTMENTS.map(d => (
                <Pressable
                  key={d}
                  style={({ pressed }) => [
                    S.filter.tab,
                    activeFilter === d && S.filter.tabActive,
                    pressed && { opacity: 0.85 },
                  ]}
                  onPress={() => setActiveFilter(d)}
                >
                  <Text style={[S.filter.tabText, activeFilter === d && S.filter.tabTextActive]}>
                    {d}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>

          {/* Grouped candidate list */}
          {grouped.map(({ department, positionGroups }) => (
            <View key={department}>

              {/* Department section header (only in "All" view) */}
              {activeFilter === 'all' && (
                <Text style={[S.screen.sectionLabel, { marginTop: SPACE.lg }]}>
                  {department}
                </Text>
              )}

              {positionGroups.map(({ positionName, positionId, items }) => {
                const isDisabled = disabledPositions.has(positionId);
                return (
                  <View key={positionId}>

                    {/* Position sub-header + toggle */}
                    <PositionHeader
                      positionName={positionName}
                      positionId={positionId}
                      isDisabled={isDisabled}
                      onToggle={() => togglePositionDisabled(positionId)}
                    />

                    {/* Disabled banner */}
                    {isDisabled && (
                      <View style={{
                        backgroundColor: C.redGlow,
                        borderRadius:    RADIUS.md,
                        borderWidth:     1,
                        borderColor:     'rgba(239,68,68,0.35)',
                        padding:         SPACE.sm,
                        marginBottom:    SPACE.sm,
                      }}>
                        <Text style={{
                          fontSize:  FONT.xs,
                          color:     C.red,
                          textAlign: 'center',
                        }}>
                          This position is disabled and excluded from the ballot.
                        </Text>
                      </View>
                    )}

                    {/* Candidates or empty placeholder */}
                    {items.length === 0 ? (
                      <View style={{
                        backgroundColor: C.surface,
                        borderRadius:    RADIUS.md,
                        borderWidth:     1,
                        borderColor:     C.border,
                        padding:         SPACE.base,
                        marginBottom:    SPACE.sm,
                      }}>
                        <Text style={{
                          fontSize:  FONT.sm,
                          color:     C.textMuted,
                          textAlign: 'center',
                          fontStyle: 'italic',
                        }}>
                          No candidates for this position.
                        </Text>
                      </View>
                    ) : renderCards(items)}

                  </View>
                );
              })}
            </View>
          ))}

        </ScrollView>
      )}

      {/* Add / Edit form sheet */}
      <CandidateFormSheet
        visible={formVisible}
        editId={editId}
        initial={formInitial}
        candidates={candidates}
        onClose={() => setFormVisible(false)}
        onSave={handleSave}
      />

      {/* Profile modal — admin mode */}
      <CandidateModal
        candidate={viewedCandidate ? toModalRow(viewedCandidate) : null}
        visible={!!viewedCandidate}
        onClose={() => setViewedCandidate(null)}
        onAdminEdit={row => {
          const original = candidates.find(x => x.id === row.id);
          if (!original) return;
          setViewedCandidate(null);
          setTimeout(() => openEdit(original), 250);
        }}
        onAdminDelete={row => {
          const original = candidates.find(x => x.id === row.id);
          if (!original) return;
          setViewedCandidate(null);
          setTimeout(() => confirmDelete(original), 250);
        }}
      />
    </SafeAreaView>
  );
}

// ─── BOTH exports so navigator works regardless of named vs default import ────
export { AdminCandidatesScreen };
export default AdminCandidatesScreen;