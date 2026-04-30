// screens/admin/AdminCandidatesScreen.styles.ts
import { StyleSheet } from 'react-native';
import { T } from '../../theme';

export const COLORS = {
  bg:           T.bg,
  bgCard:       T.surface,
  bgElevated:   T.surface2,
  bgModal:      T.surface,
  border:       T.border,
  borderBright: 'rgba(27,98,53,0.22)',
  green:        T.green,
  greenDim:     T.green,
  greenFaint:   T.greenLight,
  text:         T.text,
  textMuted:    T.textMuted,
  textSub:      T.textSub,
  red:          T.red,
  redFaint:     T.redGlow,
  redBorder:    'rgba(220,38,38,0.25)',
  amber:        T.amber,
  amberFaint:   T.amberGlow,
  amberBorder:  'rgba(217,119,6,0.30)',
  overlay:      'rgba(0,0,0,0.40)',
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
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: SPACE.base,
    paddingTop:        SPACE.lg,
    paddingBottom:     SPACE.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor:   COLORS.bg,
  },
  headerTitle: {
    fontSize:      FONT.xxl,
    fontWeight:    '800',
    color:         COLORS.text,
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize:  FONT.sm,
    color:     COLORS.textMuted,
    marginTop: 2,
  },
  addBtn: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               5,
    backgroundColor:   COLORS.green,
    borderRadius:      RADIUS.pill,
    paddingHorizontal: SPACE.md,
    paddingVertical:   SPACE.sm,
    shadowColor:       COLORS.green,
    shadowOffset:      { width: 0, height: 3 },
    shadowOpacity:     0.25,
    shadowRadius:      6,
    elevation:         3,
  },
  addBtnText: {
    fontSize:   FONT.sm,
    fontWeight: '800',
    color:      '#fff',
  },
  scrollContent: {
    paddingHorizontal: SPACE.base,
    paddingTop:        SPACE.lg,
    paddingBottom:     120,
  },
  sectionLabel: {
    fontSize:      FONT.xs,
    fontWeight:    '700',
    letterSpacing: 2,
    color:         COLORS.green,
    textTransform: 'uppercase',
    marginBottom:  SPACE.sm,
    marginTop:     SPACE.md,
  },
});

// ─── Filter tabs row ──────────────────────────────────────────────────────────
export const filterStyles = StyleSheet.create({
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
    borderColor:       COLORS.border,
    backgroundColor:   COLORS.bgCard,
  },
  tabActive: {
    backgroundColor: COLORS.greenFaint,
    borderColor:     COLORS.green,
  },
  tabText: {
    fontSize:   FONT.sm,
    fontWeight: '600',
    color:      COLORS.textMuted,
  },
  tabTextActive: {
    color:      COLORS.green,
    fontWeight: '700',
  },
});

// ─── Candidate card (in list) ─────────────────────────────────────────────────
export const cardStyles = StyleSheet.create({
  wrapper: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: COLORS.bgCard,
    borderRadius:    RADIUS.lg,
    borderWidth:     1,
    borderColor:     COLORS.border,
    marginBottom:    SPACE.sm,
    padding:         SPACE.base,
    gap:             SPACE.md,
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 1 },
    shadowOpacity:   0.05,
    shadowRadius:    3,
    elevation:       1,
  },
  avatar: {
    width:           50,
    height:          50,
    borderRadius:    25,
    backgroundColor: COLORS.bgElevated,
    borderWidth:     2,
    borderColor:     COLORS.borderBright,
    alignItems:      'center',
    justifyContent:  'center',
  },
  avatarText: {
    fontSize:   FONT.md,
    fontWeight: '800',
    color:      COLORS.green,
  },
  info: { flex: 1 },
  name: {
    fontSize:   FONT.md,
    fontWeight: '700',
    color:      COLORS.text,
  },
  positionBadge: {
    fontSize:   FONT.xs,
    color:      COLORS.green,
    fontWeight: '600',
    marginTop:  2,
  },
  partylist: {
    fontSize:  FONT.xs,
    color:     COLORS.textMuted,
    marginTop: 1,
  },
  actions: {
    flexDirection: 'row',
    gap:           SPACE.xs,
  },
  actionBtn: {
    width:          34,
    height:         34,
    borderRadius:   17,
    alignItems:     'center',
    justifyContent: 'center',
    borderWidth:    1,
  },
  viewBtn: {
    backgroundColor: COLORS.bgElevated,
    borderColor:     COLORS.borderBright,
  },
  editBtn: {
    backgroundColor: COLORS.amberFaint,
    borderColor:     COLORS.amberBorder,
  },
  deleteBtn: {
    backgroundColor: COLORS.redFaint,
    borderColor:     COLORS.redBorder,
  },
  actionIcon: { fontSize: 14 },
});

