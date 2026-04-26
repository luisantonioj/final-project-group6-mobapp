/**
 * AppNavigator.tsx — Bottom tab bar (authenticated student view)
 * ─────────────────────────────────────────────────────────────────────────────
 * Four tabs shown after login:
 *   Dashboard  — Feed + countdown + live voting board
 *   Vote       — Ballot with candidate profile modals
 *   Miting     — Reddit-style live Q&A upvote board
 *   Profile    — Student profile + sign out
 *
 * TO ADD A SCREEN PUSH ON TOP OF A TAB (e.g. post detail):
 *   Wrap the relevant tab in a createNativeStackNavigator instead of
 *   pointing it directly at the screen component. See StudentNavigator.tsx
 *   in the previous version for reference.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { DashboardScreen } from '../screens/student/DashboardScreen';
import { VoteScreen } from '../screens/student/VoteScreen';
import { MitingScreen } from '../screens/student/MitingScreen';
import { ProfileScreen } from '../screens/student/ProfileScreen';

import type { AppTabParamList } from './types';

const Tab = createBottomTabNavigator<AppTabParamList>();

export function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarActiveTintColor:   '#0F6E56',
        tabBarInactiveTintColor: '#4B6B4B',
        tabBarStyle: {
          backgroundColor: '#111811',
          borderTopColor:  '#1E2E1E',
          borderTopWidth:  1,
        },
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          const icons: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
            Dashboard: 'home-outline',
            Vote:      'checkbox-outline',
            Miting:    'mic-outline',
            Profile:   'person-outline',
          };
          return <Ionicons name={icons[route.name]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Home' }}    />
      <Tab.Screen name="Vote"      component={VoteScreen}      options={{ title: 'Vote' }}      />
      <Tab.Screen name="Miting"    component={MitingScreen}    options={{ title: 'Miting' }}    />
      <Tab.Screen name="Profile"   component={ProfileScreen}   options={{ title: 'Profile' }}   />
    </Tab.Navigator>
  );
}
