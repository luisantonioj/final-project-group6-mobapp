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
  bg:          '#0A0D0B',
  surface:     '#101510',
  surface2:    '#182018',
  border:      'rgba(27,98,53,0.28)',
  green:       '#1B6235',
  greenBright: '#4ADE80',
  greenLight:  'rgba(27,98,53,0.22)',
  greenDim:    'rgba(27,98,53,0.38)',
  text:        '#F0FFF0',
  textSub:     '#A3C5A3',
  textMuted:   '#6B9B70',
  red:         '#EF4444',
  redGlow:     'rgba(239,68,68,0.12)',
  amber:       '#F59E0B',
  amberGlow:   'rgba(245,158,11,0.10)',
  pill:        'rgba(27,98,53,0.18)',
};

// ─── Hook — returns active palette, re-renders on toggle ──────────────────────
export function useThemeColors(): ThemeColors {
  const isDark = useThemeStore(s => s.isDark);
  return isDark ? darkTheme : lightTheme;
}

// ─── T — backwards-compatible alias (existing screens keep working) ───────────
export const T = lightTheme;