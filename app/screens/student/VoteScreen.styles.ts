// screens/student/VoteScreen.styles.ts
import { StyleSheet } from 'react-native';
import { T } from '../../theme';

// ─── Design tokens ────────────────────────────────────────────────────────────
export const COLORS = {
  bg:           T.bg,
  bgCard:       T.surface,
  bgElevated:   T.surface2,
  bgModal:      T.surface,
  border:       T.border,
  borderBright: 'rgba(27,98,53,0.22)',
  green:        T.green,
  greenDim:     T.greenBright,
  greenFaint:   T.greenLight,
  greenGlow:    T.greenLight,
  text:         T.text,
  textMuted:    T.textMuted,
  textSub:      T.textSub,
  red:          T.red,
  redFaint:     T.redGlow,
  overlay:      'rgba(0,0,0,0.50)',
};

export const FONT = {
  xs:   10,
  sm:   12,
  base: 14,
  md:   15,
  lg:   17,
  xl:   20,
  xxl:  24,
};

export const RADIUS = {
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  pill: 999,
};

export const SPACE = {
  xs:   4,
  sm:   8,
  md:   12,
  base: 16,
  lg:   20,
  xl:   24,
  xxl:  32,
};

// ─── Screen shell ─────────────────────────────────────────────────────────────
export const screenStyles = StyleSheet.create({
  container: {
    flex:            1,
    backgroundColor: COLORS.bg,
  },
  header: {
    flexDirection:     'row',
    alignItems:        'flex-start',
    justifyContent:    'space-between',
    paddingHorizontal: SPACE.base,
    paddingTop:        SPACE.lg,
    paddingBottom:     SPACE.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize:      FONT.xxl,
    fontWeight:    '800',
    color:         COLORS.text,
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize:      FONT.sm,
    color:         COLORS.textMuted,
    marginTop:     2,
    letterSpacing: 0.3,
  },
  progressPill: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               5,
    backgroundColor:   COLORS.bgElevated,
    borderRadius:      RADIUS.pill,
    paddingHorizontal: SPACE.sm,
    paddingVertical:   5,
    borderWidth:       1,
    borderColor:       COLORS.borderBright,
  },
  progressDot: {
    width:           7,
    height:          7,
    borderRadius:    4,
    backgroundColor: COLORS.green,
  },
  progressText: {
    fontSize:   FONT.sm,
    fontWeight: '700',
    color:      COLORS.textSub,
  },
  progressGreen: {
    color: COLORS.green,
  },
  scrollContent: {
    paddingHorizontal: SPACE.base,
    paddingTop:        SPACE.lg,
    paddingBottom:     120,
  },
});

// ─── Position card ────────────────────────────────────────────────────────────
export const positionCardStyles = StyleSheet.create({
  wrapper: {
    backgroundColor: COLORS.bgCard,
    borderRadius:    RADIUS.lg,
    borderWidth:     1,
    borderColor:     COLORS.border,
    marginBottom:    SPACE.md,
    overflow:        'hidden',
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 1 },
    shadowOpacity:   0.06,
    shadowRadius:    3,
    elevation:       2,
  },
  wrapperDone: {
    borderColor: COLORS.green,
  },
  cardHeader: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    padding:           SPACE.base,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  positionName: {
    fontSize:   FONT.md,
    fontWeight: '700',
    color:      COLORS.text,
  },
  candidateCount: {
    fontSize:  FONT.xs,
    color:     COLORS.textMuted,
    marginTop: 2,
  },
  doneBadge: {
    width:           26,
    height:          26,
    borderRadius:    13,
    backgroundColor: COLORS.greenFaint,
    borderWidth:     1,
    borderColor:     COLORS.green,
    alignItems:      'center',
    justifyContent:  'center',
  },
  pendingBadge: {
    width:           26,
    height:          26,
    borderRadius:    13,
    backgroundColor: COLORS.bgElevated,
    borderWidth:     1,
    borderColor:     COLORS.border,
    alignItems:      'center',
    justifyContent:  'center',
  },
  badgeText: {
    fontSize:   11,
    fontWeight: '800',
    color:      COLORS.green,
  },
  pendingText: {
    fontSize:   11,
    color:      COLORS.textMuted,
  },
  candidateList: {
    padding: SPACE.sm,
    gap:     SPACE.xs,
  },
  emptyNote: {
    fontSize:        FONT.sm,
    color:           COLORS.textMuted,
    textAlign:       'center',
    paddingVertical: SPACE.base,
    fontStyle:       'italic',
  },
});

