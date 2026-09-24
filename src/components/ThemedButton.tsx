import React from 'react';
import { ActivityIndicator, StyleProp, StyleSheet, Text, TextStyle, TouchableOpacity, ViewStyle } from 'react-native';
import { getColors } from '../styles/colors';
import { BORDER_RADIUS, SPACING } from '../styles/spacing';
import { useLabStore } from '../store/useLabStore';
import { resolveFontFamily, fontScale } from '../styles/design';

type Variant = 'primary' | 'secondary' | 'danger' | 'success' | 'outline' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface Props {
  title: string;
  variant?: Variant;
  size?: Size;
  icon?: string;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export default function ThemedButton({
  title, variant = 'primary', size = 'md', icon, onPress, disabled, loading, fullWidth = true, style, textStyle,
}: Props) {
  const isDark = useLabStore((s) => s.darkMode);
  const themeType = useLabStore((s) => s.theme);
  const fontFamily = useLabStore((s) => s.fontFamily);
  const fontSize = useLabStore((s) => s.fontSize);
  const colors = getColors(isDark, themeType);
  const scale = fontScale(fontSize);
  const styles = createStyles(colors, resolveFontFamily(fontFamily), scale);
  const textStyles: any = { primary: styles.primaryText, secondary: styles.secondaryText, danger: styles.dangerText, success: styles.successText, outline: styles.outlineText, ghost: styles.ghostText };

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      disabled={disabled || loading}
      onPress={onPress}
      style={[
        styles.base,
        styles[size],
        styles[variant],
        fullWidth && styles.fullWidth,
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'secondary' || variant === 'outline' || variant === 'ghost' ? colors.navy : '#fff'} />
      ) : (
        <>
          {icon ? <Text style={styles.icon}>{icon}</Text> : null}
          <Text style={[textStyles[variant], textStyle]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const createStyles = (colors: any, fontFamily: string, scale: number) => StyleSheet.create({
  base: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: BORDER_RADIUS.xl, gap: 8 },
  fullWidth: { width: '100%' },
  disabled: { opacity: 0.48 },
  sm: { minHeight: 38, paddingHorizontal: 14 },
  md: { minHeight: 46, paddingHorizontal: 18 },
  lg: { minHeight: 52, paddingHorizontal: 20 },
  primary: { backgroundColor: colors.navy },
  secondary: { backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.line },
  danger: { backgroundColor: colors.danger },
  success: { backgroundColor: colors.success },
  outline: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.navy },
  ghost: { backgroundColor: colors.paper },
  primaryText: { color: '#fff', fontSize: 14 * scale, fontWeight: '800', fontFamily },
  secondaryText: { color: colors.ink, fontSize: 14 * scale, fontWeight: '700', fontFamily },
  dangerText: { color: '#fff', fontSize: 14 * scale, fontWeight: '800', fontFamily },
  successText: { color: '#fff', fontSize: 14 * scale, fontWeight: '800', fontFamily },
  outlineText: { color: colors.navy, fontSize: 14 * scale, fontWeight: '800', fontFamily },
  ghostText: { color: colors.ink, fontSize: 14 * scale, fontWeight: '700', fontFamily },
  icon: { color: colors.ink, fontSize: 17 * scale, fontFamily },
});
