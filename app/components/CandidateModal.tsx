/**
 * components/CandidateModal.tsx
 *
 * Candidate profile bottom sheet used in both student and admin contexts.
 *
 * STUDENT (VoteScreen) — onSelect provided, admin props omitted:
 *   <CandidateModal
 *     candidate={viewed}
 *     visible={!!viewed}
 *     onClose={() => setViewed(null)}
 *     onSelect={(c) => { selectCandidate(c.position_id, c.id); setViewed(null); }}
 *     alreadyVoted={!!selectedCandidates[viewed?.position_id ?? '']}
 *   />
 *
 * ADMIN (AdminCandidatesScreen) — onSelect omitted, admin props provided:
 *   <CandidateModal
 *     candidate={viewed}
 *     visible={!!viewed}
 *     onClose={() => setViewed(null)}
 *     onAdminEdit={(c) => { setViewed(null); openEdit(c); }}
 *     onAdminDelete={(c) => { setViewed(null); confirmDelete(c); }}
 *   />
 */

import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export interface CandidateRow {
  id:          string;
  name:        string;
  partylist:   string | null;
  position_id: string;
  email?:      string | null;
  credentials: string | null;
  platform:    string | null;
  photo_url:   string | null;
  Positions?:  { position_name: string } | null;
}

interface Props {
  candidate:      CandidateRow | null;
  visible:        boolean;
  onClose:        () => void;
  // Student props
  onSelect?:      (c: CandidateRow) => void;
  alreadyVoted?:  boolean;
  // Admin props
  onAdminEdit?:   (c: CandidateRow) => void;
  onAdminDelete?: (c: CandidateRow) => void;
}

const C = {
  bg:          '#0A0F0A',
  surface:     '#111811',
  surface2:    '#162016',
  border:      '#1E2E1E',
  borderBright:'#2A4A2A',
  green:       '#22C55E',
  greenDim:    '#0F6E56',
  greenFaint:  '#14532D',
  text:        '#F0FFF0',
  textSub:     '#A3C5A3',
  textMuted:   '#6B8C6B',
  red:         '#EF4444',
  redFaint:    'rgba(239,68,68,0.12)',
  amber:       '#F59E0B',
  amberFaint:  'rgba(245,158,11,0.12)',
  amberBorder: 'rgba(245,158,11,0.35)',
  redBorder:   'rgba(239,68,68,0.35)',
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0] ?? '')
    .join('')
    .toUpperCase();
}