// ─── Candidate row ────────────────────────────────────────────────────────────
export const candidateRowStyles = StyleSheet.create({
  wrapper: {
    flexDirection:   'row',
    alignItems:      'center',
    padding:         SPACE.sm,
    borderRadius:    RADIUS.md,
    borderWidth:     1,
    borderColor:     COLORS.border,
    backgroundColor: COLORS.bgElevated,
    gap:             SPACE.sm,
  },
  wrapperSelected: {
    backgroundColor: COLORS.greenFaint,
    borderColor:     COLORS.borderBright,
  },
  avatar: {
    width:           42,
    height:          42,
    borderRadius:    21,
    backgroundColor: COLORS.bgCard,
    borderWidth:     2,
    borderColor:     COLORS.border,
    alignItems:      'center',
    justifyContent:  'center',
  },
  avatarSelected: {
    borderColor: COLORS.green,
  },
  avatarInitials: {
    fontSize:   FONT.md,
    fontWeight: '800',
    color:      COLORS.textSub,
  },
  avatarInitialsSelected: {
    color: COLORS.green,
  },
  info: { flex: 1 },
  name: {
    fontSize:   FONT.base,
    fontWeight: '700',
    color:      COLORS.text,
  },
  partylist: {
    fontSize:  FONT.xs,
    color:     COLORS.textMuted,
    marginTop: 1,
  },
  viewBtn: {
    paddingHorizontal: SPACE.sm,
    paddingVertical:   4,
    borderRadius:      RADIUS.pill,
    borderWidth:       1,
    borderColor:       COLORS.borderBright,
    backgroundColor:   COLORS.bgCard,
  },
  viewBtnText: {
    fontSize:   FONT.xs,
    color:      COLORS.textSub,
    fontWeight: '600',
  },
  radio: {
    width:           20,
    height:          20,
    borderRadius:    10,
    borderWidth:     2,
    borderColor:     COLORS.border,
    alignItems:      'center',
    justifyContent:  'center',
  },
  radioSelected: {
    borderColor: COLORS.green,
  },
  radioDot: {
    width:           10,
    height:          10,
    borderRadius:    5,
    backgroundColor: COLORS.green,
  },
});

// ─── Submit button ────────────────────────────────────────────────────────────
export const submitStyles = StyleSheet.create({
  wrapper: {
    backgroundColor:   COLORS.bgCard,
    borderRadius:      RADIUS.lg,
    borderWidth:       1,
    borderColor:       COLORS.borderBright,
    paddingVertical:   SPACE.md,
    paddingHorizontal: SPACE.base,
    marginTop:         SPACE.sm,
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'center',
    gap:               SPACE.sm,
  },
  wrapperActive: {
    backgroundColor: COLORS.green,
    borderColor:     COLORS.green,
    shadowColor:     COLORS.green,
    shadowOffset:    { width: 0, height: 3 },
    shadowOpacity:   0.25,
    shadowRadius:    6,
    elevation:       4,
  },
  wrapperDisabled: {
    opacity: 0.4,
  },
  text: {
    fontSize:      FONT.lg,
    fontWeight:    '800',
    color:         COLORS.textMuted,
    letterSpacing: 0.3,
  },
  textActive: { color: '#fff' },
  hint: {
    fontSize:  FONT.xs,
    color:     COLORS.textMuted,
    textAlign: 'center',
    marginTop: SPACE.xs,
  },
});

