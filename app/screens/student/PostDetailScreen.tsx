import { View, Text } from 'react-native';
import { useRoute } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { FeedStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<FeedStackParamList, 'PostDetail'>;

export function PostDetailScreen({ route }: Props) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Post {route.params.postId} — TODO</Text>
    </View>
  );
}