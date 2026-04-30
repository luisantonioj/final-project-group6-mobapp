// screens/admin/AdminCandidatesScreen.tsx
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';

import {
  useCandidateStore,
  DEPARTMENTS,
  EXECUTIVE_POSITIONS,
  DEPARTMENT_POSITIONS,
  POSITION_IDS,
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

function resolvePositionId(department: string, position: string): string {
  const execPositions: readonly string[] = EXECUTIVE_POSITIONS;
  if (execPositions.includes(position)) {
    return POSITION_IDS[position] ?? `pos-unknown-${position}`;
  }
  return POSITION_IDS[`${department}-${position}`] ?? `pos-unknown-${department}-${position}`;
}

function generateCandidateId(): string {
  return `cand-${Date.now()}-${Math.floor(Math.random() * 9999)}`;
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
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email.trim())) {
      errors.email = 'Please enter a valid email address.';
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
          <TouchableOpacity
            key={d}
            style={[S.form.positionTab, selected === d && S.form.positionTabActive]}
            onPress={() => onChange(d)}
          >
            <Text style={[
              S.form.positionTabText,
              selected === d && S.form.positionTabTextActive,
            ]}>
              {d}
            </Text>
          </TouchableOpacity>
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
          <TouchableOpacity
            key={p}
            style={[S.form.positionTab, selected === p && S.form.positionTabActive]}
            onPress={() => onChange(p)}
          >
            <Text style={[
              S.form.positionTabText,
              selected === p && S.form.positionTabTextActive,
            ]}>
              {p}
            </Text>
          </TouchableOpacity>
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

  useEffect(() => {
    setFormState(initial);
    setErrors({});
    setSaveAttempted(false);
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
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photo library to upload a photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      setField('photo_uri', result.assets[0].uri);
    }
  }, [setField]);

  const handleSave = useCallback(() => {
    setSaveAttempted(true);
    if (!isValid) return;
    onSave(editId, form);
  }, [isValid, editId, form, onSave]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={S.form.overlay}>
          <ScrollView
            style={S.form.sheet}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <View style={S.form.handle} />

            <Text style={S.form.title}>
              {editId ? 'Edit Candidate' : 'Add Candidate'}
            </Text>

            {/* ── Photo ─────────────────────────────────────────────────── */}
            <Text style={S.form.fieldLabel}>Photo</Text>
            <View style={{ alignItems: 'center', marginBottom: SPACE.md }}>
              <TouchableOpacity onPress={handlePickPhoto} activeOpacity={0.8}>
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
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handlePickPhoto}
                style={{
                  marginTop: SPACE.sm,
                  paddingHorizontal: SPACE.md,
                  paddingVertical: SPACE.xs,
                  borderRadius: RADIUS.pill,
                  borderWidth: 1,
                  borderColor: C.greenDim,
                  backgroundColor: C.surface2,
                }}
              >
                <Text style={{ fontSize: FONT.sm, color: C.textSub, fontWeight: '600' }}>
                  {form.photo_uri ? 'Change Photo' : 'Upload from Gallery'}
                </Text>
              </TouchableOpacity>
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
              <TouchableOpacity style={S.form.btnCancel} onPress={onClose}>
                <Text style={S.form.btnCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[S.form.btnSave, !isValid && S.form.btnSaveDisabled]}
                onPress={handleSave}
                disabled={!isValid}
              >
                <Text style={S.form.btnSaveText}>
                  {editId ? 'Save Changes' : 'Add Candidate'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={{ height: 24 }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
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
        <TouchableOpacity
          style={[S.card.actionBtn, S.card.viewBtn]}
          onPress={onView}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Text style={S.card.actionIcon}>👁</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[S.card.actionBtn, S.card.editBtn]}
          onPress={onEdit}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Text style={S.card.actionIcon}>✏️</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[S.card.actionBtn, S.card.deleteBtn]}
          onPress={onDelete}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Text style={S.card.actionIcon}>🗑️</Text>
        </TouchableOpacity>
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
      <TouchableOpacity
        onPress={onToggle}
        style={{
          paddingHorizontal: SPACE.sm,
          paddingVertical:   SPACE.xs,
          borderRadius:      RADIUS.pill,
          borderWidth:       1,
          borderColor:       isDisabled ? 'rgba(239,68,68,0.35)' : C.greenDim,
          backgroundColor:   isDisabled ? C.redGlow              : C.surface2,
        }}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      >
        <Text style={{
          fontSize:   FONT.xs,
          fontWeight: '700',
          color:      isDisabled ? C.red : C.textSub,
        }}>
          {isDisabled ? '⛔ Disabled' : '✓ Active'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

// ─── Main screen ──────────────────────────────────────────────────────────────

function AdminCandidatesScreen() {
  const C = useThemeColors();
  const S = useMemo(() => makeStyles(C), [C]);

  const {
    candidates,
    disabledPositions,
    addCandidate,
    updateCandidate,
    deleteCandidate,
    togglePositionDisabled,
  } = useCandidateStore();

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
        const posId = resolvePositionId(dept, posName);
        const items = candidates.filter(
          c => c.department === dept && c.position_name === posName,
        );
        return { positionName: posName, positionId: posId, items };
      });

      return { department: dept, positionGroups };
    });
  }, [candidates, activeFilter]);

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
          onPress: () => deleteCandidate(c.id),
        },
      ],
    );
  }, [deleteCandidate]);

  const handleSave = useCallback((id: string | null, data: FormState) => {
    if (!data.department || !data.position) return;

    const dept        = data.department as Department;
    const pos         = data.position   as Position;
    const position_id = resolvePositionId(dept, pos);

    const payload = {
      name:          data.name.trim(),
      partylist:     data.partylist.trim(),
      department:    dept,
      position_id,
      position_name: pos,
      email:         data.email.trim()       || null,
      credentials:   data.credentials.trim() || null,
      platform:      data.platform.trim()    || null,
      photo_url:     data.photo_uri,
    };

    if (id) {
      updateCandidate(id, payload);
    } else {
      addCandidate({ ...payload, id: generateCandidateId() });
    }

    setFormVisible(false);
  }, [addCandidate, updateCandidate]);

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
        <TouchableOpacity style={S.screen.addBtn} onPress={openAdd}>
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800', lineHeight: 18 }}>＋</Text>
          <Text style={S.screen.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

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
            <TouchableOpacity
              style={[S.filter.tab, activeFilter === 'all' && S.filter.tabActive]}
              onPress={() => setActiveFilter('all')}
            >
              <Text style={[S.filter.tabText, activeFilter === 'all' && S.filter.tabTextActive]}>
                All
              </Text>
            </TouchableOpacity>
            {DEPARTMENTS.map(d => (
              <TouchableOpacity
                key={d}
                style={[S.filter.tab, activeFilter === d && S.filter.tabActive]}
                onPress={() => setActiveFilter(d)}
              >
                <Text style={[S.filter.tabText, activeFilter === d && S.filter.tabTextActive]}>
                  {d}
                </Text>
              </TouchableOpacity>
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
