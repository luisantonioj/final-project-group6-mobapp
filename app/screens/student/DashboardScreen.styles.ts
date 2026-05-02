//app/screens/student/DashboardScreen.styles.ts
import { StyleSheet } from 'react-native';
import type { ThemeColors } from '../../theme';

export const FONT = {
  xs: 10, sm: 12, base: 14, md: 15, lg: 17, xl: 20, xxl: 24, display: 30,
};

export const RADIUS = {
  sm: 8, md: 12, lg: 16, xl: 20, pill: 999,
};

export const SPACE = {
  xs: 4, sm: 8, md: 12, base: 16, lg: 20, xl: 24, xxl: 32,
};

export function makeStyles(C: ThemeColors) {
  const shared = StyleSheet.create({
    card: {
      backgroundColor: C.surface,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: C.border,
      padding: SPACE.base,
      marginBottom: SPACE.md,
    },
    sectionTitle: {
      fontSize: FONT.xs,
      fontWeight: '700',
      letterSpacing: 2,
      color: C.green,
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

  const screen = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: C.bg,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: SPACE.base,
      paddingTop: SPACE.lg,
      paddingBottom: SPACE.md,
      borderBottomWidth: 1,
      borderBottomColor: C.border,
    },
    headerLogoText: {
      fontSize: FONT.lg,
      fontWeight: '800',
      color: C.green,
      letterSpacing: 1,
    },
    headerSub: {
      fontSize: FONT.xs,
      color: C.textMuted,
      letterSpacing: 0.5,
    },
    headerLive: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: C.redGlow,
      borderRadius: RADIUS.pill,
      paddingHorizontal: SPACE.sm,
      paddingVertical: 4,
    },
    headerLiveDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: C.red,
    },
    headerLiveText: {
      fontSize: FONT.xs,
      fontWeight: '700',
      color: C.red,
      letterSpacing: 1,
    },
    profileBtn: {
      fontSize: FONT.xs,
      fontWeight: '700',
      color: C.text,
      letterSpacing: 1,
    },
    profileHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: C.pill,
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

  const countdown = StyleSheet.create({
    wrapper: {
      backgroundColor: C.surface2,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: C.greenDim,
      padding: SPACE.base,
      marginBottom: SPACE.md,
      overflow: 'hidden',
    },
    glowBar: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 2,
      backgroundColor: C.green,
    },
    label: {
      fontSize: FONT.xs,
      fontWeight: '700',
      letterSpacing: 2,
      color: C.green,
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
      color: C.text,
      lineHeight: 34,
    },
    timeUnit: {
      fontSize: FONT.xs,
      color: C.textMuted,
      fontWeight: '600',
      letterSpacing: 1.5,
      textTransform: 'uppercase',
      marginTop: 2,
    },
    timeSeparator: {
      fontSize: FONT.display,
      fontWeight: '300',
      color: C.green,
      lineHeight: 34,
      opacity: 0.5,
      marginTop: 2,
    },
    progressTrack: {
      height: 4,
      backgroundColor: C.surface,
      borderRadius: RADIUS.pill,
      overflow: 'hidden',
    },
    progressBar: {
      height: 4,
      backgroundColor: C.green,
      borderRadius: RADIUS.pill,
    },
    subText: {
      fontSize: FONT.xs,
      color: C.textMuted,
      marginTop: SPACE.xs,
      textAlign: 'center',
    },
  });

  const feed = StyleSheet.create({
    tabRow: {
      flexDirection: 'row',
      gap: SPACE.sm,
      marginBottom: SPACE.md,
    },
    tab: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 20,
      backgroundColor: C.pill,
      marginRight: 8,
    },
    tabActive: {
      backgroundColor: C.greenLight,
    },
    tabText: {
      color: C.textMuted,
      fontSize: 13,
      fontWeight: '500',
    },
    tabTextActive: {
      color: C.text,
    },
    postCard: {
      backgroundColor: C.surface,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: C.border,
      padding: SPACE.base,
      marginBottom: SPACE.md,
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
      backgroundColor: C.greenLight,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: SPACE.sm,
      borderWidth: 1,
      borderColor: C.greenDim,
    },
    avatarText: {
      fontSize: FONT.sm,
      fontWeight: '700',
      color: C.green,
    },
    postMeta: {
      flex: 1,
    },
    postAuthor: {
      fontSize: FONT.base,
      fontWeight: '700',
      color: C.text,
    },
    postTime: {
      fontSize: FONT.xs,
      color: C.textMuted,
      marginTop: 1,
    },
    postTitle: {
      fontSize: FONT.md,
      fontWeight: '700',
      color: C.text,
      marginBottom: SPACE.xs,
      lineHeight: 22,
    },
    postBody: {
      fontSize: FONT.base,
      color: C.textSub,
      lineHeight: 20,
      marginBottom: SPACE.md,
    },
    postActions: {
      flexDirection: 'row',
      gap: SPACE.base,
      paddingTop: SPACE.sm,
      borderTopWidth: 1,
      borderTopColor: C.border,
    },
    postAction: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    postActionText: {
      fontSize: FONT.xs,
      color: C.textMuted,
      fontWeight: '600',
    },
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
      color: C.textSub,
      fontWeight: '600',
    },
    pollOptionPct: {
      fontSize: FONT.sm,
      color: C.green,
      fontWeight: '700',
    },
    pollTrack: {
      height: 6,
      backgroundColor: C.surface2,
      borderRadius: RADIUS.pill,
      overflow: 'hidden',
    },
    pollFill: {
      height: 6,
      backgroundColor: C.green,
      borderRadius: RADIUS.pill,
    },
    pollFillLead: {
      backgroundColor: C.green,
    },
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
      backgroundColor: C.surface2,
      borderRadius: RADIUS.pill,
      paddingHorizontal: SPACE.md,
      paddingVertical: SPACE.xs + 2,
      borderWidth: 1,
      borderColor: C.border,
    },
    commentInputText: {
      fontSize: FONT.sm,
      color: C.textMuted,
    },
    commentSendBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: C.green,
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
      backgroundColor: C.surface2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    commentAvatarText: {
      fontSize: 10,
      fontWeight: '700',
      color: C.textSub,
    },
    commentBubble: {
      flex: 1,
      backgroundColor: C.surface2,
      borderRadius: RADIUS.md,
      padding: SPACE.sm,
      borderWidth: 1,
      borderColor: C.border,
    },
    commentUser: {
      fontSize: FONT.xs,
      fontWeight: '700',
      color: C.text,
      marginBottom: 2,
    },
    commentText: {
      fontSize: FONT.xs,
      color: C.textSub,
      lineHeight: 16,
    },
    commentUserText: {
      fontSize: FONT.xs,
      color: C.text,
    },
  });

  const live = StyleSheet.create({
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
      backgroundColor: C.redGlow,
      borderRadius: RADIUS.pill,
      paddingHorizontal: SPACE.sm,
      paddingVertical: 3,
    },
    liveDot: {
      width: 5,
      height: 5,
      borderRadius: 3,
      backgroundColor: C.red,
    },
    livePillText: {
      fontSize: FONT.xs,
      fontWeight: '700',
      color: C.red,
      letterSpacing: 1,
    },
    positionLabel: {
      fontSize: FONT.xs,
      fontWeight: '700',
      color: C.textMuted,
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
      borderBottomColor: C.border,
      gap: SPACE.sm,
    },
    rank: {
      width: 22,
      alignItems: 'center',
    },
    rankText: {
      fontSize: FONT.sm,
      fontWeight: '800',
      color: C.textMuted,
    },
    rankFirst: {
      color: C.green,
    },
    candidateAvatar: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: C.border,
    },
    candidateAvatarLead: {
      borderColor: C.green,
    },
    candidateAvatarText: {
      fontSize: FONT.sm,
      fontWeight: '800',
      color: C.text,
    },
    candidateInfo: {
      flex: 1,
    },
    candidateName: {
      fontSize: FONT.base,
      fontWeight: '700',
      color: C.text,
      marginBottom: 3,
    },
    candidateBarTrack: {
      height: 5,
      backgroundColor: C.surface2,
      borderRadius: RADIUS.pill,
      overflow: 'hidden',
    },
    candidateBarFill: {
      height: 5,
      backgroundColor: C.greenDim,
      borderRadius: RADIUS.pill,
    },
    candidateBarFillLead: {
      backgroundColor: C.green,
    },
    candidateVotes: {
      alignItems: 'flex-end',
      minWidth: 50,
    },
    candidateVoteCount: {
      fontSize: FONT.md,
      fontWeight: '800',
      color: C.text,
    },
    candidateVotePct: {
      fontSize: FONT.xs,
      color: C.textMuted,
      marginTop: 1,
    },
    candidateVotePctLead: {
      color: C.green,
    },
    totalVotes: {
      textAlign: 'center',
      fontSize: FONT.xs,
      color: C.textMuted,
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
      borderColor: C.border,
    },
    positionTabActive: {
      backgroundColor: C.greenLight,
      borderColor: C.green,
    },
    positionTabText: {
      fontSize: FONT.xs,
      fontWeight: '700',
      color: C.textMuted,
      letterSpacing: 0.5,
    },
    positionTabTextActive: {
      color: C.green,
    },
  });

  return { shared, screen, countdown, feed, live };
}

export type DashboardStyles = ReturnType<typeof makeStyles>;