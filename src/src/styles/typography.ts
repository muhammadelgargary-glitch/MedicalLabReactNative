// src/styles/typography.ts - نظام الخطوط والأحجام

export const FONT_SIZES = {
  xs: 11,
  sm: 12,
  base: 14,
  lg: 16,
  xl: 18,
  '2xl': 20,
  '3xl': 24,
  '4xl': 28,
  '5xl': 32,
} as const;

export const FONT_WEIGHTS = {
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
  black: '900',
} as const;

// ===== Font Size Multipliers =====
export const FONT_SIZE_MULTIPLIERS = {
  small: 0.85,
  medium: 1,
  large: 1.15,
} as const;

// ===== Calculate Font Size Based on User Preference =====
export function getFontSize(
  baseSize: keyof typeof FONT_SIZES,
  multiplier: 0.85 | 1 | 1.15 = 1
): number {
  const base = FONT_SIZES[baseSize];
  return Math.round(base * multiplier);
}

// ===== Line Heights =====
export const LINE_HEIGHTS = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,
  loose: 2,
} as const;

// ===== Letter Spacing =====
export const LETTER_SPACING = {
  tight: -0.5,
  normal: 0,
  wide: 0.5,
  wider: 1,
} as const;

// ===== Typography Presets =====
export const TYPOGRAPHY_PRESETS = {
  h1: {
    fontSize: FONT_SIZES['4xl'],
    fontWeight: FONT_WEIGHTS.extrabold,
    lineHeight: LINE_HEIGHTS.tight,
  },
  h2: {
    fontSize: FONT_SIZES['3xl'],
    fontWeight: FONT_WEIGHTS.bold,
    lineHeight: LINE_HEIGHTS.tight,
  },
  h3: {
    fontSize: FONT_SIZES['2xl'],
    fontWeight: FONT_WEIGHTS.bold,
    lineHeight: LINE_HEIGHTS.normal,
  },
  h4: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.semibold,
    lineHeight: LINE_HEIGHTS.normal,
  },
  body: {
    fontSize: FONT_SIZES.base,
    fontWeight: FONT_WEIGHTS.normal,
    lineHeight: LINE_HEIGHTS.normal,
  },
  bodyBold: {
    fontSize: FONT_SIZES.base,
    fontWeight: FONT_WEIGHTS.semibold,
    lineHeight: LINE_HEIGHTS.normal,
  },
  caption: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.normal,
    lineHeight: LINE_HEIGHTS.normal,
  },
  captionBold: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
    lineHeight: LINE_HEIGHTS.normal,
  },
} as const;

export type TypographyPreset = keyof typeof TYPOGRAPHY_PRESETS;
 
