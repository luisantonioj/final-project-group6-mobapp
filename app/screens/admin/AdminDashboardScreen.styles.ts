import { StyleSheet } from 'react-native';

// =============================================================================
// DESIGN TOKENS — matches DashboardScreen palette
// =============================================================================

export const C = {
  bg:          '#0A0A0F',
  surface:     '#111118',
  card:        '#16161F',
  border:      'rgba(255,255,255,0.07)',
  borderHover: 'rgba(255,255,255,0.14)',
  green:       '#22C55E',
  greenGlow:   'rgba(34,197,94,0.12)',
  greenDim:    'rgba(34,197,94,0.18)',
  red:         '#EF4444',
  redGlow:     'rgba(239,68,68,0.12)',
  amber:       '#F59E0B',
  amberGlow:   'rgba(245,158,11,0.12)',
  text:        '#F9FAFB',
  textSub:     '#9CA3AF',
  textMuted:   '#6B7280',
  pill:        'rgba(255,255,255,0.06)',
};

// =============================================================================
// STYLES
// =============================================================================

export const s = StyleSheet.create({
  screen:      { flex: 1, backgroundColor: C.bg },
  listContent: { paddingHorizontal: 16, paddingBottom: 40 },

  // ── App header
  appHeader: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    paddingTop:     12,
    paddingBottom:  20,
  },
  appLogo: {
    fontSize:   22,
    fontWeight: '700',
    color:      C.text,
    letterSpacing: -0.5,
  },
  appSub: { fontSize: 12, color: C.textMuted, marginTop: 2 },
  adminPill: {
    flexDirection:  'row',
    alignItems:     'center',
    backgroundColor: C.greenDim,
    borderRadius:   20,
    paddingHorizontal: 10,
    paddingVertical:   5,
    gap: 5,
  },
  adminPillText: { fontSize: 12, fontWeight: '600', color: C.green },

  // ── Summary
  summaryRow: {
    flexDirection:  'row',
    gap:            10,
    marginBottom:   24,
  },
  statCard: {
    flex:           1,
    backgroundColor: C.card,
    borderRadius:   14,
    padding:        14,
    alignItems:     'center',
    borderWidth:    1,
    borderColor:    C.border,
  },
  statIcon: {
    width:         32,
    height:        32,
    borderRadius:  10,
    alignItems:    'center',
    justifyContent:'center',
    marginBottom:   8,
  },
  statValue: { fontSize: 22, fontWeight: '700', marginBottom: 2 },
  statLabel: { fontSize: 10, color: C.textMuted, textAlign: 'center', fontWeight: '500' },

  // ── Section bar
  sectionBar: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    marginBottom:   12,
  },
  sectionLabel: { fontSize: 16, fontWeight: '700', color: C.text },
  createBtn: {
    flexDirection:  'row',
    alignItems:     'center',
    backgroundColor: C.green,
    borderRadius:   10,
    paddingHorizontal: 14,
    paddingVertical:    8,
    gap: 4,
  },
  createBtnText: { fontSize: 13, fontWeight: '700', color: '#000' },

  // ── Tabs
  tabRow: {
    flexDirection:  'row',
    gap:            8,
    marginBottom:   14,
  },
  tab: {
    flexDirection:  'row',
    alignItems:     'center',
    paddingHorizontal: 12,
    paddingVertical:    7,
    borderRadius:   20,
    backgroundColor: C.pill,
    borderWidth:    1,
    borderColor:    C.border,
  },
  tabActive: {
    backgroundColor: 'rgba(34,197,94,0.15)',
    borderColor:     C.green,
  },
  tabText:       { fontSize: 13, color: C.textMuted, fontWeight: '500' },
  tabTextActive: { color: '#fff', fontWeight: '600' },

  // ── Post row
  postRow: {
    backgroundColor: C.card,
    borderRadius:    14,
    padding:         16,
    marginBottom:    10,
    borderWidth:     1,
    borderColor:     C.border,
  },
  typePill: {
    flexDirection:  'row',
    alignItems:     'center',
    alignSelf:      'flex-start',
    borderRadius:   20,
    paddingHorizontal: 8,
    paddingVertical:   3,
    marginBottom:   8,
    gap: 4,
  },
  typePillText:  { fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
  postRowTitle:  { fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 4 },
  postRowBody:   { fontSize: 13, color: C.textSub, lineHeight: 19, marginBottom: 12 },
  postRowFooter: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    marginTop:      4,
  },
  postRowTime:    { fontSize: 11, color: C.textMuted },
  postRowActions: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            4,
    paddingHorizontal: 10,
    paddingVertical:    5,
    borderRadius:   8,
    backgroundColor: C.pill,
    borderWidth:    1,
    borderColor:    C.border,
  },
  actionBtnDanger: {
    backgroundColor: C.redGlow,
    borderColor:     'rgba(239,68,68,0.2)',
  },
  actionBtnText: { fontSize: 12, color: C.textSub, fontWeight: '500' },

  // ── Empty / loading states
  stateBox: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  stateText: { fontSize: 13, color: C.textMuted, textAlign: 'center' },

  // ── Modal / Sheet
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    position:        'absolute',
    bottom:          0,
    left:            0,
    right:           0,
    backgroundColor: C.surface,
    borderTopLeftRadius:  24,
    borderTopRightRadius: 24,
    maxHeight:       '90%',
    borderWidth:     1,
    borderColor:     C.border,
    overflow:        'hidden',
  },
  sheetHandle: {
    width:           40,
    height:          4,
    borderRadius:    2,
    backgroundColor: C.border,
    alignSelf:       'center',
    marginTop:       12,
    marginBottom:    4,
  },
  sheetHeader: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    paddingHorizontal: 20,
    paddingVertical:   16,
    borderBottomWidth: 1,
    borderColor:       C.border,
  },
  sheetTitle: { fontSize: 17, fontWeight: '700', color: C.text },
  sheetClose: {
    width:          32,
    height:         32,
    borderRadius:   10,
    backgroundColor: C.pill,
    alignItems:     'center',
    justifyContent: 'center',
  },
  sheetBody:   { padding: 20, paddingBottom: 8 },
  sheetFooter: {
    padding:       16,
    borderTopWidth: 1,
    borderColor:   C.border,
  },

  // ── Form fields
  fieldLabel: {
    fontSize:     12,
    fontWeight:   '600',
    color:        C.textSub,
    marginBottom: 8,
    textTransform:'uppercase',
    letterSpacing: 0.6,
  },
  fieldHint: {
    fontSize:     11,
    color:        C.textMuted,
    marginTop:    -4,
    marginBottom: 10,
    fontStyle:    'italic',
  },
  input: {
    backgroundColor: C.card,
    borderWidth:     1,
    borderColor:     C.border,
    borderRadius:    12,
    paddingHorizontal: 14,
    paddingVertical:   12,
    color:           C.text,
    fontSize:        14,
    marginBottom:    16,
  },
  inputMultiline: { minHeight: 110, paddingTop: 12 },

  // ── Type toggle
  typeToggle: {
    flexDirection:  'row',
    gap:            8,
    marginBottom:   16,
  },
  typeToggleBtn: {
    flex:           1,
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius:   12,
    borderWidth:    1,
    borderColor:    C.border,
    backgroundColor: C.card,
  },
  typeToggleBtnActive: {
    backgroundColor: C.greenDim,
    borderColor:     C.green,
  },
  typeToggleBtnText:       { fontSize: 13, color: C.textMuted, fontWeight: '500' },
  typeToggleBtnTextActive: { color: C.green, fontWeight: '600' },

  // ── Poll options
  pollOptionRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           8,
    marginBottom:  10,
  },
  pollOptionRemove: { padding: 4 },
  addOptionBtn: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            6,
    paddingVertical: 10,
    justifyContent: 'center',
    borderWidth:    1,
    borderColor:    'rgba(34,197,94,0.3)',
    borderRadius:   12,
    borderStyle:    'dashed',
    marginBottom:   8,
  },
  addOptionBtnText: { fontSize: 13, color: C.green, fontWeight: '600' },

  // ── Save button
  saveBtn: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    backgroundColor: C.green,
    borderRadius:   14,
    paddingVertical: 14,
  },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: '#000' },
});