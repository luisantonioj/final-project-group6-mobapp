/**
 * components/CandidateModal.tsx
 *
 * Candidate profile bottom sheet used in both student and admin contexts.
 */

import React, { useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors, ThemeColors } from '../theme';

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
  const C = useThemeColors();
  const s = useMemo(() => makeStyles(C), [C]);

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
          <Pressable onPress={onClose} style={({ pressed }) => [s.closeBtn, pressed && { opacity: 0.75 }]} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close" size={20} color={C.textMuted} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={s.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Photo / Avatar */}
          <View style={s.photoOuterRing}>
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
          <View style={s.sectionCard}>
            <View style={s.sectionHeader}>
              <View style={s.sectionIconWrap}>
                <Ionicons name="ribbon-outline" size={16} color={C.green} />
              </View>
              <Text style={s.sectionTitle}>Credentials</Text>
            </View>
            {candidate.credentials ? (
              <Text style={s.sectionBody}>{candidate.credentials}</Text>
            ) : (
              <Text style={s.sectionEmpty}>No credentials provided.</Text>
            )}
          </View>

          {/* Platform */}
          <View style={s.sectionCard}>
            <View style={s.sectionHeader}>
              <View style={s.sectionIconWrap}>
                <Ionicons name="megaphone-outline" size={16} color={C.green} />
              </View>
              <Text style={s.sectionTitle}>Platform & Advocacies</Text>
            </View>
            {candidate.platform ? (
              <Text style={s.sectionBody}>{candidate.platform}</Text>
            ) : (
              <Text style={s.sectionEmpty}>No platform provided.</Text>
            )}
          </View>

          <View style={{ height: 160 }} />
        </ScrollView>

        {/* Fixed bottom action bar */}
        <View style={s.actions}>

          {/* STUDENT MODE (Enhanced UI) */}
          {!isAdminMode && onSelect ? (
            <View style={s.studentActions}>
              <Pressable
                style={({ pressed }) => [
                  s.primaryBtn,
                  alreadyVoted && s.primaryBtnSwap,
                  pressed && { opacity: 0.88, transform: [{ scale: 0.98 }] },
                ]}
                onPress={() => onSelect(candidate)}
              >
                <Ionicons
                  name={alreadyVoted ? 'swap-horizontal' : 'checkmark-circle'}
                  size={20}
                  color="#fff"
                />
                <Text style={s.primaryBtnText}>
                  {alreadyVoted ? 'Change to this Candidate' : 'Select This Candidate'}
                </Text>
              </Pressable>
              <Pressable style={({ pressed }) => [s.ghostBtn, pressed && { opacity: 0.75 }]} onPress={onClose}>
                <Text style={s.ghostBtnText}>Cancel</Text>
              </Pressable>
            </View>
          ) : null}

          {/* ADMIN MODE (Untouched Legacy Styles) */}
          {isAdminMode ? (
            <>
              <View style={s.adminRow}>
                {onAdminEdit ? (
                  <Pressable
                    style={({ pressed }) => [s.adminBtn, s.editBtn, pressed && { opacity: 0.88 }]}
                    onPress={() => onAdminEdit(candidate)}
                  >
                    <Ionicons name="pencil-outline" size={15} color={C.amber} />
                    <Text style={[s.adminBtnText, { color: C.amber }]}>Edit</Text>
                  </Pressable>
                ) : null}
                {onAdminDelete ? (
                  <Pressable
                    style={({ pressed }) => [s.adminBtn, s.deleteBtn, pressed && { opacity: 0.88 }]}
                    onPress={() => onAdminDelete(candidate)}
                  >
                    <Ionicons name="trash-outline" size={15} color={C.red} />
                    <Text style={[s.adminBtnText, { color: C.red }]}>Delete</Text>
                  </Pressable>
                ) : null}
              </View>
              <Pressable style={({ pressed }) => [s.ghostBtn, pressed && { opacity: 0.75 }]} onPress={onClose}>
                <Text style={s.ghostBtnText}>Close</Text>
              </Pressable>
            </>
          ) : null}

        </View>
      </SafeAreaView>
    </Modal>
  );
}

