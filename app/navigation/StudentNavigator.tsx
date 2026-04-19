import React from 'react';
import { createBottomTabNavigator }  from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { FeedScreen }        from '../screens/student/FeedScreen';
import { PostDetailScreen }  from '../screens/student/PostDetailScreen';
import { CandidateProfileScreen } from '../screens/student/CandidateProfileScreen';
import { BallotScreen }      from '../screens/BallotScreen/BallotScreen';
import { BallotDetailScreen }from '../screens/student/BallotDetailScreen';
import { VoteConfirmScreen } from '../screens/student/VoteConfirmScreen';
import { LiveResultsScreen } from '../screens/student/LiveResultsScreen';
import { MitingScreen }      from '../screens/MitingScreen/MitingScreen';
import { ProfileScreen }     from '../screens/student/ProfileScreen';

import type {
  StudentTabParamList,
  FeedStackParamList,
  VoteStackParamList,
} from './types';

const Tab       = createBottomTabNavigator<StudentTabParamList>();
const FeedStack = createNativeStackNavigator<FeedStackParamList>();
const VoteStack = createNativeStackNavigator<VoteStackParamList>();

// Replaces: app/(student)/feed/index.tsx + app/(student)/feed/[postID].tsx
function FeedStackNavigator() {
  return (
    <FeedStack.Navigator>
      <FeedStack.Screen
        name="FeedList"
        component={FeedScreen}
        options={{ title: 'Feed' }}
      />
      <FeedStack.Screen
        name="PostDetail"
        component={PostDetailScreen}
        options={{ title: 'Post' }}
      />
      <FeedStack.Screen
        name="CandidateProfile"
        component={CandidateProfileScreen}
        options={{ title: 'Candidate' }}
      />
    </FeedStack.Navigator>
  );
}

// Replaces: app/(student)/vote/index.tsx + [positionID].tsx + confirm.tsx
function VoteStackNavigator() {
  return (
    <VoteStack.Navigator>
      <VoteStack.Screen
        name="BallotList"
        component={BallotScreen}
        options={{ title: 'Ballot' }}
      />
      <VoteStack.Screen
        name="BallotDetail"
        component={BallotDetailScreen}
        options={{ title: 'Position' }}
      />
      <VoteStack.Screen
        name="VoteConfirm"
        component={VoteConfirmScreen}
        options={{ title: 'Confirm Vote' }}
      />
      <VoteStack.Screen
        name="LiveResults"
        component={LiveResultsScreen}
        options={{ title: 'Live Results' }}
      />
    </VoteStack.Navigator>
  );
}

export function StudentNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarActiveTintColor:   '#0F6E56',
        tabBarInactiveTintColor: '#888',
        tabBarIcon: ({ color, size }) => {
          const icons: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
            FeedTab:    'newspaper-outline',
            VoteTab:    'checkbox-outline',
            MitingTab:  'mic-outline',
            ProfileTab: 'person-outline',
          };
          return <Ionicons name={icons[route.name]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="FeedTab"
        component={FeedStackNavigator}
        options={{ title: 'Feed', headerShown: false }}
      />
      <Tab.Screen
        name="VoteTab"
        component={VoteStackNavigator}
        options={{ title: 'Vote', headerShown: false }}
      />
      <Tab.Screen
        name="MitingTab"
        component={MitingScreen}
        options={{ title: 'Miting' }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
}