// ─── Confirm bottom sheet ─────────────────────────────────────────────────────
export const confirmStyles = StyleSheet.create({
  overlay: {
    flex:            1,
    backgroundColor: COLORS.overlay,
    justifyContent:  'flex-end',
  },
  sheet: {
    backgroundColor:      COLORS.bgModal,
    borderTopLeftRadius:  RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    borderTopWidth:       1,
    borderTopColor:       COLORS.borderBright,
    paddingHorizontal:    SPACE.xl,
    paddingTop:           SPACE.lg,
    paddingBottom:        40,
    shadowColor:          '#000',
    shadowOffset:         { width: 0, height: -2 },
    shadowOpacity:        0.08,
    shadowRadius:         8,
    elevation:            8,
  },
  handle: {
    width:           40,
    height:          4,
    borderRadius:    2,
    backgroundColor: COLORS.border,
    alignSelf:       'center',
    marginBottom:    SPACE.lg,
  },
  title: {
    fontSize:     FONT.xl,
    fontWeight:   '800',
    color:        COLORS.text,
    textAlign:    'center',
    marginBottom: SPACE.xs,
  },
  subtitle: {
    fontSize:     FONT.sm,
    color:        COLORS.textMuted,
    textAlign:    'center',
    lineHeight:   18,
    marginBottom: SPACE.xl,
  },
  row: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingVertical:   SPACE.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  rowPosition: {
    flex:     1,
    fontSize: FONT.xs,
    color:    COLORS.textMuted,
  },
  rowName: {
    flex:       2,
    fontSize:   FONT.sm,
    fontWeight: '700',
    color:      COLORS.text,
    textAlign:  'right',
  },
  divider: {
    height:          1,
    backgroundColor: COLORS.border,
    marginVertical:  SPACE.lg,
  },
  confirmBtn: {
    backgroundColor: COLORS.green,
    borderRadius:    RADIUS.lg,
    paddingVertical: SPACE.md,
    alignItems:      'center',
    marginBottom:    SPACE.sm,
    shadowColor:     COLORS.green,
    shadowOffset:    { width: 0, height: 3 },
    shadowOpacity:   0.25,
    shadowRadius:    6,
    elevation:       4,
  },
  confirmBtnText: {
    fontSize:   FONT.md,
    fontWeight: '800',
    color:      '#fff',
  },
  cancelBtn: {
    backgroundColor: COLORS.bgElevated,
    borderRadius:    RADIUS.lg,
    paddingVertical: SPACE.md,
    alignItems:      'center',
    borderWidth:     1,
    borderColor:     COLORS.border,
  },
  cancelBtnText: {
    fontSize:   FONT.md,
    fontWeight: '700',
    color:      COLORS.textMuted,
  },
});

// ─── Full-screen state views (not-open / ended / voted) ───────────────────────
export const stateStyles = StyleSheet.create({
  wrapper: {
    flex:              1,
    alignItems:        'center',
    justifyContent:    'center',
    paddingHorizontal: SPACE.xl,
    gap:               SPACE.md,
  },
  iconCircle: {
    width:           72,
    height:          72,
    borderRadius:    36,
    backgroundColor: COLORS.bgElevated,
    borderWidth:     1,
    borderColor:     COLORS.border,
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    SPACE.sm,
  },
  iconCircleGreen: {
    backgroundColor: COLORS.greenFaint,
    borderColor:     COLORS.green,
  },
  iconText: { fontSize: 30 },
  title: {
    fontSize:   FONT.xl,
    fontWeight: '800',
    color:      COLORS.text,
    textAlign:  'center',
  },
  body: {
    fontSize:   FONT.base,
    color:      COLORS.textMuted,
    textAlign:  'center',
    lineHeight: 22,
  },
});