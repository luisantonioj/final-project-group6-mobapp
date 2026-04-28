/**
 * app/screens/student/VoteScreen.tsx
 *
 * Ballot screen — works fully with dummy data (no backend required).
 * Candidates are grouped by position. Students can:
 *   - Browse candidates per position
 *   - View full candidate profile via modal
 *   - Select a candidate per position
 *   - Submit all votes once every position has a selection
 *
 * Ready for backend integration: swap dummy data for
 * usePositions() / useCandidates() / useCastVote() hooks.
 */

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  StatusBar,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useVotingStore } from '../../stores/votingStore';
import { CandidateModal, CandidateRow } from '../../components/CandidateModal';
import {
  notifyVotingStarted,
  notifyVoteSubmitted,
} from '../../notifications/notificationService';

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg:           '#0A0F0A',
  surface:      '#111811',
  surface2:     '#162016',
  border:       '#1E2E1E',
  borderBright: '#2A4A2A',
  green:        '#0F6E56',
  greenBright:  '#22C55E',
  greenGlow:    'rgba(34,197,94,0.10)',
  greenFaint:   '#14532D',
  amber:        '#F59E0B',
  text:         '#F0FFF0',
  textSub:      '#A3C5A3',
  textMuted:    '#4B6B4B',
  error:        '#EF4444',
};

// ─── Types ────────────────────────────────────────────────────────────────────
interface PositionRow {
  id:            string;
  position_name: string;
  display_order: number;
}

// ─── Dummy data ───────────────────────────────────────────────────────────────
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

const INITIAL_CANDIDATES: CandidateRow[] = [
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
    id: 'c4', name: 'Ben Pascual',
    partylist: 'Sama-Sama',
    position_id: 'p2', photo_url: null,
    email: 'ben.pascual@dlsl.edu.ph',
    credentials: 'VP of CEA Council · Engineering Excellence Awardee · Student Publication Editor',
    platform: 'Bridge the gap between student organizations and administration through regular open forums.',
    Positions: { position_name: 'Executive Vice President' },
  },
  {
    id: 'c5', name: 'Carlos Mendoza',
    partylist: 'Sama-Sama',
    position_id: 'p3', photo_url: null,
    email: 'carlos.mendoza@dlsl.edu.ph',
    credentials: 'Secretary of ROTC · Publication Coordinator · Consistent Honors Student',
    platform: 'Streamline student-admin communication through a transparent bulletin system.',
    Positions: { position_name: 'Secretary General' },
  },
  {
    id: 'c6', name: 'Diane Flores',
    partylist: 'Alyansa ng Pagbabago',
    position_id: 'p3', photo_url: null,
    email: 'diane.flores@dlsl.edu.ph',
    credentials: 'Class Secretary 3 consecutive years · Journalism Club President · Honors Student',
    platform: 'Modernize documentation and meeting processes. Establish a digital campus-wide bulletin board.',
    Positions: { position_name: 'Secretary General' },
  },
  {
    id: 'c7', name: 'Patricia Lim',
    partylist: 'Alyansa ng Pagbabago',
    position_id: 'p4', photo_url: null,
    email: 'patricia.lim@dlsl.edu.ph',
    credentials: 'Treasurer of Accounting Society · CPA Board Passer · Accounting Excellence Awardee',
    platform: 'Strict financial transparency, student org budget reform, and accessible org funding.',
    Positions: { position_name: 'Treasurer' },
  },
  {
    id: 'c8', name: 'Renzo Garcia',
    partylist: 'Sama-Sama',
    position_id: 'p5', photo_url: null,
    email: 'renzo.garcia@dlsl.edu.ph',
    credentials: 'Internal Auditor of JPIA · Accounting Honor Society Member · Leadership Excellence Awardee',
    platform: 'Implement independent audit reviews for all student government financial transactions.',
    Positions: { position_name: 'Auditor' },
  },
  {
    id: 'c9', name: 'Sofia Cruz',
    partylist: 'Alyansa ng Pagbabago',
    position_id: 'p6', photo_url: null,
    email: 'sofia.cruz@dlsl.edu.ph',
    credentials: 'Marketing Head of CEA Council · Social Media Manager for DLSL Events · PR Excellence Awardee',
    platform: "Revamp DLSL's student social media presence and launch a unified student news platform.",
    Positions: { position_name: 'Public Relations Officer' },
  },
  {
    id: 'c10', name: 'Marco Villanueva',
    partylist: 'Sama-Sama',
    position_id: 'p6', photo_url: null,
    email: 'marco.v@dlsl.edu.ph',
    credentials: 'School Publication Writer · Communications Club Head · Dean\'s List 4 semesters',
    platform: 'Create a student-run media team that covers all DLSL events and advocates for student issues.',
    Positions: { position_name: 'Public Relations Officer' },
  },
  {
    id: 'c11', name: 'Liam Torres',
    partylist: 'Sama-Sama',
    position_id: 'p7', photo_url: null,
    email: 'liam.torres@dlsl.edu.ph',
    credentials: 'DLSL Freshman Class President 2024 · Debate Team Captain · Academic Excellence Awardee',
    platform: 'Create a dedicated first-year orientation committee and peer mentoring network.',
    Positions: { position_name: '1st Year Representative' },
  },
  {
    id: 'c12', name: 'Bianca Reyes',
    partylist: 'Alyansa ng Pagbabago',
    position_id: 'p8', photo_url: null,
    email: 'bianca.reyes@dlsl.edu.ph',
    credentials: '2nd Year Class Representative 2024 · Consistent Academic Excellence Awardee',
    platform: 'Improve second-year student resources and push for more org-funding opportunities.',
    Positions: { position_name: '2nd Year Representative' },
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

// ─── CandidateItem component ──────────────────────────────────────────────────
const CandidateItem: React.FC<{
  candidate:     CandidateRow;
  selected:      boolean;
  onSelect:      () => void;
  onViewProfile: () => void;
}> = ({ candidate, selected, onSelect, onViewProfile }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleSelect = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.97, duration: 80, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 180, friction: 8 }),
    ]).start();
    onSelect();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[s.candidateRow, selected && s.candidateRowSelected]}
        onPress={handleSelect}
        activeOpacity={0.8}
      >
        {/* Avatar */}
        <View style={[s.candidateAvatar, selected && s.candidateAvatarSelected]}>
          {candidate.photo_url ? (
            <Animated.Image
              source={{ uri: candidate.photo_url }}
              style={s.candidateAvatarImage}
            />
          ) : (
            <Text style={[s.candidateAvatarText, selected && s.candidateAvatarTextSelected]}>
              {getInitials(candidate.name)}
            </Text>
          )}
        </View>

        {/* Info */}
        <View style={s.candidateInfo}>
          <Text style={[s.candidateName, selected && s.candidateNameSelected]} numberOfLines={1}>
            {candidate.name}
          </Text>
          {candidate.partylist ? (
            <Text style={s.candidateParty} numberOfLines={1}>{candidate.partylist}</Text>
          ) : null}
        </View>

        {/* View button */}
        <TouchableOpacity
          style={s.viewProfileBtn}
          onPress={onViewProfile}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={s.viewProfileBtnText}>View</Text>
        </TouchableOpacity>

        {/* Radio */}
        <View style={[s.radio, selected && s.radioSelected]}>
          {selected && <View style={s.radioDot} />}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── PositionCard component ───────────────────────────────────────────────────