// ─── Add / Edit form bottom sheet ─────────────────────────────────────────────
export const formStyles = StyleSheet.create({
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
    borderTopColor:       COLORS.border,
    paddingHorizontal:    SPACE.xl,
    paddingTop:           SPACE.lg,
    paddingBottom:        48,
    maxHeight:            '92%',
    shadowColor:          '#000',
    shadowOffset:         { width: 0, height: -4 },
    shadowOpacity:        0.08,
    shadowRadius:         12,
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
    marginBottom: SPACE.xl,
  },
  fieldLabel: {
    fontSize:      FONT.xs,
    fontWeight:    '700',
    color:         COLORS.textMuted,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom:  SPACE.xs,
    marginTop:     SPACE.md,
  },
  input: {
    backgroundColor:   COLORS.bgElevated,
    borderRadius:      RADIUS.md,
    borderWidth:       1,
    borderColor:       COLORS.border,
    paddingHorizontal: SPACE.md,
    paddingVertical:   SPACE.sm + 2,
    fontSize:          FONT.base,
    color:             COLORS.text,
  },
  inputFocused: {
    borderColor: COLORS.green,
  },
  textArea: {
    minHeight:         88,
    textAlignVertical: 'top',
  },
  positionScrollRow: {
    marginBottom: SPACE.xs,
  },
  positionInnerRow: {
    flexDirection: 'row',
    gap:           SPACE.sm,
    paddingBottom: SPACE.xs,
  },
  positionTab: {
    paddingHorizontal: SPACE.md,
    paddingVertical:   SPACE.xs + 2,
    borderRadius:      RADIUS.pill,
    borderWidth:       1,
    borderColor:       COLORS.border,
    backgroundColor:   COLORS.bgElevated,
  },
  positionTabActive: {
    backgroundColor: COLORS.greenFaint,
    borderColor:     COLORS.green,
  },
  positionTabText: {
    fontSize:   FONT.sm,
    fontWeight: '600',
    color:      COLORS.textMuted,
  },
  positionTabTextActive: {
    color:      COLORS.green,
    fontWeight: '700',
  },
  divider: {
    height:          1,
    backgroundColor: COLORS.border,
    marginVertical:  SPACE.xl,
  },
  btnRow: {
    flexDirection: 'row',
    gap:           SPACE.sm,
  },
  btnSave: {
    flex:            1,
    backgroundColor: COLORS.green,
    borderRadius:    RADIUS.lg,
    paddingVertical: SPACE.md,
    alignItems:      'center',
    shadowColor:     COLORS.green,
    shadowOffset:    { width: 0, height: 3 },
    shadowOpacity:   0.25,
    shadowRadius:    6,
    elevation:       3,
  },
  btnSaveDisabled: {
    opacity: 0.45,
  },
  btnSaveText: {
    fontSize:   FONT.md,
    fontWeight: '800',
    color:      '#fff',
  },
  btnCancel: {
    flex:            1,
    backgroundColor: COLORS.bgElevated,
    borderRadius:    RADIUS.lg,
    paddingVertical: SPACE.md,
    alignItems:      'center',
    borderWidth:     1,
    borderColor:     COLORS.border,
  },
  btnCancelText: {
    fontSize:   FONT.md,
    fontWeight: '700',
    color:      COLORS.textMuted,
  },
});

// ─── Empty state ──────────────────────────────────────────────────────────────
export const emptyStyles = StyleSheet.create({
  wrapper: {
    alignItems:      'center',
    justifyContent:  'center',
    paddingVertical: SPACE.xxl * 2,
    gap:             SPACE.md,
  },
  icon:  { fontSize: 36, marginBottom: SPACE.sm },
  title: { fontSize: FONT.lg, fontWeight: '700', color: COLORS.text },
  body:  { fontSize: FONT.sm, color: COLORS.textMuted, textAlign: 'center' },
});