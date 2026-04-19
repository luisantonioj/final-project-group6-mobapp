import { View, Text } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { FeedStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<FeedStackParamList, 'CandidateProfile'>;

export function CandidateProfileScreen({ route }: Props) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Candidate {route.params.candidateId} — TODO</Text>
    </View>
  );
}