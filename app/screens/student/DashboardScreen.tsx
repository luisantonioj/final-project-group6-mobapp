/**
 * FeedScreen.tsx — Student home screen (FeedList route)
 * ─────────────────────────────────────────────────────────────────────────────
 * BACKEND STATUS:
 *   ✅ Posts / Announcements  → usePosts()
 *   ✅ Poll voting            → usePollResponses() + useSubmitPollResponse()
 *   ✅ Live vote results      → useLiveResults() — gated by show_live_results
 *   ✅ Voting countdown       → useSettings() (voting_start_time/voting_end_time)
 *   🔲 Comments               → local state only (useCreateComment not ready)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Animated,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  COLORS,
  screenStyles,
  countdownStyles,
  feedStyles,
  liveStyles,
  shared,
} from './DashboardScreen.styles';
import { usePosts } from '../../hooks/usePosts';
import { useComments, useCreateComment, useDeleteComment, Comment as CommentType } from '../../hooks/useComments';
import { useLikes, useToggleLike } from '../../hooks/useLikes';
import { usePollResponses, useSubmitPollResponse } from '../../hooks/usePollResponses';
import { useLiveResults, LivePosition } from '../../hooks/useLiveResults';
import { useSettings, VotingStatus } from '../../hooks/useSettings';
import { supabase } from '../../utils/supabase';

// =============================================================================
// TYPES
// =============================================================================

interface RawPost {
  id: string;
  admin_id: string;
  type: 'announcement' | 'poll';
  title: string;
  content: string;
  created_at: string;
  PollOptions?: { id: string; post_id: string; option_text: string }[];
}

// =============================================================================
// HELPERS
// =============================================================================

function toInitials(str: string): string {
  const words = str.trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

function timeAgo(isoString: string): string {
  const diff  = Date.now() - new Date(isoString).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(mins / 60);
  const days  = Math.floor(hours / 24);
  if (days > 0)  return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (mins > 0)  return `${mins}m ago`;
  return 'Just now';
}

/** Format a Date to a readable label e.g. "April 10, 2026 · 5:00 PM" */
function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-PH', {
    month: 'long', day: 'numeric', year: 'numeric',
  }) + ' · ' + d.toLocaleTimeString('en-PH', {
    hour: 'numeric', minute: '2-digit', hour12: true,
  });
}

/** Break a total-seconds value into { h, m, s } */
function secondsToHMS(total: number) {
  const s = total % 60;
  const m = Math.floor(total / 60) % 60;
  const h = Math.floor(total / 3600);
  return { h, m, s };
}

const pad = (n: number) => String(Math.max(0, n)).padStart(2, '0');

// =============================================================================
// SECTION 1 — VOTING COUNTDOWN
// Driven by useSettings(). Shows different states depending on votingStatus.
// =============================================================================