export function CandidateModal({
  candidate,
  visible,
  onClose,
  onSelect,
  alreadyVoted,
  onAdminEdit,
  onAdminDelete,
}: Props) {
  if (!candidate) return null;

  const isAdminMode  = !onSelect && (!!onAdminEdit || !!onAdminDelete);
  const positionName = (candidate.Positions as { position_name: string } | null | undefined)?.position_name ?? 'Candidate';
  const initials     = getInitials(candidate.name);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={s.safe}>

        {/* Header */}
        <View style={s.header}>
          <Text style={s.headerLabel}>{positionName}</Text>
          <TouchableOpacity onPress={onClose} style={s.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close" size={20} color={C.textMuted} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={s.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Photo / Avatar */}
          <View style={s.photoWrap}>
            {candidate.photo_url ? (
              <Image source={{ uri: candidate.photo_url }} style={s.photo} />
            ) : (
              <View style={s.avatarFallback}>
                <Text style={s.avatarText}>{initials}</Text>
              </View>
            )}
          </View>

          {/* Name */}
          <Text style={s.name}>{candidate.name}</Text>

          {/* Partylist badge */}
          {candidate.partylist ? (
            <View style={s.partyBadge}>
              <Text style={s.partyText}>{candidate.partylist}</Text>
            </View>
          ) : null}

          {/* Email — admin only */}
          {isAdminMode && candidate.email ? (
            <View style={s.emailRow}>
              <Ionicons name="mail-outline" size={13} color={C.textMuted} />
              <Text style={s.emailText}>{candidate.email}</Text>
            </View>
          ) : null}

          {/* Credentials */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Credentials</Text>
            {candidate.credentials ? (
              <Text style={s.sectionBody}>{candidate.credentials}</Text>
            ) : (
              <Text style={s.sectionEmpty}>No credentials provided.</Text>
            )}
          </View>

          {/* Platform */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Platform</Text>
            {candidate.platform ? (
              <Text style={s.sectionBody}>{candidate.platform}</Text>
            ) : (
              <Text style={s.sectionEmpty}>No platform provided.</Text>
            )}
          </View>

          <View style={{ height: 140 }} />
        </ScrollView>

        {/* Fixed bottom action bar */}
        <View style={s.actions}>

          {/* STUDENT MODE */}
          {!isAdminMode && onSelect ? (
            <>
              <TouchableOpacity
                style={[s.primaryBtn, alreadyVoted && s.primaryBtnSwap]}
                onPress={() => onSelect(candidate)}
                activeOpacity={0.85}
              >
                <Ionicons
                  name={alreadyVoted ? 'swap-horizontal-outline' : 'checkmark-circle-outline'}
                  size={18}
                  color="#fff"
                />
                <Text style={s.primaryBtnText}>
                  {alreadyVoted ? 'Change Selection' : 'Select This Candidate'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.ghostBtn} onPress={onClose} activeOpacity={0.75}>
                <Text style={s.ghostBtnText}>Cancel</Text>
              </TouchableOpacity>
            </>
          ) : null}

          {/* ADMIN MODE */}
          {isAdminMode ? (
            <>
              <View style={s.adminRow}>
                {onAdminEdit ? (
                  <TouchableOpacity
                    style={[s.adminBtn, s.editBtn]}
                    onPress={() => onAdminEdit(candidate)}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="pencil-outline" size={15} color={C.amber} />
                    <Text style={[s.adminBtnText, { color: C.amber }]}>Edit</Text>
                  </TouchableOpacity>
                ) : null}
                {onAdminDelete ? (
                  <TouchableOpacity
                    style={[s.adminBtn, s.deleteBtn]}
                    onPress={() => onAdminDelete(candidate)}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="trash-outline" size={15} color={C.red} />
                    <Text style={[s.adminBtnText, { color: C.red }]}>Delete</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
              <TouchableOpacity style={s.ghostBtn} onPress={onClose} activeOpacity={0.75}>
                <Text style={s.ghostBtnText}>Close</Text>
              </TouchableOpacity>
            </>
          ) : null}

        </View>
      </SafeAreaView>
    </Modal>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  header: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: 20,
    paddingVertical:   14,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  headerLabel: {
    fontSize:      13,
    fontWeight:    '700',
    color:         C.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  closeBtn: {
    padding:         6,
    backgroundColor: C.surface2,
    borderRadius:    20,
  },

  content: {
    alignItems:        'center',
    paddingHorizontal: 24,
    paddingTop:        28,
  },
  photoWrap: { marginBottom: 16 },
  photo: {
    width:        110,
    height:       110,
    borderRadius: 55,
    borderWidth:  2,
    borderColor:  C.green,
  },
  avatarFallback: {
    width:           110,
    height:          110,
    borderRadius:    55,
    backgroundColor: C.surface2,
    borderWidth:     2,
    borderColor:     C.borderBright,
    alignItems:      'center',
    justifyContent:  'center',
  },
  avatarText: { fontSize: 36, fontWeight: '800', color: C.green },

  name: {
    fontSize:     22,
    fontWeight:   '800',
    color:        C.text,
    textAlign:    'center',
    marginBottom: 8,
  },
  partyBadge: {
    backgroundColor:   C.surface2,
    borderRadius:      20,
    borderWidth:       1,
    borderColor:       C.borderBright,
    paddingHorizontal: 14,
    paddingVertical:   5,
    marginBottom:      12,
  },
  partyText: {
    fontSize:      12,
    fontWeight:    '700',
    color:         C.textSub,
    letterSpacing: 0.5,
  },
  emailRow: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               5,
    backgroundColor:   C.surface2,
    borderRadius:      20,
    borderWidth:       1,
    borderColor:       C.border,
    paddingHorizontal: 12,
    paddingVertical:   4,
    marginBottom:      16,
  },
  emailText: { fontSize: 12, color: C.textMuted, fontWeight: '600' },

  section: { width: '100%', marginBottom: 20 },
  sectionTitle: {
    fontSize:      11,
    fontWeight:    '700',
    color:         C.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom:  8,
  },
  sectionBody:  { fontSize: 14, color: C.textSub, lineHeight: 22 },
  sectionEmpty: { fontSize: 14, color: C.textMuted, fontStyle: 'italic', lineHeight: 22 },

  actions: {
    position:          'absolute',
    bottom:            0,
    left:              0,
    right:             0,
    backgroundColor:   C.bg,
    paddingHorizontal: 20,
    paddingBottom:     36,
    paddingTop:        12,
    borderTopWidth:    1,
    borderTopColor:    C.border,
    gap:               10,
  },

  primaryBtn: {
    backgroundColor: C.greenDim,
    borderRadius:    13,
    paddingVertical: 14,
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    gap:             8,
  },
  primaryBtnSwap: { backgroundColor: '#7C3AED' },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  adminRow: { flexDirection: 'row', gap: 10 },
  adminBtn: {
    flex:            1,
    borderRadius:    13,
    paddingVertical: 13,
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    gap:             6,
    borderWidth:     1,
  },
  editBtn:      { backgroundColor: C.amberFaint, borderColor: C.amberBorder },
  deleteBtn:    { backgroundColor: C.redFaint,   borderColor: C.redBorder   },
  adminBtnText: { fontSize: 14, fontWeight: '700' },

  ghostBtn: {
    borderWidth:     1,
    borderColor:     C.border,
    borderRadius:    13,
    paddingVertical: 13,
    alignItems:      'center',
  },
  ghostBtnText: { color: C.textMuted, fontSize: 14, fontWeight: '600' },
});