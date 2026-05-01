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
import { Ionicons } from '@expo/vector-icons';
import { makeStyles } from './AdminResultsScreen.styles';
import type { AdminResultsStyles } from './AdminResultsScreen.styles';
import { useThemeColors } from '../../theme';
import { useThemeStore } from '../../stores/themeStore';
import { useLiveResults, LivePosition, LiveCandidate } from '../../hooks/useLiveResults';

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

function CandidateBar({ candidate, total, rank, accentColor, S }: {
  candidate: LiveCandidate; total: number; rank: number; accentColor: string; S: AdminResultsStyles;
}) {
  const pct = total > 0 ? Math.round((candidate.votes / total) * 100) : 0;
  const isLeading = rank === 0 && candidate.votes > 0;
  
  return (
    <View style={S.candidate.row}>
      <View style={S.candidate.meta}>
        <View style={[S.candidate.rankBadge, isLeading && { backgroundColor: accentColor }]}>
          <Text style={[S.candidate.rankText, isLeading && { color: '#fff' }]}>#{rank + 1}</Text>
        </View>
        <Text style={S.candidate.name} numberOfLines={1}>{candidate.name}</Text>
        <Text style={[S.candidate.votes, { color: accentColor }]}>{candidate.votes}</Text>
      </View>
      <View style={S.candidate.barTrack}>
        <View style={[S.candidate.barFill, { width: `${pct}%`, backgroundColor: isLeading ? accentColor : accentColor + '66' }]} />
        <Text style={S.candidate.pctLabel}>{pct}%</Text>
      </View>
    </View>
  );
}

function PositionCard({ position, accentColor, S }: {
  position: LivePosition; accentColor: string; S: AdminResultsStyles;
}) {
  const icon = POSITION_ICONS[position.position_name] ?? '🗳️';
  
  return (
    <View style={S.card.wrapper}>
      <View style={S.card.header}>
        <Text style={S.card.icon}>{icon}</Text>
        <Text style={S.card.title}>{position.position_name}</Text>
        <View style={[S.card.badge, { borderColor: accentColor }]}>
          <Text style={[S.card.badgeText, { color: accentColor }]}>{position.totalVotes} votes</Text>
        </View>
      </View>
      {position.candidates.map((candidate, idx) => (
        <CandidateBar 
          key={candidate.id} 
          candidate={candidate} 
          total={position.totalVotes} 
          rank={idx} 
          accentColor={accentColor} 
          S={S} 
        />
      ))}
    </View>
  );
}

function CollegeSection({ college, positions, S }: {
  college: string; positions: LivePosition[]; S: AdminResultsStyles;
}) {
  const color = COLLEGE_COLORS[college] ?? '#888';
  
  // Calculate total votes for this specific college
  const totalAllVotes = positions.reduce((sum, p) => sum + p.totalVotes, 0);
  
  // Don't render empty sections
  if (positions.length === 0) return null;

  return (
    <View style={S.college.section}>
      <View style={[S.college.banner, { borderLeftColor: color }]}>
        <View>
          <Text style={S.college.name}>{college}</Text>
          <Text style={S.college.stat}>{totalAllVotes.toLocaleString()} total votes cast</Text>
        </View>
        <View style={[S.college.chip, { backgroundColor: color + '22' }]}>
          <Text style={[S.college.chipText, { color }]}>{positions.length} positions</Text>
        </View>
      </View>
      {positions.map(pos => (
        <PositionCard key={pos.id} position={pos} accentColor={color} S={S} />
      ))}
    </View>
  );
}

// ─── MAIN SCREEN ─────────────────────────────────────────────────────────────

export function AdminResultsScreen() {
  const C = useThemeColors();
  const { isDark, toggleTheme } = useThemeStore();
  const S = useMemo(() => makeStyles(C), [C]);
  
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

  return (
    <SafeAreaView style={S.screen.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={C.bg} />

      {/* ── Header (Matches AdminCandidatesScreen exactly) ── */}
      <View style={S.screen.header}>
        <View>
          <Text style={S.screen.headerTitle}>Live Results</Text>
          <Text style={S.screen.headerSub}>
            Total votes cast: {grandTotal.toLocaleString()}
          </Text>
        </View>
        
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={S.live.chip}>
            <View style={S.live.dot} />
            <Text style={S.live.text}>LIVE</Text>
          </View>
          
          <View style={S.live.controlsRow}>
            <Pressable
              onPress={refetch}
              disabled={isLoading}
              style={({ pressed }) => [S.live.iconBtn, !isLoading && pressed && { opacity: 0.7 }]}
            >
              <Ionicons name="refresh-outline" size={20} color={C.text} />
            </Pressable>
            <Pressable onPress={toggleTheme} style={({ pressed }) => [S.live.iconBtn, pressed && { opacity: 0.7 }]}>
              <Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={20} color={C.text} />
            </Pressable>
          </View>
        </View>
      </View>

      {isLoading && positions.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={C.green} />
        </View>
      ) : (
        <ScrollView 
          contentContainerStyle={S.screen.scrollContent} 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isLoading && positions.length > 0} onRefresh={refetch} tintColor={C.green} />
          }
        >
          {/* ── Pill Tabs (Matches Dashboard filtering) ── */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={S.filter.scrollRow}
          >
            <View style={S.filter.innerRow}>
              {TABS.map(tab => {
                const isActive = tab === activeTab;
                const tabColor = COLLEGE_COLORS[tab] || C.green;
                
                return (
                  <Pressable
                    key={tab}
                    onPress={() => setActiveTab(tab)}
                    style={({ pressed }) => [
                      S.filter.tab,
                      isActive && { backgroundColor: tabColor + '1A', borderColor: tabColor },
                      pressed && { opacity: 0.85 },
                    ]}
                  >
                    <Text style={[S.filter.tabText, isActive && S.filter.tabTextActive, isActive && { color: tabColor }]}>
                      {tab}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          {/* ── Content ── */}
          {isError ? (
            <View style={S.empty.wrapper}>
              <Text style={S.empty.icon}>⚠️</Text>
              <Text style={S.empty.title}>Failed to load</Text>
              <Text style={S.empty.body}>{error || 'Could not connect to live results.'}</Text>
            </View>
          ) : groupedSections.length === 0 ? (
            <View style={S.empty.wrapper}>
              <Text style={S.empty.icon}>🗳️</Text>
              <Text style={S.empty.title}>No Results</Text>
              <Text style={S.empty.body}>No positions found for {activeTab}.</Text>
            </View>
          ) : (
            groupedSections.map(({ college, positions }) => (
              <CollegeSection key={college} college={college} positions={positions} S={S} />
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}