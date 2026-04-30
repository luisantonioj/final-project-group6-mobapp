/**
 * AdminDashboardScreen.tsx — Admin post management screen
 * ─────────────────────────────────────────────────────────────────────────────
 * Features:
 *   - Summary header (total posts, announcement count, poll count)
 *   - Filterable list of all posts (All / Notices / Polls tabs)
 *   - Create / Edit via bottom sheet modal (title + content + type + poll options)
 *   - Delete with confirmation alert
 *   - Miting tab: Go Live toggle, Live Feed preview, Pending approval queue
 *
 * BACKEND:
 *   Reads:   usePosts()       → app/hooks/usePosts.ts
 *   Create:  useCreatePost()  → app/hooks/usePosts.ts
 *   Update:  useUpdatePost()  → app/hooks/usePosts.ts
 *   Delete:  useDeletePost()  → app/hooks/usePosts.ts
 *
 * Poll options are written to / replaced in PollOptions directly here
 * using the supabase client — no separate hook needed.
 *
 * HOOKS TO ADD (if not yet in usePosts.ts):
 * ─────────────────────────────────────────────────────────────────────────────
 *   export function useCreatePost() { ... }
 *   export function useUpdatePost() { ... }
 *   export function useDeletePost() { ... }
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  StatusBar,
  Platform,
  KeyboardAvoidingView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { usePosts, useCreatePost, useUpdatePost, useDeletePost } from '../../hooks/usePosts';
import { useSettings, useUpdateSettings } from '../../hooks/useSettings';
import { supabase } from '../../utils/supabase';
import { C, s } from './AdminDashboardScreen.styles';

// =============================================================================
// TYPES
// =============================================================================

interface PollOption {
  id: string;
  post_id: string;
  option_text: string;
}

interface RawPost {
  id: string;
  admin_id: string;
  type: 'announcement' | 'poll';
  title: string;
  content: string;
  created_at: string;
  PollOptions?: PollOption[];
}

interface MitingQuestion {
  id: string;
  student_id: string;
  question_text: string;
  upvote_count: number;
  is_approved: boolean;
  created_at: string;
}

type FeedTab = 'all' | 'announcement' | 'poll' | 'miting';
type MitingSubTab = 'live' | 'pending';

interface ModalState {
  visible: boolean;
  mode: 'create' | 'edit';
  post: RawPost | null;
}

interface SavePayload {
  type: 'announcement' | 'poll';
  title: string;
  content: string;
  pollOptions: string[];
}

// =============================================================================
// HELPERS
// =============================================================================

function timeAgo(iso: string): string {
  const diff  = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(mins / 60);
  const days  = Math.floor(hours / 24);
  if (days > 0)  return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (mins > 0)  return `${mins}m ago`;
  return 'Just now';
}

async function savePollOptions(postId: string, options: string[]): Promise<void> {
  const trimmed = options.map(o => o.trim()).filter(Boolean);
  if (trimmed.length === 0) return;

  const { error: delErr } = await supabase
    .from('PollOptions')
    .delete()
    .eq('post_id', postId);
  if (delErr) throw delErr;

  const rows = trimmed.map(option_text => ({ post_id: postId, option_text }));
  const { error: insErr } = await supabase.from('PollOptions').insert(rows);
  if (insErr) throw insErr;
}

// =============================================================================
// SUMMARY HEADER
// =============================================================================

const SummaryHeader: React.FC<{ posts: RawPost[] }> = ({ posts }) => {
  const total         = posts.length;
  const announcements = posts.filter(p => p.type === 'announcement').length;
  const polls         = posts.filter(p => p.type === 'poll').length;

  const stats = [
    { label: 'Total Posts',   value: total,         color: C.text,  icon: 'layers-outline'   as const },
    { label: 'Announcements', value: announcements, color: C.amber, icon: 'megaphone-outline' as const },
    { label: 'Polls',         value: polls,         color: C.green, icon: 'bar-chart-outline' as const },
  ];

  return (
    <View style={s.summaryRow}>
      {stats.map(stat => (
        <View key={stat.label} style={s.statCard}>
          <View style={[s.statIcon, { backgroundColor: stat.color + '18' }]}>
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
  post: RawPost;
  onEdit: (post: RawPost) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}> = ({ post, onEdit, onDelete, isDeleting }) => {
  const isPoll = post.type === 'poll';

  const handleDelete = () => {
    Alert.alert(
      'Delete Post',
      `"${post.title}" will be permanently removed. This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDelete(post.id) },
      ],
    );
  };

  return (
    <View style={s.postRow}>
      <View style={[s.typePill, { backgroundColor: isPoll ? C.greenDim : C.amberGlow }]}>
        <Ionicons
          name={isPoll ? 'bar-chart-outline' : 'megaphone-outline'}
          size={11}
          color={isPoll ? C.green : C.amber}
        />
        <Text style={[s.typePillText, { color: isPoll ? C.green : C.amber }]}>
          {isPoll ? 'Poll' : 'Notice'}
        </Text>
      </View>

      <Text style={s.postRowTitle} numberOfLines={1}>{post.title}</Text>

      {post.type === 'announcement' && post.content ? (
        <Text style={s.postRowBody} numberOfLines={2}>{post.content}</Text>
      ) : null}

      {post.type === 'poll' && post.PollOptions && post.PollOptions.length > 0 ? (
        <Text style={s.postRowBody}>
          {post.PollOptions.length} option{post.PollOptions.length !== 1 ? 's' : ''}
        </Text>
      ) : null}

      <View style={s.postRowFooter}>
        <Text style={s.postRowTime}>{timeAgo(post.created_at)}</Text>
        <View style={s.postRowActions}>
          <TouchableOpacity style={s.actionBtn} onPress={() => onEdit(post)}>
            <Ionicons name="pencil-outline" size={15} color={C.textSub} />
            <Text style={s.actionBtnText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.actionBtn, s.actionBtnDanger]}
            onPress={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting
              ? <ActivityIndicator size={12} color={C.red} />
              : <Ionicons name="trash-outline" size={15} color={C.red} />
            }
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

const EMPTY_FORM = {
  type: 'announcement' as 'announcement' | 'poll',
  title: '',
  content: '',
};

const PostModal: React.FC<{
  state: ModalState;
  onClose: () => void;
  onSave: (payload: SavePayload, id?: string) => void;
  isSaving: boolean;
}> = ({ state, onClose, onSave, isSaving }) => {
  const [form, setForm]               = useState(EMPTY_FORM);
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);

  React.useEffect(() => {
    if (state.visible && state.post) {
      setForm({
        type:    state.post.type,
        title:   state.post.title,
        content: state.post.content ?? '',
      });
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
    if (form.type === 'poll') {
      const filled = pollOptions.filter(o => o.trim());
      if (filled.length < 2) {
        Alert.alert('Not enough options', 'A poll needs at least 2 options.');
        return;
      }
    }
    onSave({ ...form, pollOptions }, state.post?.id);
  };

  const isEdit = state.mode === 'edit';

  return (
    <Modal visible={state.visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={onClose} />

        <View style={s.sheet}>
          <View style={s.sheetHandle} />

          <View style={s.sheetHeader}>
            <Text style={s.sheetTitle}>{isEdit ? 'Edit Post' : 'New Post'}</Text>
            <TouchableOpacity onPress={onClose} style={s.sheetClose}>
              <Ionicons name="close" size={20} color={C.textSub} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={s.sheetBody}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
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
                    style={{ marginRight: 6 }}
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
              placeholder="Enter a title…"
              placeholderTextColor={C.textMuted}
              value={form.title}
              onChangeText={v => setForm(f => ({ ...f, title: v }))}
            />

            {form.type === 'announcement' && (
              <>
                <Text style={s.fieldLabel}>Content</Text>
                <TextInput
                  style={[s.input, s.inputMultiline]}
                  placeholder="Write your announcement…"
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
                        <Ionicons name="close-circle" size={18} color={C.red} />
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
          </ScrollView>

          <View style={s.sheetFooter}>
            <TouchableOpacity
              style={[s.saveBtn, isSaving && { opacity: 0.6 }]}
              onPress={handleSave}
              disabled={isSaving}
            >
              {isSaving
                ? <ActivityIndicator size={16} color="#000" />
                : <Ionicons name={isEdit ? 'checkmark' : 'add'} size={16} color="#000" style={{ marginRight: 6 }} />
              }
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
  isActive: boolean;
  isLoading: boolean;
  isToggling: boolean;
  onToggle: () => void;
}> = ({ isActive, isLoading, isToggling, onToggle }) => (
  <View style={mStyles.card}>
    <View style={mStyles.statusRow}>
      <View style={[mStyles.dot, { backgroundColor: isActive ? C.green : C.textMuted }]} />
      <Text style={[mStyles.statusText, { color: isActive ? C.green : C.textMuted }]}>
        {isLoading ? 'Loading…' : isActive ? 'LIVE' : 'INACTIVE'}
      </Text>
    </View>

    <Text style={mStyles.title}>Miting de Avance</Text>
    <Text style={mStyles.desc}>
      {isActive
        ? 'The live Q&A session is currently open. Students can submit and upvote questions.'
        : 'The live Q&A session is currently closed. Tap the button below to open it for students.'}
    </Text>

    <TouchableOpacity
      style={[
        mStyles.toggleBtn,
        isActive ? mStyles.toggleBtnEnd : mStyles.toggleBtnLive,
        (isLoading || isToggling) && { opacity: 0.5 },
      ]}
      onPress={onToggle}
      disabled={isLoading || isToggling}
      activeOpacity={0.8}
    >
      {isToggling ? (
        <ActivityIndicator size={16} color="#fff" />
      ) : (
        <Ionicons
          name={isActive ? 'mic-off-outline' : 'mic-outline'}
          size={18}
          color="#fff"
          style={{ marginRight: 8 }}
        />
      )}
      <Text style={mStyles.toggleBtnText}>
        {isToggling ? 'Updating…' : isActive ? 'End Session' : 'Go Live'}
      </Text>
    </TouchableOpacity>

    <View style={mStyles.infoRow}>
      <Ionicons name="information-circle-outline" size={14} color={C.textMuted} />
      <Text style={mStyles.infoText}>
        Students receive a notification the moment you go live.
      </Text>
    </View>
  </View>
);

// =============================================================================
// MITING — LIVE FEED CARD (read-only preview + delete)
// =============================================================================

const LiveQuestionCard: React.FC<{
  q: MitingQuestion;
  index: number;
  total: number;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}> = ({ q, index, total, onDelete, isDeleting }) => {
  const isTop = index === 0 && total > 1;

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
    <View style={[mStyles.qCard, isTop && mStyles.qCardTop]}>
      <View style={mStyles.upvoteCol}>
        <Ionicons name="arrow-up-circle-outline" size={20} color={C.textMuted} />
        <Text style={mStyles.upvoteCount}>{q.upvote_count}</Text>
      </View>
      <View style={{ flex: 1 }}>
        {isTop && (
          <View style={mStyles.topBadge}>
            <Text style={mStyles.topBadgeText}>🔥 Top Question</Text>
          </View>
        )}
        <Text style={mStyles.qText}>{q.question_text}</Text>
        <View style={mStyles.qFooter}>
          <Text style={mStyles.qMeta}>{timeAgo(q.created_at)}</Text>
          <TouchableOpacity
            style={[mStyles.deleteBtn, isDeleting && { opacity: 0.5 }]}
            onPress={handleDelete}
            disabled={isDeleting}
            activeOpacity={0.8}
          >
            {isDeleting
              ? <ActivityIndicator size={12} color={C.red} />
              : <Ionicons name="trash-outline" size={13} color={C.red} />
            }
            <Text style={mStyles.deleteBtnText}>Delete</Text>
          </TouchableOpacity>
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
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  isApproving: boolean;
  isRejecting: boolean;
}> = ({ q, onApprove, onReject, isApproving, isRejecting }) => (
  <View style={mStyles.qCard}>
    <View style={{ flex: 1 }}>
      <Text style={mStyles.qText}>{q.question_text}</Text>
      <Text style={mStyles.qMeta}>{timeAgo(q.created_at)}</Text>
      <View style={mStyles.approvalRow}>
        <TouchableOpacity
          style={[mStyles.approveBtn, (isApproving || isRejecting) && { opacity: 0.5 }]}
          onPress={() => onApprove(q.id)}
          disabled={isApproving || isRejecting}
          activeOpacity={0.8}
        >
          {isApproving
            ? <ActivityIndicator size={12} color="#fff" />
            : <Ionicons name="checkmark" size={14} color="#fff" style={{ marginRight: 5 }} />
          }
          <Text style={mStyles.approveBtnText}>Approve</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[mStyles.rejectBtn, (isApproving || isRejecting) && { opacity: 0.5 }]}
          onPress={() => onReject(q.id)}
          disabled={isApproving || isRejecting}
          activeOpacity={0.8}
        >
          {isRejecting
            ? <ActivityIndicator size={12} color={C.red} />
            : <Ionicons name="close" size={14} color={C.red} style={{ marginRight: 5 }} />
          }
          <Text style={mStyles.rejectBtnText}>Reject</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
);

// =============================================================================
// MITING STYLES
// =============================================================================

const mStyles = {
  // Control panel card
  card: {
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 20,
    marginBottom: 12,
  } as const,
  statusRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    marginBottom: 12,
  },
  dot:        { width: 8, height: 8, borderRadius: 4 } as const,
  statusText: { fontSize: 11, fontWeight: '800' as const, letterSpacing: 1.2 },
  title:      { fontSize: 20, fontWeight: '800' as const, color: C.text, marginBottom: 8 },
  desc:       { fontSize: 13, color: C.textSub, lineHeight: 20, marginBottom: 20 },
  toggleBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderRadius: 14,
    paddingVertical: 15,
    marginBottom: 14,
  },
  toggleBtnLive: { backgroundColor: C.green } as const,
  toggleBtnEnd:  { backgroundColor: '#EF4444' } as const,
  toggleBtnText: { fontSize: 15, fontWeight: '700' as const, color: '#fff' },
  infoRow:  { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6 },
  infoText: { fontSize: 11, color: C.textMuted, flex: 1, lineHeight: 16 },

  // Sub-tabs
  subTabRow: {
    flexDirection: 'row' as const,
    gap: 8,
    marginBottom: 12,
  },
  subTab: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.pill,
    gap: 6,
  },
  subTabActive:     { backgroundColor: 'rgba(34,197,94,0.15)', borderColor: C.green } as const,
  subTabText:       { fontSize: 13, color: C.textMuted, fontWeight: '500' as const },
  subTabTextActive: { color: '#fff', fontWeight: '600' as const },
  pendingBadge: {
    backgroundColor: C.amber,
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
    minWidth: 18,
    alignItems: 'center' as const,
  },
  pendingBadgeText: { fontSize: 10, fontWeight: '800' as const, color: '#000' },

  // Question cards (shared between live + pending)
  qCard: {
    flexDirection: 'row' as const,
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  qCardTop:    { borderColor: C.green + '55', backgroundColor: C.surface } as const,
  upvoteCol:   { alignItems: 'center' as const, gap: 3, minWidth: 32, paddingTop: 2 },
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
  qText:   { fontSize: 14, color: C.text, lineHeight: 21, marginBottom: 6 },
  qFooter: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
  },
  qMeta: { fontSize: 11, color: C.textMuted },

  // Delete button (live feed)
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

  // Pending approval actions
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
  },
  rejectBtnText: { fontSize: 13, fontWeight: '700' as const, color: C.red },

  // Empty state
  emptyBox:  { alignItems: 'center' as const, paddingVertical: 36, gap: 10 },
  emptyText: { fontSize: 13, color: C.textMuted },
};

// =============================================================================
// MAIN SCREEN
// =============================================================================

const TABS: { key: FeedTab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'all',          label: 'All',     icon: 'layers-outline'    },
  { key: 'announcement', label: 'Notices', icon: 'megaphone-outline' },
  { key: 'poll',         label: 'Polls',   icon: 'bar-chart-outline' },
  { key: 'miting',       label: 'Miting',  icon: 'mic-outline'       },
];

export function AdminDashboardScreen() {
  const [activeTab, setActiveTab]   = useState<FeedTab>('all');
  const [modal, setModal]           = useState<ModalState>({ visible: false, mode: 'create', post: null });
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isSaving, setIsSaving]     = useState(false);

  // Miting sub-tab state
  const [mitingSubTab,     setMitingSubTab]     = useState<MitingSubTab>('live');
  const [liveQuestions,    setLiveQuestions]    = useState<MitingQuestion[]>([]);
  const [pendingQuestions, setPendingQuestions] = useState<MitingQuestion[]>([]);
  const [pendingCount,     setPendingCount]     = useState(0);
  const [approvingId,      setApprovingId]      = useState<string | null>(null);
  const [rejectingId,      setRejectingId]      = useState<string | null>(null);
  const [deletingLiveId,   setDeletingLiveId]   = useState<string | null>(null);

  const { data: rawPosts, isLoading, isError, error } = usePosts();
  const { mutateAsync: createPost } = useCreatePost();
  const { mutateAsync: updatePost } = useUpdatePost();
  const { mutateAsync: deletePost } = useDeletePost();

  const { settings, isLoading: settingsLoading } = useSettings();
  const { mutateAsync: updateSettings, isPending: isToggling } = useUpdateSettings();
  const isMitingActive = !!(settings?.is_miting_active);

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
    Alert.alert(
      isMitingActive ? 'End Miting Session?' : 'Start Miting Session?',
      isMitingActive
        ? 'This will close the live Q&A. Students will no longer be able to submit questions.'
        : 'This will open the live Q&A for all students. They will be notified immediately.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isMitingActive ? 'End Session' : 'Go Live',
          style: isMitingActive ? 'destructive' : 'default',
          onPress: async () => {
            try {
              await updateSettings({ is_miting_active: !isMitingActive });
            } catch (e: any) {
              Alert.alert('Error', e?.message ?? 'Could not update Miting status.');
            }
          },
        },
      ],
    );
  };

  const posts    = (rawPosts ?? []) as RawPost[];
  const filtered = activeTab === 'miting'
    ? []
    : posts.filter(p => activeTab === 'all' || p.type === activeTab);

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
          type:    payload.type,
          title:   payload.title,
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

  const ListHeader = (
    <>
      <View style={s.appHeader}>
        <View>
          <Text style={s.appLogo}>AnimoQuorum</Text>
          <Text style={s.appSub}>Admin · DLSL COMELEC</Text>
        </View>
        <View style={s.adminPill}>
          <Ionicons name="shield-checkmark-outline" size={13} color={C.green} />
          <Text style={s.adminPillText}>Admin</Text>
        </View>
      </View>

      {!isLoading && !isError && <SummaryHeader posts={posts} />}

      <View style={s.sectionBar}>
        <Text style={s.sectionLabel}>Manage Posts</Text>
        <TouchableOpacity style={s.createBtn} onPress={openCreate}>
          <Ionicons name="add" size={16} color="#000" />
          <Text style={s.createBtnText}>New Post</Text>
        </TouchableOpacity>
      </View>

      {/* ── Main filter tabs (Miting tab gets pending badge) ── */}
      <View style={s.tabRow}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[s.tab, activeTab === tab.key && s.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Ionicons
              name={tab.icon}
              size={14}
              color={activeTab === tab.key ? '#fff' : C.textMuted}
              style={{ marginRight: 5 }}
            />
            <Text style={[s.tabText, activeTab === tab.key && s.tabTextActive]}>
              {tab.label}
            </Text>
            {tab.key === 'miting' && pendingCount > 0 && (
              <View style={mStyles.pendingBadge}>
                <Text style={mStyles.pendingBadgeText}>{pendingCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'miting' && (
        <>
          {/* ── Control panel (Go Live / End Session) ── */}
          <MitingControlPanel
            isActive={isMitingActive}
            isLoading={settingsLoading}
            isToggling={isToggling}
            onToggle={handleMitingToggle}
          />

          {/* ── Sub-tabs: Live Feed | Pending ── */}
          <View style={mStyles.subTabRow}>
            <TouchableOpacity
              style={[mStyles.subTab, mitingSubTab === 'live' && mStyles.subTabActive]}
              onPress={() => setMitingSubTab('live')}
            >
              <Ionicons
                name="eye-outline"
                size={14}
                color={mitingSubTab === 'live' ? '#fff' : C.textMuted}
              />
              <Text style={[mStyles.subTabText, mitingSubTab === 'live' && mStyles.subTabTextActive]}>
                Live Feed
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[mStyles.subTab, mitingSubTab === 'pending' && mStyles.subTabActive]}
              onPress={() => setMitingSubTab('pending')}
            >
              <Ionicons
                name="time-outline"
                size={14}
                color={mitingSubTab === 'pending' ? '#fff' : C.textMuted}
              />
              <Text style={[mStyles.subTabText, mitingSubTab === 'pending' && mStyles.subTabTextActive]}>
                Pending
              </Text>
              {pendingQuestions.length > 0 && (
                <View style={mStyles.pendingBadge}>
                  <Text style={mStyles.pendingBadgeText}>{pendingQuestions.length}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* ── Live Feed content ── */}
          {mitingSubTab === 'live' && (
            liveQuestions.length === 0 ? (
              <View style={mStyles.emptyBox}>
                <Ionicons name="chatbubble-ellipses-outline" size={30} color={C.textMuted} />
                <Text style={mStyles.emptyText}>No approved questions yet.</Text>
              </View>
            ) : (
              liveQuestions.map((q, i) => (
                <LiveQuestionCard
                  key={q.id}
                  q={q}
                  index={i}
                  total={liveQuestions.length}
                  onDelete={handleDeleteLive}
                  isDeleting={deletingLiveId === q.id}
                />
              ))
            )
          )}

          {/* ── Pending content ── */}
          {mitingSubTab === 'pending' && (
            pendingQuestions.length === 0 ? (
              <View style={mStyles.emptyBox}>
                <Ionicons name="checkmark-circle-outline" size={30} color={C.textMuted} />
                <Text style={mStyles.emptyText}>No pending questions.</Text>
              </View>
            ) : (
              pendingQuestions.map(q => (
                <PendingQuestionCard
                  key={q.id}
                  q={q}
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

  return (
    <SafeAreaView style={s.screen} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      <FlatList
        data={isLoading || isError ? [] : filtered}
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
              <ActivityIndicator size="large" color={C.green} />
              <Text style={s.stateText}>Loading posts…</Text>
            </View>
          ) : isError ? (
            <View style={s.stateBox}>
              <Ionicons name="cloud-offline-outline" size={32} color={C.textMuted} />
              <Text style={s.stateText}>
                {(error as Error)?.message ?? 'Failed to load posts.'}
              </Text>
            </View>
          ) : (
            <View style={s.stateBox}>
              <Ionicons name="file-tray-outline" size={32} color={C.textMuted} />
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
  );
}