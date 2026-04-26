<<<<<<< Updated upstream:app/screens/DashboardScreen/DashboardScreen.tsx
=======
/**
 * FeedScreen.tsx — Student home screen (FeedList route)
 * ─────────────────────────────────────────────────────────────────────────────
 * BACKEND STATUS:
 *   ✅ Posts / Announcements  → usePosts()
 *   ✅ Poll voting            → usePollResponses() + useSubmitPollResponse()
 *   🔲 Live vote results      → still uses DUMMY_POSITIONS (useVotes not ready)
 *   🔲 Voting countdown       → still hardcoded (useSettings not ready)
 *   🔲 Comments               → local state only (useCreateComment not ready)
 * ─────────────────────────────────────────────────────────────────────────────
 */

>>>>>>> Stashed changes:app/screens/student/DashboardScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  TextInput,
  Animated,
  StatusBar,
  Platform,
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

interface Candidate {
  id: string;
  name: string;
  initials: string;
  color: string;
  votes: number;
}

interface Position {
  id: string;
  label: string;
  candidates: Candidate[];
}

// =============================================================================
// DUMMY DATA — only kept for sections not yet connected to Supabase
// =============================================================================

const DUMMY_POSITIONS: Position[] = [
  {
    id: 'pres',
    label: 'President',
    candidates: [
      { id: 'p1', name: 'XXXX XXXXXXX', initials: 'L', color: '#16A34A', votes: 847 },
      { id: 'p2', name: 'XXXX XXXXXXX', initials: 'R', color: '#1D4ED8', votes: 612 },
      { id: 'p3', name: 'XXXX XXXXXXX', initials: 'M', color: '#7C3AED', votes: 389 },
      { id: 'p4', name: 'XXXX XXXXXXX', initials: 'Y', color: '#B45309', votes: 201 },
    ],
  },
  {
    id: 'vp',
    label: 'Vice Pres.',
    candidates: [
      { id: 'v1', name: 'XXXX XXXXXXX', initials: 'LS', color: '#0891B2', votes: 791 },
      { id: 'v2', name: 'XXXX XXXXXXX', initials: 'PG', color: '#16A34A', votes: 703 },
      { id: 'v3', name: 'XXXX XXXXXXX', initials: 'KL', color: '#B45309', votes: 422 },
    ],
  },
  {
    id: 'sec',
    label: 'Secretary',
    candidates: [
      { id: 's1', name: 'XXXX XXXXXXX', initials: 'BC', color: '#16A34A', votes: 654 },
      { id: 's2', name: 'XXXX XXXXXXX', initials: 'NF', color: '#7C3AED', votes: 498 },
      { id: 's3', name: 'XXXX XXXXXXX', initials: 'LM', color: '#B45309', votes: 311 },
    ],
  },
];

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

// =============================================================================
// SECTION 1 — VOTING COUNTDOWN
// =============================================================================

const VotingCountdown: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState({ h: 12, m: 32, s: 9 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        let { h, m, s } = prev;
        s -= 1;
        if (s < 0) { s = 59; m -= 1; }
        if (m < 0) { m = 59; h -= 1; }
        if (h < 0) return { h: 0, m: 0, s: 0 };
        return { h, m, s };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <View style={countdownStyles.wrapper}>
      <View style={countdownStyles.glowBar} />
      <Text style={countdownStyles.label}>⏱ Voting Closes In</Text>
      <View style={countdownStyles.timerRow}>
        <View style={countdownStyles.timeBlock}>
          <Text style={countdownStyles.timeValue}>{pad(timeLeft.h)}</Text>
          <Text style={countdownStyles.timeUnit}>Hrs</Text>
        </View>
        <Text style={countdownStyles.timeSeparator}>:</Text>
        <View style={countdownStyles.timeBlock}>
          <Text style={countdownStyles.timeValue}>{pad(timeLeft.m)}</Text>
          <Text style={countdownStyles.timeUnit}>Min</Text>
        </View>
        <Text style={countdownStyles.timeSeparator}>:</Text>
        <View style={countdownStyles.timeBlock}>
          <Text style={countdownStyles.timeValue}>{pad(timeLeft.s)}</Text>
          <Text style={countdownStyles.timeUnit}>Sec</Text>
        </View>
      </View>
      <View style={countdownStyles.progressTrack}>
        <Animated.View style={[countdownStyles.progressBar, { width: '62%' }]} />
      </View>
      <Text style={countdownStyles.subText}>April 10, 2026 · Closes at 5:00 PM</Text>
    </View>
  );
};

// =============================================================================
// SECTION 2 — LIVE VOTING BOARD
// =============================================================================