const PositionCard: React.FC<{
  position:          PositionRow;
  candidates:        CandidateRow[];
  selectedId:        string | undefined;
  onSelectCandidate: (candidateId: string) => void;
  onViewCandidate:   (candidate: CandidateRow) => void;
}> = ({ position, candidates, selectedId, onSelectCandidate, onViewCandidate }) => {
  const isDone = !!selectedId;

  return (
    <View style={[s.positionCard, isDone && s.positionCardDone]}>
      {/* Position header */}
      <View style={s.positionHeader}>
        <View style={s.positionMeta}>
          <Text style={s.positionName}>{position.position_name}</Text>
          <Text style={s.positionCount}>
            {candidates.length} candidate{candidates.length !== 1 ? 's' : ''}
          </Text>
        </View>

        {isDone ? (
          <View style={s.doneBadge}>
            <Ionicons name="checkmark-circle" size={14} color={C.greenBright} style={{ marginRight: 4 }} />
            <Text style={s.doneBadgeText}>Selected</Text>
          </View>
        ) : (
          <View style={s.pendingBadge}>
            <Text style={s.pendingBadgeText}>Required</Text>
          </View>
        )}
      </View>

      {/* Selected candidate highlight banner */}
      {selectedId && (() => {
        const selected = candidates.find(c => c.id === selectedId);
        if (!selected) return null;
        return (
          <View style={s.selectionBanner}>
            <Ionicons name="person-circle" size={16} color={C.greenBright} />
            <Text style={s.selectionName} numberOfLines={1}>{selected.name}</Text>
            {selected.partylist ? (
              <Text style={s.selectionParty} numberOfLines={1}>· {selected.partylist}</Text>
            ) : null}
          </View>
        );
      })()}

      {/* Candidates */}
      {candidates.length === 0 ? (
        <View style={s.emptyPosition}>
          <Text style={s.emptyPositionText}>No candidates registered for this position.</Text>
        </View>
      ) : (
        <View style={s.candidateList}>
          {candidates.map((c, idx) => (
            <CandidateItem
              key={c.id}
              candidate={c}
              selected={selectedId === c.id}
              onSelect={() => onSelectCandidate(c.id)}
              onViewProfile={() => onViewCandidate(c)}
            />
          ))}
        </View>
      )}
    </View>
  );
};

