/**
 * admin/CandidateListScreen.tsx — Candidate management table
 * ─────────────────────────────────────────────────────────────────────────────
 * TASK: Display all candidates grouped by position. Each row has Edit and
 * Delete actions. A FAB or header button leads to CandidateCreate.
 *
 * DATA TO FETCH:
 * ─────────────────────────────────────────────────────────────────────────────
 *   const { data: candidates, isLoading } = useCandidates(); // app/hooks/useCandidates.ts
 *   const { mutate: deleteCandidate }     = useDeleteCandidate();
 *   → useCandidates() returns candidates with Positions(position_name) joined
 *   → useDeleteCandidate() calls delete_candidate RPC (also writes AuditLogs)
 *
 * NAVIGATION:
 * ─────────────────────────────────────────────────────────────────────────────
 *   Create: navigation.navigate('CandidateCreate')
 *   Edit:   navigation.navigate('CandidateEdit', { candidateId: candidate.id })
 *
 * DELETE CONFIRMATION:
 * ─────────────────────────────────────────────────────────────────────────────
 *   Alert.alert('Delete Candidate', `Remove ${candidate.name}?`, [
 *     { text: 'Cancel', style: 'cancel' },
 *     { text: 'Delete', style: 'destructive',
 *       onPress: () => deleteCandidate(candidate.id) },
 *   ]);
 *
 * UI LAYOUT:
 * ─────────────────────────────────────────────────────────────────────────────
 *   [ Screen header: "Candidates" + "Add +" button (top right) ]
 *   [ Section headers per position (President, VP, etc.)       ]
 *   [ CandidateRow: photo/avatar, name, partylist, Edit | Delete buttons ]
 *   [ Empty state if no candidates: "No candidates yet. Tap + to add." ]
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { View, Text, StyleSheet } from 'react-native';

// TODO: Replace this placeholder with the full implementation described above.
export function CandidateListScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Candidate List — TODO</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0A0F0A' },
  text:      { fontSize: 16, fontWeight: 'bold', color: '#0F6E56' },
});
