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
      flexDirection:  'row',
      alignItems:     'center',
      marginBottom:   SPACE.md,
      gap:            SPACE.sm,
    },
    icon: {   // unused but keep to avoid type errors
      fontSize: 0,
    },
    title: {
      flex:          1,
      color:         C.text,
      fontSize:      FONT.base,
      fontWeight:    '700',
      letterSpacing: 0.2,
      textTransform: 'uppercase',
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

  const college = StyleSheet.create({
    section: {
      marginBottom: SPACE.xl,
    },
    banner: {
      flexDirection:   'row',
      justifyContent:  'space-between',
      alignItems:      'center',
      borderLeftWidth: 3,
      paddingLeft:     SPACE.md,
      marginBottom:    SPACE.md,
    },
    name: {
      color:         C.text,
      fontSize:      FONT.md,
      fontWeight:    '800',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
    stat: {
      color:     C.textMuted,
      fontSize:  FONT.xs,
      marginTop: 2,
      letterSpacing: 0.3,
    },
    chip: {
      borderRadius:      RADIUS.pill,
      paddingHorizontal: SPACE.md,
      paddingVertical:   SPACE.xs,
    },
    chipText: {
      fontSize:   FONT.xs,
      fontWeight: '700',
    },
  });

  const candidate = StyleSheet.create({
    row: {
      marginBottom: SPACE.sm,
    },
    meta: {
      flexDirection: 'row',
      alignItems:    'center',
      marginBottom:  5,
    },
    rankBadge: {
      width:           20,
      height:          20,
      borderRadius:    10,
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
      flex:          1,
      color:         C.text,
      fontSize:      FONT.sm,
      fontWeight:    '600',
      letterSpacing: 0.1,
    },
    votes: {
      fontSize:      FONT.sm,
      fontWeight:    '800',
      letterSpacing: 0.2,
      marginRight:   SPACE.xs,
    },
    pct: {
      fontSize:    FONT.xs,
      fontWeight:  '600',
      color:       C.textMuted,
      minWidth:    32,
      textAlign:   'right',
    },
    barTrack: {
      height:          6,
      backgroundColor: C.surface2,
      borderRadius:    3,
      overflow:        'hidden',
    },
    barFill: {
      height:       '100%',
      borderRadius: 3,
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