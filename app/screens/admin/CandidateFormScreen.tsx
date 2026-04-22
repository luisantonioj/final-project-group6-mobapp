/**
 * admin/CandidateFormScreen.tsx — Create or edit a candidate (shared form)
 * ─────────────────────────────────────────────────────────────────────────────
 * TASK: One screen handles both Create and Edit. Detect mode by checking
 * whether route.params.candidateId is present.
 *
 * ROUTE PARAMS (from CandidatesStackParamList in types.ts):
 *   CandidateEdit:   route.params.candidateId — pre-populate form from DB
 *   CandidateCreate: no params                — start with blank form
 *
 * DATA TO FETCH (edit mode only):
 * ─────────────────────────────────────────────────────────────────────────────
 *   const isEdit = !!route.params?.candidateId;
 *   const { data: candidate } = useCandidate(route.params?.candidateId ?? '');
 *   → Populate form fields when candidate data loads
 *
 *   const { data: positions } = usePositions(); // for the position picker
 *
 * CREATING A CANDIDATE:
 * ─────────────────────────────────────────────────────────────────────────────
 *   await supabase.from('Candidates').insert({
 *     name:        form.name,
 *     partylist:   form.partylist,
 *     position_id: form.positionId,
 *     email:       form.email,
 *     credentials: form.credentials,
 *     platform:    form.platform,
 *     photo_url:   form.photoUrl,  // upload to Supabase Storage first if changed
 *   });
 *
 * UPDATING A CANDIDATE:
 * ─────────────────────────────────────────────────────────────────────────────
 *   await supabase.from('Candidates').update({ ...form }).eq('id', candidateId);
 *   → Invalidate ['candidates'] and ['candidates', candidateId] queries after
 *
 * PHOTO UPLOAD (optional for now — use a text URL field first):
 * ─────────────────────────────────────────────────────────────────────────────
 *   Use expo-image-picker to pick a photo, then:
 *   await supabase.storage.from('candidate-photos').upload(path, file);
 *   const { publicUrl } = supabase.storage.from('candidate-photos').getPublicUrl(path);
 *
 * FORM FIELDS:
 * ─────────────────────────────────────────────────────────────────────────────
 *   name          (required) — TextInput
 *   partylist     (required) — TextInput
 *   position_id   (required) — Picker/select from positions list
 *   email         (optional) — TextInput, keyboardType="email-address"
 *   credentials   (optional) — TextInput multiline
 *   platform      (optional) — TextInput multiline
 *   photo_url     (optional) — TextInput URL or image picker
 *
 * ON SUCCESS:
 * ─────────────────────────────────────────────────────────────────────────────
 *   navigation.goBack(); // returns to CandidateList
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { View, Text } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CandidatesStackParamList } from '../../navigation/types';

type EditProps   = NativeStackScreenProps<CandidatesStackParamList, 'CandidateEdit'>;
type CreateProps = NativeStackScreenProps<CandidatesStackParamList, 'CandidateCreate'>;
type Props = EditProps | CreateProps;

// TODO: Replace this placeholder with the full implementation described above.
export function CandidateFormScreen({ route }: Props) {
  const isEdit = route.name === 'CandidateEdit';
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0A0F0A' }}>
      <Text style={{ color: '#F0FFF0' }}>{isEdit ? 'Edit' : 'Create'} Candidate — TODO</Text>
    </View>
  );
}
