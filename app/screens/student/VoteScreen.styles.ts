import { StyleSheet } from 'react-native';
import type { ThemeColors } from '../../theme';

export const FONT = {
  xs: 10, sm: 12, base: 14, md: 15, lg: 17, xl: 20, xxl: 24,
};

export const RADIUS = {
  sm: 8, md: 12, lg: 16, xl: 20, pill: 999,
};

export const SPACE = {
  xs: 4, sm: 8, md: 12, base: 16, lg: 20, xl: 24, xxl: 32,
};

export function makeStyles(C: ThemeColors) {
  const screen = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: C.bg,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      paddingHorizontal: SPACE.base,
      paddingTop: SPACE.lg,
      paddingBottom: SPACE.md,
      borderBottomWidth: 1,
      borderBottomColor: C.border,
    },
    headerTitle: {
      fontSize: FONT.xxl,
      fontWeight: '800',
      color: C.text,
      letterSpacing: -0.5,
    },
    headerSub: {
      fontSize: FONT.sm,
      color: C.textMuted,
      marginTop: 2,
      letterSpacing: 0.3,
    },
    progressPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: C.surface2,
      borderRadius: RADIUS.pill,
      paddingHorizontal: SPACE.sm,
      paddingVertical: 5,
      borderWidth: 1,
      borderColor: C.greenDim,
    },
    progressDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: C.green,
    },
    progressText: {
      fontSize: FONT.sm,
      fontWeight: '700',
      color: C.textSub,
    },
    progressGreen: {
      color: C.green,
    },
    scrollContent: {
      paddingHorizontal: SPACE.base,
      paddingTop: SPACE.lg,
      paddingBottom: 120,
    },
  });

  const posCard = StyleSheet.create({
    wrapper: {
      backgroundColor: C.surface,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: C.border,
      marginBottom: SPACE.md,
      overflow: 'hidden',
    },
    wrapperDone: {
      borderColor: C.green,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: SPACE.base,
      borderBottomWidth: 1,
      borderBottomColor: C.border,
    },
    positionName: {
      fontSize: FONT.md,
      fontWeight: '700',
      color: C.text,
    },
    candidateCount: {
      fontSize: FONT.xs,
      color: C.textMuted,
      marginTop: 2,
    },
    doneBadge: {
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: C.greenLight,
      borderWidth: 1,
      borderColor: C.green,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pendingBadge: {
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: C.surface2,
      borderWidth: 1,
      borderColor: C.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    badgeText: {
      fontSize: 11,
      fontWeight: '800',
      color: C.green,
    },
    pendingText: {
      fontSize: 11,
      color: C.textMuted,
    },
    candidateList: {
      padding: SPACE.sm,
      gap: SPACE.xs,
    },
    emptyNote: {
      fontSize: FONT.sm,
      color: C.textMuted,
      textAlign: 'center',
      paddingVertical: SPACE.base,
      fontStyle: 'italic',
    },
  });

  const candRow = StyleSheet.create({
    wrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: SPACE.sm,
      borderRadius: RADIUS.md,
      borderWidth: 1,
      borderColor: C.border,
      backgroundColor: C.surface2,
      gap: SPACE.sm,
    },
    wrapperSelected: {
      backgroundColor: C.greenLight,
      borderColor: C.green,
    },
    avatar: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: C.surface,
      borderWidth: 2,
      borderColor: C.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarSelected: {
      borderColor: C.green,
    },
    avatarInitials: {
      fontSize: FONT.md,
      fontWeight: '800',
      color: C.textSub,
    },
    avatarInitialsSelected: {
      color: C.green,
    },
    info: { flex: 1 },
    name: {
      fontSize: FONT.base,
      fontWeight: '700',
      color: C.text,
    },
    partylist: {
      fontSize: FONT.xs,
      color: C.textMuted,
      marginTop: 1,
    },
    viewBtn: {
      paddingHorizontal: SPACE.sm,
      paddingVertical: 4,
      borderRadius: RADIUS.pill,
      borderWidth: 1,
      borderColor: C.greenDim,
      backgroundColor: C.surface,
    },
    viewBtnText: {
      fontSize: FONT.xs,
      color: C.textSub,
      fontWeight: '600',
    },
    radio: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: C.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    radioSelected: {
      borderColor: C.green,
    },
    radioDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: C.green,
    },
  });

  const submit = StyleSheet.create({
    wrapper: {
      backgroundColor: C.surface,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: C.greenDim,
      paddingVertical: SPACE.md,
      paddingHorizontal: SPACE.base,
      marginTop: SPACE.sm,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: SPACE.sm,
    },
    wrapperActive: {
      backgroundColor: C.green,
      borderColor: C.green,
    },
    wrapperDisabled: {
      opacity: 0.4,
    },
    text: {
      fontSize: FONT.lg,
      fontWeight: '800',
      color: C.textMuted,
      letterSpacing: 0.3,
    },
    textActive: { color: '#fff' },
    hint: {
      fontSize: FONT.xs,
      color: C.textMuted,
      textAlign: 'center',
      marginTop: SPACE.xs,
    },
  });

  const confirm = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.78)',
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: C.surface,
      borderTopLeftRadius: RADIUS.xl,
      borderTopRightRadius: RADIUS.xl,
      borderTopWidth: 1,
      borderTopColor: C.greenDim,
      paddingHorizontal: SPACE.xl,
      paddingTop: SPACE.lg,
      paddingBottom: 40,
    },
    handle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: C.border,
      alignSelf: 'center',
      marginBottom: SPACE.lg,
    },
    title: {
      fontSize: FONT.xl,
      fontWeight: '800',
      color: C.text,
      textAlign: 'center',
      marginBottom: SPACE.xs,
    },
    subtitle: {
      fontSize: FONT.sm,
      color: C.textMuted,
      textAlign: 'center',
      lineHeight: 18,
      marginBottom: SPACE.xl,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: SPACE.sm,
      borderBottomWidth: 1,
      borderBottomColor: C.border,
    },
    rowPosition: {
      flex: 1,
      fontSize: FONT.xs,
      color: C.textMuted,
    },
    rowName: {
      flex: 2,
      fontSize: FONT.sm,
      fontWeight: '700',
      color: C.text,
      textAlign: 'right',
    },
    divider: {
      height: 1,
      backgroundColor: C.border,
      marginVertical: SPACE.lg,
    },
    confirmBtn: {
      backgroundColor: C.green,
      borderRadius: RADIUS.lg,
      paddingVertical: SPACE.md,
      alignItems: 'center',
      marginBottom: SPACE.sm,
    },
    confirmBtnText: {
      fontSize: FONT.md,
      fontWeight: '800',
      color: '#fff',
    },
    cancelBtn: {
      backgroundColor: C.surface2,
      borderRadius: RADIUS.lg,
      paddingVertical: SPACE.md,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: C.border,
    },
    cancelBtnText: {
      fontSize: FONT.md,
      fontWeight: '700',
      color: C.textMuted,
    },
  });

  const state = StyleSheet.create({
    wrapper: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: SPACE.xl,
      gap: SPACE.md,
    },
    iconCircle: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: C.surface2,
      borderWidth: 1,
      borderColor: C.border,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: SPACE.sm,
    },
    iconCircleGreen: {
      backgroundColor: C.greenLight,
      borderColor: C.green,
    },
    iconText: { fontSize: 30 },
    title: {
      fontSize: FONT.xl,
      fontWeight: '800',
      color: C.text,
      textAlign: 'center',
    },
    body: {
      fontSize: FONT.base,
      color: C.textMuted,
      textAlign: 'center',
      lineHeight: 22,
    },
  });

  return { screen, posCard, candRow, submit, confirm, state };
}

export type VoteStyles = ReturnType<typeof makeStyles>;