const VotingCountdown: React.FC = () => {
  const { settings, votingStatus, isLoading } = useSettings();
  const [secondsLeft, setSecondsLeft]         = useState(0);
  const [secondsUntil, setSecondsUntil]       = useState(0);
  const progressAnim                          = useRef(new Animated.Value(0)).current;

  // Tick every second — recalculate from the real end/start times
  useEffect(() => {
    if (!settings) return;

    const tick = () => {
      const now = Date.now();

      if (settings.voting_end_time) {
        const end  = new Date(settings.voting_end_time).getTime();
        const left = Math.max(0, Math.floor((end - now) / 1000));
        setSecondsLeft(left);

        // Progress bar: fraction of window elapsed
        if (settings.voting_start_time) {
          const start    = new Date(settings.voting_start_time).getTime();
          const total    = end - start;
          const elapsed  = now - start;
          const fraction = Math.min(1, Math.max(0, elapsed / total));
          Animated.timing(progressAnim, {
            toValue: fraction,
            duration: 500,
            useNativeDriver: false,
          }).start();
        }
      }

      if (settings.voting_start_time) {
        const start = new Date(settings.voting_start_time).getTime();
        const until = Math.max(0, Math.floor((start - now) / 1000));
        setSecondsUntil(until);
      }
    };

    tick(); // immediate
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [settings]);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={countdownStyles.wrapper}>
        <View style={countdownStyles.glowBar} />
        <ActivityIndicator color={COLORS.green} style={{ marginVertical: 24 }} />
      </View>
    );
  }

  // ── Unconfigured ───────────────────────────────────────────────────────────
  if (votingStatus === 'unconfigured') {
    return (
      <View style={countdownStyles.wrapper}>
        <View style={countdownStyles.glowBar} />
        <Text style={countdownStyles.label}>🗳 Election</Text>
        <Text style={{ color: COLORS.textMuted, fontSize: 13, marginTop: 8, textAlign: 'center' }}>
          Voting schedule has not been set yet.
        </Text>
      </View>
    );
  }

  // ── Not started yet — count UP to start ───────────────────────────────────
  if (votingStatus === 'not_started') {
    const { h, m, s } = secondsToHMS(secondsUntil);
    return (
      <View style={countdownStyles.wrapper}>
        <View style={countdownStyles.glowBar} />
        <Text style={countdownStyles.label}>🗳 Voting Opens In</Text>
        <View style={countdownStyles.timerRow}>
          {[{ val: h, unit: 'Hrs' }, { val: m, unit: 'Min' }, { val: s, unit: 'Sec' }].map(
            (item, idx, arr) => (
              <React.Fragment key={item.unit}>
                <View style={countdownStyles.timeBlock}>
                  <Text style={countdownStyles.timeValue}>{pad(item.val)}</Text>
                  <Text style={countdownStyles.timeUnit}>{item.unit}</Text>
                </View>
                {idx < arr.length - 1 && (
                  <Text style={countdownStyles.timeSeparator}>:</Text>
                )}
              </React.Fragment>
            ),
          )}
        </View>
        <View style={countdownStyles.progressTrack}>
          <Animated.View style={[countdownStyles.progressBar, { width: '0%' }]} />
        </View>
        {settings?.voting_start_time && (
          <Text style={countdownStyles.subText}>
            Opens: {formatDateTime(settings.voting_start_time)}
          </Text>
        )}
      </View>
    );
  }

  // ── Ended ──────────────────────────────────────────────────────────────────
  if (votingStatus === 'ended') {
    return (
      <View style={countdownStyles.wrapper}>
        <View style={[countdownStyles.glowBar, { backgroundColor: COLORS.textMuted }]} />
        <Text style={countdownStyles.label}>🗳 Voting Has Ended</Text>
        <View style={countdownStyles.timerRow}>
          {['00', '00', '00'].map((v, i) => (
            <React.Fragment key={i}>
              <View style={countdownStyles.timeBlock}>
                <Text style={[countdownStyles.timeValue, { color: COLORS.textMuted }]}>{v}</Text>
                <Text style={countdownStyles.timeUnit}>
                  {['Hrs', 'Min', 'Sec'][i]}
                </Text>
              </View>
              {i < 2 && <Text style={countdownStyles.timeSeparator}>:</Text>}
            </React.Fragment>
          ))}
        </View>
        <View style={countdownStyles.progressTrack}>
          <Animated.View style={[countdownStyles.progressBar, { width: '100%' }]} />
        </View>
        {settings?.voting_end_time && (
          <Text style={countdownStyles.subText}>
            Closed: {formatDateTime(settings.voting_end_time)}
          </Text>
        )}
      </View>
    );
  }

  // ── Active — count DOWN to end ─────────────────────────────────────────────
  const { h, m, s } = secondsToHMS(secondsLeft);
  const progressWidth = progressAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={countdownStyles.wrapper}>
      <View style={countdownStyles.glowBar} />
      <Text style={countdownStyles.label}>⏱ Voting Closes In</Text>
      <View style={countdownStyles.timerRow}>
        {[{ val: h, unit: 'Hrs' }, { val: m, unit: 'Min' }, { val: s, unit: 'Sec' }].map(
          (item, idx, arr) => (
            <React.Fragment key={item.unit}>
              <View style={countdownStyles.timeBlock}>
                <Text style={countdownStyles.timeValue}>{pad(item.val)}</Text>
                <Text style={countdownStyles.timeUnit}>{item.unit}</Text>
              </View>
              {idx < arr.length - 1 && (
                <Text style={countdownStyles.timeSeparator}>:</Text>
              )}
            </React.Fragment>
          ),
        )}
      </View>
      <View style={countdownStyles.progressTrack}>
        <Animated.View style={[countdownStyles.progressBar, { width: progressWidth }]} />
      </View>
      {settings?.voting_end_time && (
        <Text style={countdownStyles.subText}>
          {formatDateTime(settings.voting_start_time ?? '')} → {formatDateTime(settings.voting_end_time)}
        </Text>
      )}
    </View>
  );
};

