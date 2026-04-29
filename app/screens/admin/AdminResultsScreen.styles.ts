import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0A0F0A',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerLabel: {
    fontSize: 10,
    letterSpacing: 2,
    color: '#555',
    fontWeight: '700',
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#F0F0F0',
    letterSpacing: -0.5,
  },
  liveChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF3B3022',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#FF3B3055',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF3B30',
    marginRight: 5,
  },
  liveText: {
    color: '#FF3B30',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },

  // Summary bar
  summaryBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 4,
    backgroundColor: '#1A1D26',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  summaryLabel: {
    color: '#888',
    fontSize: 12,
    fontWeight: '500',
  },
  summaryCount: {
    color: '#F0F0F0',
    fontSize: 18,
    fontWeight: '800',
  },

  // Tabs
  tabScroll: {
    flexGrow: 0,
    marginTop: 8,
  },
  tabContainer: {
    paddingHorizontal: 16,
    gap: 4,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginRight: 2,
  },
  tabActive: {
    borderBottomWidth: 2,
  },
  tabText: {
    color: '#555',
    fontSize: 13,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#F0F0F0',
    fontWeight: '700',
  },

  // Content
  content: {
    flex: 1,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderLeftWidth: 4,
    paddingLeft: 12,
    marginBottom: 12,
  },
  collegeName: {
    color: '#F0F0F0',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  collegeStat: {
    color: '#555',
    fontSize: 11,
    marginTop: 1,
  },
  collegeChip: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  collegeChipText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Position card
  positionCard: {
    backgroundColor: '#111811',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  positionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  positionIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  positionTitle: {
    flex: 1,
    color: '#E0E0E0',
    fontSize: 14,
    fontWeight: '700',
  },
  totalBadge: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  totalText: {
    fontSize: 10,
    fontWeight: '700',
  },

  // Candidate row
  candidateRow: {
    marginBottom: 10,
  },
  candidateMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  rankBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#2A2D38',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  rankText: {
    color: '#888',
    fontSize: 9,
    fontWeight: '800',
  },
  candidateName: {
    flex: 1,
    color: '#C8C8C8',
    fontSize: 13,
    fontWeight: '500',
  },
  candidateVotes: {
    fontSize: 13,
    fontWeight: '800',
  },
  barTrack: {
    height: 6,
    backgroundColor: '#2A2D38',
    borderRadius: 3,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  pctLabel: {
    position: 'absolute',
    right: 0,
    color: '#444',
    fontSize: 9,
    fontWeight: '600',
  },
});