// ─── Submit confirmation section ──────────────────────────────────────────────
const SubmitSection: React.FC<{
  allSelected:     boolean;
  totalPositions:  number;
  selectedCount:   number;
  onPress:         () => void;
  isSubmitting:    boolean;
}> = ({ allSelected, totalPositions, selectedCount, onPress, isSubmitting }) => (
  <View style={s.submitSection}>
    {!allSelected && (
      <View style={s.submitHint}>
        <Ionicons name="information-circle-outline" size={15} color={C.textMuted} />
        <Text style={s.submitHintText}>
          {totalPositions - selectedCount} position{totalPositions - selectedCount !== 1 ? 's' : ''} remaining
        </Text>
      </View>
    )}

    <TouchableOpacity
      style={[s.submitBtn, !allSelected && s.submitBtnDisabled]}
      onPress={onPress}
      disabled={!allSelected || isSubmitting}
      activeOpacity={0.85}
    >
      {isSubmitting ? (
        <ActivityIndicator color="#fff" size="small" />
      ) : (
        <>
          <Ionicons
            name={allSelected ? 'send' : 'lock-closed-outline'}
            size={16}
            color={allSelected ? '#fff' : C.textMuted}
          />
          <Text style={[s.submitBtnText, !allSelected && s.submitBtnTextDisabled]}>
            {allSelected ? 'Submit My Votes' : 'Complete All Positions First'}
          </Text>
        </>
      )}
    </TouchableOpacity>
  </View>
);

