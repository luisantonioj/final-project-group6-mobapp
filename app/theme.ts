// app/theme.ts — Shared palette for AnimoQuorum (light + dark)
// White: #F8FAF8 · Accent green: #1B6235 (DLSL forest green)

import { useThemeStore } from './stores/themeStore';

// ─── Palette shape ─────────────────────────────────────────────────────────────
export type ThemeColors = {
  bg:          string;
  surface:     string;
  surface2:    string;
  border:      string;
  green:       string;
  greenBright: string;
  greenLight:  string;
  greenDim:    string;
  text:        string;
  textSub:     string;
  textMuted:   string;
  red:         string;
  redGlow:     string;
  amber:       string;
  amberGlow:   string;
  pill:        string;
};

// ─── Light palette ─────────────────────────────────────────────────────────────
export const lightTheme: ThemeColors = {
  bg:          '#F8FAF8',
  surface:     '#FFFFFF',
  surface2:    '#EEF3EE',
  border:      'rgba(27,98,53,0.13)',
  green:       '#1B6235',
  greenBright: '#217840',
  greenLight:  'rgba(27,98,53,0.09)',
  greenDim:    'rgba(27,98,53,0.15)',
  text:        '#111D14',
  textSub:     '#3A5940',
  textMuted:   '#77927C',
  red:         '#DC2626',
  redGlow:     'rgba(220,38,38,0.08)',
  amber:       '#D97706',
  amberGlow:   'rgba(217,119,6,0.10)',
  pill:        'rgba(27,98,53,0.07)',
};

// ─── Dark palette ──────────────────────────────────────────────────────────────
export const darkTheme: ThemeColors = {
  bg:          '#111113',
  surface:     '#1C1C20',
  surface2:    '#26262A',
  border:      'rgba(255,255,255,0.08)',
  green:       '#1B6235',
  greenBright: '#22C55E',
  greenLight:  'rgba(34,197,94,0.10)',
  greenDim:    'rgba(34,197,94,0.18)',
  text:        '#F4F4F5',
  textSub:     '#A1A1AA',
  textMuted:   '#71717A',
  red:         '#EF4444',
  redGlow:     'rgba(239,68,68,0.12)',
  amber:       '#F59E0B',
  amberGlow:   'rgba(245,158,11,0.10)',
  pill:        'rgba(34,197,94,0.10)',
};

// ─── Hook — returns active palette, re-renders on toggle ──────────────────────
export function useThemeColors(): ThemeColors {
  const isDark = useThemeStore(s => s.isDark);
  return isDark ? darkTheme : lightTheme;
}

// ─── T — backwards-compatible alias (existing screens keep working) ───────────
export const T = lightTheme;
