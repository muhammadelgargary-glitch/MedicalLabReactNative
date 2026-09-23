import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useLabStore } from '../store/useLabStore';
import { getColors } from '../styles/colors';
import { SPACING, BORDER_RADIUS, SHADOWS } from '../styles/spacing';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: string;
  color?: string;
  onPress?: () => void;
}

export function StatsCard({ title, value, icon, color, onPress }: StatsCardProps) {
  const isDark = useLabStore((s) => s.darkMode);
  const themeType = useLabStore((s) => s.theme);

  const colors = getColors(isDark, themeType);
  const styles = createStatsCardStyles(colors);

  const Content = (
    <View style={[styles.card, { borderLeftColor: color || colors.seal }]}>
      <Text style={styles.icon}>{icon}</Text>
      <View style={styles.content}>
        <Text style={styles.value}>{value}</Text>
        <Text style={styles.title}>{title}</Text>
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {Content}
      </TouchableOpacity>
    );
  }

  return Content;
}

const createStatsCardStyles = (colors: ReturnType<typeof getColors>) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.panel,
      borderRadius: BORDER_RADIUS.lg,
      padding: SPACING[3],
      marginHorizontal: SPACING[2],
      marginVertical: SPACING[2],
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING[3],
      borderLeftWidth: 5,
      borderWidth: 1,
      borderColor: colors.line,
      ...SHADOWS.sm,
    },
    icon: {
      fontSize: 28,
    },
    content: {
      flex: 1,
    },
    value: {
      fontSize: 20,
      fontWeight: '800',
      color: colors.ink,
      fontFamily: 'Tajawal-Bold',
    },
    title: {
      fontSize: 12,
      color: colors.inkSub,
      fontWeight: '600',
      fontFamily: 'Tajawal',
      marginTop: SPACING[1],
    },
  });
 
