// src/screens/StatsScreen.tsx - لوحة الإحصائيات احترافية

import React, { useMemo } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { useLabStore } from '../store/useLabStore';
import { createTheme } from '../styles/theme';
import { getColors } from '../styles/colors';
import { SPACING, BORDER_RADIUS, SHADOWS, FLEX_CENTERS } from '../styles/spacing';
import { StatsCard } from '../components/PatientCard';

interface StatsScreenProps {
  navigation: any;
}

export default function StatsScreen({ navigation }: StatsScreenProps) {
  const patients = useLabStore((s) => s.patients);
  const isDark = useLabStore((s) => s.darkMode);
  const themeType = useLabStore((s) => s.theme);

  const colors = getColors(isDark, themeType);
  const styles = createStyles(colors);

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return {
      totalPatients: patients.length,
      todayPatients: patients.filter((p) => p.date === today).length,
      blood: patients.filter((p) => p.includeBlood).length,
      chemistry: patients.filter((p) => p.includeChem).length,
      urine: patients.filter((p) => p.includeUrine).length,
      serology: patients.filter((p) => p.includeSerology).length,
      stool: patients.filter((p) => p.includeStool).length,
      pregnancy: patients.filter((p) => p.includePreg).length,
      withNotes: patients.filter((p) => p.notes && p.notes.trim()).length,
    };
  }, [patients]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* ===== HEADER ===== */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>📊 الإحصائيات</Text>
          <Text style={styles.headerSubtitle}>ملخص شامل للبيانات</Text>
        </View>

        {/* ===== MAIN STATS ===== */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📈 الإحصائيات الرئيسية</Text>
          <View style={styles.mainStatsGrid}>
            <StatsCard
              title="مرضى اليوم"
              value={stats.todayPatients}
              icon="👤"
              color={colors.navy}
            />
            <StatsCard
              title="إجمالي المرضى"
              value={stats.totalPatients}
              icon="📋"
              color={colors.seal}
            />
          </View>
        </View>

        {/* ===== TEST TYPES ===== */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🧪 توزيع الفحوصات</Text>

          <View style={styles.statsGrid}>
            <StatsCard
              title="فحوصات الدم"
              value={stats.blood}
              icon="🩸"
              color="#D32F2F"
            />
            <StatsCard
              title="كيمياء الدم"
              value={stats.chemistry}
              icon="🧬"
              color="#7B1FA2"
            />
          </View>

          <View style={styles.statsGrid}>
            <StatsCard
              title="تحليل البول"
              value={stats.urine}
              icon="💧"
              color="#0288D1"
            />
            <StatsCard
              title="الأمصال"
              value={stats.serology}
              icon="🧪"
              color="#F57C00"
            />
          </View>

          <View style={styles.statsGrid}>
            <StatsCard
              title="تحليل البراز"
              value={stats.stool}
              icon="🪳"
              color="#6D4C41"
            />
            <StatsCard
              title="اختبارات الحمل"
              value={stats.pregnancy}
              icon="🤰"
              color="#C2185B"
            />
          </View>
        </View>

        {/* ===== DETAILED METRICS ===== */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📑 البيانات التفصيلية</Text>

          <View style={styles.metricItem}>
            <View style={styles.metricInfo}>
              <Text style={styles.metricLabel}>نسبة السجلات مع الملاحظات</Text>
              <Text style={styles.metricDescription}>
                {stats.totalPatients > 0
                  ? ((stats.withNotes / stats.totalPatients) * 100).toFixed(1)
                  : 0}
                %
              </Text>
            </View>
            <ProgressBar
              percentage={
                stats.totalPatients > 0
                  ? (stats.withNotes / stats.totalPatients) * 100
                  : 0
              }
              color={colors.seal}
            />
          </View>

          <View style={styles.metricItem}>
            <View style={styles.metricInfo}>
              <Text style={styles.metricLabel}>متوسط الفحوصات للمريض</Text>
              <Text style={styles.metricDescription}>
                {stats.totalPatients > 0
                  ? (
                      (stats.blood +
                        stats.chemistry +
                        stats.urine +
                        stats.serology +
                        stats.stool +
                        stats.pregnancy) /
                      stats.totalPatients
                    ).toFixed(1)
                  : 0}
              </Text>
            </View>
            <ProgressBar
              percentage={
                stats.totalPatients > 0
                  ? ((stats.blood +
                      stats.chemistry +
                      stats.urine +
                      stats.serology +
                      stats.stool +
                      stats.pregnancy) /
                      (stats.totalPatients * 6)) *
                    100
                  : 0
              }
              color={colors.navy}
            />
          </View>
        </View>

        {/* ===== SUMMARY ===== */}
        <View style={[styles.section, styles.summarySection]}>
          <Text style={styles.sectionTitle}>📝 ملخص</Text>

          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>إجمالي السجلات:</Text>
            <Text style={styles.summaryValue}>{stats.totalPatients}</Text>
          </View>

          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>السجلات اليوم:</Text>
            <Text style={styles.summaryValue}>{stats.todayPatients}</Text>
          </View>

          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>إجمالي الفحوصات:</Text>
            <Text style={styles.summaryValue}>
              {stats.blood +
                stats.chemistry +
                stats.urine +
                stats.serology +
                stats.stool +
                stats.pregnancy}
            </Text>
          </View>

          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>السجلات بملاحظات:</Text>
            <Text style={styles.summaryValue}>{stats.withNotes}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ===== PROGRESS BAR COMPONENT =====
function ProgressBar({ percentage, color }: { percentage: number; color: string }) {
  const colors = getColors(false, 'default');
  return (
    <View style={{ height: 6, backgroundColor: colors.line, borderRadius: 3, overflow: 'hidden' }}>
      <View
        style={{
          height: '100%',
          width: `${Math.min(percentage, 100)}%`,
          backgroundColor: color,
        }}
      />
    </View>
  );
}

// ===== STYLES =====
const createStyles = (colors: ReturnType<typeof getColors>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.paper,
    },
    contentContainer: {
      paddingBottom: SPACING[8],
    },

    // ===== Header =====
    header: {
      backgroundColor: colors.headerBg,
      paddingHorizontal: SPACING[4],
      paddingVertical: SPACING[4],
      marginBottom: SPACING[4],
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: '900',
      color: colors.headerText,
      fontFamily: 'Tajawal-Bold',
    },
    headerSubtitle: {
      fontSize: 13,
      color: colors.headerText,
      opacity: 0.7,
      marginTop: SPACING[1],
      fontFamily: 'Tajawal',
    },

    // ===== Section =====
    section: {
      paddingHorizontal: SPACING[4],
      marginBottom: SPACING[6],
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.navy,
      marginBottom: SPACING[4],
      fontFamily: 'Tajawal-Bold',
    },

    // ===== Main Stats Grid =====
    mainStatsGrid: {
      flexDirection: 'row',
      gap: SPACING[2],
      marginBottom: SPACING[2],
    },

    // ===== Stats Grid =====
    statsGrid: {
      flexDirection: 'row',
      gap: SPACING[2],
      marginBottom: SPACING[3],
    },

    // ===== Metric Item =====
    metricItem: {
      backgroundColor: colors.panel,
      borderRadius: BORDER_RADIUS.lg,
      padding: SPACING[4],
      marginBottom: SPACING[3],
      borderWidth: 1,
      borderColor: colors.line,
    },
    metricInfo: {
      marginBottom: SPACING[2],
    },
    metricLabel: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.ink,
      fontFamily: 'Tajawal-Bold',
      marginBottom: SPACING[1],
    },
    metricDescription: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.navy,
      fontFamily: 'Tajawal-Bold',
    },

    // ===== Summary Section =====
    summarySection: {
      backgroundColor: colors.panel,
      borderRadius: BORDER_RADIUS.lg,
      paddingHorizontal: SPACING[4],
      paddingVertical: SPACING[4],
      borderWidth: 1,
      borderColor: colors.line,
      ...SHADOWS.sm,
    },
    summaryItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: SPACING[2],
      borderBottomWidth: 1,
      borderBottomColor: colors.line,
    },
    summaryLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.inkSub,
      fontFamily: 'Tajawal',
    },
    summaryValue: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.navy,
      fontFamily: 'Tajawal-Bold',
    },
  });
 
