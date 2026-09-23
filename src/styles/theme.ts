// src/styles/theme.ts - إدارة الثيم والألوان الديناميكية

import { StyleSheet } from 'react-native';
import { getColors, ThemeType, ColorMode } from './colors';
import { FONT_SIZES, FONT_WEIGHTS } from './typography';
import { SPACING, BORDER_RADIUS } from './spacing';

export type { ThemeType, ColorMode };

export interface Theme {
  colors: ReturnType<typeof getColors>;
  spacing: typeof SPACING;
  borderRadius: typeof BORDER_RADIUS;
  typography: {
    fontSizes: typeof FONT_SIZES;
    fontWeights: typeof FONT_WEIGHTS;
  };
}

export function createTheme(isDark: boolean, themeType: ThemeType = 'default'): Theme {
  return {
    colors: getColors(isDark, themeType),
    spacing: SPACING,
    borderRadius: BORDER_RADIUS,
    typography: {
      fontSizes: FONT_SIZES,
      fontWeights: FONT_WEIGHTS,
    },
  };
}

// ===== Common Styles =====
export const createCommonStyles = (theme: Theme) =>
  StyleSheet.create({
    // ===== Container Styles =====
    container: {
      flex: 1,
      backgroundColor: theme.colors.paper,
    },
    contentContainer: {
      padding: theme.spacing[4],
      paddingBottom: theme.spacing[12],
    },
    centerContent: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },

    // ===== Header & Card Styles =====
    header: {
      backgroundColor: theme.colors.headerBg,
      paddingHorizontal: theme.spacing[4],
      paddingVertical: theme.spacing[3],
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.line,
    },
    card: {
      backgroundColor: theme.colors.panel,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing[4],
      marginVertical: theme.spacing[2],
      borderWidth: 1,
      borderColor: theme.colors.line,
      // Shadow for iOS
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      // Shadow for Android
      elevation: 2,
    },

    // ===== Text Styles =====
    text: {
      color: theme.colors.ink,
      fontFamily: 'Tajawal',
    },
    textPrimary: {
      color: theme.colors.ink,
      fontSize: theme.typography.fontSizes.base,
      fontWeight: theme.typography.fontWeights.semibold,
      fontFamily: 'Tajawal',
    },
    textSecondary: {
      color: theme.colors.inkSub,
      fontSize: theme.typography.fontSizes.sm,
      fontWeight: theme.typography.fontWeights.normal,
      fontFamily: 'Tajawal',
    },
    textLarge: {
      color: theme.colors.ink,
      fontSize: theme.typography.fontSizes.lg,
      fontWeight: theme.typography.fontWeights.bold,
      fontFamily: 'Tajawal',
    },
    textXLarge: {
      color: theme.colors.ink,
      fontSize: theme.typography.fontSizes['2xl'],
      fontWeight: theme.typography.fontWeights.extrabold,
      fontFamily: 'Tajawal',
    },

    // ===== Button Styles =====
    button: {
      paddingHorizontal: theme.spacing[4],
      paddingVertical: theme.spacing[2],
      borderRadius: theme.borderRadius.md,
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: 40,
    },
    buttonPrimary: {
      backgroundColor: theme.colors.seal,
    },
    buttonSecondary: {
      backgroundColor: theme.colors.panel,
      borderWidth: 1,
      borderColor: theme.colors.line,
    },
    buttonDanger: {
      backgroundColor: theme.colors.danger,
    },
    buttonSuccess: {
      backgroundColor: theme.colors.success,
    },
    buttonText: {
      color: '#FFFFFF',
      fontSize: theme.typography.fontSizes.base,
      fontWeight: theme.typography.fontWeights.bold,
      fontFamily: 'Tajawal',
    },
    buttonSecondaryText: {
      color: theme.colors.ink,
      fontSize: theme.typography.fontSizes.base,
      fontWeight: theme.typography.fontWeights.bold,
      fontFamily: 'Tajawal',
    },

    // ===== Input Styles =====
    input: {
      backgroundColor: theme.colors.panel,
      borderWidth: 1,
      borderColor: theme.colors.line,
      borderRadius: theme.borderRadius.md,
      paddingHorizontal: theme.spacing[3],
      paddingVertical: theme.spacing[2],
      color: theme.colors.ink,
      fontSize: theme.typography.fontSizes.base,
      fontFamily: 'Tajawal',
    },
    inputFocused: {
      borderColor: theme.colors.seal,
      borderWidth: 2,
    },

    // ===== Separator =====
    separator: {
      height: 1,
      backgroundColor: theme.colors.line,
      marginVertical: theme.spacing[2],
    },

    // ===== Badge/Tag =====
    badge: {
      paddingHorizontal: theme.spacing[2],
      paddingVertical: theme.spacing[1],
      borderRadius: theme.borderRadius.full,
      backgroundColor: theme.colors.seal,
    },
    badgeText: {
      color: '#FFFFFF',
      fontSize: theme.typography.fontSizes.xs,
      fontWeight: theme.typography.fontWeights.bold,
      fontFamily: 'Tajawal',
    },
  });

// ===== Theme Context Type =====
export interface ThemeContextType {
  isDark: boolean;
  themeType: ThemeType;
  theme: Theme;
  toggleDarkMode: () => void;
  setThemeType: (theme: ThemeType) => void;
}
 
