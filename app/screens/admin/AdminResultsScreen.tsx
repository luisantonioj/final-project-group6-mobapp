// app/screens/admin/AdminResultsScreen.tsx
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { makeStyles } from './AdminResultsScreen.styles';
import { useThemeColors } from '../../theme';
import { useThemeStore } from '../../stores/themeStore';
import { useLiveResults, LivePosition, LiveCandidate } from '../../hooks/useLiveResults';

type Styles = ReturnType<typeof makeStyles>;

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const TABS = ['All', 'Executive Council', 'CITE', 'CBEAM', 'CON', 'CEAS', 'CIHTM'];

const COLLEGE_COLORS: { [key: string]: string } = {
  'Executive Council': '#3e9b43',
  CITE:   '#c20000',
  CBEAM:  '#6b7aff',
  CON:    '#F7A440',
  CEAS:   '#4e85cd',
  CIHTM:  '#A78BFA',
};

const POSITION_ICONS: { [key: string]: string } = {
  President: '👑', 
  'Vice President': '⭐', 
  Secretary: '📝', 
  Treasurer: '💰',
};

// ─── SUB-COMPONENTS ──────────────────────────────────────────────────────────

function CandidateBar({ candidate, total, rank, accentColor, styles }: {
  candidate: LiveCandidate; total: number; rank: number; accentColor: string; styles: Styles;
}) {
  const pct = total > 0 ? Math.round((candidate.votes / total) * 100) : 0;
  const isLeading = rank === 0 && candidate.votes > 0;
  
  return (
    <View style={styles.candidateRow}>
      <View style={styles.candidateMeta}>
        <View style={[styles.rankBadge, isLeading && { backgroundColor: accentColor }]}>
          <Text style={[styles.rankText, isLeading && { color: '#fff' }]}>#{rank + 1}</Text>
        </View>
        <Text style={styles.candidateName} numberOfLines={1}>{candidate.name}</Text>
        <Text style={[styles.candidateVotes, { color: accentColor }]}>{candidate.votes}</Text>
      </View>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: isLeading ? accentColor : accentColor + '66' }]} />
        <Text style={styles.pctLabel}>{pct}%</Text>
      </View>
    </View>
  );
}

function PositionCard({ position, accentColor, styles }: {
  position: LivePosition; accentColor: string; styles: Styles;
}) {
  const icon = POSITION_ICONS[position.position_name] ?? '🗳️';
  
  return (
    <View style={styles.positionCard}>
      <View style={styles.positionHeader}>
        <Text style={styles.positionIcon}>{icon}</Text>
        <Text style={styles.positionTitle}>{position.position_name}</Text>
        <View style={[styles.totalBadge, { borderColor: accentColor }]}>
          <Text style={[styles.totalText, { color: accentColor }]}>{position.totalVotes} votes</Text>
        </View>
      </View>
      {position.candidates.map((candidate, idx) => (
        <CandidateBar 
          key={candidate.id} 
          candidate={candidate} 
          total={position.totalVotes} 
          rank={idx} 
          accentColor={accentColor} 
          styles={styles} 
        />
      ))}
    </View>
  );
}

function CollegeSection({ college, positions, styles }: {
  college: string; positions: LivePosition[]; styles: Styles;
}) {
  const color = COLLEGE_COLORS[college] ?? '#888';
  
  // Calculate total votes for this specific college
  const totalAllVotes = positions.reduce((sum, p) => sum + p.totalVotes, 0);
  
  // Don't render empty sections
  if (positions.length === 0) return null;

  return (
    <View style={styles.collegeSection}>
      <View style={[styles.collegeBanner, { borderLeftColor: color }]}>
        <View>
          <Text style={styles.collegeName}>{college}</Text>
          <Text style={styles.collegeStat}>{totalAllVotes.toLocaleString()} total votes cast</Text>
        </View>
        <View style={[styles.collegeChip, { backgroundColor: color + '22' }]}>
          <Text style={[styles.collegeChipText, { color }]}>{positions.length} positions</Text>
        </View>
      </View>
      {positions.map(pos => (
        <PositionCard key={pos.id} position={pos} accentColor={color} styles={styles} />
      ))}
    </View>
  );
}

// ─── MAIN SCREEN ─────────────────────────────────────────────────────────────

export function AdminResultsScreen() {
  const C = useThemeColors();
  const { isDark } = useThemeStore();
  const styles = useMemo(() => makeStyles(C), [C]);
  
  const [activeTab, setActiveTab] = useState('All');

  // Hook into our live Supabase data
  const { positions, isLoading, isError, error, refetch } = useLiveResults();

  // Calculate the massive global total across everything
  const grandTotal = useMemo(() => {
    return positions.reduce((sum, pos) => sum + pos.totalVotes, 0);
  }, [positions]);

  // Group and filter the data dynamically based on the active tab
  const groupedSections = useMemo(() => {
    if (activeTab === 'All') {
      // Group everything by college
      const grouped = positions.reduce((acc, pos) => {
        const col = pos.college || 'Executive Council';
        if (!acc[col]) acc[col] = [];
        acc[col].push(pos);
        return acc;
      }, {} as Record<string, LivePosition[]>);

      // Map to array of sections (you can also map to control display order if needed)
      return Object.entries(grouped).map(([college, posList]) => ({
        college,
        positions: posList,
      }));
    } else {
      // Filter just for the selected tab
      const filtered = positions.filter(p => (p.college || 'Executive Council') === activeTab);
      return [{ college: activeTab, positions: filtered }];
    }
  }, [positions, activeTab]);

  if (isLoading && positions.length === 0) {
    return (
      <SafeAreaView style={[styles.safe, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={C.green} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={C.bg} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerLabel}>ADMIN PANEL</Text>
          <Text style={styles.headerTitle}>Live Voting</Text>
        </View>
        <View style={styles.liveChip}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      </View>

      {/* ── Grand Total ── */}
      <View style={styles.summaryBar}>
        <Text style={styles.summaryLabel}>Total Votes Cast</Text>
        <Text style={styles.summaryCount}>{grandTotal.toLocaleString()}</Text>
      </View>

      {/* ── Tabs ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabScroll}
        contentContainerStyle={styles.tabContainer}
      >
        {TABS.map(tab => {
          const isActive = tab === activeTab;
          const color = COLLEGE_COLORS[tab] || '#888';
          return (
            <Pressable
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={({ pressed }) => [
                styles.tab,
                isActive && styles.tabActive,
                isActive && tab !== 'All' ? { borderBottomColor: color } : {},
                pressed && { opacity: 0.85 },
              ]}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive, isActive && tab !== 'All' ? { color } : {}]}>
                {tab}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* ── Content ── */}
      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.contentInner} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading && positions.length > 0} onRefresh={refetch} tintColor={C.green} />
        }
      >
        {isError ? (
           <Text style={{ color: '#ef4444', textAlign: 'center', marginVertical: 20 }}>
             {error || 'Failed to load live results.'}
           </Text>
        ) : groupedSections.length === 0 ? (
           <Text style={{ color: C.textMuted, textAlign: 'center', marginVertical: 40 }}>
             No positions found for {activeTab}.
           </Text>
        ) : (
          groupedSections.map(({ college, positions }) => (
            <CollegeSection key={college} college={college} positions={positions} styles={styles} />
          ))
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}