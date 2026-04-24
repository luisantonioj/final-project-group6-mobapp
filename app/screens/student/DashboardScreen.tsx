/**
 * FeedScreen.tsx — Student home screen (FeedList route)
 * ─────────────────────────────────────────────────────────────────────────────
 * This is the first screen students see after login. It contains three
 * sections rendered as a FlatList so everything scrolls together:
 *
 *   1. VotingCountdown  — live ticking timer with progress bar
 *   2. LiveVotingBoard  — PBB-style leaderboard per position (tabs to switch)
 *   3. AnnouncementFeed — filterable list of posts + polls with comments
 *
 * CURRENT STATE:
 *   All data is hardcoded in DUMMY_FEED and DUMMY_POSITIONS constants.
 *   The comments + like counts are local state only.
 *
 * BACKEND INTEGRATION (replace each DUMMY_* with a real hook):
 * ─────────────────────────────────────────────────────────────────────────────
 *   Posts / Polls:    const { data: posts } = usePosts();
 *                     → app/hooks/usePosts.ts
 *
 *   Live Results:     const { data: results } = useLiveResults();
 *                     → app/hooks/useVotes.ts (polls every 10s)
 *                     → Only works when SystemSettings.show_live_results = true
 *
 *   Countdown end time: const { data: settings } = useSettings();
 *                     → app/hooks/useSettings.ts
 *
 *   Comments (submit): const { mutate: submitComment } = useCreateComment();
 *                     → app/hooks/useComments.ts (TODO: not yet implemented)
 *
 *   Voting timer:     Replace the hardcoded 12h32m09s initial value and the
 *                     end-date text with values from SystemSettings.
 *
 * NAVIGATION TO OTHER SCREENS:
 * ─────────────────────────────────────────────────────────────────────────────
 *   Post detail:      navigation.navigate('PostDetail', { postId: post.id })
 *   Candidate modal:  navigation.navigate('CandidateProfile', { candidateId })
 *   Both are push screens within the FeedStack (see StudentNavigator.tsx).
 * ─────────────────────────────────────────────────────────────────────────────
 */

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
  Keyboard,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
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

// =============================================================================
// TYPES
// =============================================================================

interface Comment {
  id: string;
  user: string;
  initials: string;
  text: string;
}

interface Post {
  id: string;
  type: 'announcement' | 'poll';
  author: string;
  authorInitials: string;
  role: string;
  time: string;
  title: string;
  body: string;
  likes: number;
  comments: Comment[];
  pollOptions?: { label: string; votes: number }[];
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
// DUMMY DATA — remove and replace with real Supabase queries upon integration
// =============================================================================

const DUMMY_FEED: Post[] = [
  {
    id: '1',
    type: 'announcement',
    author: 'DLSL COMELEC',
    authorInitials: 'CO',
    role: 'Official',
    time: '2h ago',
    title: 'Voting Opens Tomorrow at 8:00 AM',
    body: 'Remind all registered voters to bring their school ID. Voting booths will be located at the gymnasium and student center. Cast your vote wisely!',
    likes: 142,
    comments: [
      { id: 'c1', user: 'Juan D.', initials: 'JD', text: 'Will there be a mobile voting option this year?' },
      { id: 'c2', user: 'Maria S.', initials: 'MS', text: "Finally! Can't wait to vote." },
    ],
  },
  {
    id: '2',
    type: 'poll',
    author: 'DLSL COMELEC',
    authorInitials: 'CO',
    role: 'Official',
    time: '5h ago',
    title: 'Which platform do you prefer for Miting de Avance?',
    body: '',
    likes: 88,
    comments: [
      { id: 'c3', user: 'Carlo R.', initials: 'CR', text: 'Online is more accessible for everyone!' },
    ],
    pollOptions: [
      { label: 'In-Person', votes: 312 },
      { label: 'Online (Zoom)', votes: 198 },
      { label: 'Hybrid', votes: 276 },
    ],
  },
  {
    id: '3',
    type: 'announcement',
    author: 'Student Affairs',
    authorInitials: 'SA',
    role: 'Admin',
    time: '1d ago',
    title: 'Candidate Verification Completed',
    body: "All 14 candidates have been verified and cleared to run in this year's election. Full candidate profiles are available in the Candidates tab.",
    likes: 61,
    comments: [],
  },
];

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
// SECTION 1 — VOTING COUNTDOWN
// Live ticking timer with a progress bar showing how far into the voting
// window we currently are. Both values will come from the backend later.
// =============================================================================

const VotingCountdown: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState({ h: 12, m: 32, s: 9 });

  // Decrement the clock by one second on each tick
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
      {/* Green accent line at the top of the card */}
      <View style={countdownStyles.glowBar} />

      <Text style={countdownStyles.label}>⏱ Voting Closes In</Text>

      {/* HH : MM : SS */}
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

      {/* Progress bar — hardcoded to 62% until backend supplies elapsed/total */}
      <View style={countdownStyles.progressTrack}>
        <Animated.View style={[countdownStyles.progressBar, { width: '62%' }]} />
      </View>