const LiveVotingBoard: React.FC = () => {
  const [activePositionId, setActivePositionId] = useState('pres');
  const position         = DUMMY_POSITIONS.find(p => p.id === activePositionId)!;
  const sortedCandidates = [...position.candidates].sort((a, b) => b.votes - a.votes);
  const topVotes         = sortedCandidates[0]?.votes ?? 1;
  const totalVotes       = sortedCandidates.reduce((sum, c) => sum + c.votes, 0);

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
            {DUMMY_POSITIONS.map(pos => (
              <TouchableOpacity
                key={pos.id}
                style={[liveStyles.positionTab, activePositionId === pos.id && liveStyles.positionTabActive]}
                onPress={() => setActivePositionId(pos.id)}
              >
                <Text style={[liveStyles.positionTabText, activePositionId === pos.id && liveStyles.positionTabTextActive]}>
                  {pos.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
      <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
        {sortedCandidates.map((candidate, idx) => {
          const isLeading   = idx === 0;
          const barWidthPct = Math.round((candidate.votes / topVotes) * 100);
          const sharePct    = Math.round((candidate.votes / totalVotes) * 100);
          return (
            <View key={candidate.id} style={liveStyles.candidateRow}>
              <View style={liveStyles.rank}>
                <Text style={[liveStyles.rankText, isLeading && liveStyles.rankFirst]}>
                  {isLeading ? '1st' : `#${idx + 1}`}
                </Text>
              </View>
              <View style={[
                liveStyles.candidateAvatar,
                { backgroundColor: candidate.color + '22' },
                isLeading && liveStyles.candidateAvatarLead,
              ]}>
                <Text style={liveStyles.candidateAvatarText}>{candidate.initials}</Text>
              </View>
              <View style={liveStyles.candidateInfo}>
                <Text style={liveStyles.candidateName}>{candidate.name}</Text>
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
        })}
        <Text style={liveStyles.totalVotes}>{totalVotes.toLocaleString()} total votes cast</Text>
      </View>
    </View>
  );
};

// =============================================================================
// POLL VOTER COMPONENT
// Before vote: tappable radio-button options
// After vote:  result bars with %, leading highlight, "your vote" checkmark
// =============================================================================

const PollVoter: React.FC<{ post: RawPost; userId: string | null }> = ({ post, userId }) => {
  const { data, isLoading, isError } = usePollResponses(post.id, userId);
  const { mutateAsync: submitVote, isPending: isSubmitting } = useSubmitPollResponse(post.id);
  const [pendingOptionId, setPendingOptionId] = useState<string | null>(null);

  const hasVoted   = data?.hasVoted   ?? false;
  const myOptionId = data?.myOptionId ?? pendingOptionId;
  const options    = data?.options    ?? [];
  const totalVotes = options.reduce((sum, o) => sum + o.responseCount, 0);
  const showResults = hasVoted || !!pendingOptionId;

  const handleVote = async (optionId: string) => {
    if (!userId) {
      Alert.alert('Not signed in', 'You must be signed in to vote.');
      return;
    }
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
                  <Text
                    style={[pStyles.resultLabel, isMyVote && { color: COLORS.green }]}
                    numberOfLines={1}
                  >
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
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: 11,
    paddingHorizontal: 14,
    marginBottom: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
  },
  optionRadio: {
    width: 16, height: 16, borderRadius: 8,
    borderWidth: 2, borderColor: COLORS.textMuted, marginRight: 10,
  },
  optionText: { color: '#fff', fontSize: 14, flex: 1 },
  resultRow: { marginBottom: 12 },
  resultHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 5,
  },
  resultLabel: { color: '#fff', fontSize: 13, fontWeight: '500' as const, flex: 1 },
  resultPct:   { color: COLORS.textMuted, fontSize: 13, fontWeight: '600' as const, marginLeft: 8 },
  barTrack: {
    height: 6, backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 4, overflow: 'hidden' as const, marginBottom: 4,
  },
  barFill: { height: 6, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.2)' },
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
    setComments(prev => [
      ...prev,
      { id: Date.now().toString(), user: 'You', initials: 'YO', text: trimmed },
    ]);
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
          <Text style={[shared.badgeText, {
            color: post.type === 'poll' ? COLORS.green : COLORS.textMuted,
          }]}>
            {post.type === 'poll' ? 'Poll' : 'Notice'}
          </Text>
        </View>
      </View>

      {post.title ? <Text style={feedStyles.postTitle}>{post.title}</Text> : null}

      {post.type === 'announcement' && post.content
        ? <Text style={feedStyles.postBody}>{post.content}</Text>
        : null}

      {post.type === 'poll'
        ? <PollVoter post={post} userId={userId} />
        : null}

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

      {!isLoading && !isError && (
        <View>
          {filteredPosts.map(post => (
            <PostCard key={post.id} post={post} userId={userId} />
          ))}
        </View>
      )}
    </View>
  );
};

// =============================================================================
// MAIN SCREEN
// =============================================================================

type SectionKey = 'countdown' | 'live' | 'feed';
const SECTIONS: { type: SectionKey }[] = [
  { type: 'countdown' },
  { type: 'live' },
  { type: 'feed' },
];

export default function DashboardScreen() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const renderSection = ({ item }: { item: { type: SectionKey } }) => {
    switch (item.type) {
      case 'countdown': return <VotingCountdown />;
      case 'live':
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
      default: return null;
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
            <Ionicons name="person-circle-outline" size={22} color="#fff" />
            <Text style={screenStyles.profileBtn}>LightOrDark</Text>
          </View>
        </View>
        <FlatList
          data={SECTIONS}
          keyExtractor={item => item.type}
          renderItem={renderSection}
          showsVerticalScrollIndicator={false}
          style={{ flex: 1, backgroundColor: COLORS.bg }}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[screenStyles.scrollContent, { flexGrow: 1, paddingBottom: 0 }]}
        />
      </View>
    </SafeAreaView>
  );
}