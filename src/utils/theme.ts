import { Settings } from '../store/useLabStore';

export const THEME_COLORS = {
  default: { primary: '#1d3b36', secondary: '#3e6b4f', accent: '#9c6b3e', accentSoft: '#e3cbae', header: '#0f1f1b' },
  blue: { primary: '#1a365d', secondary: '#2b6cb0', accent: '#2b6cb0', accentSoft: '#90cdf4', header: '#0f2942' },
  purple: { primary: '#4a154b', secondary: '#6b21a8', accent: '#7c3aed', accentSoft: '#c4b5fd', header: '#2e082d' },
  teal: { primary: '#0d4a4a', secondary: '#0d7c7c', accent: '#0d7c7c', accentSoft: '#81e6d9', header: '#063333' },
  rose: { primary: '#5e1a2e', secondary: '#b83260', accent: '#b83260', accentSoft: '#f9a8d4', header: '#3d0f1e' },
  amber: { primary: '#6b4c1a', secondary: '#b7791f', accent: '#b7791f', accentSoft: '#ecc94b', header: '#4a3310' },
} as const;

export type ThemeKey = keyof typeof THEME_COLORS;

export function getTheme(settings?: any) {
  const key = (settings?.theme || 'default') as ThemeKey;
  const base = THEME_COLORS[key] || THEME_COLORS.default;
  const accent = settings?.customAccent || base.accent;
  const dark = !!settings?.darkMode;
  return {
    dark,
    primary: base.primary,
    secondary: base.secondary,
    accent,
    accentSoft: base.accentSoft,
    header: dark ? '#0d1311' : base.header,
    background: dark ? '#121816' : '#f4f7f6',
    surface: dark ? '#1e2824' : '#ffffff',
    surfaceAlt: dark ? '#1a2320' : '#eef3f1',
    input: dark ? '#161e1b' : '#fbfdfc',
    text: dark ? '#e8ece9' : '#26332f',
    muted: dark ? '#9eaea6' : '#687570',
    border: dark ? '#2e3b35' : '#dfe7e3',
    danger: '#b33a3a',
    good: '#3f8f68',
    shadow: dark ? 'rgba(0,0,0,0.4)' : 'rgba(31,55,48,0.10)',
  };
}
