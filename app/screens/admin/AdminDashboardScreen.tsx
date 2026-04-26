/**
 * AdminDashboardScreen.tsx — Admin post management screen
 * ─────────────────────────────────────────────────────────────────────────────
 * Features:
 *   - Summary header (total posts, announcement count, poll count)
 *   - Filterable list of all posts (All / Notices / Polls tabs)
 *   - Create / Edit via bottom sheet modal (title + content + type + poll options)
 *   - Delete with confirmation alert
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
 *   export function useCreatePost() {
 *     const qc = useQueryClient();
 *     return useMutation({
 *       mutationFn: async (post: { type: string; title: string; content: string }) => {
 *         const { data, error } = await supabase.from('Posts').insert([post]).select().single();
 *         if (error) throw error;
 *         return data;
 *       },
 *       onSuccess: () => qc.invalidateQueries({ queryKey: ['posts'] }),
 *     });
 *   }
 *
 *   export function useUpdatePost() {
 *     const qc = useQueryClient();
 *     return useMutation({
 *       mutationFn: async ({ id, ...updates }: { id: string; type: string; title: string; content: string }) => {
 *         const { data, error } = await supabase.from('Posts').update(updates).eq('id', id).select().single();
 *         if (error) throw error;
 *         return data;
 *       },
 *       onSuccess: () => qc.invalidateQueries({ queryKey: ['posts'] }),
 *     });
 *   }
 *
 *   export function useDeletePost() {
 *     const qc = useQueryClient();
 *     return useMutation({
 *       mutationFn: async (id: string) => {
 *         const { error } = await supabase.from('Posts').delete().eq('id', id);
 *         if (error) throw error;
 *       },
 *       onSuccess: () => qc.invalidateQueries({ queryKey: ['posts'] }),
 *     });
 *   }
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useCallback } from 'react';
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

type FeedTab = 'all' | 'announcement' | 'poll';

interface ModalState {
  visible: boolean;
  mode: 'create' | 'edit';
  post: RawPost | null;
}

// Payload passed from PostModal → handleSave
interface SavePayload {
  type: 'announcement' | 'poll';
  title: string;
  content: string;
  pollOptions: string[]; // only used when type === 'poll'
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

/**
 * Writes poll options for a post.
 * Deletes all existing options first so editing is always a clean replace.
 */
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
// pollOptions are now included in the save payload so the parent can write
// them to the PollOptions table after upserting the post row.
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
            {/* Type toggle */}
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

            {/* Title */}
            <Text style={s.fieldLabel}>Title</Text>
            <TextInput
              style={s.input}
              placeholder="Enter a title…"
              placeholderTextColor={C.textMuted}
              value={form.title}
              onChangeText={v => setForm(f => ({ ...f, title: v }))}
            />

            {/* Announcement content */}
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

            {/* Poll options — fully wired to PollOptions table on save */}
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
// MAIN SCREEN
// =============================================================================

const TABS: { key: FeedTab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'all',          label: 'All',     icon: 'layers-outline'    },
  { key: 'announcement', label: 'Notices', icon: 'megaphone-outline' },
  { key: 'poll',         label: 'Polls',   icon: 'bar-chart-outline' },
];

export function AdminDashboardScreen() {
  const [activeTab, setActiveTab]   = useState<FeedTab>('all');
  const [modal, setModal]           = useState<ModalState>({ visible: false, mode: 'create', post: null });
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isSaving, setIsSaving]     = useState(false);

  const { data: rawPosts, isLoading, isError, error } = usePosts();
  const { mutateAsync: createPost } = useCreatePost();
  const { mutateAsync: updatePost } = useUpdatePost();
  const { mutateAsync: deletePost } = useDeletePost();

  const posts    = (rawPosts ?? []) as RawPost[];
  const filtered = posts.filter(p => activeTab === 'all' || p.type === activeTab);

  const openCreate = () => setModal({ visible: true, mode: 'create', post: null });
  const openEdit   = (post: RawPost) => setModal({ visible: true, mode: 'edit', post });
  const closeModal = () => setModal(m => ({ ...m, visible: false }));

  /**
   * Two-step save:
   *   1. Upsert the Post row, capture returned id
   *   2. If poll, delete + re-insert all PollOptions for that post
   */
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
      // Delete options first in case FK cascade is not set up
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
          </TouchableOpacity>
        ))}
      </View>
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
          isLoading ? (
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