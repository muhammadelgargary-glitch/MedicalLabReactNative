// src/screens/HomeScreen.tsx - شاشة رئيسية احترافية

import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { useLabStore, Patient } from '../store/useLabStore';
import { createTheme } from '../styles/theme';
import { getColors } from '../styles/colors';
import { SPACING, BORDER_RADIUS, SHADOWS, FLEX_CENTERS } from '../styles/spacing';
import { StatsCard } from '../components/PatientCard';
import ThemedButton from '../components/ThemedButton';
import { PatientCard } from '../components/PatientCard';

interface HomeScreenProps {
  navigation: any;
}

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const patients = useLabStore((s) => s.patients);
  const settings = useLabStore((s) => s.settings);
  const isDark = useLabStore((s) => s.darkMode);
  const themeType = useLabStore((s) => s.theme);

  const [searchQuery, setSearchQuery] = useState('');
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>(patients);

  const colors = getColors(isDark, themeType);
  const theme = createTheme(isDark, themeType);
  const styles = createStyles(colors);

  useEffect(() => {
    const filtered = patients.filter(
      (p) =>
        p.name.includes(searchQuery) ||
        p.seq.includes(searchQuery) ||
        p.id.includes(searchQuery)
    );
    setFilteredPatients(filtered);
  }, [searchQuery, patients]);

  const getStats = () => {
    return {
      today: patients.filter((p) => p.date === new Date().toISOString().split('T')[0]).length,
      total: patients.length,
      blood: patients.filter((p) => p.includeBlood).length,
      chem: patients.filter((p) => p.includeChem).length,
      urine: patients.filter((p) => p.includeUrine).length,
      serology: patients.filter((p) => p.includeSerology).length,
      stool: patients.filter((p) => p.includeStool).length,
      preg: patients.filter((p) => p.includePreg).length,
    };
  };

  const stats = getStats();

  const navigationItems = [
    { icon: '👤', label: 'مريض جديد', action: () => navigation.navigate('PatientForm') },
    { icon: '⚙️', label: 'الإعدادات', action: () => navigation.navigate('Settings') },
    { icon: '💰', label: 'التمويل', action: () => {} },
    { icon: '📁', label: 'الملفات', action: () => {} },
    { icon: '📋', label: 'التقارير', action: () => navigation.navigate('Stats') },
    { icon: '📊', label: 'الإحصائيات', action: () => navigation.navigate('Stats') },
    { icon: '🎨', label: 'التخصيص', action: () => navigation.navigate('Settings') },
    { icon: '🌙', label: 'الوضع الليلي', action: () => {} },
  ];

  return (
    <SafeAreaView style={[styles.container]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* ===== HEADER ===== */}
        <View style={styles.headerContainer}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>{settings.center || 'مختبري'}</Text>
            <Text style={styles.headerSubtitle}>معلومات المختبر</Text>
          </View>
          <TouchableOpacity style={styles.headerLogo}>
            <Text style={styles.logoText}>🧪 LAB</Text>
          </TouchableOpacity>
        </View>

        {/* ===== NAVIGATION PILLS ===== */}
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          data={navigationItems}
          keyExtractor={(item) => item.label}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.navPill, { marginRight: SPACING[2] }]}
              onPress={item.action}
            >
              <Text style={styles.navPillIcon}>{item.icon}</Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.navPillsContainer}
        />

        {/* ===== SEARCH BAR ===== */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="بحث باسم أو رقم السجل أو الفحص"
            placeholderTextColor={colors.inkSub}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity style={styles.searchButton}>
            <Text style={styles.searchIcon}>🔍</Text>
          </TouchableOpacity>
        </View>

        {/* ===== ACTION BUTTONS ===== */}
        <View style={styles.actionGrid}>
          <ThemedButton
            title="+ إضافة مريض"
            variant="primary"
            size="lg"
            icon="➕"
            onPress={() => navigation.navigate('PatientForm')}
          />
          <ThemedButton
            title="قيد الإنجاز"
            variant="secondary"
            size="lg"
            icon="✏️"
            onPress={() => {}}
          />
        </View>

        {/* ===== EXPORT BUTTONS ===== */}
        <View style={styles.exportGrid}>
          <ThemedButton
            title="تصدير الكل Excel"
            variant="success"
            icon="📊"
            fullWidth={false}
            style={{ flex: 1 }}
          />
          <ThemedButton
            title="طباعة عدة تقارير"
            variant="secondary"
            icon="🖨️"
            fullWidth={false}
            style={{ flex: 1 }}
          />
        </View>

        <View style={styles.exportGrid}>
          <ThemedButton
            title="تصدير الكل PDF"
            variant="primary"
            icon="📄"
            fullWidth={false}
            style={{ flex: 1 }}
          />
          <ThemedButton
            title="البيانات محفوظة"
            variant="secondary"
            icon="✅"
            fullWidth={false}
            style={{ flex: 1 }}
          />
        </View>

        {/* ===== QUICK STATS ===== */}
        <View style={styles.statsHeader}>
          <Text style={styles.statsTitle}>إحصائيات سريعة</Text>
        </View>

        <View style={styles.statsGrid}>
          <StatsCard
            title="مرضى اليوم"
            value={stats.today}
            icon="👤"
            color={colors.navy}
          />
          <StatsCard
            title="إجمالي المرضى"
            value={stats.total}
            icon="📋"
            color={colors.seal}
          />
        </View>

        <View style={styles.statsGrid}>
          <StatsCard
            title="فحوصات الدم"
            value={stats.blood}
            icon="🩸"
            color="#D32F2F"
          />
          <StatsCard
            title="فحوصات كيمياء"
            value={stats.chem}
            icon="🧬"
            color="#7B1FA2"
          />
        </View>

        <View style={styles.statsGrid}>
          <StatsCard
            title="فحوصات البول"
            value={stats.urine}
            icon="💧"
            color="#0288D1"
          />
          <StatsCard
            title="فحوصات الأمصال"
            value={stats.serology}
            icon="🧪"
            color="#F57C00"
          />
        </View>

        <View style={styles.statsGrid}>
          <StatsCard
            title="فحوصات البراز"
            value={stats.stool}
            icon="🪳"
            color="#6D4C41"
          />
          <StatsCard
            title="اختبارات الحمل"
            value={stats.preg}
            icon="🤰"
            color="#C2185B"
          />
        </View>

        {/* ===== FILTER SECTION ===== */}
        <View style={styles.filterSection}>
          <ThemedButton
            title="جميع السجلات"
            variant="primary"
            size="sm"
            style={{ marginRight: SPACING[2] }}
          />
          <ThemedButton
            title="سجلات اليوم"
            variant="secondary"
            size="sm"
            style={{ marginRight: SPACING[2] }}
          />
          <ThemedButton
            title="دم"
            variant="secondary"
            size="sm"
            style={{ marginRight: SPACING[2] }}
          />
          <ThemedButton
            title="كيمياء"
            variant="secondary"
            size="sm"
          />
        </View>

        {/* ===== PATIENTS LIST ===== */}
        <View style={styles.patientsHeader}>
          <Text style={styles.patientsTitle}>السجلات ({filteredPatients.length})</Text>
          <Text style={styles.patientsSubtitle}>اسحب لليسار للخيارات</Text>
        </View>

        {filteredPatients.length > 0 ? (
          filteredPatients.map((patient) => (
            <PatientCard
              key={patient.id}
              patient={patient}
              onPress={() => navigation.navigate('PatientReport', { id: patient.id })}
            />
          ))
        ) : (
          <View style={[styles.emptyState, FLEX_CENTERS.center]}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyText}>لا توجد سجلات</Text>
            <ThemedButton
              title="إضافة مريض جديد"
              variant="primary"
              size="lg"
              style={{ marginTop: SPACING[4], width: '80%' }}
              onPress={() => navigation.navigate('PatientForm')}
            />
          </View>
        )}
      </ScrollView>

      {/* ===== FAB - FLOATING ACTION BUTTON ===== */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.seal }]}
        onPress={() => navigation.navigate('PatientForm')}
      >
        <Text style={styles.fabIcon}>➕</Text>
      </TouchableOpacity>
    </SafeAreaView>
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
      paddingBottom: SPACING[12],
    },

    // ===== Header =====
    headerContainer: {
      backgroundColor: colors.headerBg,
      paddingHorizontal: SPACING[4],
      paddingVertical: SPACING[4],
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: SPACING[4],
    },
    headerContent: {
      flex: 1,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: '900',
      color: colors.headerText,
      fontFamily: 'Tajawal-Bold',
    },
    headerSubtitle: {
      fontSize: 12,
      color: colors.headerText,
      opacity: 0.8,
      marginTop: SPACING[1],
      fontFamily: 'Tajawal',
    },
    headerLogo: {
      backgroundColor: colors.seal,
      paddingHorizontal: SPACING[3],
      paddingVertical: SPACING[2],
      borderRadius: BORDER_RADIUS.lg,
    },
    logoText: {
      fontSize: 14,
      fontWeight: '900',
      color: '#FFFFFF',
      fontFamily: 'Tajawal-Bold',
    },

    // ===== Navigation Pills =====
    navPillsContainer: {
      paddingHorizontal: SPACING[4],
      paddingBottom: SPACING[3],
      gap: SPACING[2],
    },
    navPill: {
      width: 54,
      height: 54,
      borderRadius: BORDER_RADIUS['3xl'],
      backgroundColor: colors.panel,
      borderWidth: 1,
      borderColor: colors.line,
      ...FLEX_CENTERS.center,
      ...SHADOWS.sm,
    },
    navPillIcon: {
      fontSize: 28,
    },

    // ===== Search Bar =====
    searchContainer: {
      flexDirection: 'row',
      paddingHorizontal: SPACING[4],
      marginBottom: SPACING[4],
      gap: SPACING[2],
      alignItems: 'center',
    },
    searchInput: {
      flex: 1,
      backgroundColor: colors.panel,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: BORDER_RADIUS.lg,
      paddingHorizontal: SPACING[3],
      paddingVertical: SPACING[2],
      color: colors.ink,
      fontSize: 14,
      textAlign: 'right',
      fontFamily: 'Tajawal',
    },
    searchButton: {
      width: 44,
      height: 44,
      borderRadius: BORDER_RADIUS.lg,
      backgroundColor: colors.seal,
      ...FLEX_CENTERS.center,
    },
    searchIcon: {
      fontSize: 20,
    },

    // ===== Action Grid =====
    actionGrid: {
      paddingHorizontal: SPACING[4],
      gap: SPACING[2],
      marginBottom: SPACING[4],
    },

    // ===== Export Grid =====
    exportGrid: {
      flexDirection: 'row',
      paddingHorizontal: SPACING[4],
      gap: SPACING[2],
      marginBottom: SPACING[3],
    },

    // ===== Stats =====
    statsHeader: {
      paddingHorizontal: SPACING[4],
      marginBottom: SPACING[3],
      marginTop: SPACING[2],
    },
    statsTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.ink,
      fontFamily: 'Tajawal-Bold',
    },
    statsGrid: {
      flexDirection: 'row',
      paddingHorizontal: SPACING[2],
      marginBottom: SPACING[2],
      gap: SPACING[2],
    },

    // ===== Filter Section =====
    filterSection: {
      flexDirection: 'row',
      paddingHorizontal: SPACING[4],
      marginVertical: SPACING[4],
      gap: SPACING[2],
      borderBottomWidth: 1,
      borderBottomColor: colors.line,
      paddingBottom: SPACING[4],
    },

    // ===== Patients List =====
    patientsHeader: {
      paddingHorizontal: SPACING[4],
      marginBottom: SPACING[3],
      marginTop: SPACING[4],
    },
    patientsTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.ink,
      fontFamily: 'Tajawal-Bold',
    },
    patientsSubtitle: {
      fontSize: 11,
      color: colors.inkSub,
      marginTop: SPACING[1],
      fontFamily: 'Tajawal',
    },

    // ===== Empty State =====
    emptyState: {
      paddingVertical: SPACING[12],
    },
    emptyIcon: {
      fontSize: 56,
      marginBottom: SPACING[3],
    },
    emptyText: {
      fontSize: 16,
      color: colors.inkSub,
      fontFamily: 'Tajawal',
      marginBottom: SPACING[4],
    },

    // ===== FAB =====
    fab: {
      position: 'absolute',
      bottom: SPACING[4],
      right: SPACING[4],
      width: 56,
      height: 56,
      borderRadius: 28,
      ...FLEX_CENTERS.center,
      ...SHADOWS.lg,
    },
    fabIcon: {
      fontSize: 28,
    },
  });
 
