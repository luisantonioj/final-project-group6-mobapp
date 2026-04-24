/**
 * navigation/types.ts — Route param lists
 * ─────────────────────────────────────────────────────────────────────────────
 * Import the right ParamList in each screen for typed navigation props.
 *
 * USAGE:
 *   import type { NativeStackScreenProps } from '@react-navigation/native-stack';
 *   import type { RootStackParamList } from '../navigation/types';
 *   type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;
 *
 * useNavigation hook (inside any screen):
 *   import { useNavigation } from '@react-navigation/native';
 *   import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
 *   const nav = useNavigation<BottomTabNavigationProp<AppTabParamList>>();
 *   nav.navigate('Vote');
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ─── Root stack ───────────────────────────────────────────────────────────────
export type RootStackParamList = {
  Splash:    undefined;
  Login:     undefined;
  App:       undefined;   // student bottom tabs
  Admin:     undefined;   // admin bottom tabs
};

// ─── Student bottom tabs ──────────────────────────────────────────────────────
export type AppTabParamList = {
  Dashboard: undefined;
  Vote:      undefined;
  Miting:    undefined;
  Profile:   undefined;
};

// ─── Admin bottom tabs ────────────────────────────────────────────────────────
export type AdminTabParamList = {
  AdminDashboard:  undefined;
  AdminCandidates: undefined;
  AdminResults:    undefined;
  AdminSettings:   undefined;
};
