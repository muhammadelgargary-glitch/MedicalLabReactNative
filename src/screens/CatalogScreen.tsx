// src/screens/CatalogScreen.tsx - عرض قائمة المرضى احترافي

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useLabStore, Patient } from '../store/useLabStore';
import { createTheme } from '../styles/theme';
import { getColors } from '../styles/colors';
import { SPACING, BORDER_RADIUS, SHADOWS } from '../styles/spacing';
import { PatientCard } from '../components/PatientCard';
import ThemedButton from '../components/ThemedButton';

interface CatalogScreenProps {
  navigation: any;
}

export default function CatalogScreen({ navigation }: CatalogScreenProps) {
  const patients = useLabStore((s) => s.patients);
  const isDark = useLabStore((s) => s.darkMode);
  const themeType = useLabStore((s) => s.theme);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const colors = getColors(isDark, themeType);
  const styles = createStyles(colors);

  useFocusEffect(
    useCallback(() => {
      // Refresh when screen is focused
    }, [])
  );

  const filteredPatients = patients.filter((p) => {
    const matchesSearch =
      p.name.includes(searchQuery) || p.seq.includes(searchQuery) || p.id.includes(searchQuery);

    if (!filterType) return matchesSearch;

    switch (filterType) {
      case 'blood':
        return matchesSearch && p.includeBlood;
      case 'chem':
        return matchesSearch && p.includeChem;
      case 'urine':
        return matchesSearch && p.includeUrine;
      case 'serology':
        return matchesSearch && p.includeSerology;
      case 'stool':
        return matchesSearch && p.includeStool;
      case 'preg':
        return matchesSearch && p.includePreg;
      default:
        return matchesSearch;
    }
  });

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const filters = [
    { id: null, label: 'الكل', icon: '📋' },
    { id: 'blood', label: 'دم', icon: '🩸' },
    { id: 'chem', label: 'كيمياء', icon: '🧬' },
    { id: 'urine', label: 'بول', icon: '💧' },
    { id: 'serology', label: 'أمصال', icon: '🧪' },
    { id: 'stool', label: 'براز', icon: '🪳' },
    { id: 'preg', label: 'حمل', icon: '🤰' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* ===== HEADER ===== */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>السجلات الطبية</Text>
        <Text style={styles.headerSubtitle}>({filteredPatients.length} سجل)</Text>
      </View>

      {/* ===== SEARCH BAR ===== */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="بحث باسم أو رقم السجل"
          placeholderTextColor={colors.inkSub}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity style={styles.searchButton}>
          <Text style={styles.searchIcon}>🔍</Text>
        </TouchableOpacity>
      </View>

      {/* ===== FILTER CHIPS ===== */}
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        data={filters}
        keyExtractor={(item) => String(item.id || 'all')}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.filterChip,
              filterType === item.id && styles.filterChipActive,
            ]}
            onPress={() => setFilterType(item.id)}
          >
            <Text style={styles.filterChipIcon}>{item.icon}</Text>
            <Text
              style={[
                styles.filterChipText,
                filterType === item.id && styles.filterChipTextActive,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.filterChipsContainer}
      />

      {/* ===== PATIENTS LIST ===== */}
      {filteredPatients.length > 0 ? (
        <FlatList
          data={filteredPatients}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.patientListItem}>
              <PatientCard
                patient={item}
                onPress={() => navigation.navigate('PatientReport', { id: item.id })}
              />
            </View>
          )}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyText}>
            {searchQuery
              ? 'لا توجد نتائج للبحث'
              : filterType
                ? 'لا توجد سجلات لهذا النوع'
                : 'لا توجد سجلات حتى الآن'}
          </Text>
          <ThemedButton
            title="إضافة سجل جديد"
            variant="primary"
            size="lg"
            icon="➕"
            style={{ marginTop: SPACING[4], width: '80%' }}
            onPress={() => navigation.navigate('PatientForm')}
          />
        </View>
      )}

      {/* ===== FAB =====  */}
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

    // ===== Header =====
    header: {
      backgroundColor: colors.headerBg,
      paddingHorizontal: SPACING[4],
      paddingVertical: SPACING[4],
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

    // ===== Search =====
    searchContainer: {
      flexDirection: 'row',
      paddingHorizontal: SPACING[4],
      paddingVertical: SPACING[3],
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
      justifyContent: 'center',
      alignItems: 'center',
    },
    searchIcon: {
      fontSize: 20,
    },

    // ===== Filter Chips =====
    filterChipsContainer: {
      paddingHorizontal: SPACING[4],
      paddingVertical: SPACING[2],
      gap: SPACING[2],
    },
    filterChip: {
      flexDirection: 'row',
      paddingHorizontal: SPACING[3],
      paddingVertical: SPACING[2],
      borderRadius: BORDER_RADIUS.full,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.panel,
      gap: SPACING[1],
      alignItems: 'center',
    },
    filterChipActive: {
      backgroundColor: colors.seal,
      borderColor: colors.seal,
    },
    filterChipIcon: {
      fontSize: 14,
    },
    filterChipText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.ink,
      fontFamily: 'Tajawal',
    },
    filterChipTextActive: {
      color: '#FFFFFF',
      fontWeight: '700',
    },

    // ===== List =====
    listContent: {
      paddingHorizontal: SPACING[4],
      paddingVertical: SPACING[2],
      paddingBottom: SPACING[12],
    },
    patientListItem: {
      marginVertical: SPACING[1],
    },

    // ===== Empty State =====
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
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
      justifyContent: 'center',
      alignItems: 'center',
      ...SHADOWS.lg,
    },
    fabIcon: {
      fontSize: 28,
    },
  });
 
