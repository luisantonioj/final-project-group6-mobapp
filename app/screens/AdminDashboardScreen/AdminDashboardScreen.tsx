//Sample NOT actually implemented YET

/**
 * AdminDashboardScreen.tsx
 * AnimoQuorum — DLSL COMELEC Admin Panel
 *
 * Features
 * ─────────────────────────────────────────────────────────────
 *  • Full CRUD on Posts  (announcements + polls)
 *  • Publish / Draft toggling per post
 *  • Results visibility toggle  (hide / reveal live counts from students)
 *  • Countdown controls         (pause, resume, reset, edit end time)
 *  • Voting-open toggle
 *
 * Backend integration checklist
 * ─────────────────────────────────────────────────────────────
 *  1.  Replace every stub inside `adminService` with your real
 *      Supabase / REST calls — the function signatures stay the same.
 *  2.  Wire Supabase real-time subscriptions in useAdminStore's
 *      useEffect (marked with TODO comments).
 *  3.  Delete DUMMY_* constants once live data is flowing.
 *  4.  Guard this screen behind a role check in your navigator.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Switch,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type PostType = 'announcement' | 'poll';

export interface PollOption {
  id: string;
  label: string;
  votes: number;
}

export interface Post {
  id: string;
  type: PostType;
  author: string;
  authorInitials: string;
  role: string;
  time: string;
  title: string;
  body: string;
  likes: number;
  pollOptions?: PollOption[];
  published: boolean;   // false = draft, true = visible to students
  createdAt: string;    // ISO string
  updatedAt: string;    // ISO string
}

export interface Candidate {
  id: string;
  name: string;
  initials: string;
  color: string;
  votes: number;
}

export interface Position {
  id: string;
  label: string;
  candidates: Candidate[];
}

export interface CountdownSettings {
  endsAt: string;           // ISO string — when voting closes
  isPaused: boolean;
  totalDurationMs: number;  // used to compute progress bar %
}

export interface AdminSettings {
  resultsVisible: boolean;    // if false → students see "Results hidden"
  countdownVisible: boolean;  // if false → students see "Voting not started"
  votingOpen: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// BACKEND SERVICE LAYER
// Swap each stub for a real Supabase / REST implementation.
// The hook and components above this layer never change.
// ─────────────────────────────────────────────────────────────────────────────

const adminService = {
  // Posts ────────────────────────────────────────────────────────────────────

  async fetchPosts(): Promise<Post[]> {
    // TODO: const { data } = await supabase.from('posts').select('*').order('created_at', { ascending: false });
    // TODO: return data ?? [];
    return Promise.resolve(DUMMY_POSTS);
  },

  async createPost(
    payload: Omit<Post, 'id' | 'time' | 'createdAt' | 'updatedAt'>,
  ): Promise<Post> {
    // TODO: const { data } = await supabase.from('posts').insert(payload).select().single();
    // TODO: return data;
    const now: Post = {
      ...payload,
      id: Date.now().toString(),
      time: 'just now',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return Promise.resolve(now);
  },

  async updatePost(id: string, payload: Partial<Post>): Promise<Post> {
    // TODO: const { data } = await supabase.from('posts').update(payload).eq('id', id).select().single();
    // TODO: return data;
    return Promise.resolve({
      id,
      updatedAt: new Date().toISOString(),
      ...payload,
    } as Post);
  },

  async deletePost(id: string): Promise<void> {
    // TODO: await supabase.from('posts').delete().eq('id', id);
    return Promise.resolve();
  },

  // Admin settings ───────────────────────────────────────────────────────────

  async fetchSettings(): Promise<AdminSettings> {
    // TODO: const { data } = await supabase.from('admin_settings').select('*').single();
    // TODO: return data;
    return Promise.resolve(DUMMY_SETTINGS);
  },

  async updateSettings(payload: Partial<AdminSettings>): Promise<AdminSettings> {
    // TODO: const { data } = await supabase.from('admin_settings').update(payload).select().single();
    // TODO: return data;
    return Promise.resolve({ ...DUMMY_SETTINGS, ...payload });
  },

  // Countdown ────────────────────────────────────────────────────────────────

  async fetchCountdown(): Promise<CountdownSettings> {
    // TODO: const { data } = await supabase.from('countdown').select('*').single();
    // TODO: return data;
    return Promise.resolve(DUMMY_COUNTDOWN);
  },

  async updateCountdown(payload: Partial<CountdownSettings>): Promise<CountdownSettings> {
    // TODO: const { data } = await supabase.from('countdown').update(payload).select().single();
    // TODO: return data;
    return Promise.resolve({ ...DUMMY_COUNTDOWN, ...payload });
  },

  // Positions / candidates ───────────────────────────────────────────────────

  async fetchPositions(): Promise<Position[]> {
    // TODO: const { data } = await supabase.from('positions').select('*, candidates(*)').order('order');
    // TODO: return data ?? [];
    return Promise.resolve(DUMMY_POSITIONS);
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// DUMMY DATA  — delete once real backend is wired up
// ─────────────────────────────────────────────────────────────────────────────

const DUMMY_POSTS: Post[] = [
  {
    id: '1',
    type: 'announcement',
    author: 'DLSL COMELEC',
    authorInitials: 'CO',
    role: 'Official',
    time: '2h ago',
    title: 'Voting Opens Tomorrow at 8:00 AM',
    body: 'Remind all registered voters to bring their school ID. Voting booths at the gymnasium and student center.',
    likes: 142,
    published: true,
    createdAt: '2026-04-14T08:00:00Z',
    updatedAt: '2026-04-14T08:00:00Z',
  },
  {
    id: '2',
    type: 'poll',
    author: 'DLSL COMELEC',
    authorInitials: 'CO',
    role: 'Official',
    time: '5h ago',
    title: 'Which platform do you prefer for Miting de Avance?',
    body: '',
    likes: 88,
    published: true,
    pollOptions: [
      { id: 'o1', label: 'In-Person',    votes: 312 },
      { id: 'o2', label: 'Online (Zoom)', votes: 198 },
      { id: 'o3', label: 'Hybrid',        votes: 276 },
    ],
    createdAt: '2026-04-14T05:00:00Z',
    updatedAt: '2026-04-14T05:00:00Z',
  },
  {
    id: '3',
    type: 'announcement',
    author: 'Student Affairs',
    authorInitials: 'SA',
    role: 'Admin',
    time: '1d ago',
    title: 'Candidate Verification Completed',
    body: "All 14 candidates have been verified and cleared to run in this year's election.",
    likes: 61,
    published: false,
    createdAt: '2026-04-13T10:00:00Z',
    updatedAt: '2026-04-13T10:00:00Z',
  },
];

const DUMMY_SETTINGS: AdminSettings = {
  resultsVisible:    true,
  countdownVisible:  true,
  votingOpen:        true,
};

const DUMMY_COUNTDOWN: CountdownSettings = {
  endsAt:          new Date(Date.now() + 12 * 3_600_000 + 32 * 60_000 + 9_000).toISOString(),
  isPaused:        false,
  totalDurationMs: 9 * 3_600_000,
};

const DUMMY_POSITIONS: Position[] = [
  {
    id: 'pres',
    label: 'President',
    candidates: [
      { id: 'p1', name: 'XXXX XXXXXXX', initials: 'L', color: '#16A34A', votes: 847 },
      { id: 'p2', name: 'XXXX XXXXXXX', initials: 'R', color: '#1D4ED8', votes: 612 },
      { id: 'p3', name: 'XXXX XXXXXXX', initials: 'M', color: '#7C3AED', votes: 389 },
      { id: 'p4', name: 'XXXX XXXXXXX', initials: 'Y', color: '#B45309', votes: 201 },
    ],
  },
  {
    id: 'vp',
    label: 'Vice Pres.',
    candidates: [
      { id: 'v1', name: 'XXXX XXXXXXX', initials: 'LS', color: '#0891B2', votes: 791 },
      { id: 'v2', name: 'XXXX XXXXXXX', initials: 'PG', color: '#16A34A', votes: 703 },
      { id: 'v3', name: 'XXXX XXXXXXX', initials: 'KL', color: '#B45309', votes: 422 },
    ],
  },
  {
    id: 'sec',
    label: 'Secretary',
    candidates: [
      { id: 's1', name: 'XXXX XXXXXXX', initials: 'BC', color: '#16A34A', votes: 654 },
      { id: 's2', name: 'XXXX XXXXXXX', initials: 'NF', color: '#7C3AED', votes: 498 },
      { id: 's3', name: 'XXXX XXXXXXX', initials: 'LM', color: '#B45309', votes: 311 },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// COLORS
// ─────────────────────────────────────────────────────────────────────────────

const C = {
  bg:        '#0A0D14',
  surface:   '#111827',
  surface2:  '#1C2333',
  border:    '#2A3347',
  accent:    '#22D3EE',
  accentGlow:'rgba(34,211,238,0.12)',
  green:     '#22C55E',
  greenGlow: 'rgba(34,197,94,0.12)',
  red:       '#EF4444',
  redGlow:   'rgba(239,68,68,0.12)',
  amber:     '#F59E0B',
  amberGlow: 'rgba(245,158,11,0.12)',
  text:      '#F1F5F9',
  textSub:   '#94A3B8',
  textMuted: '#64748B',
};

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOM HOOK — useAdminStore
// All state lives here. Swap service stubs inside adminService; this hook
// never needs to change when you switch to real backend calls.
// ─────────────────────────────────────────────────────────────────────────────

function useAdminStore() {
  const [posts,     setPosts]     = useState<Post[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [settings,  setSettings]  = useState<AdminSettings>(DUMMY_SETTINGS);
  const [countdown, setCountdown] = useState<CountdownSettings>(DUMMY_COUNTDOWN);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    // TODO: add Supabase real-time subscriptions here
    Promise.all([
      adminService.fetchPosts(),
      adminService.fetchPositions(),
      adminService.fetchSettings(),
      adminService.fetchCountdown(),
    ]).then(([p, pos, s, c]) => {
      setPosts(p);
      setPositions(pos);
      setSettings(s);
      setCountdown(c);
    }).finally(() => setLoading(false));
  }, []);

  const createPost = useCallback(async (
    payload: Omit<Post, 'id' | 'time' | 'createdAt' | 'updatedAt'>,
  ) => {
    const newPost = await adminService.createPost(payload);
    setPosts(prev => [newPost, ...prev]);
    return newPost;
  }, []);

  const updatePost = useCallback(async (id: string, payload: Partial<Post>) => {
    const updated = await adminService.updatePost(id, payload);
    setPosts(prev => prev.map(p => (p.id === id ? { ...p, ...updated } : p)));
  }, []);

  const deletePost = useCallback(async (id: string) => {
    await adminService.deletePost(id);
    setPosts(prev => prev.filter(p => p.id !== id));
  }, []);

  const togglePublish = useCallback(async (id: string, published: boolean) => {
    await adminService.updatePost(id, { published });
    setPosts(prev => prev.map(p => (p.id === id ? { ...p, published } : p)));
  }, []);

  const updateSettings = useCallback(async (payload: Partial<AdminSettings>) => {
    const updated = await adminService.updateSettings(payload);
    setSettings(updated);
  }, []);

  const updateCountdown = useCallback(async (payload: Partial<CountdownSettings>) => {
    const updated = await adminService.updateCountdown(payload);
    setCountdown(updated);
  }, []);

  return {
    posts, positions, settings, countdown, loading,
    createPost, updatePost, deletePost, togglePublish,
    updateSettings, updateCountdown,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// REUSABLE — ToggleRow
// ─────────────────────────────────────────────────────────────────────────────

interface ToggleRowProps {
  label: string;
  sublabel?: string;
  value: boolean;
  onToggle: (v: boolean) => void;
  color?: string;
}

const ToggleRow: React.FC<ToggleRowProps> = ({
  label, sublabel, value, onToggle, color = C.accent,
}) => (
  <View style={s.toggleRow}>
    <View style={{ flex: 1 }}>
      <Text style={s.toggleLabel}>{label}</Text>
      {sublabel ? <Text style={s.toggleSublabel}>{sublabel}</Text> : null}
    </View>
    <Switch
      value={value}
      onValueChange={onToggle}
      trackColor={{ false: C.border, true: color + '66' }}
      thumbColor={value ? color : C.textMuted}
      ios_backgroundColor={C.border}
    />
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// PANEL — Countdown Control
// ─────────────────────────────────────────────────────────────────────────────

interface CountdownPanelProps {
  countdown: CountdownSettings;
  settings: AdminSettings;
  onUpdateCountdown: (p: Partial<CountdownSettings>) => Promise<void>;
  onUpdateSettings:  (p: Partial<AdminSettings>)    => Promise<void>;
}

const CountdownPanel: React.FC<CountdownPanelProps> = ({
  countdown, settings, onUpdateCountdown, onUpdateSettings,
}) => {
  const [timeLeft,      setTimeLeft]      = useState({ h: 0, m: 0, s: 0 });
  const [editingEnd,    setEditingEnd]    = useState(false);
  const [endDateInput,  setEndDateInput]  = useState(
    countdown.endsAt.slice(0, 16).replace('T', 'T'),
  );

  useEffect(() => {
    const tick = () => {
      if (countdown.isPaused) return;
      const diff = Math.max(0, new Date(countdown.endsAt).getTime() - Date.now());
      setTimeLeft({
        h: Math.floor(diff / 3_600_000),
        m: Math.floor((diff % 3_600_000) / 60_000),
        s: Math.floor((diff % 60_000) / 1_000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [countdown]);

  const pad = (n: number) => String(n).padStart(2, '0');

  const totalMs   = countdown.totalDurationMs;
  const remaining = Math.max(0, new Date(countdown.endsAt).getTime() - Date.now());
  const progress  = Math.min(1, (totalMs - remaining) / totalMs);

  const handleSaveEndTime = () => {
    try {
      const iso = new Date(endDateInput).toISOString();
      onUpdateCountdown({ endsAt: iso });
      setEditingEnd(false);
    } catch {
      Alert.alert('Invalid Date', 'Please enter a valid date-time value.');
    }
  };

  const handleReset = () => {
    Alert.alert('Reset Countdown', 'Unpause and reset to the saved end time?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: () => onUpdateCountdown({ isPaused: false }),
      },
    ]);
  };

  return (
    <View style={s.panel}>
      {/* Header */}
      <View style={s.panelHeader}>
        <Text style={s.panelTitle}>⏱  Countdown Control</Text>
        <View style={[
          s.statusPill,
          { backgroundColor: countdown.isPaused ? C.amberGlow : C.greenGlow },
        ]}>
          <View style={[
            s.statusDot,
            { backgroundColor: countdown.isPaused ? C.amber : C.green },
          ]} />
          <Text style={[
            s.statusPillText,
            { color: countdown.isPaused ? C.amber : C.green },
          ]}>
            {countdown.isPaused ? 'PAUSED' : 'RUNNING'}
          </Text>
        </View>
      </View>

      {/* Timer digits */}
      <View style={s.timerRow}>
        {([timeLeft.h, timeLeft.m, timeLeft.s] as const).map((val, i) => (
          <React.Fragment key={i}>
            <View style={s.timeBlock}>
              <Text style={s.timeValue}>{pad(val)}</Text>
              <Text style={s.timeUnit}>{['Hrs', 'Min', 'Sec'][i]}</Text>
            </View>
            {i < 2 && <Text style={s.timeSep}>:</Text>}
          </React.Fragment>
        ))}
      </View>

      {/* Progress bar */}
      <View style={s.progressTrack}>
        <View style={[s.progressFill, { width: `${Math.round(progress * 100)}%` as any }]} />
      </View>

      {/* End time row */}
      <View style={s.rowBetween}>
        <Text style={s.rowLabel}>End Time</Text>
        {editingEnd ? (
          <View style={s.inlineEdit}>
            <TextInput
              style={s.inlineInput}
              value={endDateInput}
              onChangeText={setEndDateInput}
              placeholder="YYYY-MM-DDTHH:MM"
              placeholderTextColor={C.textMuted}
            />
            <TouchableOpacity style={s.savePill} onPress={handleSaveEndTime}>
              <Text style={s.savePillText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setEditingEnd(false)}>
              <Text style={[s.savePillText, { color: C.textMuted }]}>✕</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity onPress={() => setEditingEnd(true)}>
            <Text style={s.rowValue}>
              {new Date(countdown.endsAt).toLocaleString('en-PH', {
                month: 'short', day: 'numeric',
                hour: '2-digit', minute: '2-digit',
              })} ✎
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Pause / Resume — Reset */}
      <View style={s.btnRow}>
        <TouchableOpacity
          style={[s.controlBtn, {
            backgroundColor: countdown.isPaused ? C.greenGlow : C.amberGlow,
          }]}
          onPress={() => onUpdateCountdown({ isPaused: !countdown.isPaused })}
        >
          <Text style={[s.controlBtnText, {
            color: countdown.isPaused ? C.green : C.amber,
          }]}>
            {countdown.isPaused ? '▶  Resume' : '⏸  Pause'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.controlBtn, { backgroundColor: C.redGlow }]}
          onPress={handleReset}
        >
          <Text style={[s.controlBtnText, { color: C.red }]}>↺  Reset</Text>
        </TouchableOpacity>
      </View>

      <View style={s.divider} />

      {/* Visibility toggles */}
      <ToggleRow
        label="Show countdown to students"
        value={settings.countdownVisible}
        onToggle={v => onUpdateSettings({ countdownVisible: v })}
      />
      <ToggleRow
        label="Voting open"
        value={settings.votingOpen}
        onToggle={v => onUpdateSettings({ votingOpen: v })}
        color={settings.votingOpen ? C.green : C.red}
      />
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// PANEL — Results Visibility
// ─────────────────────────────────────────────────────────────────────────────

