/**
 * VoteScreen.tsx — Ballot with candidate profile modals + push notifications
 * ─────────────────────────────────────────────────────────────────────────────
 * Flow:
 *   1. Show all positions as cards (usePositions)
 *   2. Each card lists its candidates — tap any to open CandidateModal
 *   3. CandidateModal has "Select" → stores in votingStore (local, not yet submitted)
 *   4. Once every position has a selection, "Submit My Votes" button enables
 *   5. Confirmation Alert → loop useCastVote() per position → success state
 *   6. On success → notifyVoteSubmitted() local push notification
 *
 * DATA HOOKS:
 *   usePositions()  → app/hooks/usePositions.ts
 *   useCandidates() → app/hooks/useCandidates.ts
 *   useCastVote()   → app/hooks/useVotes.ts
 *   useSettings()   → app/hooks/useSettings.ts (check votingOpen)
 *
 * VOTING STORE (local state, not Supabase):
 *   const { selectedCandidates, selectCandidate, reset } = useVotingStore();
 *   selectedCandidates = { [positionId]: candidateId }
 *
 * SUPABASE SUBMISSION (inside handleSubmit):
 *   for (const [positionId, candidateId] of Object.entries(selectedCandidates)) {
 *     await castVote({ candidateId, positionId });
 *   }
 *   The RPC cast_vote() enforces UNIQUE(student_id, position_id) — returns
 *   an error if the student already voted for that position.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import React, { useState, useMemo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator,
  ScrollView, StatusBar,
} from 'react-native';
import { SafeAreaView }      from 'react-native-safe-area-context';
import { Ionicons }          from '@expo/vector-icons';
import { usePositions }      from '../hooks/usePositions';
import { useCandidates }     from '../hooks/useCandidates';
import { useCastVote }       from '../hooks/useVotes';
import { useVotingStore }    from '../stores/votingStore';
import { CandidateModal }    from '../components/CandidateModal';
import { notifyVoteSubmitted } from '../utils/notifications';

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
  amber:        '#F59E0B',
  amberGlow:    'rgba(245,158,11,0.10)',
  text:         '#F0FFF0',
  textSub:      '#A3C5A3',
  textMuted:    '#4B6B4B',
  error:        '#EF4444',
};

// Candidate row type (what useCandidates returns, simplified)
interface CandidateRow {
  id:          string;
  name:        string;
  partylist:   string;
  position_id: string;
  photo_url:   string | null;
  credentials: string | null;
  platform:    string | null;
  Positions?:  { position_name: string } | null;
}

export function VoteScreen() {
  const { data: positions,  isLoading: posLoading  } = usePositions();
  const { data: allCandidates, isLoading: candLoading } = useCandidates();
  const { mutateAsync: castVote } = useCastVote();
  const { selectedCandidates, selectCandidate, reset } = useVotingStore();

  const [modalCandidate, setModalCandidate] = useState<CandidateRow | null>(null);
  const [submitting, setSubmitting]         = useState(false);
  const [submitted, setSubmitted]           = useState(false);

  const isLoading = posLoading || candLoading;

  // Group candidates by position_id
  const candidatesByPosition = useMemo(() => {
    const map: Record<string, CandidateRow[]> = {};
    (allCandidates ?? []).forEach((c: any) => {
      if (!map[c.position_id]) map[c.position_id] = [];
      map[c.position_id].push(c as CandidateRow);
    });
    return map;
  }, [allCandidates]);

  const totalPositions   = positions?.length ?? 0;
  const selectedCount    = Object.keys(selectedCandidates).length;
  const allSelected      = totalPositions > 0 && selectedCount === totalPositions;

  // ─── Submission ─────────────────────────────────────────────────────────────
  const handleSubmit = () => {
    Alert.alert(
      'Submit Your Votes',
      `You've selected candidates for all ${totalPositions} positions.\nThis action cannot be undone.`,
      [
        { text: 'Go Back', style: 'cancel' },
        {
          text: 'Submit',
          style: 'destructive',
          onPress: async () => {
            setSubmitting(true);
            try {
              for (const [positionId, candidateId] of Object.entries(selectedCandidates)) {
                await castVote({ candidateId, positionId });
              }
              reset(); // clear local selections
              setSubmitted(true);
              await notifyVoteSubmitted(); // 🔔 local push notification
            } catch (err: any) {
              Alert.alert('Submission Error', err.message ?? 'Failed to submit votes.');
            } finally {
              setSubmitting(false);
            }
          },
        },
      ],
    );
  };

  // ─── Success state ───────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <SafeAreaView style={s.safe}>
        <StatusBar barStyle="light-content" backgroundColor={C.bg} />
        <View style={s.successContainer}>
          <View style={s.successIcon}>
            <Ionicons name="checkmark-circle" size={64} color={C.greenBright} />
          </View>
          <Text style={s.successTitle}>Vote Submitted!</Text>
          <Text style={s.successBody}>
            Your choices have been recorded. Thank you for participating in this election.
          </Text>
          <View style={s.successBadge}>
            <Ionicons name="shield-checkmark-outline" size={14} color={C.textSub} style={{ marginRight: 5 }} />
            <Text style={s.successBadgeText}>Secured by AnimoQuorum</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Loading state ───────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.center}>
          <ActivityIndicator size="large" color={C.greenBright} />
          <Text style={s.loadingText}>Loading ballot…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      {/* ── Header ── */}
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>Cast Your Vote</Text>
          <Text style={s.headerSub}>SY 2025–2026 · DLSL COMELEC</Text>
        </View>
        {/* Progress pill */}
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

      {/* ── Ballot ── */}
      <FlatList
        data={positions ?? []}
        keyExtractor={item => item.id}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={
          <TouchableOpacity
            style={[s.submitBtn, !allSelected && s.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={!allSelected || submitting}
            activeOpacity={0.85}
          >
            {submitting
              ? <ActivityIndicator color="#fff" />
              : <>
                  <Ionicons name="send" size={16} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={s.submitBtnText}>Submit My Votes</Text>
                </>
            }
          </TouchableOpacity>
        }
        renderItem={({ item: position }) => {
          const candidates      = candidatesByPosition[position.id] ?? [];
          const selectionId     = selectedCandidates[position.id];
          const selectedCand    = candidates.find(c => c.id === selectionId);
          const isComplete      = !!selectionId;

          return (
            <View style={s.positionCard}>
              {/* Position header */}
              <View style={s.positionHeader}>
                <View style={s.positionMeta}>
                  <Text style={s.positionName}>{position.position_name}</Text>
                  <Text style={s.positionCount}>{candidates.length} candidates</Text>
                </View>
                {isComplete && (
                  <View style={s.completeBadge}>
                    <Ionicons name="checkmark-circle" size={13} color={C.greenBright} style={{ marginRight: 3 }} />
                    <Text style={s.completeBadgeText}>Selected</Text>
                  </View>
                )}
              </View>

              {/* Selected candidate highlight */}
              {selectedCand && (
                <View style={s.selectionBanner}>
                  <Ionicons name="person-circle-outline" size={16} color={C.greenBright} />
                  <Text style={s.selectionName}>{selectedCand.name}</Text>
                  <Text style={s.selectionParty}>· {selectedCand.partylist}</Text>
                </View>
              )}

              {/* Candidate list */}
              <View style={s.candidateList}>
                {candidates.map((c, idx) => {
                  const isSelected = c.id === selectionId;
                  return (
                    <TouchableOpacity
                      key={c.id}
                      style={[
                        s.candidateRow,
                        idx === candidates.length - 1 && { borderBottomWidth: 0 },
                        isSelected && s.candidateRowSelected,
                      ]}
                      onPress={() => setModalCandidate(c)}
                      activeOpacity={0.75}
                    >
                      {/* Initials avatar */}
                      <View style={[s.avatar, isSelected && s.avatarSelected]}>
                        <Text style={[s.avatarText, isSelected && { color: C.greenBright }]}>
                          {c.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                        </Text>
                      </View>

                      {/* Name + party */}
                      <View style={{ flex: 1 }}>
                        <Text style={[s.candName, isSelected && { color: C.greenBright }]}>
                          {c.name}
                        </Text>
                        <Text style={s.candParty}>{c.partylist}</Text>
                      </View>

                      {/* Selection indicator or view chevron */}
                      {isSelected
                        ? <Ionicons name="checkmark-circle" size={20} color={C.greenBright} />
                        : <Ionicons name="chevron-forward" size={16} color={C.textMuted} />
                      }
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          );
        }}
      />

      {/* ── Candidate detail modal ── */}
      <CandidateModal
        candidate={modalCandidate}
        visible={!!modalCandidate}
        onClose={() => setModalCandidate(null)}
        alreadyVoted={!!(modalCandidate && selectedCandidates[modalCandidate.position_id])}
        onSelect={(c) => {
          selectCandidate(c.position_id, c.id);
          setModalCandidate(null);
        }}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: C.bg },
  center:  { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: C.textMuted, fontSize: 13 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  headerTitle: { fontSize: 17, fontWeight: '800', color: C.text },
  headerSub:   { fontSize: 11, color: C.textMuted, marginTop: 2, letterSpacing: 0.4 },

  progressPill: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.surface2, borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: C.border,
  },
  progressPillDone: { backgroundColor: C.greenGlow, borderColor: C.greenBright + '55' },
  progressText:     { fontSize: 12, fontWeight: '700', color: C.textMuted },

  // List
  list: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 },

  // Position card
  positionCard: {
    backgroundColor: C.surface, borderRadius: 16,
    borderWidth: 1, borderColor: C.border,
    marginBottom: 14, overflow: 'hidden',
  },
  positionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 14, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  positionMeta: { gap: 2 },
  positionName:  { fontSize: 14, fontWeight: '700', color: C.text },
  positionCount: { fontSize: 11, color: C.textMuted },
  completeBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.greenGlow, borderRadius: 20,
    paddingHorizontal: 9, paddingVertical: 4,
    borderWidth: 1, borderColor: C.greenBright + '44',
  },
  completeBadgeText: { fontSize: 11, fontWeight: '700', color: C.greenBright },

  // Selected candidate banner
  selectionBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: C.greenGlow, paddingHorizontal: 14, paddingVertical: 9,
    borderBottomWidth: 1, borderBottomColor: C.borderBright,
  },
  selectionName:  { fontSize: 13, fontWeight: '700', color: C.greenBright },
  selectionParty: { fontSize: 12, color: C.textSub },

  // Candidate rows
  candidateList: {},
  candidateRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  candidateRowSelected: { backgroundColor: C.surface2 },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: C.surface2, borderWidth: 1, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarSelected: { borderColor: C.greenBright, backgroundColor: C.greenGlow },
  avatarText:     { fontSize: 13, fontWeight: '800', color: C.textSub },
  candName:       { fontSize: 14, fontWeight: '600', color: C.text, marginBottom: 2 },
  candParty:      { fontSize: 11, color: C.textMuted },

  // Submit
  submitBtn: {
    marginTop: 12, marginHorizontal: 2,
    backgroundColor: C.green, borderRadius: 14,
    paddingVertical: 15, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center',
  },
  submitBtnDisabled: { backgroundColor: C.surface2, borderWidth: 1, borderColor: C.border },
  submitBtnText:     { color: '#fff', fontSize: 15, fontWeight: '700' },

  // Success
  successContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 32,
  },
  successIcon:  { marginBottom: 20 },
  successTitle: { fontSize: 26, fontWeight: '800', color: C.text, marginBottom: 12 },
  successBody:  { fontSize: 15, color: C.textSub, textAlign: 'center', lineHeight: 24, marginBottom: 24 },
  successBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.surface2, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 7,
    borderWidth: 1, borderColor: C.border,
  },
  successBadgeText: { fontSize: 12, color: C.textSub },
});
