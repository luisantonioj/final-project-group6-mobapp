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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useCandidates, useDeleteCandidate } from '../../hooks/useCandidates';
import { usePositions }                      from '../../hooks/usePositions';
import { CandidateModal, CandidateRow }      from '../../components/CandidateModal';
import { supabase }                          from '../../utils/supabase';

import {
  COLORS,
  FONT,
  SPACE,
  RADIUS,
  screenStyles,
  filterStyles,
  cardStyles,
  formStyles,
  emptyStyles,
} from './AdminCandidatesScreen.styles';

// ─── Types ────────────────────────────────────────────────────────────────────
interface PositionRow {
  id:            string;
  position_name: string;
  display_order: number;
}

interface FormState {
  name:        string;
  partylist:   string;
  position_id: string;
  email:       string;
  credentials: string;
  platform:    string;
}

const EMPTY_FORM: FormState = {
  name:        '',
  partylist:   '',
  position_id: '',
  email:       '',
  credentials: '',
  platform:    '',
};

// ─── Dummy data shown when DB has no records yet ──────────────────────────────
const DUMMY_POSITIONS: PositionRow[] = [
  { id: 'p1', position_name: 'Executive President',      display_order: 1 },
  { id: 'p2', position_name: 'Executive Vice President', display_order: 2 },
  { id: 'p3', position_name: 'Secretary General',        display_order: 3 },
  { id: 'p4', position_name: 'Treasurer',                display_order: 4 },
  { id: 'p5', position_name: 'Auditor',                  display_order: 5 },
  { id: 'p6', position_name: 'Public Relations Officer', display_order: 6 },
  { id: 'p7', position_name: '1st Year Representative',  display_order: 7 },
  { id: 'p8', position_name: '2nd Year Representative',  display_order: 8 },
];

const DUMMY_CANDIDATES: CandidateRow[] = [
  {
    id: 'c1', name: 'Maria Santos',
    partylist: 'Alyansa ng Pagbabago',
    position_id: 'p1', photo_url: null,
    email: 'maria.santos@dlsl.edu.ph',
    credentials: "Former Student Council Secretary · Dean's Lister 6 semesters · Model Lasallian Awardee 2024",
    platform: 'Strengthen academic support programs, improve campus Wi-Fi, and establish a 24/7 student wellness hotline.',
    Positions: { position_name: 'Executive President' },
  },
  {
    id: 'c2', name: 'Juan dela Cruz',
    partylist: 'Sama-Sama',
    position_id: 'p1', photo_url: null,
    email: 'juan.delacruz@dlsl.edu.ph',
    credentials: 'President of JPIA · 2x Campus Journalism Awardee · DLSL Ambassador 2023',
    platform: 'Transparent governance, expanded scholarships, and stronger student-admin linkages.',
    Positions: { position_name: 'Executive President' },
  },
  {
    id: 'c3', name: 'Angela Reyes',
    partylist: 'Alyansa ng Pagbabago',
    position_id: 'p2', photo_url: null,
    email: 'angela.reyes@dlsl.edu.ph',
    credentials: 'VP of CCS Student Council · Academic Excellence Awardee · Coding Bootcamp Facilitator',
    platform: 'Digitize student services, create a centralized org calendar, push for mental health days.',
    Positions: { position_name: 'Executive Vice President' },
  },
  {
    id: 'c4', name: 'Carlos Mendoza',
    partylist: 'Sama-Sama',
    position_id: 'p3', photo_url: null,
    email: 'carlos.mendoza@dlsl.edu.ph',
    credentials: 'Secretary of ROTC · Publication Coordinator · Consistent Honors Student',
    platform: 'Streamline student-admin communication through a transparent bulletin system.',
    Positions: { position_name: 'Secretary General' },
  },
  {
    id: 'c5', name: 'Patricia Lim',
    partylist: 'Alyansa ng Pagbabago',
    position_id: 'p4', photo_url: null,
    email: 'patricia.lim@dlsl.edu.ph',
    credentials: 'Treasurer of Accounting Society · CPA Board Passer · Accounting Excellence Awardee',
    platform: 'Strict financial transparency, student org budget reform, and accessible org funding.',
    Positions: { position_name: 'Treasurer' },
  },
  {
    id: 'c6', name: 'Renzo Garcia',
    partylist: 'Sama-Sama',
    position_id: 'p5', photo_url: null,
    email: 'renzo.garcia@dlsl.edu.ph',
    credentials: 'Internal Auditor of JPIA · Accounting Honor Society Member · Leadership Excellence Awardee',
    platform: 'Implement independent audit reviews for all student government financial transactions.',
    Positions: { position_name: 'Auditor' },
  },
  {
    id: 'c7', name: 'Sofia Cruz',
    partylist: 'Alyansa ng Pagbabago',
    position_id: 'p6', photo_url: null,
    email: 'sofia.cruz@dlsl.edu.ph',
    credentials: 'Marketing Head of CEA Council · Social Media Manager for DLSL Events · PR Excellence Awardee',
    platform: "Revamp DLSL's student social media presence and launch a unified student news platform.",
    Positions: { position_name: 'Public Relations Officer' },
  },
  {
    id: 'c8', name: 'Liam Torres',
    partylist: 'Sama-Sama',
    position_id: 'p7', photo_url: null,
    email: 'liam.torres@dlsl.edu.ph',
    credentials: 'DLSL Freshman Class President 2024 · Debate Team Captain · Academic Excellence Awardee',
    platform: 'Create a dedicated first-year orientation committee and peer mentoring network.',
    Positions: { position_name: '1st Year Representative' },
  },
];

