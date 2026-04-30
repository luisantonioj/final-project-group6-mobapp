/**
 * MitingScreen.tsx — Reddit-style live Q&A for Miting de Avance
 * ─────────────────────────────────────────────────────────────────────────────
 * Students submit questions and upvote the best ones. The list updates in
 * real-time via Supabase Realtime (already wired in useMitingQuestions hook).
 * Only approved questions appear (is_approved = true, set by admins).
 *
 * FEATURES:
 *   • Submit a question (inserts into MitingQuestions — pending admin approval)
 *   • Upvote / remove upvote (QuestionUpvotes, blocked by unique constraint)
 *   • Live reordering as upvote_count changes via Realtime subscription
 *   • Inactive state when is_miting_active = false in SystemSettings
 *   • Admin alert push notification (notifyAdminAlert) fires when Miting
 *     goes live — triggered from a Realtime listener on SystemSettings
 *
 * DATA:
 *   useMitingQuestions() → questions sorted by upvote_count DESC, realtime ✓
 *   useUpvoteQuestion()  → inserts into QuestionUpvotes
 *   useRemoveUpvote()    → deletes from QuestionUpvotes
 *   useSettings()        → checks is_miting_active
 *
 * LOCAL UPVOTE TRACKING:
 *   We track which question IDs the current user has upvoted in local state
 *   (Set<string>) so the UI responds instantly without a round-trip.
 *   The DB enforces uniqueness — if the insert fails, we revert the local state.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  TextInput, StyleSheet, ActivityIndicator,
  KeyboardAvoidingView, Platform, Animated,
  StatusBar,
} from 'react-native';
import { SafeAreaView }      from 'react-native-safe-area-context';
import { Ionicons }          from '@expo/vector-icons';
import { useMitingQuestions, useUpvoteQuestion, useRemoveUpvote } from '../../hooks/useMiting';
import { useAuthStore }      from '../../stores/authStore';
import { supabase }          from '../../utils/supabase';
import { notifyAdminAlert }  from '../../notifications/notificationService';
import { T }                 from '../../theme';

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg:          T.bg,
  surface:     T.surface,
  surface2:    T.surface2,
  border:      T.border,
  green:       T.green,
  greenBright: T.greenBright,
  greenGlow:   T.greenLight,
  amber:       T.amber,
  amberGlow:   T.amberGlow,
  text:        T.text,
  textSub:     T.textSub,
  textMuted:   T.textMuted,
  red:         T.red,
};

// MitingQuestion row shape
interface Question {
  id:            string;
  question_text: string;
  upvote_count:  number;
  student_id:    string;
  is_approved:   boolean;
  created_at:    string;
}

// ─── QuestionCard ─────────────────────────────────────────────────────────────
function QuestionCard({
  q, index, totalCount, hasUpvoted, onUpvote, userId,
}: {
  q: Question;
  index: number;
  totalCount: number;
  hasUpvoted: boolean;
  onUpvote: (id: string) => void;
  userId: string;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const isTop = index === 0 && totalCount > 1;
  const isOwn = q.student_id === userId;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.35, duration: 100, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }),
    ]).start();
    onUpvote(q.id);
  };

  return (
    <View style={[s.questionCard, isTop && s.questionCardTop]}>
      {/* Upvote button */}
      <TouchableOpacity
        style={[s.upvoteBtn, hasUpvoted && s.upvoteBtnActive]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <Ionicons
            name={hasUpvoted ? 'arrow-up-circle' : 'arrow-up-circle-outline'}
            size={22}
            color={hasUpvoted ? C.green : C.textMuted}
          />
        </Animated.View>
        <Text style={[s.upvoteCount, hasUpvoted && { color: C.green }]}>
          {q.upvote_count}
        </Text>
      </TouchableOpacity>

      {/* Question body */}
      <View style={{ flex: 1 }}>
        {isTop && (
          <View style={s.topBadge}>
            <Text style={s.topBadgeText}>🔥 Top Question</Text>
          </View>
        )}
        <Text style={s.questionText}>{q.question_text}</Text>
        <View style={s.questionFooter}>
          <Text style={s.questionMeta}>
            {new Date(q.created_at).toLocaleTimeString('en-PH', {
              hour: '2-digit', minute: '2-digit',
            })}
          </Text>
          {isOwn && (
            <View style={s.youBadge}>
              <Text style={s.youBadgeText}>You</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

export function MitingScreen() {
  const { userProfile } = useAuthStore();
  const userId = userProfile?.id ?? '';

  const { data: questions, isLoading } = useMitingQuestions() as { data: Question[] | undefined, isLoading: boolean };

  const { mutateAsync: upvote }       = useUpvoteQuestion();
  const { mutateAsync: removeUpvote } = useRemoveUpvote();

  const [draft,          setDraft]         = useState('');
  const [submitting,     setSubmitting]    = useState(false);
  const [upvotedIds,     setUpvotedIds]    = useState<Set<string>>(new Set());
  const [isMitingActive, setMitingActive]  = useState(false);
  const [showToast,      setShowToast]     = useState(false);

  const inputRef  = useRef<TextInput>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // ─── Pulse animation for LIVE dot ────────────────────────────────────────
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.2, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,   duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // ─── Check if Miting is active + listen for admin to activate it ─────────
  useEffect(() => {
    // Initial check — read current value from DB on mount
    supabase.from('SystemSettings').select('is_miting_active').limit(1).maybeSingle()
      .then(({ data }: { data: any }) => setMitingActive(!!(data as any)?.is_miting_active));

    // Realtime: fire notification + update state when admin activates Miting
    const ch = supabase
      .channel('miting-settings')
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'SystemSettings' },
        (payload: any) => {
          const next = payload.new as any;
          const prev = payload.old as any;
          setMitingActive(!!next.is_miting_active);
          // 🔔 Notify students when admin turns Miting on
          if (!prev.is_miting_active && next.is_miting_active) {
            notifyAdminAlert('🎤 Miting de Avance is now live! Submit your questions.');
          }
        })
      .subscribe();

    return () => { supabase.removeChannel(ch); };
  }, []);

  // ─── Submit a question ────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const text = draft.trim();
    if (!text || !userId) return;
    setSubmitting(true);
    try {
      await supabase.from('MitingQuestions').insert({
        student_id:    userId,
        question_text: text,
      });
      setDraft('');
      inputRef.current?.blur();
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Toggle upvote (optimistic) ───────────────────────────────────────────
  const handleUpvote = async (questionId: string) => {
    if (!userId) return;
    const hasUpvoted = upvotedIds.has(questionId);

    // Optimistic update
    setUpvotedIds(prev => {
      const next = new Set(prev);
      hasUpvoted ? next.delete(questionId) : next.add(questionId);
      return next;
    });

    try {
      if (hasUpvoted) {
        await removeUpvote({ questionId, studentId: userId });
      } else {
        await upvote({ questionId, studentId: userId });
      }
    } catch {
      // Revert on error
      setUpvotedIds(prev => {
        const next = new Set(prev);
        hasUpvoted ? next.add(questionId) : next.delete(questionId);
        return next;
      });
    }
  };

  const charColor = draft.length >= 265 ? C.red : draft.length >= 250 ? C.amber : C.textMuted;
  const qCount    = questions?.length ?? 0;
  const qLabel    = qCount === 1 ? '1 question' : `${qCount} questions`;

  // ─── Inactive state ───────────────────────────────────────────────────────
  if (!isMitingActive) {
    return (
      <SafeAreaView style={s.safe}>
        <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
        <View style={s.center}>
          <View style={s.inactiveIcon}>
            <Ionicons name="mic-off-outline" size={40} color={C.textMuted} />
          </View>
          <Text style={s.inactiveTitle}>Not Live Yet</Text>
          <Text style={s.inactiveBody}>
            Miting de Avance hasn't started.{'\n'}
            You'll get a notification when it goes live.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={90}
      >
        {/* ── Header ── */}
        <View style={s.header}>
          <View style={s.livePill}>
            <Animated.View style={[s.liveDot, { opacity: pulseAnim }]} />
            <Text style={s.livePillText}>LIVE</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={s.headerTitle}>Miting de Avance</Text>
            <Text style={s.headerSub}>Upvote the questions you want answered</Text>
          </View>
          <View style={s.questionCountBadge}>
            <Text style={s.questionCountText}>{qLabel}</Text>
          </View>
        </View>

        {/* ── Questions list ── */}
        {isLoading ? (
          <View style={s.center}>
            <ActivityIndicator size="large" color={C.green} />
          </View>
        ) : (
          <FlatList
            data={questions ?? []}
            keyExtractor={item => item.id}
            contentContainerStyle={s.list}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <View style={s.emptyState}>
                <Ionicons name="chatbubble-ellipses-outline" size={36} color={C.textMuted} />
                <Text style={s.emptyTitle}>No questions yet</Text>
                <Text style={s.emptyBody}>Be the first to submit one below.</Text>
              </View>
            }
            renderItem={({ item: q, index }) => (
              <QuestionCard
                q={q}
                index={index}
                totalCount={questions?.length ?? 0}
                hasUpvoted={upvotedIds.has(q.id)}
                onUpvote={handleUpvote}
                userId={userId}
              />
            )}
          />
        )}

        {/* ── Submission toast ── */}
        {showToast && (
          <View style={s.toast}>
            <Ionicons name="checkmark-circle" size={16} color={C.green} />
            <Text style={s.toastText}>Question submitted! Waiting for approval.</Text>
          </View>
        )}

        {/* ── Ask a question input ── */}
        <View style={s.inputBar}>
          <View style={s.inputWrap}>
            <TextInput
              ref={inputRef}
              style={s.input}
              value={draft}
              onChangeText={setDraft}
              placeholder="Ask the candidates something…"
              placeholderTextColor={C.textMuted}
              multiline
              maxLength={280}
              returnKeyType="send"
              onSubmitEditing={handleSubmit}
            />
            <Text style={[s.charCount, { color: charColor }]}>{draft.length}/280</Text>
          </View>
          <TouchableOpacity
            style={[s.sendBtn, (!draft.trim() || submitting) && s.sendBtnDisabled]}
            onPress={handleSubmit}
            disabled={!draft.trim() || submitting}
            activeOpacity={0.8}
          >
            {submitting
              ? <ActivityIndicator size="small" color="#fff" />
              : <Ionicons name="send" size={18} color="#fff" />
            }
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },

  // Inactive state
  inactiveIcon:  {
    width: 80, height: 80, borderRadius: 40, backgroundColor: C.surface2,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
    borderWidth: 1, borderColor: C.border,
  },
  inactiveTitle: { fontSize: 20, fontWeight: '800', color: C.text },
  inactiveBody:  { fontSize: 14, color: C.textMuted, textAlign: 'center', lineHeight: 22, marginTop: 8 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  livePill: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(220,38,38,0.10)', borderRadius: 20,
    paddingHorizontal: 8, paddingVertical: 4, gap: 4,
  },
  liveDot:      { width: 6, height: 6, borderRadius: 3, backgroundColor: C.red },
  livePillText: { fontSize: 10, fontWeight: '800', color: C.red, letterSpacing: 1 },
  headerTitle:  { fontSize: 15, fontWeight: '800', color: C.text },
  headerSub:    { fontSize: 11, color: C.textMuted, marginTop: 1 },

  questionCountBadge: {
    backgroundColor: C.surface2, borderRadius: 12,
    borderWidth: 1, borderColor: C.border,
    paddingHorizontal: 9, paddingVertical: 4,
  },
  questionCountText: { fontSize: 11, fontWeight: '700', color: C.textMuted },

  // List
  list: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 16 },

  emptyState: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: C.textSub },
  emptyBody:  { fontSize: 13, color: C.textMuted },

  // Question card
  questionCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: C.surface, borderRadius: 14,
    borderWidth: 1, borderColor: C.border,
    padding: 14, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 2, elevation: 1,
  },
  questionCardTop: {
    borderColor: C.green + '55',
    backgroundColor: C.surface2,
  },

  // Upvote
  upvoteBtn: {
    alignItems: 'center', gap: 3, minWidth: 36,
    paddingTop: 2,
  },
  upvoteBtnActive: {
    backgroundColor: C.greenGlow,
    borderRadius: 10,
    paddingHorizontal: 4,
  },
  upvoteCount: { fontSize: 13, fontWeight: '700', color: C.textMuted },

  // Top badge
  topBadge: {
    alignSelf: 'flex-start',
    backgroundColor: C.greenGlow, borderRadius: 20,
    paddingHorizontal: 9, paddingVertical: 3,
    marginBottom: 6,
  },
  topBadgeText: { fontSize: 11, fontWeight: '700', color: C.green },

  questionText:   { fontSize: 14, color: C.text, lineHeight: 21, marginBottom: 6 },
  questionFooter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  questionMeta:   { fontSize: 11, color: C.textMuted },

  // "You" badge
  youBadge: {
    backgroundColor: 'rgba(27,98,53,0.15)', borderRadius: 8,
    borderWidth: 1, borderColor: C.green,
    paddingHorizontal: 7, paddingVertical: 2,
  },
  youBadgeText: { fontSize: 10, fontWeight: '700', color: C.green },

  // Toast
  toast: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 14, marginBottom: 8,
    backgroundColor: C.surface2, borderRadius: 12,
    borderWidth: 1, borderColor: C.green + '44',
    paddingHorizontal: 14, paddingVertical: 10,
  },
  toastText: { fontSize: 13, color: C.textSub, flex: 1 },

  // Input bar
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: C.border,
    backgroundColor: C.bg,
  },
  inputWrap: {
    flex: 1,
    backgroundColor: C.surface, borderRadius: 14,
    borderWidth: 1, borderColor: C.border,
    paddingHorizontal: 14, paddingTop: 10, paddingBottom: 8,
  },
  input:     { color: C.text, fontSize: 14, maxHeight: 90 },
  charCount: { fontSize: 10, textAlign: 'right', marginTop: 4 },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: C.green,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 2,
    shadowColor: C.green, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25, shadowRadius: 4, elevation: 3,
  },
  sendBtnDisabled: { backgroundColor: C.surface2, borderWidth: 1, borderColor: C.border,
                     shadowOpacity: 0 },
});