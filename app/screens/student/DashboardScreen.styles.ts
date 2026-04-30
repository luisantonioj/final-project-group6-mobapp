import { StyleSheet } from 'react-native';
import { T } from '../../theme';

// ─── Design Tokens ───────────────────────────────────────────────────────────
export const COLORS = {
  bg:           T.bg,
  bgCard:       T.surface,
  bgElevated:   T.surface2,
  border:       T.border,
  borderBright: 'rgba(27,98,53,0.22)',
  green:        T.green,
  greenDim:     T.greenBright,
  greenFaint:   T.greenLight,
  greenGlow:    T.greenLight,
  greenGlow2:   'rgba(27,98,53,0.04)',
  text:         T.text,
  textMuted:    T.textMuted,
  textSub:      T.textSub,
  red:          T.red,
  redFaint:     T.redGlow,
  whiteFaint:   T.surface2,
  amber:        T.amber,
  white:        T.surface,
};

export const FONT = {
  xs: 10,
  sm: 12,
  base: 14,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  display: 30,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
};

export const SPACE = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
};

// ─── Shared / Utility Styles ─────────────────────────────────────────────────
export const shared = StyleSheet.create({
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACE.base,
    marginBottom: SPACE.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: FONT.xs,
    fontWeight: '700',
    letterSpacing: 2,
    color: COLORS.green,
    textTransform: 'uppercase',
    marginBottom: SPACE.sm,
  },
  badge: {
    paddingHorizontal: SPACE.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: FONT.xs,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spaceBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});

// ─── Screen ──────────────────────────────────────────────────────────────────
export const screenStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACE.base,
    paddingTop: SPACE.lg,
    paddingBottom: SPACE.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerLogoText: {
    fontSize: FONT.lg,
    fontWeight: '800',
    color: COLORS.green,
    letterSpacing: 1,
  },
  headerSub: {
    fontSize: FONT.xs,
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },
  headerLive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.redFaint,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACE.sm,
    paddingVertical: 4,
  },
  headerLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.red,
  },
  headerLiveText: {
    fontSize: FONT.xs,
    fontWeight: '700',
    color: COLORS.red,
    letterSpacing: 1,
  },
  profileBtn: {
    fontSize: FONT.xs,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: 1,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.whiteFaint,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACE.sm,
    paddingVertical: 4,
  },
  scrollContent: {
    paddingHorizontal: SPACE.base,
    paddingTop: SPACE.lg,
    paddingBottom: 100,
  },
});

// ─── Countdown ───────────────────────────────────────────────────────────────
export const countdownStyles = StyleSheet.create({
  wrapper: {
    backgroundColor: COLORS.bgElevated,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderBright,
    padding: SPACE.base,
    marginBottom: SPACE.md,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  glowBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: COLORS.green,
  },
  label: {
    fontSize: FONT.xs,
    fontWeight: '700',
    letterSpacing: 2,
    color: COLORS.green,
    textTransform: 'uppercase',
    marginBottom: SPACE.md,
  },
  timerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACE.xs,
    marginBottom: SPACE.base,
  },
  timeBlock: {
    alignItems: 'center',
    flex: 1,
  },
  timeValue: {
    fontSize: FONT.display,
    fontWeight: '800',
    color: COLORS.text,
    lineHeight: 34,
  },
  timeUnit: {
    fontSize: FONT.xs,
    color: COLORS.textMuted,
    fontWeight: '600',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  timeSeparator: {
    fontSize: FONT.display,
    fontWeight: '300',
    color: COLORS.green,
    lineHeight: 34,
    opacity: 0.5,
    marginTop: 2,
  },
  progressTrack: {
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: RADIUS.pill,
    overflow: 'hidden',
  },
  progressBar: {
    height: 4,
    backgroundColor: COLORS.green,
    borderRadius: RADIUS.pill,
  },
  subText: {
    fontSize: FONT.xs,
    color: COLORS.textMuted,
    marginTop: SPACE.xs,
    textAlign: 'center',
  },
});