// ─── Main VoteScreen ──────────────────────────────────────────────────────────
export function VoteScreen() {
  const { selectedCandidates, selectCandidate, reset } = useVotingStore();

  // Use dummy data — swap with usePositions() / useCandidates() for backend
  const positions  = DUMMY_POSITIONS;
  const [allCandidates, setAllCandidates] = useState<CandidateRow[]>(INITIAL_CANDIDATES);

  const [viewedCandidate, setViewedCandidate] = useState<CandidateRow | null>(null);
  const [isSubmitting,    setIsSubmitting]    = useState(false);
  const [hasSubmitted,    setHasSubmitted]    = useState(false);

  const didNotifyRef = useRef(false);

  useEffect(() => {
    if (!didNotifyRef.current) {
      didNotifyRef.current = true;
      notifyVotingStarted();
    }
  }, []);

  // Group candidates by position
  const candidatesByPosition = useMemo(() => {
    const map: Record<string, CandidateRow[]> = {};
    allCandidates.forEach(c => {
      if (!map[c.position_id]) map[c.position_id] = [];
      map[c.position_id].push(c);
    });
    return map;
  }, [allCandidates]);

  const totalPositions = positions.length;
  const selectedCount  = Object.keys(selectedCandidates).length;
  const allSelected    = selectedCount === totalPositions && totalPositions > 0;

  // ─── Build confirm summary ─────────────────────────────────────────────────
  const confirmSummary = useMemo(() =>
    positions
      .filter(p => selectedCandidates[p.id])
      .map(p => {
        const c = allCandidates.find(x => x.id === selectedCandidates[p.id]);
        return {
          positionName:  p.position_name,
          candidateName: c?.name ?? '—',
          positionId:    p.id,
          candidateId:   selectedCandidates[p.id],
        };
      }),
    [positions, allCandidates, selectedCandidates]
  );

  // ─── Submit ────────────────────────────────────────────────────────────────
  const handleSubmitPress = useCallback(() => {
    Alert.alert(
      'Submit Your Votes',
      `You've selected candidates for all ${totalPositions} positions.\n\nThis action cannot be undone. Are you sure?`,
      [
        { text: 'Review Again', style: 'cancel' },
        {
          text: 'Submit Votes',
          style: 'destructive',
          onPress: async () => {
            setIsSubmitting(true);
            // Simulate network delay — remove when connecting to backend
            await new Promise(res => setTimeout(res, 1200));
            // For backend: await castVote({ candidateId, positionId }) for each entry
            setIsSubmitting(false);
            await notifyVoteSubmitted();
            reset();
            setHasSubmitted(true);
          },
        },
      ]
    );
  }, [totalPositions, confirmSummary, reset]);

  // ─── Success state ─────────────────────────────────────────────────────────
  if (hasSubmitted) {
    return (
      <SafeAreaView style={s.safe}>
        <StatusBar barStyle="light-content" backgroundColor={C.bg} />
        <View style={s.successContainer}>
          <View style={s.successIconWrap}>
            <Ionicons name="checkmark-circle" size={72} color={C.greenBright} />
          </View>
          <Text style={s.successTitle}>Vote Submitted!</Text>
          <Text style={s.successBody}>
            Your choices have been securely recorded.{'\n\n'}
            Thank you for participating in the DLSL Student Council Election, Lasallian!
          </Text>
          <View style={s.successBadge}>
            <Ionicons name="shield-checkmark-outline" size={13} color={C.textSub} style={{ marginRight: 5 }} />
            <Text style={s.successBadgeText}>Secured by AnimoQuorum</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Main ballot ───────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>Cast Your Vote</Text>
          <Text style={s.headerSub}>SY 2025–2026 · DLSL COMELEC</Text>
        </View>
        <View style={[s.progressPill, allSelected && s.progressPillDone]}>
          <Ionicons
            name={allSelected ? 'checkmark-circle' : 'ellipse-outline'}
            size={12}
            color={allSelected ? C.greenBright : C.textMuted}
            style={{ marginRight: 4 }}
          />
          <Text style={[s.progressText, allSelected && { color: C.greenBright }]}>
            {selectedCount}/{totalPositions}
          </Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={s.progressBarTrack}>
        <Animated.View
          style={[
            s.progressBarFill,
            { width: totalPositions > 0 ? `${(selectedCount / totalPositions) * 100}%` : '0%' },
          ]}
        />
      </View>

      {/* Ballot */}
      <FlatList
        data={positions}
        keyExtractor={item => item.id}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item: position }) => (
          <PositionCard
            position={position}
            candidates={candidatesByPosition[position.id] ?? []}
            selectedId={selectedCandidates[position.id]}
            onSelectCandidate={candidateId => selectCandidate(position.id, candidateId)}
            onViewCandidate={candidate => setViewedCandidate(candidate)}
          />
        )}
        ListFooterComponent={
          <SubmitSection
            allSelected={allSelected}
            totalPositions={totalPositions}
            selectedCount={selectedCount}
            onPress={handleSubmitPress}
            isSubmitting={isSubmitting}
          />
        }
      />

      {/* Candidate detail modal */}
      <CandidateModal
        candidate={viewedCandidate}
        visible={!!viewedCandidate}
        onClose={() => setViewedCandidate(null)}
        alreadyVoted={
          viewedCandidate
            ? !!selectedCandidates[viewedCandidate.position_id]
            : false
        }
        onSelect={c => {
          selectCandidate(c.position_id, c.id);
          setViewedCandidate(null);
        }}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  // Header
  header: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: 18,
    paddingVertical:   14,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  headerTitle: { fontSize: 17, fontWeight: '800', color: C.text },
  headerSub:   { fontSize: 11, color: C.textMuted, marginTop: 2, letterSpacing: 0.4 },
  progressPill: {
    flexDirection:     'row',
    alignItems:        'center',
    backgroundColor:   C.surface2,
    borderRadius:      20,
    paddingHorizontal: 10,
    paddingVertical:   5,
    borderWidth:       1,
    borderColor:       C.border,
  },
  progressPillDone: {
    backgroundColor: C.greenGlow,
    borderColor:     C.greenBright + '55',
  },
  progressText: { fontSize: 12, fontWeight: '700', color: C.textMuted },

  // Progress bar
  progressBarTrack: {
    height:          3,
    backgroundColor: C.border,
  },
  progressBarFill: {
    height:          3,
    backgroundColor: C.greenBright,
  },

  // List
  list: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 20 },

  // Position card
  positionCard: {
    backgroundColor: C.surface,
    borderRadius:    16,
    borderWidth:     1,
    borderColor:     C.border,
    marginBottom:    14,
    overflow:        'hidden',
  },
  positionCardDone: {
    borderColor: C.greenBright + '55',
  },
  positionHeader: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    padding:           14,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  positionMeta:  { gap: 2 },
  positionName:  { fontSize: 14, fontWeight: '700', color: C.text },
  positionCount: { fontSize: 11, color: C.textMuted },

  doneBadge: {
    flexDirection:     'row',
    alignItems:        'center',
    backgroundColor:   C.greenGlow,
    borderRadius:      20,
    paddingHorizontal: 9,
    paddingVertical:   4,
    borderWidth:       1,
    borderColor:       C.greenBright + '44',
  },
  doneBadgeText: { fontSize: 11, fontWeight: '700', color: C.greenBright },

  pendingBadge: {
    backgroundColor:   C.surface2,
    borderRadius:      20,
    paddingHorizontal: 9,
    paddingVertical:   4,
    borderWidth:       1,
    borderColor:       C.border,
  },
  pendingBadgeText: { fontSize: 11, fontWeight: '600', color: C.textMuted },

  selectionBanner: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             6,
    backgroundColor: C.greenGlow,
    paddingHorizontal: 14,
    paddingVertical:   9,
    borderBottomWidth: 1,
    borderBottomColor: C.borderBright,
  },
  selectionName:  { fontSize: 13, fontWeight: '700', color: C.greenBright, flex: 1 },
  selectionParty: { fontSize: 12, color: C.textSub },

  emptyPosition: {
    padding:    16,
    alignItems: 'center',
  },
  emptyPositionText: { fontSize: 13, color: C.textMuted, fontStyle: 'italic' },

  candidateList: {
    padding: 10,
    gap:     8,
  },

  // Candidate row
  candidateRow: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             10,
    padding:         12,
    borderRadius:    12,
    borderWidth:     1,
    borderColor:     C.border,
    backgroundColor: C.surface2,
  },
  candidateRowSelected: {
    backgroundColor: C.greenGlow,
    borderColor:     C.greenBright + '44',
  },
  candidateAvatar: {
    width:           42,
    height:          42,
    borderRadius:    21,
    backgroundColor: C.surface,
    borderWidth:     1.5,
    borderColor:     C.border,
    alignItems:      'center',
    justifyContent:  'center',
    overflow:        'hidden',
  },
  candidateAvatarSelected: { borderColor: C.greenBright },
  candidateAvatarImage: { width: 42, height: 42, borderRadius: 21 },
  candidateAvatarText: { fontSize: 14, fontWeight: '800', color: C.textSub },
  candidateAvatarTextSelected: { color: C.greenBright },

  candidateInfo: { flex: 1 },
  candidateName: { fontSize: 13, fontWeight: '600', color: C.text, marginBottom: 2 },
  candidateNameSelected: { color: C.greenBright },
  candidateParty: { fontSize: 11, color: C.textMuted },

  viewProfileBtn: {
    paddingHorizontal: 10,
    paddingVertical:   5,
    borderRadius:      20,
    borderWidth:       1,
    borderColor:       C.borderBright,
    backgroundColor:   C.surface,
  },
  viewProfileBtnText: { fontSize: 10, color: C.textSub, fontWeight: '600' },

  radio: {
    width:           20,
    height:          20,
    borderRadius:    10,
    borderWidth:     2,
    borderColor:     C.border,
    alignItems:      'center',
    justifyContent:  'center',
  },
  radioSelected: { borderColor: C.greenBright },
  radioDot: {
    width:           10,
    height:          10,
    borderRadius:    5,
    backgroundColor: C.greenBright,
  },

  // Submit section
  submitSection: {
    paddingTop: 4,
    paddingBottom: 32,
    gap: 10,
  },
  submitHint: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               6,
    paddingHorizontal: 4,
  },
  submitHintText: { fontSize: 12, color: C.textMuted },

  submitBtn: {
    backgroundColor: C.green,
    borderRadius:    14,
    paddingVertical: 15,
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    gap:             8,
  },
  submitBtnDisabled: {
    backgroundColor: C.surface2,
    borderWidth:     1,
    borderColor:     C.border,
  },
  submitBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  submitBtnTextDisabled: { color: C.textMuted },

  // Success
  successContainer: {
    flex:              1,
    alignItems:        'center',
    justifyContent:    'center',
    paddingHorizontal: 32,
  },
  successIconWrap: { marginBottom: 20 },
  successTitle: { fontSize: 26, fontWeight: '800', color: C.text, marginBottom: 12 },
  successBody: {
    fontSize:   15,
    color:      C.textSub,
    textAlign:  'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  successBadge: {
    flexDirection:     'row',
    alignItems:        'center',
    backgroundColor:   C.surface2,
    borderRadius:      20,
    paddingHorizontal: 14,
    paddingVertical:   7,
    borderWidth:       1,
    borderColor:       C.border,
  },
  successBadgeText: { fontSize: 12, color: C.textSub },
});

export default VoteScreen;