import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@animo_quorum_theme';

type ThemeState = {
  isDark:      boolean;
  hydrated:    boolean;
  toggleTheme: () => void;
};

export const useThemeStore = create<ThemeState>((set, get) => ({
  isDark:   false,
  hydrated: false,

  toggleTheme: () => {
    const next = !get().isDark;
    set({ isDark: next });
    AsyncStorage.setItem(STORAGE_KEY, next ? 'dark' : 'light').catch(() => {});
  },
}));

// ─── Call once on app startup to restore saved preference ─────────────────────
export async function hydrateTheme() {
  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEY);
    useThemeStore.setState({ isDark: saved === 'dark', hydrated: true });
  } catch {
    useThemeStore.setState({ hydrated: true });
  }
}