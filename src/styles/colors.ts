// src/styles/colors.ts - نظام الألوان الموحد للتطبيق

export type ColorMode = 'light' | 'dark';
export type ThemeType = 'default' | 'blue' | 'purple' | 'teal' | 'rose' | 'amber';

// ===== Light Mode Colors =====
export const COLORS_LIGHT = {
  paper: '#F6F3EC',        // الخلفية الرئيسية
  panel: '#FFFFFF',        // خلفية الكروت والـ panels
  ink: '#1F2A24',          // النص الرئيسي
  inkSub: '#6D7A73',       // النص الثانوي
  line: '#C9BFA6',         // الحدود والفواصل
  navy: '#1D3B36',         // اللون الأساسي
  navyLight: '#2E5750',    // اللون الأساسي فاتح
  seal: '#9C6B3E',         // لون التأكيد (بني)
  sealLight: '#C99A63',    // لون التأكيد فاتح
  success: '#3E6B4F',      // لون النجاح (أخضر)
  danger: '#A3423A',       // لون الخطر (أحمر)
  warning: '#B7791F',      // لون التحذير (برتقالي)
  headerBg: '#1D3B36',     // خلفية الـ header
  headerText: '#F6F3EC',   // نص الـ header
  shadow: 'rgba(0,0,0,0.06)', // الظل
};

// ===== Dark Mode Colors =====
export const COLORS_DARK = {
  paper: '#121816',        // الخلفية الرئيسية
  panel: '#1A2320',        // خلفية الكروت
  ink: '#E8ECE9',          // النص الرئيسي
  inkSub: '#9EAEA6',       // النص الثانوي
  line: '#2E3B35',         // الحدود
  navy: '#2E5750',         // اللون الأساسي
  navyLight: '#3E6B4F',    // اللون الأساسي فاتح
  seal: '#C99A63',         // لون التأكيد
  sealLight: '#E3CBAE',    // لون التأكيد فاتح
  success: '#81C784',      // أخضر فاتح
  danger: '#E57373',       // أحمر فاتح
  warning: '#FFB74D',      // برتقالي فاتح
  headerBg: '#0D1311',     // خلفية الـ header
  headerText: '#E8ECE9',   // نص الـ header
  shadow: 'rgba(0,0,0,0.4)', // الظل
};

// ===== Theme Overrides - تجاوزات الثيمات =====
export const THEME_OVERRIDES: Record<ThemeType, Partial<typeof COLORS_LIGHT>> = {
  default: {}, // بدون تجاوزات
  blue: {
    navy: '#1A365D',
    navyLight: '#2B6CB0',
    seal: '#2B6CB0',
    sealLight: '#4299E1',
    headerBg: '#0F2942',
    success: '#1565C0',
  },
  purple: {
    navy: '#4A154B',
    navyLight: '#6B21A8',
    seal: '#7C3AED',
    sealLight: '#A78BFA',
    headerBg: '#2E082D',
    success: '#5B21B6',
  },
  teal: {
    navy: '#0D4A4A',
    navyLight: '#0D7C7C',
    seal: '#0D7C7C',
    sealLight: '#38B2B2',
    headerBg: '#063333',
    success: '#0D7C7C',
  },
  rose: {
    navy: '#5E1A2E',
    navyLight: '#B83260',
    seal: '#B83260',
    sealLight: '#ED64A6',
    headerBg: '#3D0F1E',
    success: '#9F1239',
  },
  amber: {
    navy: '#6B4C1A',
    navyLight: '#B7791F',
    seal: '#B7791F',
    sealLight: '#ECC94B',
    headerBg: '#4A3310',
    success: '#92400E',
  },
};

// ===== Tag Colors - ألوان الأقسام =====
export const TAG_COLORS = {
  blood: {
    bg: 'rgba(200,50,50,0.15)',
    text: '#C0392B',
  },
  chem: {
    bg: 'rgba(156,107,62,0.15)',
    text: '#9C6B3E',
  },
  urine: {
    bg: 'rgba(62,107,79,0.15)',
    text: '#3E6B4F',
  },
  serology: {
    bg: 'rgba(124,58,237,0.15)',
    text: '#9333EA',
  },
  stool: {
    bg: 'rgba(180,83,9,0.15)',
    text: '#D97706',
  },
  preg: {
    bg: 'rgba(219,39,119,0.15)',
    text: '#DB2777',
  },
};

// ===== Color Getter Function =====
export function getColors(isDark: boolean, theme: ThemeType = 'default') {
  const baseColors = isDark ? COLORS_DARK : COLORS_LIGHT;
  const themeOverride = THEME_OVERRIDES[theme];
  
  return {
    ...baseColors,
    ...themeOverride,
  };
}

// ===== Theme Presets - معاينات الثيمات =====
export const THEME_PRESETS = {
  default: { label: 'الأخضر الافتراضي', color: '#1D3B36' },
  blue: { label: 'الأزرق', color: '#1A365D' },
  purple: { label: 'البنفسجي', color: '#4A154B' },
  teal: { label: 'التركواز', color: '#0D4A4A' },
  rose: { label: 'الوردي', color: '#5E1A2E' },
  amber: { label: 'الذهبي', color: '#6B4C1A' },
};

// ===== Status Colors =====
export const STATUS_COLORS = {
  normal: '#3E6B4F',
  warning: '#B7791F',
  critical: '#A3423A',
  pending: '#F0B44D',
  success: '#3E6B4F',
  error: '#A3423A',
};
 