      <Text style={countdownStyles.subText}>April 10, 2026 · Closes at 5:00 PM</Text>
    </View>
  );
};

// =============================================================================
// SECTION 2 — LIVE VOTING BOARD
// PBB-style ranked leaderboard per position. Switch positions via the tab
// strip. Bar widths are relative to the leading candidate, not total votes.
// =============================================================================

const LiveVotingBoard: React.FC = () => {
  const [activePositionId, setActivePositionId] = useState('pres');

  const position = DUMMY_POSITIONS.find(p => p.id === activePositionId)!;
  // Sort descending so rank 1 is always at the top
  const sortedCandidates = [...position.candidates].sort((a, b) => b.votes - a.votes);
  const topVotes  = sortedCandidates[0]?.votes ?? 1;
  const totalVotes = sortedCandidates.reduce((sum, c) => sum + c.votes, 0);

  return (
    <View style={[shared.card, { padding: 0, overflow: 'hidden' }]}>

      <View style={{ padding: 16, paddingBottom: 0 }}>
        {/* Header */}
        <View style={liveStyles.headerRow}>
          <Text style={shared.sectionTitle}>Live Results</Text>
          <View style={liveStyles.livePill}>
            <View style={liveStyles.liveDot} />
            <Text style={liveStyles.livePillText}>LIVE</Text>
          </View>
        </View>

        {/* Position selector tabs */}
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

      {/* Candidate rows */}
      <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
        {sortedCandidates.map((candidate, idx) => {
          const isLeading   = idx === 0;
          const barWidthPct = Math.round((candidate.votes / topVotes) * 100);
          const sharePct    = Math.round((candidate.votes / totalVotes) * 100);

          return (
            <View key={candidate.id} style={liveStyles.candidateRow}>
              {/* Rank */}
              <View style={liveStyles.rank}>
                <Text style={[liveStyles.rankText, isLeading && liveStyles.rankFirst]}>
                  {isLeading ? '1st' : `#${idx + 1}`}
                </Text>
              </View>

              {/* Avatar (initials until real photos are available) */}
              <View style={[
                liveStyles.candidateAvatar,
                { backgroundColor: candidate.color + '22' },
                isLeading && liveStyles.candidateAvatarLead,
              ]}>
                <Text style={liveStyles.candidateAvatarText}>{candidate.initials}</Text>
              </View>

              {/* Name + relative vote bar */}
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

              {/* Vote count + percentage of total */}
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
// SECTION 3 — ANNOUNCEMENT / POLL FEED
// Filterable list of posts (notices and polls). Each post supports likes and
// an expandable comment thread where the user can submit new comments.
// =============================================================================

// ─── Single poll option bar ───────────────────────────────────────────────────

const PollOptionBar: React.FC<{
  option: { label: string; votes: number };
  total: number;
  isLeading: boolean;
}> = ({ option, total, isLeading }) => {
  const pct = Math.round((option.votes / total) * 100);
  return (
    <View style={feedStyles.pollOption}>
      <View style={feedStyles.pollOptionHeader}>
        <Text style={feedStyles.pollOptionLabel}>{option.label}</Text>
        <Text style={feedStyles.pollOptionPct}>{pct}%</Text>
      </View>
      <View style={feedStyles.pollTrack}>
        <View style={[feedStyles.pollFill, { width: `${pct}%` }, isLeading && feedStyles.pollFillLead]} />
      </View>
    </View>
  );
};

// ─── Post card (announcement or poll) ────────────────────────────────────────

const PostCard: React.FC<{ post: Post }> = ({ post }) => {
  const [liked, setLiked]                   = useState(false);
  const [commentsVisible, setCommentsVisible] = useState(false);
  const [comments, setComments]             = useState<Comment[]>(post.comments);
  const [draftComment, setDraftComment]     = useState('');

  const totalPollVotes = post.pollOptions?.reduce((sum, o) => sum + o.votes, 0) ?? 0;
  const maxPollVotes   = Math.max(...(post.pollOptions?.map(o => o.votes) ?? [0]));

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

      {/* ── Author info + badge ── */}
      <View style={feedStyles.postHeader}>
        <View style={feedStyles.avatar}>
          <Text style={feedStyles.avatarText}>{post.authorInitials}</Text>
        </View>
        <View style={feedStyles.postMeta}>
          <Text style={feedStyles.postAuthor}>{post.author}</Text>
          <Text style={feedStyles.postTime}>{post.role} · {post.time}</Text>
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

      {/* ── Title ── */}
      {post.title ? <Text style={feedStyles.postTitle}>{post.title}</Text> : null}

      {/* ── Announcement body ── */}
      {post.type === 'announcement' && post.body
        ? <Text style={feedStyles.postBody}>{post.body}</Text>
        : null}

      {/* ── Poll bars ── */}
      {post.type === 'poll' && post.pollOptions ? (
        <View style={{ marginBottom: 16 }}>
          {post.pollOptions.map(opt => (
            <PollOptionBar
              key={opt.label}
              option={opt}
              total={totalPollVotes}
              isLeading={opt.votes === maxPollVotes}
            />
          ))}
          <Text style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 4 }}>
            {totalPollVotes} total responses
          </Text>
        </View>
      ) : null}

      {/* ── Like & comment buttons ── */}
      <View style={feedStyles.postActions}>

  {/* LIKE BUTTON */}
      <TouchableOpacity
        style={feedStyles.postAction}
        onPress={() => setLiked(v => !v)}
      >
        <Ionicons
          name={liked ? 'heart' : 'heart-outline'}
          size={18}
          color={liked ? '#22c55e' : '#ffffff'}
        />

        <Text style={feedStyles.postActionText}>
          {post.likes + (liked ? 1 : 0)}
        </Text>
      </TouchableOpacity>

      {/* COMMENT BUTTON */}
      <TouchableOpacity
        style={feedStyles.postAction}
        onPress={() => setCommentsVisible(v => !v)}
      >
        <Ionicons name="chatbubble-outline" size={18} color="#ffffff" />

        <Text style={feedStyles.postActionText}>
          {comments.length} Comments
        </Text>
      </TouchableOpacity>

</View>

      {/* ── Expandable comment thread ── */}
      {commentsVisible && (
        <View style={feedStyles.commentSection}>
          {/* Existing comments */}
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

          {/* New comment input row */}
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

// ─── Feed container with filter tabs ─────────────────────────────────────────

type FeedTab = 'all' | 'announcements' | 'polls';

const FEED_TABS: { key: FeedTab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'all', label: 'All', icon: 'layers-outline' },
  { key: 'announcements', label: 'Notices', icon: 'megaphone-outline' },
  { key: 'polls', label: 'Polls', icon: 'bar-chart-outline' },
];

const AnnouncementFeed: React.FC = () => {
  const [activeTab, setActiveTab] = useState<FeedTab>('all');

  const filteredPosts = DUMMY_FEED.filter(post => {
    if (activeTab === 'all')           return true;
    if (activeTab === 'announcements') return post.type === 'announcement';
    if (activeTab === 'polls')         return post.type === 'poll';
    return true;
  });

  return (
    <View>
      {/* Tabs */}
      <View style={feedStyles.tabRow}>
        {FEED_TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[
              feedStyles.tab,
              activeTab === tab.key && feedStyles.tabActive,
            ]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Ionicons
              name={tab.icon}
              size={16}
              color={activeTab === tab.key ? '#fff' : '#9ca3af'}
              style={{ marginRight: 6 }}
            />

            <Text
              style={[
                feedStyles.tabText,
                activeTab === tab.key && feedStyles.tabTextActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Posts (THIS WAS MISSING) */}
      <View>
        {filteredPosts.map(post => (
          <PostCard key={post.id} post={post} />
        ))}
      </View>
    </View>
  );
};

// =============================================================================
// MAIN SCREEN
// Root FlatList drives all scrolling so everything moves together.
// KeyboardAvoidingView lifts the comment input above the keyboard on iOS/Android.
// =============================================================================

type SectionKey = 'countdown' | 'live' | 'feed';

const SECTIONS: { type: SectionKey }[] = [
  { type: 'countdown' },
  { type: 'live' },
  { type: 'feed' },
];

const renderSection = ({ item }: { item: { type: SectionKey } }) => {
  switch (item.type) {
    case 'countdown':
      return <VotingCountdown />;
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
          <AnnouncementFeed />
        </View>
      );
    default:
      return null;
  }
};

export default function DashboardScreen() {
  return (
    <SafeAreaView style={screenStyles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: COLORS.bg }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
          <View style={{ flex: 1, backgroundColor: COLORS.bg }}>

            {/* ── App header ── */}
            <View style={screenStyles.header}>
              <View>
                <Text style={screenStyles.headerLogoText}>AnimoQuorum</Text>
                <Text style={screenStyles.headerSub}>DLSL COMELEC · SY 2025–2026</Text>
              </View>
              {/* TODO: replace with a real profile/avatar button */}
              <View style={screenStyles.profileHeader}>
                <Ionicons name="person-circle-outline" size={22} color="#fff" />
                <Text style={screenStyles.profileBtn}>Profile</Text>
              </View>
            </View>

            {/* ── Scrollable body ── */}
            <FlatList
              data={SECTIONS}
              keyExtractor={item => item.type}
              renderItem={renderSection}
              showsVerticalScrollIndicator={false}
              style={{ flex: 1, backgroundColor: COLORS.bg }}
              keyboardDismissMode='on-drag'
              keyboardShouldPersistTaps='handled'
              contentContainerStyle={[
                screenStyles.scrollContent,
                { flexGrow: 1, paddingBottom: 0 },
              ]}
            />

          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export { DashboardScreen };