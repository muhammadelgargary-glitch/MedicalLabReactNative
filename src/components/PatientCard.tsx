import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { useLabStore, Patient } from '../store/useLabStore';
import { getColors } from '../styles/colors';
import { SPACING, BORDER_RADIUS, SHADOWS } from '../styles/spacing';
import { displayDate } from '../utils/helpers';

interface PatientCardProps {
  patient: Patient;
  onPress: () => void;
  style?: ViewStyle;
}

export function PatientCard({ patient, onPress, style }: PatientCardProps) {
  const isDark = useLabStore((s) => s.darkMode);
  const themeType = useLabStore((s) => s.theme);

  const colors = getColors(isDark, themeType);
  const styles = createPatientCardStyles(colors);

  return (
    <TouchableOpacity style={[styles.card, style]} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <Text style={styles.name}>{patient.name}</Text>
        <Text style={styles.seq}>#{patient.seq}</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.row}>
        <View style={styles.infoItem}>
          <Text style={styles.label}>النوع</Text>
          <Text style={styles.value}>{patient.gender}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.label}>العمر</Text>
          <Text style={styles.value}>{patient.age}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.label}>التاريخ</Text>
          <Text style={styles.date}>{displayDate(patient.date)}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.arrowIcon}>›</Text>
      </View>
    </TouchableOpacity>
  );
}

const createPatientCardStyles = (colors: ReturnType<typeof getColors>) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.panel,
      borderRadius: BORDER_RADIUS.lg,
      padding: SPACING[4],
      marginVertical: SPACING[2],
      borderWidth: 1,
      borderColor: colors.line,
      ...SHADOWS.sm,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: SPACING[2],
    },
    name: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.ink,
      fontFamily: 'Tajawal-Bold',
      flex: 1,
    },
    seq: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.seal,
      fontFamily: 'Tajawal-Bold',
    },
    divider: {
      height: 1,
      backgroundColor: colors.line,
      marginVertical: SPACING[2],
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      marginBottom: SPACING[2],
    },
    infoItem: {
      alignItems: 'center',
    },
    label: {
      fontSize: 11,
      color: colors.inkSub,
      fontWeight: '600',
      fontFamily: 'Tajawal',
      marginBottom: SPACING[1],
    },
    value: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.navy,
      fontFamily: 'Tajawal-Bold',
    },
    date: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.inkSub,
      fontFamily: 'Tajawal',
    },
    footer: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    arrowIcon: {
      fontSize: 24,
      color: colors.seal,
    },
  });
 