interface ResultsPanelProps {
  positions: Position[];
  settings: AdminSettings;
  onUpdateSettings: (p: Partial<AdminSettings>) => Promise<void>;
}

const ResultsPanel: React.FC<ResultsPanelProps> = ({
  positions, settings, onUpdateSettings,
}) => {
  const [activePos, setActivePos] = useState(positions[0]?.id ?? '');

  const position = positions.find(p => p.id === activePos);
  const sorted   = [...(position?.candidates ?? [])].sort((a, b) => b.votes - a.votes);
  const topVotes = sorted[0]?.votes ?? 1;
  const total    = sorted.reduce((s, c) => s + c.votes, 0);

  return (
    <View style={s.panel}>
      {/* Header + live/hidden badge */}
      <View style={s.panelHeader}>
        <Text style={s.panelTitle}>📊  Live Results</Text>
        <View style={[
          s.statusPill,
          { backgroundColor: settings.resultsVisible ? C.greenGlow : C.redGlow },
        ]}>
          <View style={[
            s.statusDot,
            { backgroundColor: settings.resultsVisible ? C.green : C.red },
          ]} />
          <Text style={[
            s.statusPillText,
            { color: settings.resultsVisible ? C.green : C.red },
          ]}>
            {settings.resultsVisible ? 'VISIBLE' : 'HIDDEN'}
          </Text>
        </View>
      </View>

      <ToggleRow
        label="Show results to students"
        value={settings.resultsVisible}
        onToggle={v => onUpdateSettings({ resultsVisible: v })}
        color={settings.resultsVisible ? C.green : C.red}
      />

      <View style={s.divider} />

      {/* Position selector tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginBottom: 12 }}
      >
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {positions.map(pos => (
            <TouchableOpacity
              key={pos.id}
              style={[s.posTab, activePos === pos.id && s.posTabActive]}
              onPress={() => setActivePos(pos.id)}
            >
              <Text style={[s.posTabText, activePos === pos.id && s.posTabTextActive]}>
                {pos.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Candidate leaderboard */}
      {sorted.map((c, idx) => {
        const barPct   = Math.round((c.votes / topVotes) * 100);
        const sharePct = Math.round((c.votes / total) * 100);
        const isLead   = idx === 0;
        return (
          <View key={c.id} style={s.candidateRow}>
            <View style={s.rankBadge}>
              <Text style={[s.rankText, isLead && s.rankTextLead]}>
                {isLead ? '1st' : `#${idx + 1}`}
              </Text>
            </View>
            <View style={[s.miniAvatar, { backgroundColor: c.color + '22' }]}>
              <Text style={[s.miniAvatarText, { color: c.color }]}>{c.initials}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.candidateName}>{c.name}</Text>
              <View style={s.barTrack}>
                <View style={[
                  s.barFill,
                  {
                    width: `${barPct}%` as any,
                    backgroundColor: isLead ? C.accent : C.border,
                  },
                ]} />
              </View>
            </View>
            <View style={{ alignItems: 'flex-end', marginLeft: 8 }}>
              <Text style={[s.voteCount, isLead && { color: C.accent }]}>
                {c.votes.toLocaleString()}
              </Text>
              <Text style={s.votePct}>{sharePct}%</Text>
            </View>
          </View>
        );
      })}

      <Text style={s.totalVotes}>{total.toLocaleString()} total votes cast</Text>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MODAL — Post Form  (Create + Edit)
// ─────────────────────────────────────────────────────────────────────────────

const BLANK_FORM: Omit<Post, 'id' | 'time' | 'createdAt' | 'updatedAt'> = {
  type:           'announcement',
  author:         'DLSL COMELEC',
  authorInitials: 'CO',
  role:           'Official',
  title:          '',
  body:           '',
  likes:          0,
  pollOptions:    [],
  published:      false,
};

interface PostFormModalProps {
  visible: boolean;
  initial: Post | null;   // null → create; Post → edit
  onClose: () => void;
  onSave: (
    payload: Omit<Post, 'id' | 'time' | 'createdAt' | 'updatedAt'>,
    id?: string,
  ) => Promise<void>;
}

const PostFormModal: React.FC<PostFormModalProps> = ({
  visible, initial, onClose, onSave,
}) => {
  const [form,        setForm]        = useState({ ...BLANK_FORM });
  const [saving,      setSaving]      = useState(false);
  const [optionDraft, setOptionDraft] = useState('');

  // Populate form when modal opens
  useEffect(() => {
    if (!visible) return;
    if (initial) {
      const { id, time, createdAt, updatedAt, ...rest } = initial;
      setForm({ ...rest });
    } else {
      setForm({ ...BLANK_FORM });
    }
    setOptionDraft('');
  }, [visible, initial]);

  const addOption = () => {
    const label = optionDraft.trim();
    if (!label) return;
    setForm(f => ({
      ...f,
      pollOptions: [
        ...(f.pollOptions ?? []),
        { id: Date.now().toString(), label, votes: 0 },
      ],
    }));
    setOptionDraft('');
  };

  const removeOption = (id: string) => {
    setForm(f => ({
      ...f,
      pollOptions: (f.pollOptions ?? []).filter(o => o.id !== id),
    }));
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      Alert.alert('Validation', 'Title is required.');
      return;
    }
    if (form.type === 'poll' && (form.pollOptions ?? []).length < 2) {
      Alert.alert('Validation', 'A poll needs at least 2 options.');
      return;
    }
    setSaving(true);
    try {
      await onSave(form, initial?.id);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <ScrollView
              contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
              keyboardShouldPersistTaps="handled"
            >
              {/* Modal header */}
              <View style={s.modalHeader}>
                <Text style={s.modalTitle}>
                  {initial ? '✎  Edit Post' : '+  New Post'}
                </Text>
                <TouchableOpacity style={s.closeBtn} onPress={onClose}>
                  <Text style={s.closeBtnText}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Type selector */}
              <Text style={s.fieldLabel}>Type</Text>
              <View style={s.segmented}>
                {(['announcement', 'poll'] as PostType[]).map(t => (
                  <TouchableOpacity
                    key={t}
                    style={[s.segment, form.type === t && s.segmentActive]}
                    onPress={() => setForm(f => ({ ...f, type: t }))}
                  >
                    <Text style={[s.segmentText, form.type === t && s.segmentTextActive]}>
                      {t === 'announcement' ? '📢  Announcement' : '📊  Poll'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Author */}
              <Text style={s.fieldLabel}>Author Name</Text>
              <TextInput
                style={s.input}
                value={form.author}
                onChangeText={v => setForm(f => ({ ...f, author: v }))}
                placeholder="e.g. DLSL COMELEC"
                placeholderTextColor={C.textMuted}
              />

              {/* Initials + Role */}
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={s.fieldLabel}>Initials</Text>
                  <TextInput
                    style={s.input}
                    value={form.authorInitials}
                    onChangeText={v =>
                      setForm(f => ({ ...f, authorInitials: v.slice(0, 3).toUpperCase() }))
                    }
                    placeholder="CO"
                    placeholderTextColor={C.textMuted}
                    maxLength={3}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.fieldLabel}>Role</Text>
                  <TextInput
                    style={s.input}
                    value={form.role}
                    onChangeText={v => setForm(f => ({ ...f, role: v }))}
                    placeholder="Official"
                    placeholderTextColor={C.textMuted}
                  />
                </View>
              </View>

              {/* Title */}
              <Text style={s.fieldLabel}>Title *</Text>
              <TextInput
                style={s.input}
                value={form.title}
                onChangeText={v => setForm(f => ({ ...f, title: v }))}
                placeholder="Post title…"
                placeholderTextColor={C.textMuted}
              />

              {/* Body (announcement only) */}
              {form.type === 'announcement' && (
                <>
                  <Text style={s.fieldLabel}>Body</Text>
                  <TextInput
                    style={[s.input, { height: 100, textAlignVertical: 'top' }]}
                    value={form.body}
                    onChangeText={v => setForm(f => ({ ...f, body: v }))}
                    placeholder="Write your announcement…"
                    placeholderTextColor={C.textMuted}
                    multiline
                  />
                </>
              )}

              {/* Poll options */}
              {form.type === 'poll' && (
                <>
                  <Text style={s.fieldLabel}>Poll Options *</Text>
                  {(form.pollOptions ?? []).map(opt => (
                    <View key={opt.id} style={s.optionRow}>
                      <Text style={s.optionLabel}>{opt.label}</Text>
                      <TouchableOpacity
                        onPress={() => removeOption(opt.id)}
                        style={s.optionRemove}
                      >
                        <Text style={{ color: C.red, fontSize: 14 }}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                  <View style={s.optionInputRow}>
                    <TextInput
                      style={[s.input, { flex: 1, marginBottom: 0 }]}
                      value={optionDraft}
                      onChangeText={setOptionDraft}
                      placeholder="Add option…"
                      placeholderTextColor={C.textMuted}
                      onSubmitEditing={addOption}
                      returnKeyType="done"
                    />
                    <TouchableOpacity style={s.addOptionBtn} onPress={addOption}>
                      <Text style={s.addOptionBtnText}>+ Add</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}

              {/* Publish toggle */}
              <View style={[s.divider, { marginVertical: 16 }]} />
              <ToggleRow
                label="Publish immediately"
                sublabel="Unpublished posts are saved as drafts"
                value={form.published}
                onToggle={v => setForm(f => ({ ...f, published: v }))}
              />

              {/* Save */}
              <TouchableOpacity
                style={[s.primaryBtn, saving && { opacity: 0.6 }]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving
                  ? <ActivityIndicator color={C.bg} />
                  : <Text style={s.primaryBtnText}>
                      {initial ? 'Save Changes' : 'Create Post'}
                    </Text>
                }
              </TouchableOpacity>
            </ScrollView>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// PANEL — Posts Manager  (CRUD list)
// ─────────────────────────────────────────────────────────────────────────────

type PostFilter = 'all' | 'published' | 'drafts';

interface PostsManagerProps {
  posts: Post[];
  onNew:           () => void;
  onEdit:          (post: Post) => void;
  onDelete:        (id: string) => Promise<void>;
  onTogglePublish: (id: string, published: boolean) => Promise<void>;
}

const PostsManager: React.FC<PostsManagerProps> = ({
  posts, onNew, onEdit, onDelete, onTogglePublish,
}) => {
  const [filter, setFilter] = useState<PostFilter>('all');

  const filtered = posts.filter(p => {
    if (filter === 'published') return p.published;
    if (filter === 'drafts')    return !p.published;
    return true;
  });

  const confirmDelete = (id: string, title: string) => {
    Alert.alert('Delete Post', `Delete "${title}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => onDelete(id) },
    ]);
  };

  return (
    <View style={s.panel}>
      {/* Header */}
      <View style={s.panelHeader}>
        <Text style={s.panelTitle}>📝  Posts</Text>
        <TouchableOpacity style={s.newPostBtn} onPress={onNew}>
          <Text style={s.newPostBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {/* Filter tabs */}
      <View style={s.filterTabs}>
        {(['all', 'published', 'drafts'] as PostFilter[]).map(f => (
          <TouchableOpacity
            key={f}
            style={[s.filterTab, filter === f && s.filterTabActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[s.filterTabText, filter === f && s.filterTabTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {filtered.length === 0 && (
        <Text style={s.emptyText}>No posts here.</Text>
      )}

      {filtered.map((post, idx) => (
        <View
          key={post.id}
          style={[
            s.postRow,
            idx === filtered.length - 1 && { borderBottomWidth: 0 },
          ]}
        >
          {/* Meta */}
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              {/* Type badge */}
              <View style={[s.typeBadge, {
                backgroundColor: post.type === 'poll' ? C.accentGlow : C.surface2,
              }]}>
                <Text style={[s.typeBadgeText, {
                  color: post.type === 'poll' ? C.accent : C.textMuted,
                }]}>
                  {post.type === 'poll' ? 'Poll' : 'Notice'}
                </Text>
              </View>
              {/* Draft badge */}
              {!post.published && (
                <View style={[s.typeBadge, { backgroundColor: C.amberGlow }]}>
                  <Text style={[s.typeBadgeText, { color: C.amber }]}>Draft</Text>
                </View>
              )}
            </View>
            <Text style={s.postRowTitle} numberOfLines={1}>{post.title}</Text>
            <Text style={s.postRowMeta}>{post.author} · {post.time}</Text>
          </View>

          {/* Action buttons */}
          <View style={s.postRowActions}>
            {/* Publish toggle */}
            <TouchableOpacity
              style={[s.actionBtn, {
                backgroundColor: post.published ? C.greenGlow : C.surface2,
              }]}
              onPress={() => onTogglePublish(post.id, !post.published)}
            >
              <Text style={[s.actionBtnText, {
                color: post.published ? C.green : C.textMuted,
              }]}>
                {post.published ? '✓ Live' : '○ Draft'}
              </Text>
            </TouchableOpacity>

            {/* Edit */}
            <TouchableOpacity
              style={[s.actionBtn, { backgroundColor: C.accentGlow }]}
              onPress={() => onEdit(post)}
            >
              <Text style={[s.actionBtnText, { color: C.accent }]}>✎</Text>
            </TouchableOpacity>

            {/* Delete */}
            <TouchableOpacity
              style={[s.actionBtn, { backgroundColor: C.redGlow }]}
              onPress={() => confirmDelete(post.id, post.title)}
            >
              <Text style={[s.actionBtnText, { color: C.red }]}>🗑</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────────────────────────────────────

type AdminTab = 'countdown' | 'results' | 'posts';

const ADMIN_TABS: { key: AdminTab; label: string; icon: string }[] = [
  { key: 'countdown', label: 'Countdown', icon: '⏱' },
  { key: 'results',   label: 'Results',   icon: '📊' },
  { key: 'posts',     label: 'Posts',     icon: '📝' },
];

export default function AdminDashboardScreen() {
  const store = useAdminStore();

  const [activeTab,    setActiveTab]    = useState<AdminTab>('countdown');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPost,  setEditingPost]  = useState<Post | null>(null);

  const openCreate = () => { setEditingPost(null); setModalVisible(true); };
  const openEdit   = (post: Post) => { setEditingPost(post); setModalVisible(true); };

  const handleSave = async (
    payload: Omit<Post, 'id' | 'time' | 'createdAt' | 'updatedAt'>,
    id?: string,
  ) => {
    if (id) {
      await store.updatePost(id, payload);
    } else {
      await store.createPost(payload);
    }
  };

  if (store.loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={C.accent} />
        <Text style={{ color: C.textSub, marginTop: 12 }}>Loading admin panel…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>AnimoQuorum</Text>
          <Text style={s.headerSub}>Admin Panel · DLSL COMELEC</Text>
        </View>
        <View style={s.adminBadge}>
          <Text style={s.adminBadgeText}>ADMIN</Text>
        </View>
      </View>

      {/* Tab bar */}
      <View style={s.tabBar}>
        {ADMIN_TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[s.tabBtn, activeTab === tab.key && s.tabBtnActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={s.tabIcon}>{tab.icon}</Text>
            <Text style={[s.tabLabel, activeTab === tab.key && s.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Scrollable content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {activeTab === 'countdown' && (
          <CountdownPanel
            countdown={store.countdown}
            settings={store.settings}
            onUpdateCountdown={store.updateCountdown}
            onUpdateSettings={store.updateSettings}
          />
        )}

        {activeTab === 'results' && (
          <ResultsPanel
            positions={store.positions}
            settings={store.settings}
            onUpdateSettings={store.updateSettings}
          />
        )}

        {activeTab === 'posts' && (
          <PostsManager
            posts={store.posts}
            onNew={openCreate}
            onEdit={openEdit}
            onDelete={store.deletePost}
            onTogglePublish={store.togglePublish}
          />
        )}
      </ScrollView>

      {/* Create / Edit modal */}
      <PostFormModal
        visible={modalVisible}
        initial={editingPost}
        onClose={() => setModalVisible(false)}
        onSave={handleSave}
      />
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  // ── App chrome ──────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: C.accent,
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 11,
    color: C.textMuted,
    marginTop: 1,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  adminBadge: {
    backgroundColor: C.accentGlow,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: C.accent + '44',
  },
  adminBadgeText: {
    color: C.accent,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },

  // ── Tab bar ──────────────────────────────────────────────────────────────────
  tabBar: {
    flexDirection: 'row',
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    gap: 2,
  },
  tabBtnActive: {
    borderBottomWidth: 2,
    borderBottomColor: C.accent,
  },
  tabIcon:  { fontSize: 16 },
  tabLabel: { fontSize: 11, color: C.textMuted, fontWeight: '500' },
  tabLabelActive: { color: C.accent, fontWeight: '700' },

  // ── Panel container ──────────────────────────────────────────────────────────
  panel: {
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 16,
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  panelTitle: { fontSize: 15, fontWeight: '700', color: C.text },

  // ── Status pill ──────────────────────────────────────────────────────────────
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusDot:      { width: 6, height: 6, borderRadius: 3 },
  statusPillText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },

  // ── Countdown ───────────────────────────────────────────────────────────────
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  timeBlock: {
    alignItems: 'center',
    backgroundColor: C.surface2,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: C.border,
    minWidth: 70,
  },
  timeValue: {
    fontSize: 32,
    fontWeight: '800',
    color: C.accent,
    fontVariant: ['tabular-nums'],
  },
  timeUnit: {
    fontSize: 10,
    color: C.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 2,
  },
  timeSep: {
    fontSize: 28,
    color: C.textMuted,
    fontWeight: '300',
    marginBottom: 10,
  },
  progressTrack: {
    height: 5,
    backgroundColor: C.border,
    borderRadius: 99,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: C.accent,
    borderRadius: 99,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  rowLabel: { fontSize: 12, color: C.textSub, fontWeight: '500' },
  rowValue:  { fontSize: 13, color: C.accent, fontWeight: '600' },
  inlineEdit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  inlineInput: {
    backgroundColor: C.surface2,
    borderWidth: 1,
    borderColor: C.accent,
    borderRadius: 8,
    color: C.text,
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 5,
    width: 155,
  },
  savePill: {
    backgroundColor: C.accent,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  savePillText: { color: C.bg, fontWeight: '700', fontSize: 12 },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  controlBtn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  controlBtnText: { fontWeight: '700', fontSize: 13 },

  // ── Toggle ───────────────────────────────────────────────────────────────────
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 12,
  },
  toggleLabel:    { fontSize: 13, color: C.text, fontWeight: '500' },
  toggleSublabel: { fontSize: 11, color: C.textMuted, marginTop: 1 },

  // ── Divider ──────────────────────────────────────────────────────────────────
  divider: { height: 1, backgroundColor: C.border, marginVertical: 12 },

  // ── Results / candidates ─────────────────────────────────────────────────────
  posTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: C.surface2,
    borderWidth: 1,
    borderColor: C.border,
  },
  posTabActive: {
    backgroundColor: C.accentGlow,
    borderColor: C.accent + '66',
  },
  posTabText:       { fontSize: 12, color: C.textMuted, fontWeight: '600' },
  posTabTextActive: { color: C.accent },
  candidateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  rankBadge:    { width: 32, alignItems: 'center' },
  rankText:     { fontSize: 11, color: C.textMuted, fontWeight: '600' },
  rankTextLead: { color: C.accent, fontWeight: '800' },
  miniAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniAvatarText: { fontWeight: '700', fontSize: 13 },
  candidateName:  { fontSize: 12, color: C.text, fontWeight: '500', marginBottom: 4 },
  barTrack: {
    height: 5,
    backgroundColor: C.border,
    borderRadius: 99,
    overflow: 'hidden',
  },
  barFill:    { height: '100%', borderRadius: 99 },
  voteCount:  { fontSize: 13, fontWeight: '700', color: C.text },
  votePct:    { fontSize: 11, color: C.textMuted },
  totalVotes: { fontSize: 11, color: C.textMuted, textAlign: 'right', marginTop: 4 },

  // ── Posts manager ────────────────────────────────────────────────────────────
  newPostBtn: {
    backgroundColor: C.accent,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  newPostBtnText: { color: C.bg, fontWeight: '700', fontSize: 13 },
  filterTabs: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  filterTab: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: C.surface2,
    borderWidth: 1,
    borderColor: C.border,
  },
  filterTabActive: {
    backgroundColor: C.accentGlow,
    borderColor: C.accent + '55',
  },
  filterTabText:       { fontSize: 12, color: C.textMuted, fontWeight: '500' },
  filterTabTextActive: { color: C.accent, fontWeight: '700' },
  postRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  typeBadge: { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  typeBadgeText: { fontSize: 10, fontWeight: '700' },
  postRowTitle: { fontSize: 13, color: C.text, fontWeight: '600' },
  postRowMeta:  { fontSize: 11, color: C.textMuted, marginTop: 2 },
  postRowActions: { flexDirection: 'row', gap: 6 },
  actionBtn: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: { fontSize: 12, fontWeight: '700' },
  emptyText: {
    color: C.textMuted,
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 20,
  },

  // ── Modal ────────────────────────────────────────────────────────────────────
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: C.text },
  closeBtn: {
    backgroundColor: C.surface2,
    borderRadius: 20,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: { color: C.textSub, fontSize: 15, fontWeight: '600' },
  fieldLabel: {
    fontSize: 11,
    color: C.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
    marginTop: 14,
  },
  input: {
    backgroundColor: C.surface2,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    color: C.text,
    fontSize: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  segmented: {
    flexDirection: 'row',
    backgroundColor: C.surface2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
  },
  segment:         { flex: 1, paddingVertical: 10, alignItems: 'center' },
  segmentActive:   { backgroundColor: C.accentGlow, borderBottomWidth: 2, borderBottomColor: C.accent },
  segmentText:     { fontSize: 13, color: C.textMuted, fontWeight: '600' },
  segmentTextActive: { color: C.accent },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface2,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: C.border,
  },
  optionLabel:  { flex: 1, color: C.text, fontSize: 13 },
  optionRemove: { padding: 4 },
  optionInputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  addOptionBtn: {
    backgroundColor: C.accentGlow,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: C.accent + '44',
  },
  addOptionBtnText: { color: C.accent, fontWeight: '700', fontSize: 13 },
  primaryBtn: {
    backgroundColor: C.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  primaryBtnText: { color: C.bg, fontWeight: '800', fontSize: 15 },
});