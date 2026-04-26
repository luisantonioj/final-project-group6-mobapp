/**
 * components/CandidateModal.tsx — Candidate profile bottom sheet
 * ─────────────────────────────────────────────────────────────────────────────
 * A full-screen modal showing a candidate's photo, name, partylist, position,
 * credentials, and platform. Two action buttons at the bottom:
 *   "Select This Candidate"  — calls onSelect() and closes
 *   "Close"                  — dismisses without selection
 *
 * USAGE in VoteScreen:
 *   const [selected, setSelected] = useState<CandidateRow | null>(null);
 *
 *   <CandidateModal
 *     candidate={selected}
 *     visible={!!selected}
 *     onClose={() => setSelected(null)}
 *     onSelect={(c) => {
 *       selectCandidate(c.position_id, c.id);  // votingStore
 *       setSelected(null);
 *     }}
 *     alreadyVoted={!!selectedCandidates[selected?.position_id ?? '']}
 *   />
 * ─────────────────────────────────────────────────────────────────────────────
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
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons }     from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// Matches the shape returned by useCandidates() / useCandidate()
interface CandidateRow {
  id:          string;
  name:        string;
  partylist:   string;
  position_id: string;
  email?:      string | null;
  credentials: string | null;
  platform:    string | null;
  photo_url:   string | null;
  Positions?: { position_name: string } | null;
}

interface Props {
  candidate:   CandidateRow | null;
  visible:     boolean;
  onClose:     () => void;
  onSelect:    (c: CandidateRow) => void;
  alreadyVoted?: boolean; // true if this position already has a selection
}

const C = {
  bg:       '#0A0F0A',
  surface:  '#111811',
  surface2: '#162016',
  border:   '#1E2E1E',
  green:    '#0F6E56',
  greenBright: '#22C55E',
  text:     '#F0FFF0',
  textSub:  '#A3C5A3',
  textMuted:'#4B6B4B',
};

export function CandidateModal({ candidate, visible, onClose, onSelect, alreadyVoted }: Props) {
  if (!candidate) return null;

  const positionName = candidate.Positions?.position_name ?? 'Candidate';
  const initials     = candidate.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={s.safe}>
        {/* ── Header ── */}
        <View style={s.header}>
          <Text style={s.headerLabel}>{positionName}</Text>
          <TouchableOpacity onPress={onClose} style={s.closeBtn}>
            <Ionicons name="close" size={20} color={C.textSub} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={s.content}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Photo / Avatar ── */}
          <View style={s.photoWrap}>
            {candidate.photo_url ? (
              <Image source={{ uri: candidate.photo_url }} style={s.photo} />
            ) : (
              <View style={s.avatarFallback}>
                <Text style={s.avatarText}>{initials}</Text>
              </View>
            )}
          </View>

          {/* ── Name + partylist ── */}
          <Text style={s.name}>{candidate.name}</Text>
          <View style={s.partyBadge}>
            <Text style={s.partyText}>{candidate.partylist}</Text>
          </View>

          {/* ── Credentials ── */}
          {candidate.credentials ? (
            <View style={s.section}>
              <Text style={s.sectionTitle}>Credentials</Text>
              <Text style={s.sectionBody}>{candidate.credentials}</Text>
            </View>
          ) : null}

          {/* ── Platform ── */}
          {candidate.platform ? (
            <View style={s.section}>
              <Text style={s.sectionTitle}>Platform</Text>
              <Text style={s.sectionBody}>{candidate.platform}</Text>
            </View>
          ) : null}

          <View style={{ height: 120 }} />
        </ScrollView>

        {/* ── Action buttons (fixed at bottom) ── */}
        <View style={s.actions}>
          <TouchableOpacity
            style={[s.selectBtn, alreadyVoted && s.selectBtnAlt]}
            onPress={() => onSelect(candidate)}
            activeOpacity={0.85}
          >
            <Ionicons
              name={alreadyVoted ? 'swap-horizontal-outline' : 'checkmark-circle-outline'}
              size={18}
              color="#fff"
              style={{ marginRight: 6 }}
            />
            <Text style={s.selectBtnText}>
              {alreadyVoted ? 'Change Selection' : 'Select This Candidate'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.cancelBtn} onPress={onClose}>
            <Text style={s.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: C.bg },
  header:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
             paddingHorizontal: 20, paddingVertical: 14,
             borderBottomWidth: 1, borderBottomColor: C.border },
  headerLabel: { fontSize: 13, fontWeight: '700', color: C.textMuted,
                 textTransform: 'uppercase', letterSpacing: 0.8 },
  closeBtn:    { padding: 6, backgroundColor: C.surface2, borderRadius: 20 },
  content:     { alignItems: 'center', paddingHorizontal: 24, paddingTop: 28 },
  photoWrap:   { marginBottom: 16 },
  photo:       { width: 110, height: 110, borderRadius: 55, borderWidth: 2,
                 borderColor: C.greenBright },
  avatarFallback: { width: 110, height: 110, borderRadius: 55,
                    backgroundColor: C.surface2, borderWidth: 2, borderColor: C.border,
                    alignItems: 'center', justifyContent: 'center' },
  avatarText:  { fontSize: 36, fontWeight: '800', color: C.greenBright },
  name:        { fontSize: 22, fontWeight: '800', color: C.text, textAlign: 'center',
                 marginBottom: 8 },
  partyBadge:  { backgroundColor: C.surface2, borderRadius: 20, borderWidth: 1,
                 borderColor: C.border, paddingHorizontal: 14, paddingVertical: 5,
                 marginBottom: 24 },
  partyText:   { fontSize: 12, fontWeight: '700', color: C.textSub, letterSpacing: 0.5 },
  section:     { width: '100%', marginBottom: 20 },
  sectionTitle:{ fontSize: 11, fontWeight: '700', color: C.textMuted,
                 textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  sectionBody: { fontSize: 14, color: C.textSub, lineHeight: 22 },
  actions:     { position: 'absolute', bottom: 0, left: 0, right: 0,
                 backgroundColor: C.bg, paddingHorizontal: 20, paddingBottom: 32,
                 paddingTop: 12, borderTopWidth: 1, borderTopColor: C.border, gap: 10 },
  selectBtn:   { backgroundColor: C.green, borderRadius: 13, paddingVertical: 14,
                 flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  selectBtnAlt:{ backgroundColor: '#7C3AED' },
  selectBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  cancelBtn:   { borderWidth: 1, borderColor: C.border, borderRadius: 13,
                 paddingVertical: 13, alignItems: 'center' },
  cancelBtnText: { color: C.textMuted, fontSize: 14, fontWeight: '600' },
});