// =============================================================================
// SECTION 2 — VOTER TURNOUT DASHBOARD
// PBB-style turnout board: donut summary + college participation ranking.
// Uses dummy data — replace DUMMY_TURNOUT with real data when backend ready.
// Hidden entirely when show_live_results = false.
// =============================================================================

// TODO: replace with real data from Supabase (e.g. a Colleges + Votes join)
const DUMMY_TURNOUT = {
  totalVoters:  5255,
  totalVoted:   3121,
  asOf:         'Apr 15, 2026 · 08:02 PM',
  colleges: [
    { name: 'CON',       pct: 84.9, voted: 636,  total: 749,  color: '#16A34A' },
    { name: 'CEAS/CCJE', pct: 63.9, voted: 478,  total: 748,  color: '#1D4ED8' },
    { name: 'CBEAM',     pct: 59.9, voted: 401,  total: 669,  color: '#B45309' },
    { name: 'CIHTM',     pct: 48.6, voted: 312,  total: 642,  color: '#7C3AED' },
    { name: 'CITE',      pct: 41.2, voted: 289,  total: 702,  color: '#ff0000' },
    { name: 'CCAFS',     pct: 37.8, voted: 204,  total: 540,  color: '#4726dc' },
    { name: 'CAS',       pct: 29.3, voted: 183,  total: 625,  color: '#D97706' },
    { name: 'COM',       pct: 22.1, voted: 118,  total: 533,  color: '#6D28D9' },
  ],
};

// ── Donut ring drawn with two arcs (no chart library needed) ─────────────────
const DonutRing: React.FC<{ pct: number; size: number; stroke: number }> = ({ pct, size, stroke }) => {
  const r      = (size - stroke) / 2;
  const cx     = size / 2;
  const circ   = 2 * Math.PI * r;
  const filled = (pct / 100) * circ;

  return (
    <View style={{ width: size, height: size }}>
      <Animated.View>
        {/* SVG-less approach: two concentric Views with border */}
        <View style={{
          width: size, height: size, borderRadius: size / 2,
          borderWidth: stroke, borderColor: 'rgba(255,255,255,0.08)',
          position: 'absolute',
        }} />
        {/* Filled arc approximation using rotation trick */}
        <View style={{
          width: size, height: size, borderRadius: size / 2,
          borderWidth: stroke,
          borderTopColor:    COLORS.green,
          borderRightColor:  pct > 25  ? COLORS.green : 'transparent',
          borderBottomColor: pct > 50  ? COLORS.green : 'transparent',
          borderLeftColor:   pct > 75  ? COLORS.green : 'transparent',
          position: 'absolute',
          transform: [{ rotate: '-90deg' }],
          opacity: 0.9,
        }} />
      </Animated.View>
    </View>
  );
};

