import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { AdminDashboardScreen }  from '../screens/admin/AdminDashboardScreen';
import { AdminCandidatesScreen } from '../screens/admin/AdminCandidatesScreen';
import { AdminResultsScreen }    from '../screens/admin/AdminResultsScreen';
import { AdminSettingsScreen }   from '../screens/admin/AdminSettingsScreen'; 

import type { AdminTabParamList } from './types';

const Tab = createBottomTabNavigator<AdminTabParamList>();

export function AdminNavigator() {
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
            AdminDashboard:  'speedometer-outline',
            AdminCandidates: 'people-outline',
            AdminResults:    'bar-chart-outline',
            AdminSettings:   'settings-outline',
          };
          return <Ionicons name={icons[route.name]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="AdminDashboard"  component={AdminDashboardScreen}  options={{ title: 'Overview' }}    />
      <Tab.Screen name="AdminCandidates" component={AdminCandidatesScreen} options={{ title: 'Candidates' }}  />
      <Tab.Screen name="AdminResults"    component={AdminResultsScreen}    options={{ title: 'Results' }}     />
      <Tab.Screen name="AdminSettings"   component={AdminSettingsScreen}   options={{ title: 'Settings' }}    />
    </Tab.Navigator>
  );
}