// src/components/ThemedButton.tsx - زر معاد الاستخدام مع الثيم

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useLabStore } from '../store/useLabStore';
import { createTheme } from '../styles/theme';
import { getColors } from '../styles/colors';
import { SPACING, BORDER_RADIUS } from '../styles/spacing';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ThemedButtonProps {
  onPress: () => void;
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: string;
  fullWidth?: boolean;
}

export default function ThemedButton({
  onPress,
  title,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  style,
  textStyle,
  icon,
  fullWidth = true,
}: ThemedButtonProps) {
  const isDark = useLabStore((s) => s.darkMode);
  const themeType = useLabStore((s) => s.theme);

  const colors = getColors(isDark, themeType);
  const theme = createTheme(isDark, themeType);
  const styles = createStyles(colors, theme);

  const sizeStyles = {
    sm: styles.sizeSm,
    md: styles.sizeMd,
    lg: styles.sizeLg,
  };

  const variantStyles = {
    primary: styles.variantPrimary,
    secondary: styles.variantSecondary,
    danger: styles.variantDanger,
    success: styles.variantSuccess,
    outline: styles.variantOutline,
  };

  const textVariantStyles = {
    primary: styles.textPrimary,
    secondary: styles.textSecondary,
    danger: styles.textDanger,
    success: styles.textSuccess,
    outline: styles.textOutline,
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        sizeStyles[size],
        variantStyles[variant],
        fullWidth && styles.fullWidth,
        (disabled || loading) && styles.disabled,
        style,
      ]}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'outline' ? colors.seal : '#FFFFFF'}
          size={size === 'sm' ? 'small' : 'large'}
        />
      ) : (
        <>
          {icon && <Text style={styles.icon}>{icon} </Text>}
          <Text style={[textVariantStyles[variant], textStyle]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const createStyles = (colors: ReturnType<typeof getColors>, theme: ReturnType<typeof createTheme>) =>
  StyleSheet.create({
    button: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: BORDER_RADIUS.md,
      gap: SPACING[1],
    },
    fullWidth: {
      width: '100%',
    },
    disabled: {
      opacity: 0.5,
    },

    // ===== Sizes =====
    sizeSm: {
      paddingHorizontal: SPACING[3],
      paddingVertical: SPACING[1],
      minHeight: 36,
    },
    sizeMd: {
      paddingHorizontal: SPACING[4],
      paddingVertical: SPACING[2],
      minHeight: 44,
    },
    sizeLg: {
      paddingHorizontal: SPACING[4],
      paddingVertical: SPACING[3],
      minHeight: 52,
    },

    // ===== Variants =====
    variantPrimary: {
      backgroundColor: colors.seal,
    },
    variantSecondary: {
      backgroundColor: colors.panel,
      borderWidth: 1,
      borderColor: colors.line,
    },
    variantDanger: {
      backgroundColor: colors.danger,
    },
    variantSuccess: {
      backgroundColor: colors.success,
    },
    variantOutline: {
      backgroundColor: 'transparent',
      borderWidth: 2,
      borderColor: colors.seal,
    },

    // ===== Text Variants =====
    textPrimary: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '700',
      fontFamily: 'Tajawal-Bold',
    },
    textSecondary: {
      color: colors.ink,
      fontSize: 14,
      fontWeight: '700',
      fontFamily: 'Tajawal-Bold',
    },
    textDanger: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '700',
      fontFamily: 'Tajawal-Bold',
    },
    textSuccess: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '700',
      fontFamily: 'Tajawal-Bold',
    },
    textOutline: {
      color: colors.seal,
      fontSize: 14,
      fontWeight: '700',
      fontFamily: 'Tajawal-Bold',
    },

    // ===== Icon =====
    icon: {
      fontSize: 16,
    },
  });
 