const LiveVotingBoard: React.FC = () => {
  const { totalVoters, totalVoted, asOf, colleges } = DUMMY_TURNOUT;
  const overallPct = Math.round((totalVoted / totalVoters) * 100 * 10) / 10;
  const topCollege = colleges[0];
  const rest       = colleges.slice(1);

  // Pair remaining colleges into rows of 2
  const rows: typeof rest[] = [];
  for (let i = 0; i < rest.length; i += 2) {
    rows.push(rest.slice(i, i + 2));
  }

  return (
    <View>
      {/* ── Header pill ── */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <Text style={[shared.sectionTitle, { flex: 1 }]}>Voter Turnout</Text>
        <View style={liveStyles.livePill}>
          <View style={liveStyles.liveDot} />
          <Text style={liveStyles.livePillText}>LIVE</Text>
        </View>
      </View>

      {/* ── Summary card ── */}
      <View style={[shared.card, { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 10 }]}>
        {/* Donut */}
        <View style={{ width: 80, height: 80, alignItems: 'center', justifyContent: 'center' }}>
          <DonutRing pct={overallPct} size={80} stroke={10} />
          <View style={{ position: 'absolute', alignItems: 'center' }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.green }}>{overallPct}%</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 10, color: COLORS.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 }}>
            SG Elections 2025–2026
          </Text>
          <Text style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 8 }}>
            As of {asOf}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
            <Text style={{ fontSize: 24, fontWeight: '700', color: COLORS.green }}>{overallPct}%</Text>
            <Text style={{ fontSize: 13, color: COLORS.textMuted }}>
              {totalVoted.toLocaleString()} / {totalVoters.toLocaleString()}
            </Text>
          </View>
        </View>
      </View>

      {/* ── #1 College featured card ── */}
      <View style={[shared.card, {
        flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10,
        borderColor: COLORS.green, borderWidth: 1.5,
      }]}>
        <View style={{
          width: 44, height: 44, borderRadius: 22,
          backgroundColor: COLORS.greenGlow,
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.green }}>
            {topCollege.name[0]}
          </Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: '#fff', marginBottom: 2 }}>
            {topCollege.name}
          </Text>
          <Text style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 6 }}>
            {topCollege.pct}% participation · {topCollege.voted.toLocaleString()} / {topCollege.total.toLocaleString()}
          </Text>
          <View style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 4, height: 5, overflow: 'hidden' }}>
            <View style={{ width: `${topCollege.pct}%`, height: '100%', backgroundColor: COLORS.green, borderRadius: 4 }} />
          </View>
        </View>

        <View style={{
          backgroundColor: COLORS.greenGlow, borderRadius: 10,
          paddingHorizontal: 12, paddingVertical: 8, alignItems: 'center',
        }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: COLORS.green }}>#1</Text>
          <Text style={{ fontSize: 9, color: COLORS.green, textAlign: 'center', marginTop: 1 }}>Most{''}Engaged</Text>
        </View>
      </View>

      {/* ── Remaining colleges in 2-col grid ── */}
      {rows.map((pair, ri) => (
        <View key={ri} style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
          {pair.map((col, ci) => {
            const rank = ri * 2 + ci + 2;
            return (
              <View key={col.name} style={[shared.card, { flex: 1, gap: 6 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{
                    width: 32, height: 32, borderRadius: 16,
                    backgroundColor: col.color + '22',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: col.color }}>
                      {col.name[0]}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: '#fff' }} numberOfLines={1}>
                      {col.name}
                    </Text>
                    <Text style={{ fontSize: 10, color: COLORS.textMuted }}>
                      {col.pct}%
                    </Text>
                  </View>
                  <View style={{
                    backgroundColor: 'rgba(255,255,255,0.06)',
                    borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3,
                  }}>
                    <Text style={{ fontSize: 11, fontWeight: '600', color: COLORS.textMuted }}>#{rank}</Text>
                  </View>
                </View>
                <View style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 3, height: 4, overflow: 'hidden' }}>
                  <View style={{ width: `${col.pct}%`, height: '100%', backgroundColor: col.color, borderRadius: 3 }} />
                </View>
                <Text style={{ fontSize: 10, color: COLORS.textMuted }}>
                  {col.voted.toLocaleString()} / {col.total.toLocaleString()}
                </Text>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
};

// =============================================================================
// POLL VOTER COMPONENT
// =============================================================================

const PollVoter: React.FC<{ post: RawPost; userId: string | null }> = ({ post, userId }) => {
  const { data, isLoading, isError } = usePollResponses(post.id, userId);
  const { mutateAsync: submitVote, isPending: isSubmitting } = useSubmitPollResponse(post.id);
  const [pendingOptionId, setPendingOptionId] = useState<string | null>(null);

  const hasVoted    = data?.hasVoted   ?? false;
  const myOptionId  = data?.myOptionId ?? pendingOptionId;
  const options     = data?.options    ?? [];
  const totalVotes  = options.reduce((sum, o) => sum + o.responseCount, 0);
  const showResults = hasVoted || !!pendingOptionId;

  const handleVote = async (optionId: string) => {
    if (!userId) { Alert.alert('Not signed in', 'You must be signed in to vote.'); return; }
    if (hasVoted || pendingOptionId) return;
    setPendingOptionId(optionId);
    try {
      await submitVote({ pollOptionId: optionId, studentId: userId });
    } catch (e: any) {
      setPendingOptionId(null);
      if (e?.code === '23505') {
        Alert.alert('Already voted', 'You have already responded to this poll.');
      } else {
        Alert.alert('Error', e?.message ?? 'Could not submit your vote. Please try again.');
      }
    }
  };

  if (isLoading) {
    return (
      <View style={{ paddingVertical: 20, alignItems: 'center' }}>
        <ActivityIndicator size="small" color={COLORS.green} />
      </View>
    );
  }

  if (isError || options.length === 0) {
    return (
      <View style={{ paddingVertical: 12 }}>
        <Text style={{ color: COLORS.textMuted, fontSize: 13 }}>
          {isError ? 'Could not load poll options.' : 'No options available.'}
        </Text>
      </View>
    );
  }

  const maxCount = Math.max(...options.map(o => o.responseCount), 1);

  return (
    <View style={{ marginBottom: 12 }}>
      {options.map(opt => {
        const isMyVote  = opt.id === myOptionId;
        const pct       = totalVotes > 0 ? Math.round((opt.responseCount / totalVotes) * 100) : 0;
        const isLeading = opt.responseCount > 0 && opt.responseCount === maxCount;

        if (showResults) {
          return (
            <View key={opt.id} style={pStyles.resultRow}>
              <View style={pStyles.resultHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  {isMyVote && (
                    <Ionicons name="checkmark-circle" size={14} color={COLORS.green} style={{ marginRight: 5 }} />
                  )}
                  <Text style={[pStyles.resultLabel, isMyVote && { color: COLORS.green }]} numberOfLines={1}>
                    {opt.option_text}
                  </Text>
                </View>
                <Text style={[pStyles.resultPct, isLeading && { color: COLORS.green, fontWeight: '700' }]}>
                  {pct}%
                </Text>
              </View>
              <View style={pStyles.barTrack}>
                <View style={[
                  pStyles.barFill,
                  { width: `${pct}%` },
                  isMyVote  && { backgroundColor: 'rgba(34,197,94,0.45)' },
                  isLeading && { backgroundColor: COLORS.green },
                ]} />
              </View>
              <Text style={pStyles.resultCount}>
                {opt.responseCount} {opt.responseCount === 1 ? 'response' : 'responses'}
              </Text>
            </View>
          );
        }

        return (
          <TouchableOpacity
            key={opt.id}
            style={pStyles.optionBtn}
            onPress={() => handleVote(opt.id)}
            disabled={isSubmitting}
            activeOpacity={0.7}
          >
            {isSubmitting && pendingOptionId === opt.id
              ? <ActivityIndicator size={14} color={COLORS.green} style={{ marginRight: 10 }} />
              : <View style={pStyles.optionRadio} />
            }
            <Text style={pStyles.optionText}>{opt.option_text}</Text>
          </TouchableOpacity>
        );
      })}
      <Text style={pStyles.totalText}>
        {totalVotes} {totalVotes === 1 ? 'response' : 'responses'}
        {showResults ? ' · Refreshes every 15s' : ''}
      </Text>
    </View>
  );
};

const pStyles = {
  optionBtn: {
    flexDirection: 'row' as const, alignItems: 'center' as const,
    paddingVertical: 11, paddingHorizontal: 14, marginBottom: 8,
    borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)',
  },
  optionRadio: {
    width: 16, height: 16, borderRadius: 8,
    borderWidth: 2, borderColor: COLORS.textMuted, marginRight: 10,
  },
  optionText:   { color: '#fff', fontSize: 14, flex: 1 },
  resultRow:    { marginBottom: 12 },
  resultHeader: {
    flexDirection: 'row' as const, justifyContent: 'space-between' as const,
    alignItems: 'center' as const, marginBottom: 5,
  },
  resultLabel:  { color: '#fff', fontSize: 13, fontWeight: '500' as const, flex: 1 },
  resultPct:    { color: COLORS.textMuted, fontSize: 13, fontWeight: '600' as const, marginLeft: 8 },
  barTrack: {
    height: 6, backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 4, overflow: 'hidden' as const, marginBottom: 4,
  },
  barFill:     { height: 6, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.2)' },
  resultCount: { fontSize: 11, color: COLORS.textMuted },
  totalText:   { fontSize: 11, color: COLORS.textMuted, marginTop: 4 },
};

// =============================================================================
// POST CARD
// =============================================================================

// ─── Single comment row (supports one level of replies) ───────────────────────

const CommentRow: React.FC<{
  comment: CommentType;
  userId: string | null;
  postId: string;
  depth?: number;
}> = ({ comment, userId, postId, depth = 0 }) => {
  const [replyVisible, setReplyVisible] = useState(false);
  const [replyDraft, setReplyDraft]     = useState('');
  const { mutateAsync: createComment, isPending: isSending } = useCreateComment(postId);
  const { mutateAsync: deleteComment } = useDeleteComment(postId);
  const isOwn = userId === comment.student_id;

  const handleReply = async () => {
    const trimmed = replyDraft.trim();
    if (!trimmed || !userId) return;
    try {
      await createComment({ content: trimmed, studentId: userId, parentId: comment.id });
      setReplyDraft('');
      setReplyVisible(false);
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Could not post reply.');
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Comment', 'Remove this comment?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteComment(comment.id) },
    ]);
  };

  return (
    <View style={{ marginLeft: depth > 0 ? 28 : 0, marginBottom: 10 }}>
      <View style={feedStyles.comment}>
        <View style={feedStyles.commentAvatar}>
          <Text style={feedStyles.commentAvatarText}>{comment.authorInitials}</Text>
        </View>
        <View style={[feedStyles.commentBubble, { flex: 1 }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={feedStyles.commentUser}>{comment.authorName}</Text>
            <Text style={{ fontSize: 10, color: COLORS.textMuted }}>{timeAgo(comment.created_at)}</Text>
          </View>
          <Text style={feedStyles.commentText}>{comment.content}</Text>
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 6 }}>
            {depth === 0 && (
              <TouchableOpacity onPress={() => setReplyVisible(v => !v)}>
                <Text style={{ fontSize: 11, color: COLORS.green, fontWeight: '600' }}>
                  {replyVisible ? 'Cancel' : 'Reply'}
                </Text>
              </TouchableOpacity>
            )}
            {isOwn && (
              <TouchableOpacity onPress={handleDelete}>
                <Text style={{ fontSize: 11, color: COLORS.textMuted }}>Delete</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Reply input */}
      {replyVisible && (
        <View style={[feedStyles.commentInput, { marginLeft: 28, marginTop: 6 }]}>
          <View style={feedStyles.commentAvatar}>
            <Text style={feedStyles.commentAvatarText}>AN</Text>
          </View>
          <View style={feedStyles.commentInputBox}>
            <TextInput
              style={feedStyles.commentInputText}
              placeholder="Write a reply…"
              placeholderTextColor="#AAAAAA"
              value={replyDraft}
              onChangeText={setReplyDraft}
              multiline
              autoFocus
            />
          </View>
          <TouchableOpacity style={feedStyles.commentSendBtn} onPress={handleReply} disabled={isSending}>
            {isSending
              ? <ActivityIndicator size={12} color={COLORS.green} />
              : <Text style={{ fontSize: 14 }}>↑</Text>
            }
          </TouchableOpacity>
        </View>
      )}

      {/* Nested replies (depth 1 only) */}
      {comment.replies.map((reply, idx) => (
        <View key={reply.id} style={{ marginTop: idx === 0 ? 8 : 6 }}>
          <CommentRow comment={reply} userId={userId} postId={postId} depth={1} />
        </View>
      ))}
    </View>
  );
};

// ─── Post card ────────────────────────────────────────────────────────────────

const PostCard: React.FC<{ post: RawPost; userId: string | null }> = ({ post, userId }) => {
  const [commentsVisible, setCommentsVisible] = useState(false);
  const [draftComment, setDraftComment]       = useState('');

  const authorLabel    = 'DLSL COMELEC';
  const authorInitials = toInitials(authorLabel);
  const roleLabel      = 'Official';

  // ── Likes ──────────────────────────────────────────────────────────────────
  const { data: likesData }              = useLikes(post.id, userId);
  const { mutateAsync: toggleLike, isPending: isTogglingLike } = useToggleLike(post.id);

  const likeCount = likesData?.count   ?? 0;
  const hasLiked  = likesData?.hasLiked ?? false;
  const myLikeId  = likesData?.myLikeId ?? null;

  const handleLike = async () => {
    if (!userId) { Alert.alert('Not signed in', 'You must be signed in to like posts.'); return; }
    try {
      await toggleLike({ studentId: userId, hasLiked, myLikeId });
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Could not update like.');
    }
  };

  // ── Comments ───────────────────────────────────────────────────────────────
  const { data: comments = [], isLoading: commentsLoading } = useComments(post.id);
  const { mutateAsync: createComment, isPending: isSendingComment } = useCreateComment(post.id);

  const totalCommentCount = comments.reduce((sum, c) => sum + 1 + c.replies.length, 0);

  const handleSubmitComment = async () => {
    const trimmed = draftComment.trim();
    if (!trimmed || !userId) return;
    try {
      await createComment({ content: trimmed, studentId: userId });
      setDraftComment('');
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Could not post comment.');
    }
  };

  return (
    <View style={feedStyles.postCard}>
      {/* ── Author header ── */}
      <View style={feedStyles.postHeader}>
        <View style={feedStyles.avatar}>
          <Text style={feedStyles.avatarText}>{authorInitials}</Text>
        </View>
        <View style={feedStyles.postMeta}>
          <Text style={feedStyles.postAuthor}>{authorLabel}</Text>
          <Text style={feedStyles.postTime}>{roleLabel} · {timeAgo(post.created_at)}</Text>
        </View>
        <View style={[shared.badge, {
          backgroundColor: post.type === 'poll' ? COLORS.greenGlow : 'rgba(255,255,255,0.05)',
        }]}>
          <Text style={[shared.badgeText, { color: post.type === 'poll' ? COLORS.green : COLORS.textMuted }]}>
            {post.type === 'poll' ? 'Poll' : 'Notice'}
          </Text>
        </View>
      </View>

      {post.title ? <Text style={feedStyles.postTitle}>{post.title}</Text> : null}
      {post.type === 'announcement' && post.content
        ? <Text style={feedStyles.postBody}>{post.content}</Text>
        : null}
      {post.type === 'poll' ? <PollVoter post={post} userId={userId} /> : null}

      {/* ── Like & comment buttons ── */}
      <View style={feedStyles.postActions}>
        <TouchableOpacity
          style={feedStyles.postAction}
          onPress={handleLike}
          disabled={isTogglingLike}
        >
          <Ionicons
            name={hasLiked ? 'heart' : 'heart-outline'}
            size={18}
            color={hasLiked ? '#22c55e' : '#ffffff'}
          />
          <Text style={feedStyles.postActionText}>{likeCount}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={feedStyles.postAction}
          onPress={() => setCommentsVisible(v => !v)}
        >
          <Ionicons name="chatbubble-outline" size={18} color="#ffffff" />
          <Text style={feedStyles.postActionText}>
            {totalCommentCount} {totalCommentCount === 1 ? 'Comment' : 'Comments'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Comment thread ── */}
      {commentsVisible && (
        <View style={feedStyles.commentSection}>
          {commentsLoading ? (
            <ActivityIndicator size="small" color={COLORS.green} style={{ marginVertical: 12 }} />
          ) : comments.length === 0 ? (
            <Text style={{ color: COLORS.textMuted, fontSize: 12, marginBottom: 10 }}>
              No comments yet. Be the first!
            </Text>
          ) : (
            comments.map(c => (
              <CommentRow key={c.id} comment={c} userId={userId} postId={post.id} />
            ))
          )}

          {/* New top-level comment input */}
          <View style={feedStyles.commentInput}>
            <View style={feedStyles.commentAvatar}>
              <Text style={feedStyles.commentAvatarText}>AN</Text>
            </View>
            <View style={feedStyles.commentInputBox}>
              <TextInput
                style={feedStyles.commentInputText}
                placeholder="Add a comment…"
                placeholderTextColor="#AAAAAA"
                value={draftComment}
                onChangeText={setDraftComment}
                multiline
              />
            </View>
            <TouchableOpacity
              style={feedStyles.commentSendBtn}
              onPress={handleSubmitComment}
              disabled={isSendingComment}
            >
              {isSendingComment
                ? <ActivityIndicator size={12} color={COLORS.green} />
                : <Text style={{ fontSize: 14 }}>↑</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

// =============================================================================
// ANNOUNCEMENT FEED
// =============================================================================

type FeedTab = 'all' | 'announcements' | 'polls';

const FEED_TABS: { key: FeedTab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'all',           label: 'All',     icon: 'layers-outline'    },
  { key: 'announcements', label: 'Notices', icon: 'megaphone-outline' },
  { key: 'polls',         label: 'Polls',   icon: 'bar-chart-outline' },
];

const AnnouncementFeed: React.FC<{ userId: string | null }> = ({ userId }) => {
  const [activeTab, setActiveTab] = useState<FeedTab>('all');
  const { data: rawPosts, isLoading, isError, error } = usePosts();

  const filteredPosts = ((rawPosts ?? []) as RawPost[]).filter(post => {
    if (activeTab === 'all')           return true;
    if (activeTab === 'announcements') return post.type === 'announcement';
    if (activeTab === 'polls')         return post.type === 'poll';
    return true;
  });

  return (
    <View>
      <View style={feedStyles.tabRow}>
        {FEED_TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[feedStyles.tab, activeTab === tab.key && feedStyles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Ionicons
              name={tab.icon}
              size={16}
              color={activeTab === tab.key ? '#fff' : '#9ca3af'}
              style={{ marginRight: 6 }}
            />
            <Text style={[feedStyles.tabText, activeTab === tab.key && feedStyles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading && (
        <View style={{ paddingVertical: 40, alignItems: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.green} />
          <Text style={{ color: COLORS.textMuted, marginTop: 12, fontSize: 13 }}>Loading posts…</Text>
        </View>
      )}

      {isError && (
        <View style={{ paddingVertical: 32, alignItems: 'center', paddingHorizontal: 24 }}>
          <Ionicons name="cloud-offline-outline" size={32} color={COLORS.textMuted} />
          <Text style={{ color: COLORS.textMuted, marginTop: 12, fontSize: 13, textAlign: 'center' }}>
            Could not load posts.{'\n'}{(error as Error)?.message ?? 'Please try again.'}
          </Text>
        </View>
      )}

      {!isLoading && !isError && filteredPosts.length === 0 && (
        <View style={{ paddingVertical: 40, alignItems: 'center' }}>
          <Ionicons name="file-tray-outline" size={32} color={COLORS.textMuted} />
          <Text style={{ color: COLORS.textMuted, marginTop: 12, fontSize: 13 }}>No posts yet.</Text>
        </View>
      )}

      {!isLoading && !isError && filteredPosts.map(post => (
        <PostCard key={post.id} post={post} userId={userId} />
      ))}
    </View>
  );
};

// =============================================================================
// MAIN SCREEN
// The live results section is gated behind show_live_results from SystemSettings.
// =============================================================================

type SectionKey = 'countdown' | 'live' | 'feed';
const SECTIONS: { type: SectionKey }[] = [
  { type: 'countdown' },
  { type: 'live' },
  { type: 'feed' },
];

export default function DashboardScreen() {
  const [userId, setUserId]         = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshKey, setRefreshKey]     = useState(0);
  const { settings, isLoading: settingsLoading } = useSettings();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Bump refreshKey to force child hooks to re-mount and re-fetch
    setRefreshKey(k => k + 1);
    // Small delay so the spinner feels intentional
    await new Promise(res => setTimeout(res, 800));
    setIsRefreshing(false);
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserId(session?.user?.id ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const renderSection = ({ item }: { item: { type: SectionKey } }) => {
    switch (item.type) {
      case 'countdown':
        return <VotingCountdown />;

      case 'live':
        // Hide the whole section if admin has disabled live results
        if (settings !== null && settings.show_live_results === false) return null;
        return (
          <>
            <Text style={[shared.sectionTitle, { marginBottom: 12 }]}>Live Voting</Text>
            <LiveVotingBoard />
          </>
        );

      case 'feed':
        return (
          <View style={{ marginTop: 8 }}>
            <AnnouncementFeed userId={userId} />
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={screenStyles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
      <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
        <View style={screenStyles.header}>
          <View>
            <Text style={screenStyles.headerLogoText}>AnimoQuorum</Text>
            <Text style={screenStyles.headerSub}>DLSL COMELEC · SY 2025–2026</Text>
          </View>
          <View style={screenStyles.profileHeader}>
            <TouchableOpacity
              onPress={handleRefresh}
              disabled={isRefreshing}
              style={{ marginRight: 12, padding: 4 }}
            >
              {isRefreshing
                ? <ActivityIndicator size={18} color={COLORS.green} />
                : <Ionicons name="refresh-outline" size={20} color={COLORS.green} />
              }
            </TouchableOpacity>
            <Ionicons name="person-circle-outline" size={22} color="#fff" />
            <Text style={screenStyles.profileBtn}>LightOrDark</Text>
          </View>
        </View>
        <FlatList
          key={refreshKey}
          data={SECTIONS}
          keyExtractor={item => item.type}
          renderItem={renderSection}
          showsVerticalScrollIndicator={false}
          style={{ flex: 1, backgroundColor: COLORS.bg }}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[screenStyles.scrollContent, { flexGrow: 1, paddingBottom: 0 }]}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={COLORS.green}
              colors={[COLORS.green]}
            />
          }
        />
      </View>
    </SafeAreaView>
  );
}

export { DashboardScreen };