import React, { useState, useMemo, createContext, useContext } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StatusBar,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { makeStyles } from './AdminResultsScreen.styles';
import { useThemeColors } from '../../theme';
import { useThemeStore } from '../../stores/themeStore';

const { width } = Dimensions.get('window');

type Styles = ReturnType<typeof makeStyles>;

// ─── DUMMY DATA ───────────────────────────────────────────────────────────────

type Candidate = { name: string; votes: number };
type Position  = { title: string; candidates: Candidate[] };
type CollegeData = { [college: string]: Position[] };

const RAW_DATA: CollegeData = {
  'Executive Council': [
    { title: 'President',      candidates: [{ name: 'Maria Santos', votes: 312 }, { name: 'Jose Reyes', votes: 278 }, { name: 'Ana Dela Cruz', votes: 195 }] },
    { title: 'Vice President', candidates: [{ name: 'Carlo Mendoza', votes: 401 }, { name: 'Liza Bautista', votes: 334 }, { name: 'Mark Villanueva', votes: 210 }] },
    { title: 'Secretary',      candidates: [{ name: 'Sofia Torres', votes: 445 }, { name: 'Ryan Flores', votes: 389 }] },
    { title: 'Treasurer',      candidates: [{ name: 'Patricia Gomez', votes: 420 }, { name: 'Daniel Aquino', votes: 365 }, { name: 'Camille Navarro', votes: 150 }] },
  ],
  CITE: [
    { title: 'President',      candidates: [{ name: 'Kevin Tan', votes: 88 }, { name: 'Rachel Uy', votes: 74 }, { name: 'James Co', votes: 52 }] },
    { title: 'Vice President', candidates: [{ name: 'Nicole Sy', votes: 101 }, { name: 'Brian Lim', votes: 89 }] },
    { title: 'Secretary',      candidates: [{ name: 'Trisha Wong', votes: 95 }, { name: 'Andrei Cruz', votes: 88 }, { name: 'Mia Dizon', votes: 31 }] },
    { title: 'Treasurer',      candidates: [{ name: 'Luis Chua', votes: 110 }, { name: 'Vanessa Ong', votes: 84 }] },
  ],
  CBEAM: [
    { title: 'President',      candidates: [{ name: 'Ella Ramos', votes: 67 }, { name: 'Marco Yap', votes: 55 }, { name: 'Jana Roxas', votes: 40 }] },
    { title: 'Vice President', candidates: [{ name: 'Dino Pascual', votes: 72 }, { name: 'Sheena Alba', votes: 61 }] },
    { title: 'Secretary',      candidates: [{ name: 'Kristine Delos Reyes', votes: 80 }, { name: 'Paolo Serrano', votes: 58 }] },
    { title: 'Treasurer',      candidates: [{ name: 'Bianca Hilario', votes: 77 }, { name: 'Enrique Magno', votes: 65 }, { name: 'Lourdes Perez', votes: 20 }] },
  ],
  CON: [
    { title: 'President',      candidates: [{ name: 'Grace Dimaculangan', votes: 54 }, { name: 'Harold Vizcaya', votes: 47 }] },
    { title: 'Vice President', candidates: [{ name: 'Ivy Tolentino', votes: 60 }, { name: 'Renz Malabanan', votes: 41 }] },
    { title: 'Secretary',      candidates: [{ name: 'Abby Castillo', votes: 55 }, { name: 'Noel Soriano', votes: 46 }] },
    { title: 'Treasurer',      candidates: [{ name: 'Fiona Alcantara', votes: 63 }, { name: 'Gerald Estrada', votes: 38 }] },
  ],
  CEAS: [
    { title: 'President',      candidates: [{ name: 'Diana Mercado', votes: 92 }, { name: 'Eric Bondoc', votes: 76 }, { name: 'Lyra Manalo', votes: 44 }] },
    { title: 'Vice President', candidates: [{ name: 'Felix Hernandez', votes: 99 }, { name: 'Gina Macapagal', votes: 83 }] },
    { title: 'Secretary',      candidates: [{ name: 'Hannah Espinosa', votes: 105 }, { name: 'Ivan Lorenzo', votes: 79 }, { name: 'Jasmine Padilla', votes: 28 }] },
    { title: 'Treasurer',      candidates: [{ name: 'Kenneth Reyes', votes: 88 }, { name: 'Lorraine Salazar', votes: 73 }] },
  ],
  CIHTM: [
    { title: 'President',      candidates: [{ name: 'Mara Dalisay', votes: 45 }, { name: 'Nathan Evangelista', votes: 38 }] },
    { title: 'Vice President', candidates: [{ name: 'Olivia Francisco', votes: 50 }, { name: 'Patrick Guerrero', votes: 33 }] },
    { title: 'Secretary',      candidates: [{ name: 'Queen Ignacio', votes: 47 }, { name: 'Robert Jacinto', votes: 36 }] },
    { title: 'Treasurer',      candidates: [{ name: 'Stella Katipunan', votes: 52 }, { name: 'Timothy Lacson', votes: 31 }] },
  ],
};

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
  President: '', 'Vice President': '', Secretary: '', Treasurer: '',
};

