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

// ─── Root stack — gates Splash / Auth / App ───────────────────────────────────
export type RootStackParamList = {
  Splash:    undefined;
  Login:     undefined;
  App:       undefined;  // mounts the bottom tab navigator
};

// ─── App bottom tabs ──────────────────────────────────────────────────────────
export type AppTabParamList = {
  Dashboard: undefined;
  Vote:      undefined;
  Miting:    undefined;
  Profile:   undefined;
};
