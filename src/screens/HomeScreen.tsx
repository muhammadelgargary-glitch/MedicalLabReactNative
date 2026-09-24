import React, { useMemo, useState } from 'react';
import {
  Alert, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { useLabStore, Patient } from '../store/useLabStore';
import { getColors } from '../styles/colors';
import { BORDER_RADIUS, SHADOWS, SPACING } from '../styles/spacing';
import { resolveFontFamily, fontScale } from '../styles/design';
import { PatientCard } from '../components/PatientCard';
import ThemedButton from '../components/ThemedButton';
import { exportPatientsExcel, exportStatsPdf, getStats } from '../services/exportService';

export default function HomeScreen({ navigation }: any) {
  const patients = useLabStore((s) => s.patients);
  const settings = useLabStore((s) => s.settings);
  const isDark = useLabStore((s) => s.darkMode);
  const themeType = useLabStore((s) => s.theme);
  const fontFamily = useLabStore((s) => s.fontFamily);
  const fontSize = useLabStore((s) => s.fontSize);

  const colors = getColors(isDark, themeType);
  const styles = createStyles(colors, resolveFontFamily(fontFamily), fontScale(fontSize));

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'today' | 'blood' | 'chem' | 'urine' | 'serology' | 'stool' | 'preg'>('all');
  const [busy, setBusy] = useState(false);

  const stats = useMemo(() => ({
    today: patients.filter((p) => p.date === new Date().toISOString().slice(0, 10)).length,
    total: patients.length,
    blood: patients.filter((p) => p.includeBlood).length,
    chem: patients.filter((p) => p.includeChem).length,
    urine: patients.filter((p) => p.includeUrine).length,
    serology: patients.filter((p) => p.includeSerology).length,
    stool: patients.filter((p) => p.includeStool).length,
    preg: patients.filter((p) => p.includePreg).length,
  }), [patients]);

  const filtered = useMemo(() => patients.filter((p) => {
    const q = query.trim().toLowerCase();
    const matches = !q || `${p.name} ${p.seq} ${p.id}`.toLowerCase().includes(q);
    if (!matches) return false;
    if (filter === 'all') return true;
    if (filter === 'today') return p.date === new Date().toISOString().slice(0, 10);
    return Boolean((p as any)[`include${filter[0].toUpperCase()}${filter.slice(1)}`]);
  }), [patients, query, filter]);

  const run = async (fn: () => Promise<any>, message: string) => {
    try { setBusy(true); await fn(); Alert.alert('تم', message); }
    catch (e: any) { Alert.alert('خطأ', e?.message || 'تعذر تنفيذ العملية'); }
    finally { setBusy(false); }
  };

  const filters = [
    ['all', 'الكل'], ['today', 'اليوم'], ['blood', 'دم'], ['chem', 'كيمياء'],
    ['urine', 'بول'], ['serology', 'أمصال'], ['stool', 'براز'], ['preg', 'حمل'],
  ] as const;

  const statCards = [
    ['مرضى اليوم', stats.today, colors.navy],
    ['إجمالي المرضى', stats.total, colors.seal],
    ['الدم', stats.blood, '#D92D20'],
    ['الكيمياء', stats.chem, '#6941C6'],
    ['البول', stats.urine, '#1570EF'],
    ['الأمصال', stats.serology, '#DC6803'],
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <View style={styles.heroText}>
            <Text style={styles.kicker}>لوحة المختبر</Text>
            <Text style={styles.title}>{settings.center || 'مختبر طبي'}</Text>
            <Text style={styles.subtitle}>إدارة المرضى والنتائج والتقارير من مكان واحد</Text>
          </View>
          <TouchableOpacity style={styles.menuButton} onPress={() => navigation.navigate('Settings')}>
            <Text style={styles.menuGlyph}>☰</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchBox}>
          <Text style={styles.searchGlyph}>⌕</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="ابحث باسم المريض أو رقم السجل"
            placeholderTextColor={colors.inkSub}
            style={styles.searchInput}
          />
        </View>

        <View style={styles.primaryActions}>
          <ThemedButton title="إضافة مريض" icon="＋" size="lg" onPress={() => navigation.navigate('PatientForm')} style={{ flex: 1 }} fullWidth={false} />
          <ThemedButton title="طباعة عدة تقارير" icon="▤" variant="secondary" size="lg" onPress={() => navigation.navigate('MultiPrint')} style={{ flex: 1 }} fullWidth={false} />
        </View>

        <View style={styles.secondaryActions}>
          <ThemedButton title="Excel" icon="⇩" variant="outline" onPress={() => run(() => exportPatientsExcel(patients), 'تم تصدير ملف Excel')} style={{ flex: 1 }} fullWidth={false} />
          <ThemedButton title="PDF الإحصائيات" icon="▤" variant="outline" onPress={() => run(() => exportStatsPdf(getStats(patients), settings), 'تم إنشاء ملف الإحصائيات')} style={{ flex: 1 }} fullWidth={false} />
        </View>

        <View style={styles.sectionHeading}>
          <View>
            <Text style={styles.sectionTitle}>ملخص اليوم</Text>
            <Text style={styles.sectionHint}>نظرة سريعة على نشاط المختبر</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Stats')}>
            <Text style={styles.link}>التفاصيل</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsGrid}>
          {statCards.map(([label, value, color]) => (
            <View key={String(label)} style={[styles.statCard, { borderTopColor: color as string }]}>
              <Text style={styles.statValue}>{value}</Text>
              <Text style={styles.statLabel}>{label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.sectionHeading}>
          <View>
            <Text style={styles.sectionTitle}>السجلات</Text>
            <Text style={styles.sectionHint}>{filtered.length} سجل ظاهر</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Catalog')}>
            <Text style={styles.link}>عرض الكل</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {filters.map(([id, label]) => (
            <TouchableOpacity
              key={id}
              onPress={() => setFilter(id)}
              style={[styles.filter, filter === id && styles.filterActive]}
            >
              <Text style={[styles.filterText, filter === id && styles.filterTextActive]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {filtered.length ? filtered.slice(0, 8).map((p: Patient) => (
          <PatientCard key={p.id} patient={p} onPress={() => navigation.navigate('PatientReport', { id: p.id })} />
        )) : (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>لا توجد سجلات مطابقة</Text>
            <Text style={styles.emptyText}>غيّر البحث أو أضف مريضًا جديدًا.</Text>
          </View>
        )}

        {filtered.length > 8 && (
          <ThemedButton title={`عرض جميع النتائج (${filtered.length})`} variant="ghost" onPress={() => navigation.navigate('Catalog')} />
        )}
      </ScrollView>
      {busy && <View style={styles.busy}><Text style={styles.busyText}>جارٍ تنفيذ العملية…</Text></View>}
    </SafeAreaView>
  );
}

const createStyles = (colors: any, fontFamily: string, scale: number) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  content: { paddingBottom: 40 },
  hero: { backgroundColor: colors.headerBg, paddingHorizontal: 20, paddingTop: 22, paddingBottom: 24, flexDirection: 'row', alignItems: 'center' },
  heroText: { flex: 1 },
  kicker: { color: '#B7E8E2', fontSize: 12 * scale, fontWeight: '700', fontFamily, marginBottom: 5 },
  title: { color: '#fff', fontSize: 25 * scale, fontWeight: '900', fontFamily },
  subtitle: { color: '#D7EFEC', fontSize: 12 * scale, lineHeight: 19, marginTop: 5, fontFamily },
  menuButton: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  menuGlyph: { color: '#fff', fontSize: 23 },
  searchBox: { margin: 16, marginBottom: 10, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.line, borderRadius: 16, minHeight: 50, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, ...SHADOWS.sm },
  searchGlyph: { fontSize: 24, color: colors.navy, marginRight: 8 },
  searchInput: { flex: 1, color: colors.ink, fontSize: 14 * scale, textAlign: 'right', fontFamily },
  primaryActions: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginBottom: 10 },
  secondaryActions: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginBottom: 22 },
  sectionHeading: { paddingHorizontal: 16, marginBottom: 10, marginTop: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { color: colors.ink, fontSize: 17 * scale, fontWeight: '900', fontFamily },
  sectionHint: { color: colors.inkSub, fontSize: 11 * scale, marginTop: 2, fontFamily },
  link: { color: colors.navy, fontSize: 12 * scale, fontWeight: '800', fontFamily },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 10, marginBottom: 16 },
  statCard: { width: '31.7%', minHeight: 88, backgroundColor: colors.panel, borderRadius: 16, padding: 13, borderWidth: 1, borderColor: colors.line, borderTopWidth: 3, ...SHADOWS.sm },
  statValue: { color: colors.ink, fontSize: 22 * scale, fontWeight: '900', fontFamily },
  statLabel: { color: colors.inkSub, fontSize: 10.5 * scale, marginTop: 5, fontFamily },
  filters: { paddingHorizontal: 16, gap: 8, marginBottom: 10 },
  filter: { paddingHorizontal: 15, minHeight: 38, borderRadius: 20, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.line, justifyContent: 'center' },
  filterActive: { backgroundColor: colors.navy, borderColor: colors.navy },
  filterText: { color: colors.inkSub, fontSize: 12 * scale, fontWeight: '700', fontFamily },
  filterTextActive: { color: '#fff' },
  empty: { margin: 16, padding: 28, borderRadius: 18, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.line, alignItems: 'center' },
  emptyTitle: { color: colors.ink, fontSize: 16 * scale, fontWeight: '800', fontFamily },
  emptyText: { color: colors.inkSub, fontSize: 12 * scale, marginTop: 5, fontFamily },
  busy: { position: 'absolute', left: 20, right: 20, bottom: 20, padding: 14, borderRadius: 14, backgroundColor: colors.headerBg, alignItems: 'center' },
  busyText: { color: '#fff', fontFamily, fontWeight: '800' },
});
