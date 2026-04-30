import { StyleSheet } from 'react-native';
import { T } from '../../theme';

export const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: T.bg,
  },

  // Header
  header: {
    flexDirection:     'row',
    justifyContent:    'space-between',
    alignItems:        'center',
    paddingHorizontal: 20,
    paddingTop:        12,
    paddingBottom:     8,
    backgroundColor:   T.bg,
  },
  headerLabel: {
    fontSize:      10,
    letterSpacing: 2,
    color:         T.textMuted,
    fontWeight:    '700',
    marginBottom:  2,
  },
  headerTitle: {
    fontSize:      24,
    fontWeight:    '800',
    color:         T.text,
    letterSpacing: -0.5,
  },
  liveChip: {
    flexDirection:     'row',
    alignItems:        'center',
    backgroundColor:   'rgba(220,38,38,0.08)',
    borderRadius:      20,
    paddingHorizontal: 10,
    paddingVertical:   5,
    borderWidth:       1,
    borderColor:       'rgba(220,38,38,0.25)',
  },
  liveDot: {
    width:           6,
    height:          6,
    borderRadius:    3,
    backgroundColor: T.red,
    marginRight:     5,
  },
  liveText: {
    color:         T.red,
    fontSize:      10,
    fontWeight:    '800',
    letterSpacing: 1.5,
  },

  // Summary bar
  summaryBar: {
    flexDirection:     'row',
    justifyContent:    'space-between',
    alignItems:        'center',
    marginHorizontal:  20,
    marginBottom:      4,
    backgroundColor:   T.surface,
    borderRadius:      12,
    paddingHorizontal: 16,
    paddingVertical:   10,
    borderWidth:       1,
    borderColor:       T.border,
    shadowColor:       '#000',
    shadowOffset:      { width: 0, height: 1 },
    shadowOpacity:     0.04,
    shadowRadius:      3,
    elevation:         1,
  },
  summaryLabel: {
    color:     T.textMuted,
    fontSize:  12,
    fontWeight:'500',
  },
  summaryCount: {
    color:     T.text,
    fontSize:  18,
    fontWeight:'800',
  },

  // Tabs
  tabScroll: {
    flexGrow: 0,
    marginTop: 8,
  },
  tabContainer: {
    paddingHorizontal: 16,
    gap:               4,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical:   10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginRight:       2,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: T.green,
  },
  tabText: {
    color:     T.textMuted,
    fontSize:  13,
    fontWeight:'600',
  },
  tabTextActive: {
    color:     T.green,
    fontWeight:'700',
  },

  // Content
  content: {
    flex:      1,
    marginTop: 12,
  },
  contentInner: {
    paddingHorizontal: 16,
  },

  // College section
  collegeSection: {
    marginBottom: 28,
  },
  collegeBanner: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    borderLeftWidth:4,
    paddingLeft:    12,
    marginBottom:   12,
  },
  collegeName: {
    color:         T.text,
    fontSize:      16,
    fontWeight:    '800',
    letterSpacing: -0.3,
  },
  collegeStat: {
    color:     T.textMuted,
    fontSize:  11,
    marginTop: 1,
  },
  collegeChip: {
    borderRadius:      20,
    paddingHorizontal: 10,
    paddingVertical:   4,
  },
  collegeChipText: {
    fontSize:  11,
    fontWeight:'700',
  },

  // Position card
  positionCard: {
    backgroundColor: T.surface,
    borderRadius:    14,
    padding:         14,
    marginBottom:    10,
    borderWidth:     1,
    borderColor:     T.border,
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 1 },
    shadowOpacity:   0.04,
    shadowRadius:    3,
    elevation:       1,
  },
  positionHeader: {
    flexDirection: 'row',
    alignItems:    'center',
    marginBottom:  12,
  },
  positionIcon: {
    fontSize:    16,
    marginRight: 6,
  },
  positionTitle: {
    flex:       1,
    color:      T.text,
    fontSize:   14,
    fontWeight: '700',
  },
  totalBadge: {
    borderRadius:      20,
    borderWidth:       1,
    paddingHorizontal: 8,
    paddingVertical:   3,
  },
  totalText: {
    fontSize:  10,
    fontWeight:'700',
  },

  // Candidate row
  candidateRow: {
    marginBottom: 10,
  },
  candidateMeta: {
    flexDirection: 'row',
    alignItems:    'center',
    marginBottom:  5,
  },
  rankBadge: {
    width:           20,
    height:          20,
    borderRadius:    10,
    backgroundColor: T.surface2,
    alignItems:      'center',
    justifyContent:  'center',
    marginRight:     8,
  },
  rankText: {
    color:     T.textMuted,
    fontSize:  9,
    fontWeight:'800',
  },
  candidateName: {
    flex:       1,
    color:      T.textSub,
    fontSize:   13,
    fontWeight: '500',
  },
  candidateVotes: {
    fontSize:  13,
    fontWeight:'800',
  },
  barTrack: {
    height:        6,
    backgroundColor: T.surface2,
    borderRadius:  3,
    overflow:      'hidden',
    flexDirection: 'row',
    alignItems:    'center',
  },
  barFill: {
    height:       '100%',
    borderRadius: 3,
  },
  pctLabel: {
    position:  'absolute',
    right:     0,
    color:     T.textMuted,
    fontSize:  9,
    fontWeight:'600',
  },
});