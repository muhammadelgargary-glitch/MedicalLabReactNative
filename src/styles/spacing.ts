// src/styles/spacing.ts - نظام المسافات والحدود

export const SPACING = {
  '0': 0,
  '1': 4,
  '2': 8,
  '3': 12,
  '4': 16,
  '5': 20,
  '6': 24,
  '8': 32,
  '10': 40,
  '12': 48,
} as const;

export type SpacingValue = keyof typeof SPACING;

export const BORDER_RADIUS = {
  none: 0,
  sm: 6,
  md: 8,
  lg: 10,
  xl: 12,
  '2xl': 14,
  '3xl': 16,
  '4xl': 20,
  full: 999,
} as const;

export type BorderRadiusValue = keyof typeof BORDER_RADIUS;

// ===== Shadow Styles =====
export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
} as const;

export type ShadowValue = keyof typeof SHADOWS;

// ===== Layout Helpers =====
export const FLEX_CENTERS = {
  center: {
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  centerH: {
    justifyContent: 'center' as const,
  },
  centerV: {
    alignItems: 'center' as const,
  },
  spaceBetween: {
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  spaceAround: {
    justifyContent: 'space-around' as const,
    alignItems: 'center' as const,
  },
} as const;

// ===== Grid/Stack Helpers =====
export const GRID_GAPS = {
  tight: SPACING[1],
  small: SPACING[2],
  medium: SPACING[3],
  large: SPACING[4],
  xl: SPACING[5],
} as const;

// ===== Padding Helpers =====
export const PADDINGS = {
  xs: SPACING[1],
  sm: SPACING[2],
  md: SPACING[3],
  lg: SPACING[4],
  xl: SPACING[5],
  '2xl': SPACING[6],
  '3xl': SPACING[8],
} as const;

// ===== Margin Helpers =====
export const MARGINS = PADDINGS;

// ===== Screen Safe Areas =====
export const SAFE_AREA = {
  defaultPadding: SPACING[4],
  tabBarHeight: 65,
  headerHeight: 70,
} as const;
 
