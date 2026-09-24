import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { useLabStore, Patient } from '../store/useLabStore';
import { getColors } from '../styles/colors';
import { BORDER_RADIUS, SHADOWS } from '../styles/spacing';
import { displayDate } from '../utils/helpers';
import { resolveFontFamily, fontScale } from '../styles/design';

export function PatientCard({ patient, onPress, style }: { patient: Patient; onPress: () => void; style?: ViewStyle }) {
  const dark = useLabStore((s) => s.darkMode);
  const theme = useLabStore((s) => s.theme);
  const family = useLabStore((s) => s.fontFamily);
  const size = useLabStore((s) => s.fontSize);
  const colors = getColors(dark, theme);
  const styles = createStyles(colors, resolveFontFamily(family), fontScale(size));

  const sections = [
    patient.includeBlood && 'دم',
    patient.includeChem && 'كيمياء',
    patient.includeUrine && 'بول',
    patient.includeSerology && 'أمصال',
    patient.includeStool && 'براز',
    patient.includePreg && 'حمل',
  ].filter(Boolean).slice(0, 3) as string[];

  return (
    <TouchableOpacity style={[styles.card, style]} onPress={onPress} activeOpacity={0.86}>
      <View style={styles.top}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{patient.name?.trim()?.charAt(0) || 'م'}</Text></View>
        <View style={styles.identity}>
          <Text style={styles.name} numberOfLines={1}>{patient.name}</Text>
          <Text style={styles.meta}>سجل #{patient.seq}  •  {displayDate(patient.date)}</Text>
        </View>
        <Text style={styles.chevron}>‹</Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.bottom}>
        <View><Text style={styles.label}>العمر</Text><Text style={styles.value}>{patient.age}</Text></View>
        <View><Text style={styles.label}>الجنس</Text><Text style={styles.value}>{patient.gender}</Text></View>
        <View style={styles.tags}>{sections.map((s) => <View key={s} style={styles.tag}><Text style={styles.tagText}>{s}</Text></View>)}</View>
      </View>
    </TouchableOpacity>
  );
}

export function StatsCard({ title, value, icon, color, onPress }: { title: string; value: string | number; icon?: string; color?: string; onPress?: () => void }) {
  const dark = useLabStore((s) => s.darkMode);
  const theme = useLabStore((s) => s.theme);
  const colors = getColors(dark, theme);
  const Content = <View style={[statsStyles(colors).card, { borderTopColor: color || colors.navy }]}><Text style={statsStyles(colors).value}>{value}</Text><Text style={statsStyles(colors).title}>{title}</Text></View>;
  return onPress ? <TouchableOpacity onPress={onPress}>{Content}</TouchableOpacity> : Content;
}

const createStyles = (colors: any, fontFamily: string, scale: number) => StyleSheet.create({
  card: { backgroundColor: colors.panel, borderRadius: BORDER_RADIUS.xl, padding: 15, marginHorizontal: 16, marginVertical: 5, borderWidth: 1, borderColor: colors.line, ...SHADOWS.sm },
  top: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.sealLight, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.navy, fontSize: 18 * scale, fontWeight: '900', fontFamily },
  identity: { flex: 1, marginHorizontal: 12 },
  name: { color: colors.ink, fontSize: 15 * scale, fontWeight: '900', fontFamily },
  meta: { color: colors.inkSub, fontSize: 11 * scale, marginTop: 3, fontFamily },
  chevron: { color: colors.navy, fontSize: 27 },
  divider: { height: 1, backgroundColor: colors.line, marginVertical: 13 },
  bottom: { flexDirection: 'row', alignItems: 'center' },
  label: { color: colors.inkSub, fontSize: 10 * scale, fontFamily },
  value: { color: colors.ink, fontSize: 12 * scale, fontWeight: '800', marginTop: 3, fontFamily },
  tags: { flex: 1, flexDirection: 'row', justifyContent: 'flex-end', gap: 5, flexWrap: 'wrap' },
  tag: { backgroundColor: colors.surfaceAlt || colors.paper, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 12 },
  tagText: { color: colors.navy, fontSize: 10 * scale, fontWeight: '800', fontFamily },
});

const statsStyles = (colors: any) => StyleSheet.create({
  card: { flex: 1, backgroundColor: colors.panel, borderRadius: 16, borderWidth: 1, borderColor: colors.line, borderTopWidth: 3, padding: 14 },
  value: { color: colors.ink, fontSize: 21, fontWeight: '900' },
  title: { color: colors.inkSub, fontSize: 11, marginTop: 4 },
});
