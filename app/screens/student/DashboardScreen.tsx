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
import { usePollResponses, useSubmitPollResponse } from '../../hooks/usePollResponses';
import { useLiveResults, LivePosition } from '../../hooks/useLiveResults';
import { useSettings, VotingStatus } from '../../hooks/useSettings';
import { supabase } from '../../utils/supabase';

// =============================================================================
// TYPES
// =============================================================================

interface Comment {
  id: string;
  user: string;
  initials: string;
  text: string;
}

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
// SECTION 2 — LIVE VOTING BOARD
// Hidden entirely when show_live_results = false.
// =============================================================================

const LiveVotingBoard: React.FC = () => {
  const { positions, isLoading, isError, error } = useLiveResults();
  const [activePositionId, setActivePositionId]  = useState<string | null>(null);

  useEffect(() => {
    if (positions.length > 0 && activePositionId === null) {
      setActivePositionId(positions[0].id);
    }
  }, [positions]);

  const activePosition: LivePosition | undefined =
    positions.find(p => p.id === activePositionId) ?? positions[0];

  if (isLoading) {
    return (
      <View style={[shared.card, { padding: 24, alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.green} />
        <Text style={{ color: COLORS.textMuted, marginTop: 12, fontSize: 13 }}>
          Loading live results…
        </Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={[shared.card, { padding: 24, alignItems: 'center' }]}>
        <Ionicons name="cloud-offline-outline" size={28} color={COLORS.textMuted} />
        <Text style={{ color: COLORS.textMuted, marginTop: 10, fontSize: 13, textAlign: 'center' }}>
          {error ?? 'Could not load live results.'}
        </Text>
      </View>
    );
  }

  if (positions.length === 0 || !activePosition) {
    return (
      <View style={[shared.card, { padding: 24, alignItems: 'center' }]}>
        <Ionicons name="people-outline" size={28} color={COLORS.textMuted} />
        <Text style={{ color: COLORS.textMuted, marginTop: 10, fontSize: 13 }}>
          No positions available yet.
        </Text>
      </View>
    );
  }

  const topVotes   = activePosition.candidates[0]?.votes ?? 1;
  const totalVotes = activePosition.totalVotes;

  return (
    <View style={[shared.card, { padding: 0, overflow: 'hidden' }]}>
      <View style={{ padding: 16, paddingBottom: 0 }}>
        <View style={liveStyles.headerRow}>
          <Text style={shared.sectionTitle}>Live Results</Text>
          <View style={liveStyles.livePill}>
            <View style={liveStyles.liveDot} />
            <Text style={liveStyles.livePillText}>LIVE</Text>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          <View style={liveStyles.positionScroll}>
            {positions.map(pos => (
              <TouchableOpacity
                key={pos.id}
                style={[
                  liveStyles.positionTab,
                  activePositionId === pos.id && liveStyles.positionTabActive,
                ]}
                onPress={() => setActivePositionId(pos.id)}
              >
                <Text style={[
                  liveStyles.positionTabText,
                  activePositionId === pos.id && liveStyles.positionTabTextActive,
                ]}>
                  {pos.position_name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
        {activePosition.candidates.length === 0 ? (
          <Text style={{ color: COLORS.textMuted, fontSize: 13, paddingVertical: 12 }}>
            No candidates for this position yet.
          </Text>
        ) : (
          activePosition.candidates.map((candidate, idx) => {
            const isLeading   = idx === 0 && candidate.votes > 0;
            const barWidthPct = topVotes > 0 ? Math.round((candidate.votes / topVotes) * 100) : 0;
            const sharePct    = totalVotes > 0 ? Math.round((candidate.votes / totalVotes) * 100) : 0;

            const avatarColors = ['#16A34A', '#1D4ED8', '#7C3AED', '#B45309', '#0891B2', '#DC2626'];
            const colorIndex   = candidate.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % avatarColors.length;
            const avatarColor  = avatarColors[colorIndex];
            const initials     = toInitials(candidate.name);

            return (
              <View key={candidate.id} style={liveStyles.candidateRow}>
                <View style={liveStyles.rank}>
                  <Text style={[liveStyles.rankText, isLeading && liveStyles.rankFirst]}>
                    {isLeading ? '1st' : `#${idx + 1}`}
                  </Text>
                </View>
                <View style={[
                  liveStyles.candidateAvatar,
                  { backgroundColor: avatarColor + '22' },
                  isLeading && liveStyles.candidateAvatarLead,
                ]}>
                  <Text style={liveStyles.candidateAvatarText}>{initials}</Text>
                </View>
                <View style={liveStyles.candidateInfo}>
                  <Text style={liveStyles.candidateName} numberOfLines={1}>{candidate.name}</Text>
                  {candidate.partylist ? (
                    <Text style={{ fontSize: 10, color: COLORS.textMuted, marginBottom: 4 }}>
                      {candidate.partylist}
                    </Text>
                  ) : null}
                  <View style={liveStyles.candidateBarTrack}>
                    <View style={[
                      liveStyles.candidateBarFill,
                      { width: `${barWidthPct}%` },
                      isLeading && liveStyles.candidateBarFillLead,
                    ]} />
                  </View>
                </View>
                <View style={liveStyles.candidateVotes}>
                  <Text style={liveStyles.candidateVoteCount}>{candidate.votes.toLocaleString()}</Text>
                  <Text style={[liveStyles.candidateVotePct, isLeading && liveStyles.candidateVotePctLead]}>
                    {sharePct}%
                  </Text>
                </View>
              </View>
            );
          })
        )}
        <Text style={liveStyles.totalVotes}>
          {totalVotes.toLocaleString()} valid vote{totalVotes !== 1 ? 's' : ''} cast
        </Text>
      </View>
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

const PostCard: React.FC<{ post: RawPost; userId: string | null }> = ({ post, userId }) => {
  const [liked, setLiked]                     = useState(false);
  const [commentsVisible, setCommentsVisible] = useState(false);
  const [comments, setComments]               = useState<Comment[]>([]);
  const [draftComment, setDraftComment]       = useState('');

  const authorLabel    = 'DLSL COMELEC';
  const authorInitials = toInitials(authorLabel);
  const roleLabel      = 'Official';

  const handleSubmitComment = () => {
    const trimmed = draftComment.trim();
    if (!trimmed) return;
    setComments(prev => [...prev, { id: Date.now().toString(), user: 'You', initials: 'YO', text: trimmed }]);
    setDraftComment('');
  };

  return (
    <View style={feedStyles.postCard}>
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

      <View style={feedStyles.postActions}>
        <TouchableOpacity style={feedStyles.postAction} onPress={() => setLiked(v => !v)}>
          <Ionicons name={liked ? 'heart' : 'heart-outline'} size={18} color={liked ? '#22c55e' : '#ffffff'} />
          <Text style={feedStyles.postActionText}>{liked ? 1 : 0}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={feedStyles.postAction} onPress={() => setCommentsVisible(v => !v)}>
          <Ionicons name="chatbubble-outline" size={18} color="#ffffff" />
          <Text style={feedStyles.postActionText}>{comments.length} Comments</Text>
        </TouchableOpacity>
      </View>

      {commentsVisible && (
        <View style={feedStyles.commentSection}>
          {comments.map(c => (
            <View key={c.id} style={feedStyles.comment}>
              <View style={feedStyles.commentAvatar}>
                <Text style={feedStyles.commentAvatarText}>{c.initials}</Text>
              </View>
              <View style={feedStyles.commentBubble}>
                <Text style={feedStyles.commentUser}>{c.user}</Text>
                <Text style={feedStyles.commentText}>{c.text}</Text>
              </View>
            </View>
          ))}
          <View style={feedStyles.commentInput}>
            <View style={feedStyles.commentAvatar}>
              <Text style={feedStyles.commentAvatarText}>YO</Text>
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
            <TouchableOpacity style={feedStyles.commentSendBtn} onPress={handleSubmitComment}>
              <Text style={{ fontSize: 14 }}>↑</Text>
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