// ─── Feed / Announcements ─────────────────────────────────────────────────────
export const feedStyles = StyleSheet.create({
  tabRow: {
    flexDirection: 'row',
    gap: SPACE.sm,
    marginBottom: SPACE.md,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: COLORS.bgElevated,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tabActive: {
    backgroundColor: COLORS.greenFaint,
    borderColor: COLORS.borderBright,
  },
  tabText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '500',
  },
  tabTextActive: {
    color: COLORS.green,
    fontWeight: '700',
  },
  postCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACE.base,
    marginBottom: SPACE.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACE.sm,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.greenFaint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACE.sm,
    borderWidth: 1,
    borderColor: COLORS.borderBright,
  },
  avatarText: {
    fontSize: FONT.sm,
    fontWeight: '700',
    color: COLORS.green,
  },
  postMeta: {
    flex: 1,
  },
  postAuthor: {
    fontSize: FONT.base,
    fontWeight: '700',
    color: COLORS.text,
  },
  postTime: {
    fontSize: FONT.xs,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  postTitle: {
    fontSize: FONT.md,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACE.xs,
    lineHeight: 22,
  },
  postBody: {
    fontSize: FONT.base,
    color: COLORS.textSub,
    lineHeight: 20,
    marginBottom: SPACE.md,
  },
  postActions: {
    flexDirection: 'row',
    gap: SPACE.base,
    paddingTop: SPACE.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  postAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  postActionText: {
    fontSize: FONT.xs,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  // Poll styles
  pollOption: {
    marginBottom: SPACE.sm,
  },
  pollOptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  pollOptionLabel: {
    fontSize: FONT.sm,
    color: COLORS.textSub,
    fontWeight: '600',
  },
  pollOptionPct: {
    fontSize: FONT.sm,
    color: COLORS.green,
    fontWeight: '700',
  },
  pollTrack: {
    height: 6,
    backgroundColor: COLORS.bgElevated,
    borderRadius: RADIUS.pill,
    overflow: 'hidden',
  },
  pollFill: {
    height: 6,
    backgroundColor: COLORS.green,
    borderRadius: RADIUS.pill,
  },
  pollFillLead: {
    backgroundColor: COLORS.green,
  },
  // Comments
  commentSection: {
    marginTop: SPACE.sm,
    gap: SPACE.sm,
  },
  commentInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
    marginTop: SPACE.xs,
  },
  commentInputBox: {
    flex: 1,
    backgroundColor: COLORS.bgElevated,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACE.md,
    paddingVertical: SPACE.xs + 2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  commentInputText: {
    fontSize: FONT.sm,
    color: COLORS.textMuted,
  },
  commentSendBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  comment: {
    flexDirection: 'row',
    gap: SPACE.sm,
  },
  commentAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentAvatarText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSub,
  },
  commentBubble: {
    flex: 1,
    backgroundColor: COLORS.bgElevated,
    borderRadius: RADIUS.md,
    padding: SPACE.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  commentUser: {
    fontSize: FONT.xs,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  commentText: {
    fontSize: FONT.xs,
    color: COLORS.textSub,
    lineHeight: 16,
  },
  commentUserText: {
    fontSize: FONT.xs,
    color: COLORS.text,
  },
});

// ─── Live Voting Board ────────────────────────────────────────────────────────
export const liveStyles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACE.md,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.redFaint,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACE.sm,
    paddingVertical: 3,
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.red,
  },
  livePillText: {
    fontSize: FONT.xs,
    fontWeight: '700',
    color: COLORS.red,
    letterSpacing: 1,
  },
  positionLabel: {
    fontSize: FONT.xs,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: SPACE.sm,
    marginTop: SPACE.md,
  },
  candidateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACE.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACE.sm,
  },
  rank: {
    width: 22,
    alignItems: 'center',
  },
  rankText: {
    fontSize: FONT.sm,
    fontWeight: '800',
    color: COLORS.textMuted,
  },
  rankFirst: {
    color: COLORS.green,
  },
  candidateAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  candidateAvatarLead: {
    borderColor: COLORS.green,
  },
  candidateAvatarText: {
    fontSize: FONT.sm,
    fontWeight: '800',
    color: COLORS.text,
  },
  candidateInfo: {
    flex: 1,
  },
  candidateName: {
    fontSize: FONT.base,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 3,
  },
  candidateBarTrack: {
    height: 5,
    backgroundColor: COLORS.bgElevated,
    borderRadius: RADIUS.pill,
    overflow: 'hidden',
  },
  candidateBarFill: {
    height: 5,
    backgroundColor: COLORS.borderBright,
    borderRadius: RADIUS.pill,
  },
  candidateBarFillLead: {
    backgroundColor: COLORS.green,
  },
  candidateVotes: {
    alignItems: 'flex-end',
    minWidth: 50,
  },
  candidateVoteCount: {
    fontSize: FONT.md,
    fontWeight: '800',
    color: COLORS.text,
  },
  candidateVotePct: {
    fontSize: FONT.xs,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  candidateVotePctLead: {
    color: COLORS.green,
  },
  totalVotes: {
    textAlign: 'center',
    fontSize: FONT.xs,
    color: COLORS.textMuted,
    marginTop: SPACE.sm,
  },
  positionScroll: {
    flexDirection: 'row',
    gap: SPACE.sm,
    marginBottom: SPACE.md,
  },
  positionTab: {
    paddingHorizontal: SPACE.md,
    paddingVertical: SPACE.xs + 2,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  positionTabActive: {
    backgroundColor: COLORS.greenFaint,
    borderColor: COLORS.borderBright,
  },
  positionTabText: {
    fontSize: FONT.xs,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },
  positionTabTextActive: {
    color: COLORS.green,
  },
});