// ─── Helper ───────────────────────────────────────────────────────────────────
function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0] ?? '')
    .join('')
    .toUpperCase();
}

// ─── Upsert mutation (no existing hook covers create+update) ──────────────────
function useUpsertCandidate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id?: string; data: FormState }) => {
      const payload = {
        name:        data.name.trim(),
        partylist:   data.partylist.trim()   || null,
        position_id: data.position_id,
        email:       data.email.trim()       || null,
        credentials: data.credentials.trim() || null,
        platform:    data.platform.trim()    || null,
      };
      if (id) {
        const { error } = await supabase.from('Candidates').update(payload).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('Candidates').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['candidates'] }),
  });
}

// ─── Position pill selector inside the form ───────────────────────────────────
const PositionSelector: React.FC<{
  positions: PositionRow[];
  selected:  string;
  onChange:  (id: string) => void;
}> = ({ positions, selected, onChange }) => (
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    style={formStyles.positionScrollRow}
  >
    <View style={formStyles.positionInnerRow}>
      {positions.map(p => (
        <TouchableOpacity
          key={p.id}
          style={[formStyles.positionTab, selected === p.id && formStyles.positionTabActive]}
          onPress={() => onChange(p.id)}
        >
          <Text style={[
            formStyles.positionTabText,
            selected === p.id && formStyles.positionTabTextActive,
          ]}>
            {p.position_name}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  </ScrollView>
);

// ─── Add / Edit bottom sheet ──────────────────────────────────────────────────
const CandidateFormSheet: React.FC<{
  visible:   boolean;
  editId:    string | null;
  initial:   FormState;
  positions: PositionRow[];
  onClose:   () => void;
  onSave:    (id: string | null, data: FormState) => void;
  isSaving:  boolean;
}> = ({ visible, editId, initial, positions, onClose, onSave, isSaving }) => {
  const [form, setForm] = useState<FormState>(initial);

  useEffect(() => { setForm(initial); }, [initial]);

  const set = (field: keyof FormState, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const canSave = form.name.trim().length > 0 && form.position_id.length > 0;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={formStyles.overlay}>
          <ScrollView
            style={formStyles.sheet}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <View style={formStyles.handle} />

            <Text style={formStyles.title}>
              {editId ? 'Edit Candidate' : 'Add Candidate'}
            </Text>

            <Text style={formStyles.fieldLabel}>Full Name *</Text>
            <TextInput
              style={formStyles.input}
              placeholder="e.g. Juan dela Cruz"
              placeholderTextColor={COLORS.textMuted}
              value={form.name}
              onChangeText={v => set('name', v)}
            />

            <Text style={formStyles.fieldLabel}>Partylist</Text>
            <TextInput
              style={formStyles.input}
              placeholder="e.g. Alyansa ng Pagbabago"
              placeholderTextColor={COLORS.textMuted}
              value={form.partylist}
              onChangeText={v => set('partylist', v)}
            />

            <Text style={formStyles.fieldLabel}>Position *</Text>
            <PositionSelector
              positions={positions}
              selected={form.position_id}
              onChange={id => set('position_id', id)}
            />

            <Text style={formStyles.fieldLabel}>School Email</Text>
            <TextInput
              style={formStyles.input}
              placeholder="candidate@dlsl.edu.ph"
              placeholderTextColor={COLORS.textMuted}
              value={form.email}
              onChangeText={v => set('email', v)}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={formStyles.fieldLabel}>Credentials</Text>
            <TextInput
              style={[formStyles.input, formStyles.textArea]}
              placeholder="Academic achievements, leadership roles…"
              placeholderTextColor={COLORS.textMuted}
              value={form.credentials}
              onChangeText={v => set('credentials', v)}
              multiline
            />

            <Text style={formStyles.fieldLabel}>Platform</Text>
            <TextInput
              style={[formStyles.input, formStyles.textArea]}
              placeholder="Key advocacies and plans for the student body…"
              placeholderTextColor={COLORS.textMuted}
              value={form.platform}
              onChangeText={v => set('platform', v)}
              multiline
            />

            <View style={formStyles.divider} />

            <View style={formStyles.btnRow}>
              <TouchableOpacity
                style={formStyles.btnCancel}
                onPress={onClose}
                disabled={isSaving}
              >
                <Text style={formStyles.btnCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  formStyles.btnSave,
                  (!canSave || isSaving) && formStyles.btnSaveDisabled,
                ]}
                onPress={() => canSave && onSave(editId, form)}
                disabled={!canSave || isSaving}
              >
                {isSaving
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={formStyles.btnSaveText}>
                      {editId ? 'Save Changes' : 'Add Candidate'}
                    </Text>
                }
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
  candidate: CandidateRow;
  onView:    () => void;
  onEdit:    () => void;
  onDelete:  () => void;
}> = ({ candidate, onView, onEdit, onDelete }) => {
  const positionName =
    (candidate.Positions as { position_name: string } | null | undefined)
      ?.position_name ?? '—';

  return (
    <View style={cardStyles.wrapper}>
      <View style={cardStyles.avatar}>
        <Text style={cardStyles.avatarText}>{getInitials(candidate.name)}</Text>
      </View>

      <View style={cardStyles.info}>
        <Text style={cardStyles.name} numberOfLines={1}>{candidate.name}</Text>
        <Text style={cardStyles.positionBadge} numberOfLines={1}>{positionName}</Text>
        {candidate.partylist
          ? <Text style={cardStyles.partylist} numberOfLines={1}>{candidate.partylist}</Text>
          : null
        }
      </View>

      <View style={cardStyles.actions}>
        <TouchableOpacity
          style={[cardStyles.actionBtn, cardStyles.viewBtn]}
          onPress={onView}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Text style={cardStyles.actionIcon}>👁</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[cardStyles.actionBtn, cardStyles.editBtn]}
          onPress={onEdit}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Text style={cardStyles.actionIcon}>✏️</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[cardStyles.actionBtn, cardStyles.deleteBtn]}
          onPress={onDelete}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Text style={cardStyles.actionIcon}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ─── Main screen ──────────────────────────────────────────────────────────────
function AdminCandidatesScreen() {
  const { data: rawCandidates = [], isLoading: loadingCand } = useCandidates();
  const { data: rawPositions  = [], isLoading: loadingPos  } = usePositions();
  const deleteMutation = useDeleteCandidate();
  const upsertMutation = useUpsertCandidate();

  // Fall back to dummy data until backend is connected
  const isUsingDummy = rawCandidates.length === 0;
  const candidates   = (isUsingDummy ? DUMMY_CANDIDATES : rawCandidates) as CandidateRow[];
  const positions    = (rawPositions.length === 0 ? DUMMY_POSITIONS : rawPositions) as PositionRow[];

  const [activeFilter,    setActiveFilter]    = useState<string>('all');
  const [formVisible,     setFormVisible]     = useState(false);
  const [editId,          setEditId]          = useState<string | null>(null);
  const [formInitial,     setFormInitial]     = useState<FormState>(EMPTY_FORM);
  const [viewedCandidate, setViewedCandidate] = useState<CandidateRow | null>(null);

  // ─── Filtered + grouped ────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    if (activeFilter === 'all') return candidates;
    return candidates.filter(c => c.position_id === activeFilter);
  }, [candidates, activeFilter]);

  const grouped = useMemo(() => {
    if (activeFilter !== 'all') return null;
    const map = new Map<string, { position: PositionRow; items: CandidateRow[] }>();
    positions.forEach(p => map.set(p.id, { position: p, items: [] }));
    candidates.forEach(c => {
      const entry = map.get(c.position_id);
      if (entry) entry.items.push(c);
    });
    return Array.from(map.values());
  }, [positions, candidates, activeFilter]);

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const openAdd = useCallback(() => {
    setEditId(null);
    setFormInitial({ ...EMPTY_FORM, position_id: positions[0]?.id ?? '' });
    setFormVisible(true);
  }, [positions]);

  const openEdit = useCallback((c: CandidateRow) => {
    setEditId(c.id);
    setFormInitial({
      name:        c.name,
      partylist:   c.partylist   ?? '',
      position_id: c.position_id,
      email:       c.email       ?? '',
      credentials: c.credentials ?? '',
      platform:    c.platform    ?? '',
    });
    setFormVisible(true);
  }, []);

  const confirmDelete = useCallback((c: CandidateRow) => {
    if (isUsingDummy) {
      Alert.alert('Demo Mode', 'Connect the backend to enable deleting candidates.');
      return;
    }
    Alert.alert(
      'Delete Candidate',
      `Remove "${c.name}" from the ballot? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            try {
              await deleteMutation.mutateAsync(c.id);
            } catch (err: any) {
              Alert.alert('Error', err?.message ?? 'Failed to delete candidate.');
            }
          },
        },
      ],
    );
  }, [deleteMutation, isUsingDummy]);

  const handleSave = useCallback(async (id: string | null, data: FormState) => {
    if (isUsingDummy) {
      setFormVisible(false);
      Alert.alert('Demo Mode', 'Connect the backend to enable saving candidates.');
      return;
    }
    try {
      await upsertMutation.mutateAsync({ id: id ?? undefined, data });
      setFormVisible(false);
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Failed to save candidate.');
    }
  }, [upsertMutation, isUsingDummy]);

  const renderCards = (list: CandidateRow[]) =>
    list.map(c => (
      <CandidateCard
        key={c.id}
        candidate={c}
        onView={() => setViewedCandidate(c)}
        onEdit={() => openEdit(c)}
        onDelete={() => confirmDelete(c)}
      />
    ));

  // ─── Loading ───────────────────────────────────────────────────────────────
  if (loadingCand || loadingPos) {
    return (
      <SafeAreaView style={screenStyles.container} edges={['top', 'left', 'right']}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={COLORS.green} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  // ─── Main UI ───────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={screenStyles.container} edges={['top', 'left', 'right']}>

      {/* Header */}
      <View style={screenStyles.header}>
        <View>
          <Text style={screenStyles.headerTitle}>Candidates</Text>
          <Text style={screenStyles.headerSub}>
            {candidates.length} registered · {positions.length} positions
            {isUsingDummy ? ' · Demo' : ''}
          </Text>
        </View>
        <TouchableOpacity style={screenStyles.addBtn} onPress={openAdd}>
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800', lineHeight: 18 }}>＋</Text>
          <Text style={screenStyles.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={screenStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Position filter tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={filterStyles.scrollRow}
        >
          <View style={filterStyles.innerRow}>
            <TouchableOpacity
              style={[filterStyles.tab, activeFilter === 'all' && filterStyles.tabActive]}
              onPress={() => setActiveFilter('all')}
            >
              <Text style={[filterStyles.tabText, activeFilter === 'all' && filterStyles.tabTextActive]}>
                All
              </Text>
            </TouchableOpacity>
            {positions.map(p => (
              <TouchableOpacity
                key={p.id}
                style={[filterStyles.tab, activeFilter === p.id && filterStyles.tabActive]}
                onPress={() => setActiveFilter(p.id)}
              >
                <Text style={[filterStyles.tabText, activeFilter === p.id && filterStyles.tabTextActive]}>
                  {p.position_name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Candidate list */}
        {filtered.length === 0 ? (
          <View style={emptyStyles.wrapper}>
            <Text style={emptyStyles.icon}>🔍</Text>
            <Text style={emptyStyles.title}>None Found</Text>
            <Text style={emptyStyles.body}>No candidates for this position yet.</Text>
          </View>
        ) : activeFilter !== 'all' ? (
          renderCards(filtered)
        ) : (
          grouped?.map(({ position, items }) => (
            <View key={position.id}>
              <Text style={screenStyles.sectionLabel}>{position.position_name}</Text>
              {items.length === 0 ? (
                <View style={{
                  backgroundColor: COLORS.bgCard,
                  borderRadius:    RADIUS.md,
                  borderWidth:     1,
                  borderColor:     COLORS.border,
                  padding:         SPACE.base,
                  marginBottom:    SPACE.sm,
                }}>
                  <Text style={{
                    fontSize:  FONT.sm,
                    color:     COLORS.textMuted,
                    textAlign: 'center',
                    fontStyle: 'italic',
                  }}>
                    No candidates for this position.
                  </Text>
                </View>
              ) : renderCards(items)}
            </View>
          ))
        )}
      </ScrollView>

      {/* Add / Edit form sheet */}
      <CandidateFormSheet
        visible={formVisible}
        editId={editId}
        initial={formInitial}
        positions={positions}
        onClose={() => setFormVisible(false)}
        onSave={handleSave}
        isSaving={upsertMutation.isPending}
      />

      {/* Profile modal — admin mode */}
      <CandidateModal
        candidate={viewedCandidate}
        visible={!!viewedCandidate}
        onClose={() => setViewedCandidate(null)}
        onAdminEdit={c => {
          setViewedCandidate(null);
          setTimeout(() => openEdit(c), 250);
        }}
        onAdminDelete={c => {
          setViewedCandidate(null);
          setTimeout(() => confirmDelete(c), 250);
        }}
      />
    </SafeAreaView>
  );
}

// ─── BOTH exports so navigator works regardless of named vs default import ────
export { AdminCandidatesScreen };
export default AdminCandidatesScreen;