function makeStyles(C: ThemeColors) {
  // Preserving legacy hardcoded tints for the admin row buttons to ensure they remain untouched
  const isDark = C.text === '#F0FFF0' || C.text === '#FFFFFF';
  const borderBright = isDark ? 'rgba(34,197,94,0.3)' : 'rgba(34,197,94,0.15)';
  const amberFaint = 'rgba(245,158,11,0.12)';
  const amberBorder = 'rgba(245,158,11,0.35)';
  const redFaint = 'rgba(239,68,68,0.12)';
  const redBorder = 'rgba(239,68,68,0.35)';

  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.bg },

    header: {
      flexDirection:     'row',
      alignItems:        'center',
      justifyContent:    'space-between',
      paddingHorizontal: 20,
      paddingVertical:   16,
      borderBottomWidth: 1,
      borderBottomColor: C.border,
      backgroundColor:   C.surface,
    },
    headerLabel: {
      fontSize:      12,
      fontWeight:    '700',
      color:         C.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 1.2,
    },
    closeBtn: {
      padding:         6,
      backgroundColor: C.surface2,
      borderRadius:    20,
    },

    content: {
      alignItems:        'center',
      paddingHorizontal: 20,
      paddingTop:        32,
    },

    // Enhanced Student Avatar 
    photoOuterRing: {
      padding: 4,
      borderRadius: 64,
      borderWidth: 1,
      borderColor: C.border,
      backgroundColor: C.surface,
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    photo: {
      width:        112,
      height:       112,
      borderRadius: 56,
    },
    avatarFallback: {
      width:           112,
      height:          112,
      borderRadius:    56,
      backgroundColor: C.surface2,
      alignItems:      'center',
      justifyContent:  'center',
    },
    avatarText: { fontSize: 36, fontWeight: '800', color: C.green },

    name: {
      fontSize:     24,
      fontWeight:   '800',
      color:        C.text,
      textAlign:    'center',
      marginBottom: 10,
    },
    partyBadge: {
      backgroundColor:   C.surface2,
      borderRadius:      20,
      borderWidth:       1,
      borderColor:       C.border,
      paddingHorizontal: 16,
      paddingVertical:   6,
      marginBottom:      20,
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
      gap:               6,
      backgroundColor:   C.surface2,
      borderRadius:      20,
      borderWidth:       1,
      borderColor:       C.border,
      paddingHorizontal: 12,
      paddingVertical:   6,
      marginBottom:      20,
    },
    emailText: { fontSize: 13, color: C.textMuted, fontWeight: '600' },

    // Enhanced Student Content Cards
    sectionCard: {
      width: '100%',
      backgroundColor: C.surface2,
      borderRadius: 16,
      padding: 18,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: C.border,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 12,
    },
    sectionIconWrap: {
      width: 28,
      height: 28,
      borderRadius: 8,
      backgroundColor: isDark ? 'rgba(34,197,94,0.15)' : 'rgba(34,197,94,0.1)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    sectionTitle: {
      fontSize:      13,
      fontWeight:    '700',
      color:         C.text,
    },
    sectionBody:  { fontSize: 14, color: C.textSub, lineHeight: 22 },
    sectionEmpty: { fontSize: 14, color: C.textMuted, fontStyle: 'italic', lineHeight: 22 },

    actions: {
      position:          'absolute',
      bottom:            0,
      left:              0,
      right:             0,
      backgroundColor:   C.surface,
      paddingHorizontal: 20,
      paddingBottom:     36,
      paddingTop:        16,
      borderTopWidth:    1,
      borderTopColor:    C.border,
      gap:               12,
    },

    studentActions: { gap: 12 },
    
    primaryBtn: {
      backgroundColor: C.green,
      borderRadius:    16,
      paddingVertical: 16,
      flexDirection:   'row',
      alignItems:      'center',
      justifyContent:  'center',
      gap:             8,
      shadowColor:     C.green,
      shadowOffset:    { width: 0, height: 4 },
      shadowOpacity:   0.25,
      shadowRadius:    8,
      elevation:       4,
    },
    primaryBtnSwap: { backgroundColor: '#8B5CF6', shadowColor: '#8B5CF6' },
    primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

    // Untouched Admin Row Styles
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
    editBtn:      { backgroundColor: amberFaint, borderColor: amberBorder },
    deleteBtn:    { backgroundColor: redFaint,   borderColor: redBorder   },
    adminBtnText: { fontSize: 14, fontWeight: '700' },

    ghostBtn: {
      borderWidth:     1,
      borderColor:     C.border,
      borderRadius:    16,
      paddingVertical: 14,
      alignItems:      'center',
      backgroundColor: C.bg,
    },
    ghostBtnText: { color: C.textMuted, fontSize: 15, fontWeight: '600' },
  });
}