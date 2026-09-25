export type ColorMode = 'light' | 'dark';
export type ThemeType = 'default' | 'blue' | 'purple' | 'teal' | 'rose' | 'amber';

export const COLORS_LIGHT = {
  paper: '#F5F7F6',
  panel: '#FFFFFF',
  ink: '#16221E',
  inkSub: '#68766F',
  line: '#DCE5E1',
  navy: '#0F766E',
  navyLight: '#159A90',
  seal: '#0F766E',
  sealLight: '#CCFBF1',
  success: '#15803D',
  danger: '#B42318',
  warning: '#B54708',
  headerBg: '#0B4F4A',
  headerText: '#F8FFFD',
  shadow: 'rgba(16, 24, 40, 0.08)',
};

export const COLORS_DARK = {
  paper: '#0E1715',
  panel: '#16211E',
  ink: '#EEF6F3',
  inkSub: '#9FB1AA',
  line: '#2A3A35',
  navy: '#38B2A6',
  navyLight: '#65D5CA',
  seal: '#38B2A6',
  sealLight: '#163D38',
  success: '#4ADE80',
  danger: '#F97066',
  warning: '#FDB022',
  headerBg: '#08110F',
  headerText: '#F4FFFC',
  shadow: 'rgba(0,0,0,0.35)',
};

export const THEME_OVERRIDES: Record<ThemeType, Partial<typeof COLORS_LIGHT>> = {
  default: {},
  blue: {
    paper: '#F4F7FC', panel: '#FFFFFF', line: '#D8E2EF', inkSub: '#617086',
    navy: '#2563EB', navyLight: '#60A5FA', seal: '#2563EB', sealLight: '#DBEAFE', headerBg: '#12315F',
  },
  purple: {
    paper: '#F8F5FB', panel: '#FFFFFF', line: '#E2D8EA', inkSub: '#75687E',
    navy: '#7C3AED', navyLight: '#A78BFA', seal: '#7C3AED', sealLight: '#EDE9FE', headerBg: '#35136D',
  },
  teal: {
    paper: '#F2F8F7', panel: '#FFFFFF', line: '#D3E4E1', inkSub: '#5E756F',
    navy: '#0F766E', navyLight: '#2DD4BF', seal: '#0F766E', sealLight: '#CCFBF1', headerBg: '#0B4F4A',
  },
  rose: {
    paper: '#FBF5F8', panel: '#FFFFFF', line: '#EAD7E0', inkSub: '#806774',
    navy: '#DB2777', navyLight: '#F472B6', seal: '#DB2777', sealLight: '#FCE7F3', headerBg: '#741A43',
  },
  amber: {
    paper: '#FBF8F1', panel: '#FFFFFF', line: '#E9DEC4', inkSub: '#7D715B',
    navy: '#B45309', navyLight: '#F59E0B', seal: '#B45309', sealLight: '#FEF3C7', headerBg: '#63320A',
  },
};

const THEME_DARK_OVERRIDES: Record<ThemeType, Partial<typeof COLORS_DARK>> = {
  default: {},
  blue: {
    paper: '#0D1520', panel: '#151F2C', line: '#2A3A4E', inkSub: '#9BAFC5',
    navy: '#60A5FA', navyLight: '#93C5FD', seal: '#3B82F6', sealLight: '#172B47', headerBg: '#081321',
  },
  purple: {
    paper: '#130F18', panel: '#1D1724', line: '#3A2D45', inkSub: '#B4A5BF',
    navy: '#A78BFA', navyLight: '#C4B5FD', seal: '#8B5CF6', sealLight: '#2A1D3D', headerBg: '#0F0818',
  },
  teal: {
    paper: '#0B1715', panel: '#14231F', line: '#294039', inkSub: '#9FBAB2',
    navy: '#5EEAD4', navyLight: '#99F6E4', seal: '#2DD4BF', sealLight: '#153D38', headerBg: '#06110F',
  },
  rose: {
    paper: '#190D13', panel: '#24151D', line: '#432733', inkSub: '#C0A4B0',
    navy: '#F472B6', navyLight: '#FDA4D0', seal: '#EC4899', sealLight: '#3B1A2B', headerBg: '#12070D',
  },
  amber: {
    paper: '#19140B', panel: '#241D11', line: '#453A25', inkSub: '#C0B294',
    navy: '#FBBF24', navyLight: '#FCD34D', seal: '#F59E0B', sealLight: '#3A2D12', headerBg: '#120D05',
  },
};

export const TAG_COLORS = {
  blood: { bg: '#FEE4E2', text: '#B42318' },
  chem: { bg: '#EDE9FE', text: '#6D28D9' },
  urine: { bg: '#E0F2FE', text: '#0369A1' },
  serology: { bg: '#F3E8FF', text: '#7E22CE' },
  stool: { bg: '#FEF0C7', text: '#B54708' },
  preg: { bg: '#FCE7F3', text: '#BE185D' },
};

export function getColors(isDark: boolean, theme: ThemeType = 'default') {
  const base = isDark ? COLORS_DARK : COLORS_LIGHT;
  const override = isDark ? THEME_DARK_OVERRIDES[theme] : THEME_OVERRIDES[theme];
  return { ...base, ...(override || {}) };
}

export const THEME_PRESETS = {
  default: { label: 'تركوازي طبي', color: '#0F766E' },
  blue: { label: 'أزرق سريري', color: '#2563EB' },
  purple: { label: 'بنفسجي هادئ', color: '#7C3AED' },
  teal: { label: 'أخضر مائي', color: '#0F766E' },
  rose: { label: 'وردي احترافي', color: '#DB2777' },
  amber: { label: 'ذهبي دافئ', color: '#B45309' },
};

export const STATUS_COLORS = {
  normal: '#15803D',
  warning: '#B54708',
  critical: '#B42318',
  pending: '#D97706',
  success: '#15803D',
  error: '#B42318',
};
