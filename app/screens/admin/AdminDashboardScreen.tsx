/**
 * AdminDashboardScreen.tsx — Admin post management screen
 * ─────────────────────────────────────────────────────────────────────────────
 * Features:
 * - Summary header (total posts, announcement count, poll count)
 * - Filterable list of all posts (All / Notices / Polls tabs)
 * - Create / Edit via bottom sheet modal (title + content + type + poll options)
 * - Delete with confirmation alert
 * - Miting tab: Go Live toggle, Live Feed preview, Pending approval queue
 *
 * BACKEND:
 * Reads: usePosts() → app/hooks/usePosts.ts
 * Create: useCreatePost() → app/hooks/usePosts.ts
 * Update: useUpdatePost() → app/hooks/usePosts.ts
 * Delete: useDeletePost() → app/hooks/usePosts.ts
 *
 * Poll options are written to / replaced in PollOptions directly here
 * using the supabase client — no separate hook needed.
 *
 * HOOKS TO ADD (if not yet in usePosts.ts):
 * ─────────────────────────────────────────────────────────────────────────────
 * export function useCreatePost() { ... }
 * export function useUpdatePost() { ... }
 * export function useDeletePost() { ... }
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, {
  useState, useCallback, useMemo, createContext, useContext, useEffect,
} from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput, Modal,
  ScrollView, StatusBar, Platform, KeyboardAvoidingView, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { usePosts, useCreatePost, useUpdatePost, useDeletePost } from '../../hooks/usePosts';
import { useSettings, useUpdateSettings } from '../../hooks/useSettings';
import { supabase } from '../../utils/supabase';
import { makeStyles, type AdminDashboardStyles } from './AdminDashboardScreen.styles';
import { useThemeColors } from '../../theme';
import { useThemeStore } from '../../stores/themeStore';
import type { ThemeColors } from '../../theme';

// ─── Context ──────────────────────────────────────────────────────────────────

type AdminDashCtx = { C: ThemeColors; s: AdminDashboardStyles };
const AdminDashCtx = createContext<AdminDashCtx>(null as any);
const useAdminDash = () => useContext(AdminDashCtx);

// =============================================================================
// TYPES
// =============================================================================

interface PollOption { id: string; post_id: string; option_text: string }

interface RawPost {
  id: string; admin_id: string; type: 'announcement' | 'poll';
  title: string; content: string; created_at: string;
  PollOptions?: PollOption[];
}

interface MitingQuestion {
  id: string;
  question_text: string;
  upvote_count: number;
  is_approved: boolean;
  created_at: string;
}

type FeedTab = 'all' | 'announcement' | 'poll' | 'miting';

interface ModalState { visible: boolean; mode: 'create' | 'edit'; post: RawPost | null }

interface SavePayload {
  type: 'announcement' | 'poll'; title: string; content: string; pollOptions: string[];
}

// =============================================================================
// HELPERS
// =============================================================================

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (mins > 0) return `${mins}m ago`;
  return 'Just now';
}

async function savePollOptions(postId: string, options: string[]): Promise<void> {
  const trimmed = options.map(o => o.trim()).filter(Boolean);
  if (trimmed.length === 0) return;
  const { error: delErr } = await supabase.from('PollOptions').delete().eq('post_id', postId);
  if (delErr) throw delErr;
  const rows = trimmed.map(option_text => ({ post_id: postId, option_text }));
  const { error: insErr } = await supabase.from('PollOptions').insert(rows);
  if (insErr) throw insErr;
}

// =============================================================================
// SUMMARY HEADER
// =============================================================================

const SummaryHeader: React.FC<{ posts: RawPost[] }> = ({ posts }) => {
  const { C, s } = useAdminDash();
  const total = posts.length;
  const announcements = posts.filter(p => p.type === 'announcement').length;
  const polls = posts.filter(p => p.type === 'poll').length;

  const stats = [
    { label: 'Total Posts',    value: total,         color: C.text,  icon: 'layers-outline'    as const },
    { label: 'Announcements',  value: announcements, color: C.amber, icon: 'megaphone-outline'  as const },
    { label: 'Polls',          value: polls,         color: C.green, icon: 'bar-chart-outline'  as const },
  ];

  return (
    <View style={s.summaryRow}>
      {stats.map(stat => (
        <View key={stat.label} style={s.statCard}>
          <View style={[s.statIcon, { backgroundColor: `${stat.color}22` }]}>
            <Ionicons name={stat.icon} size={16} color={stat.color} />
          </View>
          <Text style={[s.statValue, { color: stat.color }]}>{stat.value}</Text>
          <Text style={s.statLabel}>{stat.label}</Text>
        </View>
      ))}
    </View>
  );
};

// =============================================================================
// POST ROW CARD
// =============================================================================

const PostRow: React.FC<{
  post: RawPost; onEdit: (post: RawPost) => void;
  onDelete: (id: string) => void; isDeleting: boolean;
}> = ({ post, onEdit, onDelete, isDeleting }) => {
  const { C, s } = useAdminDash();
  const isPoll = post.type === 'poll';

  const handleDelete = () => {
    Alert.alert('Delete Post', `"${post.title}" will be permanently removed.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => onDelete(post.id) },
    ]);
  };

  return (
    <View style={s.postRow}>
      <View style={[s.typePill, { backgroundColor: isPoll ? C.greenDim : C.amberGlow }]}>
        <Ionicons
          name={isPoll ? 'bar-chart-outline' : 'megaphone-outline'}
          size={10}
          color={isPoll ? C.green : C.amber}
        />
        <Text style={[s.typePillText, { color: isPoll ? C.green : C.amber }]}>
          {isPoll ? 'Poll' : 'Notice'}
        </Text>
      </View>

      <Text style={s.postRowTitle}>{post.title}</Text>

      {post.type === 'announcement' && post.content
        ? <Text style={s.postRowBody} numberOfLines={2}>{post.content}</Text>
        : null}

      {post.type === 'poll' && post.PollOptions && post.PollOptions.length > 0
        ? (
          <Text style={s.postRowBody}>
            {post.PollOptions.length} option{post.PollOptions.length !== 1 ? 's' : ''}
          </Text>
        )
        : null}

      <View style={s.postRowFooter}>
        <Text style={s.postRowTime}>{timeAgo(post.created_at)}</Text>
        <View style={s.postRowActions}>
          <TouchableOpacity style={s.actionBtn} onPress={() => onEdit(post)} activeOpacity={0.7}>
            <Ionicons name="pencil-outline" size={12} color={C.textSub} />
            <Text style={s.actionBtnText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.actionBtn, s.actionBtnDanger]}
            onPress={handleDelete}
            disabled={isDeleting}
            activeOpacity={0.7}
          >
            {isDeleting
              ? <ActivityIndicator size={12} color={C.red} />
              : <Ionicons name="trash-outline" size={12} color={C.red} />}
            <Text style={[s.actionBtnText, { color: C.red }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

// =============================================================================
// CREATE / EDIT MODAL
// =============================================================================

const EMPTY_FORM = { type: 'announcement' as 'announcement' | 'poll', title: '', content: '' };

const PostModal: React.FC<{
  state: ModalState; onClose: () => void;
  onSave: (payload: SavePayload, id?: string) => void; isSaving: boolean;
}> = ({ state, onClose, onSave, isSaving }) => {
  const { C, s } = useAdminDash();
  const [form, setForm] = useState(EMPTY_FORM);
  const [pollOptions, setPollOptions] = useState(['', '']);

  React.useEffect(() => {
    if (state.visible && state.post) {
      setForm({ type: state.post.type, title: state.post.title, content: state.post.content ?? '' });
      const existing = state.post.PollOptions?.map(o => o.option_text) ?? [];
      setPollOptions(existing.length >= 2 ? existing : [...existing, ...Array(2 - existing.length).fill('')]);
    } else if (state.visible && !state.post) {
      setForm(EMPTY_FORM);
      setPollOptions(['', '']);
    }
  }, [state.visible, state.post]);

  const addOption    = () => setPollOptions(prev => [...prev, '']);
  const removeOption = (i: number) => setPollOptions(prev => prev.filter((_, idx) => idx !== i));
  const updateOption = (i: number, val: string) =>
    setPollOptions(prev => prev.map((o, idx) => (idx === i ? val : o)));

  const handleSave = () => {
    if (!form.title.trim()) {
      Alert.alert('Missing title', 'Please enter a title before saving.');
      return;
    }
    if (form.type === 'poll' && pollOptions.filter(o => o.trim()).length < 2) {
      Alert.alert('Not enough options', 'A poll needs at least 2 options.');
      return;
    }
    onSave({ ...form, pollOptions }, state.post?.id);
  };

  const isEdit = state.mode === 'edit';

  return (
    <Modal visible={state.visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={s.sheet}>
          <View style={s.sheetHandle} />
          <View style={s.sheetHeader}>
            <Text style={s.sheetTitle}>{isEdit ? 'Edit Post' : 'New Post'}</Text>
            <TouchableOpacity style={s.sheetClose} onPress={onClose}>
              <Ionicons name="close" size={16} color={C.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView style={s.sheetBody} showsVerticalScrollIndicator={false}>
            <Text style={s.fieldLabel}>Post Type</Text>
            <View style={s.typeToggle}>
              {(['announcement', 'poll'] as const).map(t => (
                <TouchableOpacity
                  key={t}
                  style={[s.typeToggleBtn, form.type === t && s.typeToggleBtnActive]}
                  onPress={() => setForm(f => ({ ...f, type: t }))}
                >
                  <Ionicons
                    name={t === 'poll' ? 'bar-chart-outline' : 'megaphone-outline'}
                    size={14}
                    color={form.type === t ? C.green : C.textMuted}
                  />
                  <Text style={[s.typeToggleBtnText, form.type === t && s.typeToggleBtnTextActive]}>
                    {t === 'poll' ? 'Poll' : 'Announcement'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={s.fieldLabel}>Title</Text>
            <TextInput
              style={s.input}
              placeholder="Enter title…"
              placeholderTextColor={C.textMuted}
              value={form.title}
              onChangeText={v => setForm(f => ({ ...f, title: v }))}
            />

            {form.type === 'announcement' && (
              <>
                <Text style={s.fieldLabel}>Content</Text>
                <TextInput
                  style={[s.input, s.inputMultiline]}
                  placeholder="Enter content…"
                  placeholderTextColor={C.textMuted}
                  value={form.content}
                  onChangeText={v => setForm(f => ({ ...f, content: v }))}
                  multiline
                  numberOfLines={5}
                  textAlignVertical="top"
                />
              </>
            )}

            {form.type === 'poll' && (
              <>
                <Text style={s.fieldLabel}>Poll Options</Text>
                {pollOptions.map((opt, i) => (
                  <View key={i} style={s.pollOptionRow}>
                    <TextInput
                      style={[s.input, { flex: 1, marginBottom: 0 }]}
                      placeholder={`Option ${i + 1}`}
                      placeholderTextColor={C.textMuted}
                      value={opt}
                      onChangeText={v => updateOption(i, v)}
                    />
                    {pollOptions.length > 2 && (
                      <TouchableOpacity style={s.pollOptionRemove} onPress={() => removeOption(i)}>
                        <Ionicons name="close-circle" size={20} color={C.red} />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
                <TouchableOpacity style={s.addOptionBtn} onPress={addOption}>
                  <Ionicons name="add-circle-outline" size={16} color={C.green} />
                  <Text style={s.addOptionBtnText}>Add Option</Text>
                </TouchableOpacity>
              </>
            )}

            <View style={{ height: 16 }} />
          </ScrollView>

          <View style={s.sheetFooter}>
            <TouchableOpacity
              style={s.saveBtn}
              onPress={handleSave}
              disabled={isSaving}
              activeOpacity={0.8}
            >
              {isSaving
                ? <ActivityIndicator color="#fff" style={{ marginRight: 8 }} />
                : <Ionicons name="checkmark-circle-outline" size={18} color="#fff" style={{ marginRight: 8 }} />}
              <Text style={s.saveBtnText}>{isEdit ? 'Save Changes' : 'Publish Post'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// =============================================================================
// MITING CONTROL PANEL
// =============================================================================

const MitingControlPanel: React.FC<{
  isActive: boolean; isLoading: boolean; isToggling: boolean; onToggle: () => void;
}> = ({ isActive, isLoading, isToggling, onToggle }) => {
  const { C } = useAdminDash();

  const ms = useMemo(() => ({
    card: {
      backgroundColor: C.surface2, borderRadius: 16, borderWidth: 1,
      borderColor: C.border, padding: 20, marginBottom: 16,
    } as const,
    statusRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6, marginBottom: 12 },
    dot: { width: 8, height: 8, borderRadius: 4 } as const,
    statusText: { fontSize: 11, fontWeight: '800' as const, letterSpacing: 1.2 },
    title: { fontSize: 20, fontWeight: '800' as const, color: C.text, marginBottom: 8 },
    desc: { fontSize: 13, color: C.textSub, lineHeight: 20, marginBottom: 20 },
    toggleBtn: {
      flexDirection: 'row' as const, alignItems: 'center' as const,
      justifyContent: 'center' as const, borderRadius: 14, paddingVertical: 15, marginBottom: 14,
    },
    toggleBtnLive: { backgroundColor: C.green } as const,
    toggleBtnEnd:  { backgroundColor: '#EF4444' } as const,
    toggleBtnText: { fontSize: 15, fontWeight: '700' as const, color: '#fff' },
    infoRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6 },
    infoText: { fontSize: 11, color: C.textMuted, flex: 1, lineHeight: 16 },
  }), [C]);

  return (
    <View style={ms.card}>
      <View style={ms.statusRow}>
        <View style={[ms.dot, { backgroundColor: isLoading ? C.textMuted : isActive ? C.green : C.textMuted }]} />
        <Text style={[ms.statusText, { color: isLoading ? C.textMuted : isActive ? C.green : C.textMuted }]}>
          {isLoading ? 'Loading…' : isActive ? 'LIVE' : 'INACTIVE'}
        </Text>
      </View>
      <Text style={ms.title}>Miting de Avance</Text>
      <Text style={ms.desc}>
        {isActive
          ? 'The live Q&A session is currently open. Students can submit and upvote questions.'
          : 'The live Q&A session is currently closed. Tap the button below to open it for students.'}
      </Text>
      <TouchableOpacity
        style={[ms.toggleBtn, isActive ? ms.toggleBtnEnd : ms.toggleBtnLive]}
        onPress={onToggle}
        disabled={isToggling || isLoading}
        activeOpacity={0.85}
      >
        {isToggling
          ? <ActivityIndicator color="#fff" style={{ marginRight: 10 }} />
          : <Ionicons
              name={isActive ? 'stop-circle-outline' : 'radio-outline'}
              size={20}
              color="#fff"
              style={{ marginRight: 10 }}
            />}
        <Text style={ms.toggleBtnText}>
          {isToggling ? 'Updating…' : isActive ? 'End Session' : 'Go Live'}
        </Text>
      </TouchableOpacity>
      <View style={ms.infoRow}>
        <Ionicons name="information-circle-outline" size={14} color={C.textMuted} />
        <Text style={ms.infoText}>Students receive a notification the moment you go live.</Text>
      </View>
    </View>
  );
};

// =============================================================================
// MITING — LIVE FEED CARD
// =============================================================================

const LiveQuestionCard: React.FC<{
  q: MitingQuestion;
  index: number;
  total: number;
  isViewOnly: boolean;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}> = ({ q, index, total, isViewOnly, onDelete, isDeleting }) => {
  const { C } = useAdminDash();
  const isTop = index === 0 && total > 1;

  const ms = useMemo(() => ({
    qCard: {
      flexDirection: 'row' as const,
      backgroundColor: C.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: C.border,
      padding: 14,
      marginBottom: 10,
      gap: 12,
    },
    qCardTop: { borderColor: C.green + '55', backgroundColor: C.surface2 } as const,
    upvoteCol: { alignItems: 'center' as const, gap: 3, minWidth: 32, paddingTop: 2 },
    upvoteCount: { fontSize: 12, fontWeight: '700' as const, color: C.textMuted },
    topBadge: {
      alignSelf: 'flex-start' as const,
      backgroundColor: C.greenDim,
      borderRadius: 20,
      paddingHorizontal: 9,
      paddingVertical: 3,
      marginBottom: 6,
    },
    topBadgeText: { fontSize: 11, fontWeight: '700' as const, color: C.green },
    qContent: { flex: 1 },
    qText: { fontSize: 14, color: C.text, lineHeight: 21, marginBottom: 6 },
    qFooter: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
    },
    qMeta: { fontSize: 11, color: C.textMuted },
    viewOnlyPill: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
      backgroundColor: C.pill,
      borderWidth: 1,
      borderColor: C.border,
    },
    viewOnlyText: { fontSize: 11, color: C.textMuted, fontStyle: 'italic' as const },
    deleteBtn: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 4,
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderRadius: 8,
      backgroundColor: C.redGlow,
      borderWidth: 1,
      borderColor: 'rgba(239,68,68,0.22)',
    },
    deleteBtnText: { fontSize: 12, color: C.red, fontWeight: '600' as const },
  }), [C]);

  const handleDelete = () => {
    Alert.alert(
      'Remove from Live Feed?',
      'This will permanently delete the question for all students.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDelete(q.id) },
      ],
    );
  };

  return (
    <View style={[ms.qCard, isTop && ms.qCardTop]}>
      {/* ── Upvote column ── */}
      <View style={ms.upvoteCol}>
        <Ionicons name="arrow-up" size={16} color={isTop ? C.green : C.textMuted} />
        <Text style={[ms.upvoteCount, isTop && { color: C.green }]}>{q.upvote_count}</Text>
      </View>

      {/* ── Question content ── */}
      <View style={ms.qContent}>
        {isTop && (
          <View style={ms.topBadge}>
            <Text style={ms.topBadgeText}>🔥 Top Question</Text>
          </View>
        )}
        <Text style={ms.qText}>{q.question_text}</Text>
        <View style={ms.qFooter}>
          <Text style={ms.qMeta}>{timeAgo(q.created_at)}</Text>
          {isViewOnly ? (
            <View style={ms.viewOnlyPill}>
              <Ionicons name="eye-outline" size={11} color={C.textMuted} />
              <Text style={ms.viewOnlyText}>View only</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={ms.deleteBtn}
              onPress={handleDelete}
              disabled={isDeleting}
              activeOpacity={0.7}
            >
              {isDeleting
                ? <ActivityIndicator size={12} color={C.red} />
                : <Ionicons name="trash-outline" size={12} color={C.red} />}
              <Text style={ms.deleteBtnText}>Delete</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

// =============================================================================
// MITING — PENDING APPROVAL CARD
// =============================================================================

const PendingQuestionCard: React.FC<{
  q: MitingQuestion;
  isViewOnly: boolean;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  isApproving: boolean;
  isRejecting: boolean;
}> = ({ q, isViewOnly, onApprove, onReject, isApproving, isRejecting }) => {
  const { C } = useAdminDash();

  const ms = useMemo(() => ({
    card: {
      backgroundColor: C.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: C.border,
      padding: 14,
      marginBottom: 10,
    },
    qText: { fontSize: 14, color: C.text, lineHeight: 21, marginBottom: 6 },
    qMeta: { fontSize: 11, color: C.textMuted },
    viewOnlyRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 6,
      marginTop: 10,
    },
    viewOnlyText: { fontSize: 11, color: C.textMuted, fontStyle: 'italic' as const },
    approvalRow: {
      flexDirection: 'row' as const,
      gap: 8,
      marginTop: 12,
    },
    approveBtn: {
      flex: 1,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      backgroundColor: C.green,
      borderRadius: 10,
      paddingVertical: 8,
      gap: 6,
    },
    approveBtnText: { fontSize: 13, fontWeight: '700' as const, color: '#fff' },
    rejectBtn: {
      flex: 1,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      backgroundColor: C.redGlow,
      borderRadius: 10,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: 'rgba(239,68,68,0.25)',
      gap: 6,
    },
    rejectBtnText: { fontSize: 13, fontWeight: '700' as const, color: C.red },
  }), [C]);

  return (
    <View style={ms.card}>
      <Text style={ms.qText}>{q.question_text}</Text>
      <Text style={ms.qMeta}>{timeAgo(q.created_at)}</Text>

      {isViewOnly ? (
        <View style={ms.viewOnlyRow}>
          <Ionicons name="eye-outline" size={13} color={C.textMuted} />
          <Text style={ms.viewOnlyText}>View only — session ended</Text>
        </View>
      ) : (
        <View style={ms.approvalRow}>
          <TouchableOpacity
            style={ms.approveBtn}
            onPress={() => onApprove(q.id)}
            disabled={isApproving || isRejecting}
            activeOpacity={0.8}
          >
            {isApproving
              ? <ActivityIndicator size={14} color="#fff" />
              : <Ionicons name="checkmark-outline" size={14} color="#fff" />}
            <Text style={ms.approveBtnText}>Approve</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={ms.rejectBtn}
            onPress={() => onReject(q.id)}
            disabled={isApproving || isRejecting}
            activeOpacity={0.8}
          >
            {isRejecting
              ? <ActivityIndicator size={14} color={C.red} />
              : <Ionicons name="close-outline" size={14} color={C.red} />}
            <Text style={ms.rejectBtnText}>Reject</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

// =============================================================================
// MAIN SCREEN
// =============================================================================

const TABS: { key: FeedTab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'all',          label: 'All',     icon: 'layers-outline'   },
  { key: 'announcement', label: 'Notices', icon: 'megaphone-outline' },
  { key: 'poll',         label: 'Polls',   icon: 'bar-chart-outline' },
  { key: 'miting',       label: 'Miting',  icon: 'mic-outline'       },
];

export function AdminDashboardScreen() {
  const [activeTab,   setActiveTab]   = useState<FeedTab>('all');
  const [modal,       setModal]       = useState<ModalState>({ visible: false, mode: 'create', post: null });
  const [deletingId,  setDeletingId]  = useState<string | null>(null);
  const [isSaving,    setIsSaving]    = useState(false);

  // ── Miting state ──────────────────────────────────────────────────────────
  const [mitingSubTab,      setMitingSubTab]      = useState<'live' | 'pending'>('live');
  const [liveQuestions,     setLiveQuestions]     = useState<MitingQuestion[]>([]);
  const [pendingQuestions,  setPendingQuestions]  = useState<MitingQuestion[]>([]);
  const [pendingCount,      setPendingCount]      = useState(0);
  const [approvingId,       setApprovingId]       = useState<string | null>(null);
  const [rejectingId,       setRejectingId]       = useState<string | null>(null);
  const [deletingLiveId,    setDeletingLiveId]    = useState<string | null>(null);
  const [isStartingSession, setIsStartingSession] = useState(false);

  // ── Theme ─────────────────────────────────────────────────────────────────
  const C      = useThemeColors();
  const s      = useMemo(() => makeStyles(C), [C]);
  const isDark      = useThemeStore(st => st.isDark);
  const toggleTheme = useThemeStore(st => st.toggleTheme);

  // ── Data hooks ────────────────────────────────────────────────────────────
  const { data: rawPosts, isLoading, isError, error, refetch } = usePosts();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };
  const { mutateAsync: createPost } = useCreatePost();
  const { mutateAsync: updatePost } = useUpdatePost();
  const { mutateAsync: deletePost } = useDeletePost();

  const { settings, isLoading: settingsLoading } = useSettings();
  const { mutateAsync: updateSettings, isPending: isToggling } = useUpdateSettings();
  const isMitingActive = !!(settings?.is_miting_active);
  const isBusy = isToggling || isStartingSession;

  // ── Always-on pending count (powers the badge on the Miting tab) ──────────
  useEffect(() => {
    const fetchCount = async () => {
      const { count } = await supabase
        .from('MitingQuestions')
        .select('*', { count: 'exact', head: true })
        .eq('is_approved', false);
      setPendingCount(count ?? 0);
    };

    fetchCount();

    const ch = supabase
      .channel('admin-miting-pending-count')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'MitingQuestions' }, fetchCount)
      .subscribe();

    return () => { supabase.removeChannel(ch); };
  }, []);

  // ── Full question lists + realtime (only when Miting tab is open) ─────────
  useEffect(() => {
    if (activeTab !== 'miting') return;

    let cancelled = false;

    const fetchLive = async () => {
      const { data } = await supabase
        .from('MitingQuestions')
        .select('*')
        .eq('is_approved', true)
        .order('upvote_count', { ascending: false });
      if (!cancelled && data) setLiveQuestions(data as MitingQuestion[]);
    };

    const fetchPending = async () => {
      const { data } = await supabase
        .from('MitingQuestions')
        .select('*')
        .eq('is_approved', false)
        .order('created_at', { ascending: true });
      if (!cancelled && data) setPendingQuestions(data as MitingQuestion[]);
    };

    fetchLive();
    fetchPending();

    const ch = supabase
      .channel('admin-miting-questions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'MitingQuestions' }, () => {
        fetchLive();
        fetchPending();
      })
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(ch);
    };
  }, [activeTab]);

  // ── Approve a pending question ────────────────────────────────────────────
  const handleApprove = async (id: string) => {
    setApprovingId(id);
    try {
      await supabase.from('MitingQuestions').update({ is_approved: true }).eq('id', id);
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Could not approve question.');
    } finally {
      setApprovingId(null);
    }
  };

  // ── Reject (delete) a pending question ───────────────────────────────────
  const handleReject = (id: string) => {
    Alert.alert(
      'Reject Question',
      'This will permanently remove the question.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            setRejectingId(id);
            try {
              await supabase.from('MitingQuestions').delete().eq('id', id);
            } catch (e: any) {
              Alert.alert('Error', e?.message ?? 'Could not reject question.');
            } finally {
              setRejectingId(null);
            }
          },
        },
      ],
    );
  };

  // ── Delete an approved (live) question ───────────────────────────────────
  const handleDeleteLive = async (id: string) => {
    setDeletingLiveId(id);
    try {
      await supabase.from('MitingQuestions').delete().eq('id', id);
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Could not delete question.');
    } finally {
      setDeletingLiveId(null);
    }
  };

  // ── Miting session toggle ─────────────────────────────────────────────────
  const handleMitingToggle = () => {
    if (isMitingActive) {
      // End session — only deactivate, questions stay intact
      Alert.alert(
        'End Miting Session?',
        'This will close the live Q&A. Students can no longer submit questions. All questions will remain in view-only mode until the next session goes live.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'End Session',
            style: 'destructive',
            onPress: async () => {
              try {
                await updateSettings({ is_miting_active: false });
              } catch (e: any) {
                Alert.alert('Error', e?.message ?? 'Could not end session.');
              }
            },
          },
        ],
      );
    } else {
      // Go Live — wipe all previous questions first, then activate
      const prevCount = liveQuestions.length + pendingQuestions.length;
      const message = prevCount > 0
        ? `This will permanently clear all ${prevCount} question(s) from the previous session and open a fresh live Q&A. Students will be notified immediately.`
        : 'This will open the live Q&A for all students. They will be notified immediately.';

      Alert.alert('Start Miting Session?', message, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Go Live',
          onPress: async () => {
            setIsStartingSession(true);
            try {
              if (prevCount > 0) {
                const { data } = await supabase.from('MitingQuestions').select('id');
                const ids = (data ?? []).map((q: any) => q.id);
                if (ids.length > 0) {
                  await supabase.from('MitingQuestions').delete().in('id', ids);
                }
                setLiveQuestions([]);
                setPendingQuestions([]);
                setPendingCount(0);
              }
              await updateSettings({ is_miting_active: true });
            } catch (e: any) {
              Alert.alert('Error', e?.message ?? 'Could not start session.');
            } finally {
              setIsStartingSession(false);
            }
          },
        },
      ]);
    }
  };

  // ── Derived data ──────────────────────────────────────────────────────────
  const posts    = (rawPosts ?? []) as RawPost[];
  const filtered = activeTab === 'miting'
    ? []
    : posts.filter(p => activeTab === 'all' || p.type === activeTab);

  // ── Modal helpers ─────────────────────────────────────────────────────────
  const openCreate = () => setModal({ visible: true, mode: 'create', post: null });
  const openEdit   = (post: RawPost) => setModal({ visible: true, mode: 'edit', post });
  const closeModal = () => setModal(m => ({ ...m, visible: false }));

  const handleSave = async (payload: SavePayload, id?: string) => {
    setIsSaving(true);
    try {
      let postId: string;
      if (id) {
        await updatePost({ id, type: payload.type, title: payload.title, content: payload.content } as any);
        postId = id;
      } else {
        const created = await createPost({
          type: payload.type,
          title: payload.title,
          content: payload.content,
        } as any) as any;
        postId = created.id;
      }
      if (payload.type === 'poll') {
        await savePollOptions(postId, payload.pollOptions);
      }
      closeModal();
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await supabase.from('PollOptions').delete().eq('post_id', id);
      await deletePost(id);
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Could not delete post.');
    } finally {
      setDeletingId(null);
    }
  };

  const renderPost = useCallback(({ item }: { item: RawPost }) => (
    <PostRow
      post={item}
      onEdit={openEdit}
      onDelete={handleDelete}
      isDeleting={deletingId === item.id}
    />
  ), [deletingId]);

  // ── Miting sub-tab styles (memoised, depends on C) ────────────────────────
  const mit = useMemo(() => ({
    subTabRow: { flexDirection: 'row' as const, gap: 8, marginBottom: 12 },
    subTab: {
      flex: 1, flexDirection: 'row' as const, alignItems: 'center' as const,
      justifyContent: 'center' as const, paddingVertical: 9, borderRadius: 12,
      borderWidth: 1, borderColor: C.border, backgroundColor: C.pill, gap: 6,
    },
    subTabActive:     { backgroundColor: C.greenLight, borderColor: C.green } as const,
    subTabText:       { fontSize: 13, color: C.textMuted, fontWeight: '500' as const },
    subTabTextActive: { color: C.text, fontWeight: '600' as const },
    pendingBadge: {
      backgroundColor: C.amber, borderRadius: 8, paddingHorizontal: 5,
      paddingVertical: 1, minWidth: 18, alignItems: 'center' as const,
    },
    pendingBadgeText: { fontSize: 10, fontWeight: '800' as const, color: '#000' },
    emptyBox: { alignItems: 'center' as const, paddingVertical: 36, gap: 10 },
    emptyText: { fontSize: 13, color: C.textMuted },
  }), [C]);

  // ── List header (JSX element, not a component — no hooks allowed here) ────
  const ListHeader = (
    <>
      {/* ── App header ── */}
      <View style={s.appHeader}>
        <View>
          <Text style={s.appLogo}>AnimoQuorum</Text>
          <Text style={s.appSub}>Admin · DLSL COMELEC</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: C.pill, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 }}>
          <TouchableOpacity
            onPress={handleRefresh}
            disabled={isRefreshing}
            style={{ padding: 4 }}
          >
            {isRefreshing
              ? <ActivityIndicator size={18} color={C.green} />
              : <Ionicons name="refresh-outline" size={20} color={C.green} />
            }
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleTheme} style={{ paddingLeft: 12, paddingRight: 4 }}>
            <Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={20} color={C.green} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Summary cards ── */}
      {!isLoading && !isError && <SummaryHeader posts={posts} />}

      {/* ── Section bar ── */}
      <View style={s.sectionBar}>
        <Text style={s.sectionLabel}>Manage Posts</Text>
        <TouchableOpacity style={s.createBtn} onPress={openCreate} activeOpacity={0.8}>
          <Ionicons name="add" size={16} color="#fff" />
          <Text style={s.createBtnText}>New Post</Text>
        </TouchableOpacity>
      </View>

      {/* ── Main filter tabs (Miting tab gets pending badge) ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.tabRow}
      >
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[s.tab, activeTab === tab.key && s.tabActive]}
            onPress={() => setActiveTab(tab.key)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={tab.icon}
              size={13}
              color={activeTab === tab.key ? C.text : C.textMuted}
            />
            <Text style={[s.tabText, activeTab === tab.key && s.tabTextActive]}>
              {tab.label}
            </Text>
            {tab.key === 'miting' && pendingCount > 0 && (
              <View style={[mit.pendingBadge, { marginLeft: 2 }]}>
                <Text style={mit.pendingBadgeText}>{pendingCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── Miting section ── */}
      {activeTab === 'miting' && (
        <>
          {/* Control panel (Go Live / End Session) */}
          <MitingControlPanel
            isActive={isMitingActive}
            isLoading={settingsLoading}
            isToggling={isBusy}
            onToggle={handleMitingToggle}
          />

          {/* Sub-tabs: Live Feed | Pending */}
          <View style={mit.subTabRow}>
            <TouchableOpacity
              style={[mit.subTab, mitingSubTab === 'live' && mit.subTabActive]}
              onPress={() => setMitingSubTab('live')}
              activeOpacity={0.7}
            >
              <Ionicons
                name="radio-outline"
                size={14}
                color={mitingSubTab === 'live' ? C.green : C.textMuted}
              />
              <Text style={[mit.subTabText, mitingSubTab === 'live' && mit.subTabTextActive]}>
                Live Feed
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[mit.subTab, mitingSubTab === 'pending' && mit.subTabActive]}
              onPress={() => setMitingSubTab('pending')}
              activeOpacity={0.7}
            >
              <Ionicons
                name="time-outline"
                size={14}
                color={mitingSubTab === 'pending' ? C.green : C.textMuted}
              />
              <Text style={[mit.subTabText, mitingSubTab === 'pending' && mit.subTabTextActive]}>
                Pending
              </Text>
              {pendingQuestions.length > 0 && (
                <View style={[mit.pendingBadge, { marginLeft: 2 }]}>
                  <Text style={mit.pendingBadgeText}>{pendingQuestions.length}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Live Feed content */}
          {mitingSubTab === 'live' && (
            liveQuestions.length === 0 ? (
              <View style={mit.emptyBox}>
                <Ionicons name="chatbubbles-outline" size={32} color={C.textMuted} />
                <Text style={mit.emptyText}>No approved questions yet.</Text>
              </View>
            ) : (
              liveQuestions.map((q, i) => (
                <LiveQuestionCard
                  key={q.id}
                  q={q}
                  index={i}
                  total={liveQuestions.length}
                  isViewOnly={!isMitingActive}
                  onDelete={handleDeleteLive}
                  isDeleting={deletingLiveId === q.id}
                />
              ))
            )
          )}

          {/* Pending content */}
          {mitingSubTab === 'pending' && (
            pendingQuestions.length === 0 ? (
              <View style={mit.emptyBox}>
                <Ionicons name="hourglass-outline" size={32} color={C.textMuted} />
                <Text style={mit.emptyText}>No pending questions.</Text>
              </View>
            ) : (
              pendingQuestions.map(q => (
                <PendingQuestionCard
                  key={q.id}
                  q={q}
                  isViewOnly={!isMitingActive}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  isApproving={approvingId === q.id}
                  isRejecting={rejectingId === q.id}
                />
              ))
            )
          )}
        </>
      )}
    </>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <AdminDashCtx.Provider value={{ C, s }}>
      <SafeAreaView style={s.screen} edges={['top']}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <FlatList<RawPost>
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={renderPost}
          ListHeaderComponent={ListHeader}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.listContent}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            activeTab === 'miting' ? null
            : isLoading ? (
              <View style={s.stateBox}>
                <ActivityIndicator color={C.green} />
                <Text style={s.stateText}>Loading posts…</Text>
              </View>
            ) : isError ? (
              <View style={s.stateBox}>
                <Ionicons name="alert-circle-outline" size={32} color={C.red} />
                <Text style={s.stateText}>{(error as Error)?.message ?? 'Failed to load posts.'}</Text>
              </View>
            ) : (
              <View style={s.stateBox}>
                <Ionicons name="document-outline" size={32} color={C.textMuted} />
                <Text style={s.stateText}>No posts yet. Create one above.</Text>
              </View>
            )
          }
        />

        <PostModal
          state={modal}
          onClose={closeModal}
          onSave={handleSave}
          isSaving={isSaving}
        />
      </SafeAreaView>
    </AdminDashCtx.Provider>
  );
}
