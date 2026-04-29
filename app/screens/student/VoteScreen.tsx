/**
   * app/screens/student/VoteScreen.tsx
   *
   * Ballot screen — reads live candidate data from candidateStore (Zustand).
   * No backend calls. No Supabase. Frontend-only.
   *
   * FLOW:
   *   1. Setup phase   — student selects department + gives consent
   *   2. Ballot phase  — vote on Executive Council & Department positions
   *   3. Success phase — confirmation screen after submission
   *
   * STORE USAGE:
   *   candidateStore  → getCandidatesForBallot(), disabledPositions
   *   votingStore     → selectedCandidates, selectCandidate, reset
   */
  
  import React, {
    useState,
    useMemo,
    useCallback,
    useRef,
    useEffect,
  } from 'react';
  import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Modal,
    Animated,
    Image,
  } from 'react-native';
  import { SafeAreaView } from 'react-native-safe-area-context';
  import { Ionicons } from '@expo/vector-icons';
  
  import {
    useCandidateStore,
    DEPARTMENTS,
  } from '../../stores/candidateStore';
  import type {
    Candidate,
    Department,
    BallotPosition,
  } from '../../stores/candidateStore';
  
  import { useVotingStore } from '../../stores/votingStore';
  import { CandidateModal } from '../../components/CandidateModal';
  import type { CandidateRow } from '../../components/CandidateModal';
  
  import {
    notifyVotingStarted,
    notifyVoteSubmitted,
  } from '../../notifications/notificationService';
  
  // ─── Design tokens ─────────────────────────────────────────────────────────────
  // Matches the dark-green palette used across the project
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
    amberFaint:   'rgba(245,158,11,0.12)',
    amberBorder:  'rgba(245,158,11,0.35)',
    text:         '#F0FFF0',
    textSub:      '#A3C5A3',
    textMuted:    '#4B6B4B',
    error:        '#EF4444',
    errorFaint:   'rgba(239,68,68,0.12)',
    errorBorder:  'rgba(239,68,68,0.35)',
  };
  
  // ─── Types ─────────────────────────────────────────────────────────────────────
  type VoterDepartment = Exclude<Department, 'Executive Council'>;
  type Phase = 'setup' | 'ballot' | 'success';
  
  interface ConfirmEntry {
    positionName:  string;
    candidateName: string;
    partylist:     string | null;
    department:    Department;
  }
  
  // ─── Constants ─────────────────────────────────────────────────────────────────
  // Students must belong to a real department (not Executive Council)
  const VOTER_DEPARTMENTS = DEPARTMENTS.filter(
    (d): d is VoterDepartment => d !== 'Executive Council',
  );
  
  // ─── Helpers ───────────────────────────────────────────────────────────────────
  
  function getInitials(name: string): string {
    return name
      .split(' ')
      .slice(0, 2)
      .map((w) => w[0] ?? '')
      .join('')
      .toUpperCase();
  }
  
  /** Convert store Candidate → CandidateRow shape expected by CandidateModal */
  function toCandidateRow(c: Candidate): CandidateRow {
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
  
  // ─── CandidateItem ─────────────────────────────────────────────────────────────
  
  const CandidateItem: React.FC<{
    candidate: Candidate;
    selected:  boolean;
    onSelect:  () => void;
    onView:    () => void;
  }> = ({ candidate, selected, onSelect, onView }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;
  
    const handlePress = useCallback(() => {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.97,
          duration: 80,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 180,
          friction: 8,
        }),
      ]).start();
      onSelect();
    }, [scaleAnim, onSelect]);
  
    return (
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          style={[s.candidateRow, selected && s.candidateRowSelected]}
          onPress={handlePress}
          activeOpacity={0.82}
        >
          {/* Avatar */}
          <View style={[s.candidateAvatar, selected && s.candidateAvatarSelected]}>
            {candidate.photo_url ? (
              <Image
                source={{ uri: candidate.photo_url }}
                style={s.candidateAvatarImage}
              />
            ) : (
              <Text
                style={[
                  s.candidateAvatarText,
                  selected && s.candidateAvatarTextSelected,
                ]}
              >
                {getInitials(candidate.name)}
              </Text>
            )}
          </View>
  
          {/* Name + partylist */}
          <View style={s.candidateInfo}>
            <Text
              style={[s.candidateName, selected && s.candidateNameSelected]}
              numberOfLines={1}
            >
              {candidate.name}
            </Text>
            {candidate.partylist ? (
              <Text style={s.candidateParty} numberOfLines={1}>
                {candidate.partylist}
              </Text>
            ) : null}
          </View>
  
          {/* View profile button */}
          <TouchableOpacity
            style={s.viewProfileBtn}
            onPress={onView}
            hitSlop={{ top: 6, bottom: 6, left: 8, right: 8 }}
          >
            <Text style={s.viewProfileBtnText}>View</Text>
          </TouchableOpacity>
  
          {/* Radio indicator */}
          <View style={[s.radio, selected && s.radioSelected]}>
            {selected && <View style={s.radioDot} />}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };
  
  // ─── PositionCard ──────────────────────────────────────────────────────────────
  
  const PositionCard: React.FC<{
    ballotPosition:    BallotPosition;
    selectedId:        string | undefined;
    onSelectCandidate: (candidateId: string) => void;
    onViewCandidate:   (candidate: Candidate) => void;
  }> = ({ ballotPosition, selectedId, onSelectCandidate, onViewCandidate }) => {
    const isDone = !!selectedId;
    const selectedCandidate = ballotPosition.candidates.find(
      (c) => c.id === selectedId,
    );
  
    return (
      <View style={[s.positionCard, isDone && s.positionCardDone]}>
        {/* Position header */}
        <View style={s.positionHeader}>
          <View style={s.positionMeta}>
            <Text style={s.positionName}>{ballotPosition.position_name}</Text>
            <Text style={s.positionCount}>
              {ballotPosition.candidates.length} candidate
              {ballotPosition.candidates.length !== 1 ? 's' : ''}
            </Text>
          </View>
  
          {isDone ? (
            <View style={s.doneBadge}>
              <Ionicons name="checkmark-circle" size={12} color={C.greenBright} />
              <Text style={s.doneBadgeText}> Selected</Text>
            </View>
          ) : (
            <View style={s.pendingBadge}>
              <Text style={s.pendingBadgeText}>Required</Text>
            </View>
          )}
        </View>
  
        {/* Selected candidate banner */}
        {selectedCandidate ? (
          <View style={s.selectionBanner}>
            <Ionicons
              name="checkmark-circle"
              size={14}
              color={C.greenBright}
            />
            <Text style={s.selectionName} numberOfLines={1}>
              {selectedCandidate.name}
            </Text>
            {selectedCandidate.partylist ? (
              <Text style={s.selectionParty} numberOfLines={1}>
                · {selectedCandidate.partylist}
              </Text>
            ) : null}
          </View>
        ) : null}
  
        {/* Candidate list */}
        <View style={s.candidateList}>
          {ballotPosition.candidates.map((c) => (
            <CandidateItem
              key={c.id}
              candidate={c}
              selected={c.id === selectedId}
              onSelect={() => onSelectCandidate(c.id)}
              onView={() => onViewCandidate(c)}
            />
          ))}
        </View>
      </View>
    );
  };
  
  // ─── ConfirmModal ──────────────────────────────────────────────────────────────
  
  const ConfirmModal: React.FC<{
    visible:     boolean;
    entries:     ConfirmEntry[];
    onSubmit:    () => void;
    onCancel:    () => void;
  }> = ({ visible, entries, onSubmit, onCancel }) => (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={s.modalOverlay}>
        <View style={s.modalSheet}>
          {/* Modal header */}
          <View style={s.modalHeader}>
            <View style={s.modalIconWrap}>
              <Ionicons
                name="shield-checkmark-outline"
                size={22}
                color={C.greenBright}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.modalTitle}>Confirm Your Votes</Text>
              <Text style={s.modalSubtitle}>
                Review carefully — this cannot be undone.
              </Text>
            </View>
            <TouchableOpacity
              onPress={onCancel}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close" size={20} color={C.textMuted} />
            </TouchableOpacity>
          </View>
  
          {/* Vote summary list */}
          <ScrollView
            style={s.confirmScroll}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {entries.map((entry, i) => (
              <View key={i} style={s.confirmRow}>
                <View style={s.confirmDot} />
                <View style={{ flex: 1 }}>
                  <Text style={s.confirmPosition}>
                    {entry.positionName}
                  </Text>
                  <Text style={s.confirmCandidate}>
                    {entry.candidateName}
                  </Text>
                  {entry.partylist ? (
                    <Text style={s.confirmParty}>{entry.partylist}</Text>
                  ) : null}
                </View>
              </View>
            ))}
            <View style={{ height: 8 }} />
          </ScrollView>
  
          {/* Action buttons */}
          <View style={s.modalActions}>
            <TouchableOpacity style={s.modalCancelBtn} onPress={onCancel}>
              <Text style={s.modalCancelText}>Review Again</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.modalSubmitBtn} onPress={onSubmit}>
              <Ionicons name="send" size={15} color="#fff" />
              <Text style={s.modalSubmitText}>Submit Votes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
  
  // ─── SetupScreen ───────────────────────────────────────────────────────────────
  
  const SetupScreen: React.FC<{
    selectedDept: VoterDepartment | null;
    onSelectDept: (d: VoterDepartment) => void;
    consented:    boolean;
    onToggleConsent: () => void;
    onBegin:      () => void;
  }> = ({ selectedDept, onSelectDept, consented, onToggleConsent, onBegin }) => {
    const canBegin = !!selectedDept && consented;
  
    return (
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.setupContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Hero */}
        <View style={s.setupHero}>
          <View style={s.setupIconWrap}>
            <Ionicons
              name="checkmark-done-circle-outline"
              size={36}
              color={C.greenBright}
            />
          </View>
          <Text style={s.setupTitle}>Cast Your Vote</Text>
          <Text style={s.setupSubtitle}>SY 2025–2026 · DLSL COMELEC</Text>
        </View>
  
        {/* Department selection */}
        <View style={s.setupSection}>
          <Text style={s.setupSectionLabel}>Your Department *</Text>
          <Text style={s.setupSectionHint}>
            Determines which college-level positions appear on your ballot.
            Executive Council positions are shown to all students.
          </Text>
          <View style={s.deptGrid}>
            {VOTER_DEPARTMENTS.map((d) => (
              <TouchableOpacity
                key={d}
                style={[s.deptChip, selectedDept === d && s.deptChipActive]}
                onPress={() => onSelectDept(d)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    s.deptChipText,
                    selectedDept === d && s.deptChipTextActive,
                  ]}
                >
                  {d}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
  
        {/* Voter consent */}
        <View style={s.setupSection}>
          <Text style={s.setupSectionLabel}>Voter Consent *</Text>
          <TouchableOpacity
            style={s.consentRow}
            onPress={onToggleConsent}
            activeOpacity={0.8}
          >
            <View style={[s.checkbox, consented && s.checkboxActive]}>
              {consented && (
                <Ionicons name="checkmark" size={14} color="#fff" />
              )}
            </View>
            <Text style={s.consentText}>
              I confirm that I am a registered DLSL student and I understand
              that my vote is{' '}
              <Text style={s.consentHighlight}>
                final and cannot be changed
              </Text>{' '}
              once submitted.
            </Text>
          </TouchableOpacity>
        </View>
  
        {/* Validation hints */}
        {!selectedDept ? (
          <View style={s.warnBox}>
            <Ionicons
              name="alert-circle-outline"
              size={14}
              color={C.amber}
            />
            <Text style={s.warnText}>
              Please select your department to continue.
            </Text>
          </View>
        ) : !consented ? (
          <View style={s.warnBox}>
            <Ionicons
              name="alert-circle-outline"
              size={14}
              color={C.amber}
            />
            <Text style={s.warnText}>
              Please check the consent box to continue.
            </Text>
          </View>
        ) : null}
  
        {/* Begin button */}
        <TouchableOpacity
          style={[s.beginBtn, !canBegin && s.beginBtnDisabled]}
          onPress={onBegin}
          disabled={!canBegin}
          activeOpacity={canBegin ? 0.8 : 1}
        >
          <Ionicons
            name="chevron-forward-circle-outline"
            size={20}
            color={canBegin ? '#fff' : C.textMuted}
          />
          <Text
            style={[s.beginBtnText, !canBegin && s.beginBtnTextDisabled]}
          >
            Begin Voting
          </Text>
        </TouchableOpacity>
  
        {/* Info footer */}
        <View style={s.setupFooter}>
          <Ionicons
            name="lock-closed-outline"
            size={12}
            color={C.textMuted}
          />
          <Text style={s.setupFooterText}>
            Secured by AnimoQuorum · DLSL COMELEC SY 2025–2026
          </Text>
        </View>
      </ScrollView>
    );
  };
  
  // ─── SuccessScreen ─────────────────────────────────────────────────────────────
  
  const SuccessScreen: React.FC = () => (
    <View style={s.successContainer}>
      <View style={s.successIconWrap}>
        <Ionicons name="checkmark-circle" size={80} color={C.greenBright} />
      </View>
      <Text style={s.successTitle}>Vote Submitted!</Text>
      <Text style={s.successBody}>
        {'Your choices have been securely recorded.\n\n'}
        Thank you for participating in the DLSL Student Council Election,
        Lasallian!
      </Text>
      <View style={s.successBadge}>
        <Ionicons
          name="shield-checkmark-outline"
          size={14}
          color={C.textSub}
        />
        <Text style={s.successBadgeText}> Secured by AnimoQuorum</Text>
      </View>
    </View>
  );
  
  // ─── Main VoteScreen ───────────────────────────────────────────────────────────
  
  export function VoteScreen() {
    // ── Stores ────────────────────────────────────────────────────────────────
    const { getCandidatesForBallot, disabledPositions } = useCandidateStore();
    const { selectedCandidates, selectCandidate, reset } = useVotingStore();
  
    // ── Local state ───────────────────────────────────────────────────────────
    const [phase, setPhase]               = useState<Phase>('setup');
    const [selectedDept, setSelectedDept] = useState<VoterDepartment | null>(null);
    const [consented, setConsented]       = useState(false);
    const [viewedCandidate, setViewedCandidate] =
      useState<Candidate | null>(null);
    const [confirmVisible, setConfirmVisible] = useState(false);
  
    const didNotifyRef = useRef(false);
  
    // Fire voting-started notification once on mount
    useEffect(() => {
      if (!didNotifyRef.current) {
        didNotifyRef.current = true;
        notifyVotingStarted();
      }
    }, []);
  
    // ── Ballot data ───────────────────────────────────────────────────────────
    // getCandidatesForBallot already:
    //   • Filters out disabled positions
    //   • Filters out positions with zero candidates
    //   • Sorts: Executive Council first, then department positions
    const ballotPositions = useMemo((): BallotPosition[] => {
      if (!selectedDept) return [];
      return getCandidatesForBallot(selectedDept);
      // disabledPositions in deps so we re-derive when admin toggles positions
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedDept, getCandidatesForBallot, disabledPositions]);
  
    // Split into two visual sections
    const execPositions = useMemo(
      () => ballotPositions.filter((bp) => bp.department === 'Executive Council'),
      [ballotPositions],
    );
    const deptPositions = useMemo(
      () => ballotPositions.filter((bp) => bp.department !== 'Executive Council'),
      [ballotPositions],
    );
  
    // ── Progress ──────────────────────────────────────────────────────────────
    const totalPositions = ballotPositions.length;
  
    const selectedCount = useMemo(
      () =>
        ballotPositions.filter((bp) => !!selectedCandidates[bp.position_id])
          .length,
      [ballotPositions, selectedCandidates],
    );
  
    const allSelected = totalPositions > 0 && selectedCount === totalPositions;
  
    const progressPct =
      totalPositions > 0
        ? (selectedCount / totalPositions) * 100
        : 0;
  
    // ── Confirm entries ───────────────────────────────────────────────────────
    const confirmEntries: ConfirmEntry[] = useMemo(
      () =>
        ballotPositions
          .filter((bp) => !!selectedCandidates[bp.position_id])
          .map((bp) => {
            const cand = bp.candidates.find(
              (c) => c.id === selectedCandidates[bp.position_id],
            );
            return {
              positionName:  bp.position_name,
              candidateName: cand?.name ?? '—',
              partylist:     cand?.partylist ?? null,
              department:    bp.department,
            };
          }),
      [ballotPositions, selectedCandidates],
    );
  
    // ── Handlers ──────────────────────────────────────────────────────────────
    const handleBegin = useCallback(() => {
      if (!selectedDept || !consented) return;
      reset(); // clear leftover selections from any previous session
      setPhase('ballot');
    }, [selectedDept, consented, reset]);
  
    const handleSubmitPress = useCallback(() => {
      if (!allSelected) return;
      setConfirmVisible(true);
    }, [allSelected]);
  
    const handleConfirmSubmit = useCallback(async () => {
      setConfirmVisible(false);
      // No backend — simulate a brief processing delay
      await new Promise((res) => setTimeout(res, 600));
      await notifyVoteSubmitted();
      reset();
      setPhase('success');
    }, [reset]);
  
    // ── Render ballot section helper ──────────────────────────────────────────
    const renderSection = useCallback(
      (label: string, positions: BallotPosition[]) => {
        if (positions.length === 0) return null;
        return (
          <View key={label}>
            <Text style={s.sectionLabel}>{label}</Text>
            {positions.map((bp) => (
              <PositionCard
                key={bp.position_id}
                ballotPosition={bp}
                selectedId={selectedCandidates[bp.position_id]}
                onSelectCandidate={(candidateId) =>
                  selectCandidate(bp.position_id, candidateId)
                }
                onViewCandidate={(candidate) => setViewedCandidate(candidate)}
              />
            ))}
          </View>
        );
      },
      [selectedCandidates, selectCandidate],
    );
  
    // ── Phase: setup ──────────────────────────────────────────────────────────
    if (phase === 'setup') {
      return (
        <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
          <SetupScreen
            selectedDept={selectedDept}
            onSelectDept={setSelectedDept}
            consented={consented}
            onToggleConsent={() => setConsented((v) => !v)}
            onBegin={handleBegin}
          />
        </SafeAreaView>
      );
    }
  
    // ── Phase: success ────────────────────────────────────────────────────────
    if (phase === 'success') {
      return (
        <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
          <SuccessScreen />
        </SafeAreaView>
      );
    }
  
    // ── Phase: ballot ─────────────────────────────────────────────────────────
    return (
      <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <View style={s.header}>
          <View>
            <Text style={s.headerTitle}>Cast Your Vote</Text>
            <Text style={s.headerSub}>
              SY 2025–2026 · {selectedDept ?? 'DLSL COMELEC'}
            </Text>
          </View>
          <View style={[s.progressPill, allSelected && s.progressPillDone]}>
            <Text
              style={[
                s.progressText,
                allSelected && { color: C.greenBright },
              ]}
            >
              {selectedCount}/{totalPositions}
            </Text>
          </View>
        </View>
  
        {/* ── Progress bar ────────────────────────────────────────────────── */}
        <View style={s.progressBarTrack}>
          <View style={[s.progressBarFill, { width: `${progressPct}%` }]} />
        </View>
  
        {/* ── Ballot ──────────────────────────────────────────────────────── */}
        <ScrollView
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
        >
          {ballotPositions.length === 0 ? (
            /* Empty state — no active positions for this department */
            <View style={s.emptyBallot}>
              <Ionicons
                name="clipboard-outline"
                size={44}
                color={C.textMuted}
              />
              <Text style={s.emptyBallotTitle}>No Positions Available</Text>
              <Text style={s.emptyBallotBody}>
                There are no active ballot positions for your department at
                this time. Please check back later.
              </Text>
            </View>
          ) : (
            <>
              {renderSection('Executive Council', execPositions)}
              {renderSection(selectedDept ?? 'Department', deptPositions)}
            </>
          )}
  
          {/* ── Submit section ─────────────────────────────────────────────── */}
          {ballotPositions.length > 0 && (
            <View style={s.submitSection}>
              {!allSelected && (
                <View style={s.submitHint}>
                  <Ionicons
                    name="information-circle-outline"
                    size={14}
                    color={C.textMuted}
                  />
                  <Text style={s.submitHintText}>
                    {totalPositions - selectedCount} position
                    {totalPositions - selectedCount !== 1 ? 's' : ''} remaining
                  </Text>
                </View>
              )}
              <TouchableOpacity
                style={[s.submitBtn, !allSelected && s.submitBtnDisabled]}
                onPress={handleSubmitPress}
                disabled={!allSelected}
                activeOpacity={allSelected ? 0.8 : 1}
              >
                <Ionicons
                  name="send"
                  size={16}
                  color={allSelected ? '#fff' : C.textMuted}
                />
                <Text
                  style={[
                    s.submitBtnText,
                    !allSelected && s.submitBtnTextDisabled,
                  ]}
                >
                  {allSelected
                    ? 'Submit My Votes'
                    : 'Complete All Positions First'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
  
        {/* ── Candidate profile modal ──────────────────────────────────────── */}
        <CandidateModal
          candidate={viewedCandidate ? toCandidateRow(viewedCandidate) : null}
          visible={!!viewedCandidate}
          onClose={() => setViewedCandidate(null)}
          alreadyVoted={
            viewedCandidate
              ? !!selectedCandidates[viewedCandidate.position_id]
              : false
          }
          onSelect={(row) => {
            selectCandidate(row.position_id, row.id);
            setViewedCandidate(null);
          }}
        />
  
        {/* ── Confirmation modal ───────────────────────────────────────────── */}
        <ConfirmModal
          visible={confirmVisible}
          entries={confirmEntries}
          onSubmit={handleConfirmSubmit}
          onCancel={() => setConfirmVisible(false)}
        />
      </SafeAreaView>
    );
  }
  
  // ─── Styles ────────────────────────────────────────────────────────────────────
  const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.bg },
  
    // ── Header ──────────────────────────────────────────────────────────────
    header: {
      flexDirection:      'row',
      alignItems:         'center',
      justifyContent:     'space-between',
      paddingHorizontal:  18,
      paddingVertical:    14,
      borderBottomWidth:  1,
      borderBottomColor:  C.border,
    },
    headerTitle: { fontSize: 17, fontWeight: '800', color: C.text },
    headerSub: {
      fontSize:      11,
      color:         C.textMuted,
      marginTop:     2,
      letterSpacing: 0.4,
    },
  
    progressPill: {
      flexDirection:      'row',
      alignItems:         'center',
      backgroundColor:    C.surface2,
      borderRadius:       20,
      paddingHorizontal:  10,
      paddingVertical:    5,
      borderWidth:        1,
      borderColor:        C.border,
    },
    progressPillDone: {
      backgroundColor: C.greenGlow,
      borderColor:     C.greenBright + '55',
    },
    progressText: { fontSize: 12, fontWeight: '700', color: C.textMuted },
  
    // ── Progress bar ─────────────────────────────────────────────────────────
    progressBarTrack: { height: 3, backgroundColor: C.border },
    progressBarFill:  { height: 3, backgroundColor: C.greenBright },
  
    // ── Ballot list ──────────────────────────────────────────────────────────
    list: {
      paddingHorizontal: 16,
      paddingTop:        16,
      paddingBottom:     28,
    },
  
    // ── Section label ─────────────────────────────────────────────────────────
    sectionLabel: {
      fontSize:      10,
      fontWeight:    '700',
      letterSpacing: 2,
      color:         C.greenBright,
      textTransform: 'uppercase',
      marginBottom:  8,
      marginTop:     4,
    },
  
    // ── Position card ─────────────────────────────────────────────────────────
    positionCard: {
      backgroundColor: C.surface,
      borderRadius:    16,
      borderWidth:     1,
      borderColor:     C.border,
      marginBottom:    14,
      overflow:        'hidden',
    },
    positionCardDone: { borderColor: C.greenBright + '55' },
  
    positionHeader: {
      flexDirection:      'row',
      alignItems:         'center',
      justifyContent:     'space-between',
      padding:            14,
      borderBottomWidth:  1,
      borderBottomColor:  C.border,
    },
    positionMeta:  { gap: 2 },
    positionName:  { fontSize: 14, fontWeight: '700', color: C.text },
    positionCount: { fontSize: 11, color: C.textMuted },
  
    doneBadge: {
      flexDirection:      'row',
      alignItems:         'center',
      backgroundColor:    C.greenGlow,
      borderRadius:       20,
      paddingHorizontal:  9,
      paddingVertical:    4,
      borderWidth:        1,
      borderColor:        C.greenBright + '44',
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
      flexDirection:      'row',
      alignItems:         'center',
      gap:                6,
      backgroundColor:    C.greenGlow,
      paddingHorizontal:  14,
      paddingVertical:    9,
      borderBottomWidth:  1,
      borderBottomColor:  C.borderBright,
    },
    selectionName:  { fontSize: 13, fontWeight: '700', color: C.greenBright, flex: 1 },
    selectionParty: { fontSize: 12, color: C.textSub },
  
    candidateList: { padding: 10, gap: 8 },
  
    // ── Candidate row ─────────────────────────────────────────────────────────
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
    candidateAvatarSelected:     { borderColor: C.greenBright },
    candidateAvatarImage:        { width: 42, height: 42, borderRadius: 21 },
    candidateAvatarText:         { fontSize: 14, fontWeight: '800', color: C.textSub },
    candidateAvatarTextSelected: { color: C.greenBright },
  
    candidateInfo:         { flex: 1 },
    candidateName:         { fontSize: 13, fontWeight: '600', color: C.text, marginBottom: 2 },
    candidateNameSelected: { color: C.greenBright },
    candidateParty:        { fontSize: 11, color: C.textMuted },
  
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
      width:          20,
      height:         20,
      borderRadius:   10,
      borderWidth:    2,
      borderColor:    C.border,
      alignItems:     'center',
      justifyContent: 'center',
    },
    radioSelected: { borderColor: C.greenBright },
    radioDot: {
      width:           10,
      height:          10,
      borderRadius:    5,
      backgroundColor: C.greenBright,
    },
  
    // ── Empty ballot ──────────────────────────────────────────────────────────
    emptyBallot: {
      alignItems:      'center',
      justifyContent:  'center',
      paddingVertical: 60,
      gap:             12,
    },
    emptyBallotTitle: { fontSize: 17, fontWeight: '700', color: C.text },
    emptyBallotBody: {
      fontSize:    13,
      color:       C.textMuted,
      textAlign:   'center',
      lineHeight:  20,
      maxWidth:    280,
    },
  
    // ── Submit section ────────────────────────────────────────────────────────
    submitSection: { paddingTop: 4, paddingBottom: 32, gap: 10 },
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
    submitBtnText:         { color: '#fff', fontSize: 15, fontWeight: '700' },
    submitBtnTextDisabled: { color: C.textMuted },
  
    // ── Success screen ────────────────────────────────────────────────────────
    successContainer: {
      flex:              1,
      alignItems:        'center',
      justifyContent:    'center',
      paddingHorizontal: 32,
    },
    successIconWrap: { marginBottom: 20 },
    successTitle:    { fontSize: 26, fontWeight: '800', color: C.text, marginBottom: 12 },
    successBody: {
      fontSize:          15,
      color:             C.textSub,
      textAlign:         'center',
      lineHeight:        24,
      marginBottom:      24,
    },
    successBadge: {
      flexDirection:      'row',
      alignItems:         'center',
      backgroundColor:    C.surface2,
      borderRadius:       20,
      paddingHorizontal:  14,
      paddingVertical:    7,
      borderWidth:        1,
      borderColor:        C.border,
    },
    successBadgeText: { fontSize: 12, color: C.textSub },
  
    // ── Confirm modal ─────────────────────────────────────────────────────────
    modalOverlay: {
      flex:            1,
      backgroundColor: 'rgba(0,0,0,0.78)',
      justifyContent:  'flex-end',
    },
    modalSheet: {
      backgroundColor:      C.surface,
      borderTopLeftRadius:  24,
      borderTopRightRadius: 24,
      padding:              24,
      maxHeight:            '82%',
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems:    'center',
      gap:           12,
      marginBottom:  16,
    },
    modalIconWrap: {
      width:           40,
      height:          40,
      borderRadius:    20,
      backgroundColor: C.greenGlow,
      borderWidth:     1,
      borderColor:     C.borderBright,
      alignItems:      'center',
      justifyContent:  'center',
    },
    modalTitle:    { fontSize: 17, fontWeight: '800', color: C.text },
    modalSubtitle: { fontSize: 12, color: C.textMuted, marginTop: 2 },
  
    confirmScroll: { maxHeight: 340, marginBottom: 16 },
    confirmRow: {
      flexDirection:      'row',
      alignItems:         'flex-start',
      gap:                12,
      paddingVertical:    10,
      borderBottomWidth:  1,
      borderBottomColor:  C.border,
    },
    confirmDot: {
      width:           8,
      height:          8,
      borderRadius:    4,
      backgroundColor: C.greenBright,
      marginTop:       6,
      flexShrink:      0,
    },
    confirmPosition: {
      fontSize:      10,
      fontWeight:    '700',
      color:         C.textMuted,
      letterSpacing: 0.8,
      textTransform: 'uppercase',
      marginBottom:  2,
    },
    confirmCandidate: { fontSize: 14, fontWeight: '700', color: C.text, marginBottom: 2 },
    confirmParty:     { fontSize: 11, color: C.textSub },
  
    modalActions: { flexDirection: 'row', gap: 10, paddingTop: 4 },
    modalCancelBtn: {
      flex:            1,
      borderWidth:     1,
      borderColor:     C.border,
      borderRadius:    13,
      paddingVertical: 13,
      alignItems:      'center',
      backgroundColor: C.surface2,
    },
    modalCancelText: { fontSize: 14, fontWeight: '700', color: C.textMuted },
    modalSubmitBtn: {
      flex:            1,
      backgroundColor: C.green,
      borderRadius:    13,
      paddingVertical: 13,
      flexDirection:   'row',
      alignItems:      'center',
      justifyContent:  'center',
      gap:             6,
    },
    modalSubmitText: { fontSize: 14, fontWeight: '800', color: '#fff' },
  
    // ── Setup screen ──────────────────────────────────────────────────────────
    setupContent: {
      paddingHorizontal: 20,
      paddingTop:        28,
      paddingBottom:     60,
    },
    setupHero: { alignItems: 'center', marginBottom: 32 },
    setupIconWrap: {
      width:           72,
      height:          72,
      borderRadius:    36,
      backgroundColor: C.surface2,
      borderWidth:     1,
      borderColor:     C.borderBright,
      alignItems:      'center',
      justifyContent:  'center',
      marginBottom:    16,
    },
    setupTitle:    { fontSize: 26, fontWeight: '800', color: C.text, marginBottom: 6 },
    setupSubtitle: { fontSize: 13, color: C.textMuted },
  
    setupSection:      { marginBottom: 24 },
    setupSectionLabel: {
      fontSize:     13,
      fontWeight:   '700',
      color:        C.text,
      marginBottom: 4,
    },
    setupSectionHint: {
      fontSize:     12,
      color:        C.textMuted,
      marginBottom: 12,
      lineHeight:   18,
    },
  
    deptGrid: {
      flexDirection: 'row',
      flexWrap:      'wrap',
      gap:           8,
    },
    deptChip: {
      paddingHorizontal: 14,
      paddingVertical:   9,
      borderRadius:      20,
      borderWidth:       1,
      borderColor:       C.border,
      backgroundColor:   C.surface2,
    },
    deptChipActive: {
      backgroundColor: C.greenFaint,
      borderColor:     C.greenBright,
    },
    deptChipText:       { fontSize: 13, fontWeight: '600', color: C.textMuted },
    deptChipTextActive: { color: C.greenBright },
  
    consentRow: {
      flexDirection:   'row',
      alignItems:      'flex-start',
      gap:             12,
      backgroundColor: C.surface2,
      borderRadius:    12,
      padding:         14,
      borderWidth:     1,
      borderColor:     C.border,
    },
    checkbox: {
      width:           22,
      height:          22,
      borderRadius:    6,
      borderWidth:     2,
      borderColor:     C.borderBright,
      backgroundColor: C.surface,
      alignItems:      'center',
      justifyContent:  'center',
      marginTop:       1,
      flexShrink:      0,
    },
    checkboxActive: { backgroundColor: C.green, borderColor: C.greenBright },
    consentText:    { flex: 1, fontSize: 13, color: C.textSub, lineHeight: 20 },
    consentHighlight: { color: C.greenBright, fontWeight: '700' },
  
    warnBox: {
      flexDirection:   'row',
      alignItems:      'center',
      gap:             6,
      backgroundColor: C.amberFaint,
      borderWidth:     1,
      borderColor:     C.amberBorder,
      borderRadius:    10,
      padding:         10,
      marginBottom:    12,
    },
    warnText: { fontSize: 12, color: C.amber, flex: 1, lineHeight: 18 },
  
    beginBtn: {
      backgroundColor: C.green,
      borderRadius:    14,
      paddingVertical: 16,
      flexDirection:   'row',
      alignItems:      'center',
      justifyContent:  'center',
      gap:             8,
      marginTop:       8,
    },
    beginBtnDisabled: {
      backgroundColor: C.surface2,
      borderWidth:     1,
      borderColor:     C.border,
    },
    beginBtnText:         { color: '#fff', fontSize: 16, fontWeight: '800' },
    beginBtnTextDisabled: { color: C.textMuted },
  
    setupFooter: {
      flexDirection:  'row',
      alignItems:     'center',
      justifyContent: 'center',
      gap:            5,
      marginTop:      28,
    },
    setupFooterText: { fontSize: 11, color: C.textMuted },
  });
  
  export default VoteScreen;