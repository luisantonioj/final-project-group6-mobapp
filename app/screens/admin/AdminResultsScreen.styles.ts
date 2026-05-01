// app/screens/admin/AdminResultsScreen.styles.ts
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
      flexDirection:     'row',
      alignItems:        'center',
      justifyContent:    'space-between',
      paddingHorizontal: SPACE.base,
      paddingTop:        SPACE.lg,
      paddingBottom:     SPACE.md,
      borderBottomWidth: 1,
      borderBottomColor: C.border,
    },
    headerTitle: {
      fontSize:      FONT.xxl,
      fontWeight:    '800',
      color:         C.text,
      letterSpacing: -0.5,
    },
    headerSub: {
      fontSize:  FONT.sm,
      color:     C.textMuted,
      marginTop: 2,
    },
    scrollContent: {
      paddingHorizontal: SPACE.base,
      paddingTop:        SPACE.lg,
      paddingBottom:     120,
    },
  });

  const live = StyleSheet.create({
    chip: {
      flexDirection:     'row',
      alignItems:        'center',
      backgroundColor:   C.redGlow,
      borderRadius:      RADIUS.pill,
      paddingHorizontal: 10,
      paddingVertical:   5,
      borderWidth:       1,
      borderColor:       'rgba(239,68,68,0.35)',
    },
    dot: {
      width:           6,
      height:          6,
      borderRadius:    3,
      backgroundColor: C.red,
      marginRight:     5,
    },
    text: {
      color:         C.red,
      fontSize:      FONT.xs,
      fontWeight:    '800',
      letterSpacing: 1.5,
    },
    controlsRow: {
      flexDirection:     'row',
      alignItems:        'center',
      gap:               SPACE.xs,
      backgroundColor:   C.pill,
      borderRadius:      RADIUS.pill,
      paddingHorizontal: SPACE.sm,
      paddingVertical:   SPACE.xs,
    },
    iconBtn: {
      padding: SPACE.xs,
    },
  });

  const filter = StyleSheet.create({
    scrollRow: {
      marginBottom: SPACE.md,
    },
    innerRow: {
      flexDirection: 'row',
      gap:           SPACE.sm,
      paddingRight:  SPACE.base,
    },
    tab: {
      paddingHorizontal: SPACE.md,
      paddingVertical:   SPACE.xs + 2,
      borderRadius:      RADIUS.pill,
      borderWidth:       1,
      borderColor:       C.border,
      backgroundColor:   C.surface,
    },
    tabText: {
      fontSize:   FONT.sm,
      fontWeight: '600',
      color:      C.textMuted,
    },
    tabTextActive: {
      fontWeight: '700',
    },
  });

  const college = StyleSheet.create({
    section: {
      marginBottom: SPACE.xl,
    },
    banner: {
      flexDirection:   'row',
      justifyContent:  'space-between',
      alignItems:      'center',
      borderLeftWidth: 4,
      paddingLeft:     SPACE.md,
      marginBottom:    SPACE.base,
    },
    name: {
      color:         C.text,
      fontSize:      FONT.lg,
      fontWeight:    '800',
      letterSpacing: -0.3,
    },
    stat: {
      color:     C.textMuted,
      fontSize:  FONT.sm,
      marginTop: 2,
    },
    chip: {
      borderRadius:      RADIUS.pill,
      paddingHorizontal: SPACE.md,
      paddingVertical:   SPACE.xs,
    },
    chipText: {
      fontSize:   FONT.sm,
      fontWeight: '700',
    },
  });

  const card = StyleSheet.create({
    wrapper: {
      backgroundColor: C.surface,
      borderRadius:    RADIUS.lg,
      borderWidth:     1,
      borderColor:     C.border,
      padding:         SPACE.base,
      marginBottom:    SPACE.sm,
    },
    header: {
      flexDirection: 'row',
      alignItems:    'center',
      marginBottom:  SPACE.base,
    },
    icon: {
      fontSize:    FONT.lg,
      marginRight: SPACE.sm,
    },
    title: {
      flex:       1,
      color:      C.text,
      fontSize:   FONT.md,
      fontWeight: '700',
    },
    badge: {
      borderRadius:      RADIUS.pill,
      borderWidth:       1,
      paddingHorizontal: SPACE.sm,
      paddingVertical:   3,
    },
    badgeText: {
      fontSize:   FONT.xs,
      fontWeight: '700',
    },
  });

  const candidate = StyleSheet.create({
    row: {
      marginBottom: SPACE.md,
    },
    meta: {
      flexDirection: 'row',
      alignItems:    'center',
      marginBottom:  6,
    },
    rankBadge: {
      width:           22,
      height:          22,
      borderRadius:    11,
      backgroundColor: C.surface2,
      alignItems:      'center',
      justifyContent:  'center',
      marginRight:     SPACE.sm,
    },
    rankText: {
      color:      C.textMuted,
      fontSize:   FONT.xs,
      fontWeight: '800',
    },
    name: {
      flex:       1,
      color:      C.text,
      fontSize:   FONT.base,
      fontWeight: '600',
    },
    votes: {
      fontSize:   FONT.base,
      fontWeight: '800',
    },
    barTrack: {
      height:          8,
      backgroundColor: C.surface2,
      borderRadius:    4,
      overflow:        'hidden',
      flexDirection:   'row',
      alignItems:      'center',
    },
    barFill: {
      height:       '100%',
      borderRadius: 4,
    },
    pctLabel: {
      position:      'absolute',
      right:         0,
      color:         C.textMuted,
      fontSize:      FONT.xs,
      fontWeight:    '700',
      paddingRight:  4,
    },
  });

  const empty = StyleSheet.create({
    wrapper: {
      alignItems:      'center',
      justifyContent:  'center',
      paddingVertical: SPACE.xxl * 2,
      gap:             SPACE.md,
    },
    icon: { 
      fontSize: 36, 
      marginBottom: SPACE.sm 
    },
    title: { 
      fontSize: FONT.lg, 
      fontWeight: '700', 
      color: C.text 
    },
    body: { 
      fontSize: FONT.sm, 
      color: C.textMuted, 
      textAlign: 'center' 
    },
  });

  return { screen, live, filter, college, card, candidate, empty };
}

export type AdminResultsStyles = ReturnType<typeof makeStyles>;