function getTotalVotes(candidates: Candidate[]): number {
  return candidates.reduce((sum, c) => sum + c.votes, 0);
}

function getDataForTab(tab: string): { college: string; positions: Position[] }[] {
  if (tab === 'All') return Object.entries(RAW_DATA).map(([college, positions]) => ({ college, positions }));
  if (RAW_DATA[tab]) return [{ college: tab, positions: RAW_DATA[tab] }];
  return [];
}

// ─── SUB-COMPONENTS ──────────────────────────────────────────────────────────

function CandidateBar({ candidate, total, rank, accentColor, styles }: {
  candidate: Candidate; total: number; rank: number; accentColor: string; styles: Styles;
}) {
  const pct       = total > 0 ? Math.round((candidate.votes / total) * 100) : 0;
  const isLeading = rank === 0;
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
  position: Position; accentColor: string; styles: Styles;
}) {
  const total  = getTotalVotes(position.candidates);
  const sorted = [...position.candidates].sort((a, b) => b.votes - a.votes);
  const icon   = POSITION_ICONS[position.title] ?? '🗳️';
  return (
    <View style={styles.positionCard}>
      <View style={styles.positionHeader}>
        <Text style={styles.positionIcon}>{icon}</Text>
        <Text style={styles.positionTitle}>{position.title}</Text>
        <View style={[styles.totalBadge, { borderColor: accentColor }]}>
          <Text style={[styles.totalText, { color: accentColor }]}>{total} votes</Text>
        </View>
      </View>
      {sorted.map((candidate, idx) => (
        <CandidateBar key={candidate.name} candidate={candidate} total={total} rank={idx} accentColor={accentColor} styles={styles} />
      ))}
    </View>
  );
}

function CollegeSection({ college, positions, styles }: {
  college: string; positions: Position[]; styles: Styles;
}) {
  const color         = COLLEGE_COLORS[college] ?? '#888';
  const totalAllVotes = positions.reduce((sum, p) => sum + getTotalVotes(p.candidates), 0);
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
        <PositionCard key={pos.title} position={pos} accentColor={color} styles={styles} />
      ))}
    </View>
  );
}

// ─── MAIN SCREEN ─────────────────────────────────────────────────────────────

export function AdminResultsScreen() {
  const C                  = useThemeColors();
  const { isDark }         = useThemeStore();
  const styles             = useMemo(() => makeStyles(C), [C]);
  const [activeTab, setActiveTab] = useState('All');

  const sections   = getDataForTab(activeTab);
  const grandTotal = Object.values(RAW_DATA)
    .flat()
    .reduce((sum, pos) => sum + getTotalVotes(pos.candidates), 0);

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
          const color    = COLLEGE_COLORS[tab];
          return (
            <Pressable
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={({ pressed }) => [
                styles.tab,
                isActive && styles.tabActive,
                isActive && color ? { borderBottomColor: color } : {},
                pressed && { opacity: 0.85 },
              ]}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive, isActive && color ? { color } : {}]}>
                {tab}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* ── Content ── */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner} showsVerticalScrollIndicator={false}>
        {sections.map(({ college, positions }) => (
          <CollegeSection key={college} college={college} positions={positions} styles={styles} />
        ))}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}