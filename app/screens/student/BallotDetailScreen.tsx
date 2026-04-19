import { View, Text } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { VoteStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<VoteStackParamList, 'BallotDetail'>;

export function BallotDetailScreen({ route }: Props) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Position {route.params.positionId} — TODO</Text>
    </View>
  );
}
