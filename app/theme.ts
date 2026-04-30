// app/theme.ts — Shared light-mode palette for AnimoQuorum
// White: #F8FAF8 · Accent green: #1B6235 (DLSL forest green)

export const T = {
  // ── Backgrounds
  bg:       '#F8FAF8',          // near-white, barely-there green tint
  surface:  '#FFFFFF',          // pure white for cards & inputs
  surface2: '#EEF3EE',          // slightly deeper for nested surfaces

  // ── Borders
  border:   'rgba(27,98,53,0.13)',

  // ── DLSL Forest Green (accent, sampled from banner)
  green:     '#1B6235',
  greenBright: '#217840',       // slightly lighter for hover/active states
  greenLight:  'rgba(27,98,53,0.09)',
  greenDim:    'rgba(27,98,53,0.15)',

  // ── Text hierarchy
  text:      '#111D14',         // near-black with green undertone
  textSub:   '#3A5940',         // medium green-grey
  textMuted: '#77927C',         // muted, for placeholders & metadata

  // ── Semantic (universal, unchanged)
  red:      '#DC2626',
  redGlow:  'rgba(220,38,38,0.08)',
  amber:    '#D97706',
  amberGlow:'rgba(217,119,6,0.10)',

  // ── Misc
  pill: 'rgba(27,98,53,0.07)',
};