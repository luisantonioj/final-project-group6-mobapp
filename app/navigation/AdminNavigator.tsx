import { createBottomTabNavigator }  from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

// Screens that already have content:
import { AdminDashboardScreen } from '../screens/AdminDashboardScreen/AdminDashboardScreen';
import { CandidateListScreen }  from '../screens/CandidateListScreen/CandidateListScreen';
import { VoteTallyScreen }      from '../screens/VoteTallyScreen/VoteTallyScreen';

// Screens to be built — import from where you'll create them:
import { CandidateFormScreen }  from '../screens/admin/CandidateFormScreen';
import { PostsScreen }          from '../screens/admin/PostsScreen';
import { SystemSettingsScreen } from '../screens/admin/SystemSettingsScreen';
import { AuditLogsScreen }      from '../screens/admin/AuditLogsScreen';
import { UserManagementScreen } from '../screens/admin/UserManagementScreen';

import type {
  AdminTabParamList,
  CandidatesStackParamList,
  SettingsStackParamList,
} from './types';

const Tab             = createBottomTabNavigator<AdminTabParamList>();
const CandidatesStack = createNativeStackNavigator<CandidatesStackParamList>();
const SettingsStack   = createNativeStackNavigator<SettingsStackParamList>();

// Replaces: app/(admin)/candidates/index + [id] + create
function CandidatesStackNavigator() {
  return (
    <CandidatesStack.Navigator>
      <CandidatesStack.Screen
        name="CandidateList"
        component={CandidateListScreen}
        options={{ title: 'Candidates' }}
      />
      <CandidatesStack.Screen
        name="CandidateEdit"
        component={CandidateFormScreen}
        options={{ title: 'Edit Candidate' }}
      />
      <CandidatesStack.Screen
        name="CandidateCreate"
        component={CandidateFormScreen}
        options={{ title: 'Add Candidate' }}
      />
    </CandidatesStack.Navigator>
  );
}

// Replaces: app/(admin)/settings + audit + users + votes
function SettingsStackNavigator() {
  return (
    <SettingsStack.Navigator>
      <SettingsStack.Screen
        name="SystemSettings"
        component={SystemSettingsScreen}
        options={{ title: 'Settings' }}
      />
      <SettingsStack.Screen
        name="AuditLogs"
        component={AuditLogsScreen}
        options={{ title: 'Audit Logs' }}
      />
      <SettingsStack.Screen
        name="UserManagement"
        component={UserManagementScreen}
        options={{ title: 'Users' }}
      />
      <SettingsStack.Screen
        name="VoteTally"
        component={VoteTallyScreen}
        options={{ title: 'Vote Tally' }}
      />
    </SettingsStack.Navigator>
  );
}

export function AdminNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarActiveTintColor:   '#0F6E56',
        tabBarInactiveTintColor: '#888',
        tabBarIcon: ({ color, size }) => {
          const icons: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
            DashboardTab:  'bar-chart-outline',
            CandidatesTab: 'people-outline',
            PostsTab:      'megaphone-outline',
            SettingsTab:   'settings-outline',
          };
          return <Ionicons name={icons[route.name]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="DashboardTab"
        component={AdminDashboardScreen}
        options={{ title: 'Dashboard' }}
      />
      <Tab.Screen
        name="CandidatesTab"
        component={CandidatesStackNavigator}
        options={{ title: 'Candidates', headerShown: false }}
      />
      <Tab.Screen
        name="PostsTab"
        component={PostsScreen}
        options={{ title: 'Posts' }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsStackNavigator}
        options={{ title: 'Settings', headerShown: false }}
      />
    </Tab.Navigator>
  );
}