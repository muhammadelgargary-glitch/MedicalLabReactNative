import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { useLabStore, Patient } from '../store/useLabStore';
import { getColors } from '../styles/colors';
import { BORDER_RADIUS, SHADOWS } from '../styles/spacing';
import { displayDate } from '../utils/helpers';
import { resolveFontFamily, fontScale } from '../styles/design';

export function PatientCard({
  patient,
  onPress,
  onEdit,
  onResults,
  onPrint,
  onPdf,
  style,
}: {
  patient: Patient;
  onPress: () => void;
  onEdit?: () => void;
  onResults?: () => void;
  onPrint?: () => void | Promise<void>;
  onPdf?: () => void | Promise<void>;
  style?: ViewStyle;
}) {
  const dark = useLabStore((s) => s.darkMode);
  const theme = useLabStore((s) => s.theme);
  const family = useLabStore((s) => s.fontFamily);
  const size = useLabStore((s) => s.fontSize);
  const testCatalog = useLabStore((s) => s.testCatalog);
  const testPrices = useLabStore((s) => s.testPrices);
  const colors = getColors(dark, theme);
  const styles = createStyles(colors, resolveFontFamily(family), fontScale(size));

  const sections = [
    patient.includeBlood && 'دم',
    patient.includeChem && 'كيمياء',
    patient.includeUrine && 'بول',
    patient.includeSerology && 'أمصال',
    patient.includeStool && 'براز',
    patient.includePreg && 'حمل',
  ].filter(Boolean).slice(0, 5) as string[];

  const selected = Array.isArray(patient.selectedTests) ? patient.selectedTests : [];
  const computedTotal = selected.reduce((sum, id) => {
    const key = id.split('.').slice(1).join('.') || id;
    const item = (testCatalog || []).find((t: any) => t.key === key || t.id === key);
    const price = Number(item?.price || testPrices?.[key] || 0);
    return sum + (Number.isFinite(price) ? price : 0);
  }, 0);
  const total = patient.pricing?.total || computedTotal;
  const paid = patient.pricing?.paid || 0;
  const remaining = patient.pricing?.remaining;
  const pricingComplete = patient.pricing?.complete ?? total > 0;

  const action = (label: string, fn?: () => void | Promise<void>, primary = false) => fn ? (
    <TouchableOpacity onPress={fn} style={[styles.action, primary && styles.actionPrimary]} activeOpacity={0.8}>
      <Text style={[styles.actionText, primary && styles.actionTextPrimary]}>{label}</Text>
    </TouchableOpacity>
  ) : null;

  return (
    <View style={[styles.card, style]}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.86}>
        <View style={styles.top}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{patient.name?.trim()?.charAt(0) || 'م'}</Text></View>
          <View style={styles.identity}>
            <Text style={styles.name} numberOfLines={1}>{patient.name}</Text>
            <Text style={styles.meta}>سجل #{patient.seq || '—'}  •  {displayDate(patient.date)}</Text>
          </View>
          <View style={styles.viewBadge}><Text style={styles.viewBadgeText}>عرض</Text></View>
        </View>
        <View style={styles.divider} />
        <View style={styles.bottom}>
          <View><Text style={styles.label}>العمر</Text><Text style={styles.value}>{patient.age || '—'}</Text></View>
          <View><Text style={styles.label}>الجنس</Text><Text style={styles.value}>{patient.gender || '—'}</Text></View>
          <View style={styles.tags}>{sections.map((s) => <View key={s} style={styles.tag}><Text style={styles.tagText}>{s}</Text></View>)}</View>
        </View>
      </TouchableOpacity>

      <View style={styles.priceBox}>
        <View style={styles.priceChip}><Text style={styles.priceChipText}>💰 السعر: {pricingComplete ? `${Number(total).toLocaleString('en-US')} د.ع` : 'غير مكتمل'}</Text></View>
        <View style={styles.priceChip}><Text style={styles.priceChipText}>💵 المدفوع: {Number(paid).toLocaleString('en-US')} د.ع</Text></View>
        <View style={[styles.priceChip, styles.remainingChip]}><Text style={styles.remainingText}>📌 المتبقي: {remaining == null ? '—' : `${Number(remaining).toLocaleString('en-US')} د.ع`}</Text></View>
      </View>

      <View style={styles.actionsRow}>
        {action('عرض', onPress, true)}
        {action('تعديل', onEdit)}
        {action('النتائج', onResults)}
      </View>
      <View style={styles.actionsRow}>
        {action('🖨 طباعة', onPrint)}
        {action('📄 PDF', onPdf)}
      </View>
    </View>
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
  avatar: { width: 46, height: 46, borderRadius: 14, backgroundColor: colors.sealLight, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.navy, fontSize: 18 * scale, fontWeight: '900', fontFamily },
  identity: { flex: 1, marginHorizontal: 12 },
  name: { color: colors.ink, fontSize: 15 * scale, fontWeight: '900', fontFamily },
  meta: { color: colors.inkSub, fontSize: 11 * scale, marginTop: 3, fontFamily },
  viewBadge: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 11, backgroundColor: colors.sealLight },
  viewBadgeText: { color: colors.navy, fontSize: 10 * scale, fontWeight: '900', fontFamily },
  divider: { height: 1, backgroundColor: colors.line, marginVertical: 13 },
  bottom: { flexDirection: 'row', alignItems: 'center' },
  label: { color: colors.inkSub, fontSize: 10 * scale, fontFamily },
  value: { color: colors.ink, fontSize: 12 * scale, fontWeight: '800', marginTop: 3, fontFamily },
  tags: { flex: 1, flexDirection: 'row', justifyContent: 'flex-end', gap: 5, flexWrap: 'wrap' },
  tag: { backgroundColor: colors.surfaceAlt || colors.paper, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 12 },
  tagText: { color: colors.navy, fontSize: 10 * scale, fontWeight: '800', fontFamily },
  priceBox: { marginTop: 12, padding: 9, borderRadius: 13, backgroundColor: colors.sealLight, borderWidth: 1, borderColor: colors.line, flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  priceChip: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 10, backgroundColor: colors.panel },
  priceChipText: { color: colors.navy, fontSize: 9.5 * scale, fontWeight: '900', fontFamily },
  remainingChip: { backgroundColor: colors.paper },
  remainingText: { color: colors.inkSub, fontSize: 9.5 * scale, fontWeight: '900', fontFamily },
  actionsRow: { flexDirection: 'row', gap: 7, marginTop: 9 },
  action: { flex: 1, minHeight: 40, borderRadius: 11, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.paper, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 7 },
  actionPrimary: { backgroundColor: colors.navy, borderColor: colors.navy },
  actionText: { color: colors.navy, fontSize: 10.5 * scale, fontWeight: '900', fontFamily },
  actionTextPrimary: { color: '#fff' },
});

const statsStyles = (colors: any) => StyleSheet.create({
  card: { flex: 1, backgroundColor: colors.panel, borderRadius: 16, borderWidth: 1, borderColor: colors.line, borderTopWidth: 3, padding: 14 },
  value: { color: colors.ink, fontSize: 21, fontWeight: '900' },
  title: { color: colors.inkSub, fontSize: 11, marginTop: 4 },
});
