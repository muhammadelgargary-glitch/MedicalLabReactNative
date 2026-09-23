// src/screens/SettingsScreen.tsx - إعدادات احترافية مع theme customizer

import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Switch,
  SafeAreaView,
} from 'react-native';
import { useLabStore } from '../store/useLabStore';
import { createTheme, ThemeType } from '../styles/theme';
import { getColors, THEME_PRESETS, ThemeType as ColorThemeType } from '../styles/colors';
import { SPACING, BORDER_RADIUS, SHADOWS } from '../styles/spacing';
import ThemedButton from '../components/ThemedButton';

interface SettingsScreenProps {
  navigation: any;
}

export default function SettingsScreen({ navigation }: SettingsScreenProps) {
  const isDark = useLabStore((s) => s.darkMode);
  const themeType = useLabStore((s) => s.theme);
  const fontSize = useLabStore((s) => s.fontSize);
  const settings = useLabStore((s) => s.settings);
  const toggleDarkMode = useLabStore((s) => s.toggleDarkMode);
  const setTheme = useLabStore((s) => s.setTheme);
  const setFontSize = useLabStore((s) => s.setFontSize);
  const updateSettings = useLabStore((s) => s.updateSettings);

  const colors = getColors(isDark, themeType);
  const styles = createStyles(colors);

  const [centerName, setCenterName] = useState(settings.center);
  const [directorate, setDirectorate] = useState(settings.directorate);

  const handleSaveSettings = async () => {
    await updateSettings({
      center: centerName,
      directorate: directorate,
    });
  };

  return (
    <SafeAreaView style={[styles.container]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* ===== BASIC SETTINGS SECTION ===== */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏥 معلومات المختبر</Text>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>اسم المركز</Text>
            <TextInput
              style={styles.input}
              value={centerName}
              onChangeText={setCenterName}
              placeholder="أدخل اسم المركز"
              placeholderTextColor={colors.inkSub}
            />
          </View>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>الإدارة/الفرع</Text>
            <TextInput
              style={styles.input}
              value={directorate}
              onChangeText={setDirectorate}
              placeholder="أدخل اسم الإدارة"
              placeholderTextColor={colors.inkSub}
            />
          </View>

          <ThemedButton
            title="حفظ المعلومات"
            variant="primary"
            icon="💾"
            onPress={handleSaveSettings}
          />
        </View>

        {/* ===== APPEARANCE SECTION ===== */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎨 تخصيص الواجهة</Text>

          {/* Dark Mode Toggle */}
          <View style={styles.settingItemRow}>
            <View>
              <Text style={styles.settingLabel}>الوضع الليلي</Text>
              <Text style={styles.settingDescription}>تفعيل الألوان الداكنة</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleDarkMode}
              trackColor={{ false: colors.line, true: colors.seal }}
              thumbColor={isDark ? colors.seal : colors.inkSub}
            />
          </View>

          {/* Theme Presets */}
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>ألوان البرنامج الجاهزة</Text>
            <View style={styles.themePresets}>
              {Object.entries(THEME_PRESETS).map(([key, preset]) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.themePresetButton,
                    { backgroundColor: preset.color },
                    themeType === key && styles.themePresetActive,
                  ]}
                  onPress={() => setTheme(key as ColorThemeType)}
                >
                  {themeType === key && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.settingDescription}>
              لون مخصص (اختياري): {themeType}
            </Text>
          </View>

          {/* Font Size */}
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>حجم الخط الإجمالي</Text>
            <View style={styles.fontSizeButtons}>
              {['small', 'medium', 'large'].map((size) => (
                <TouchableOpacity
                  key={size}
                  style={[
                    styles.fontSizeButton,
                    fontSize === size && styles.fontSizeButtonActive,
                  ]}
                  onPress={() => setFontSize(size as 'small' | 'medium' | 'large')}
                >
                  <Text
                    style={[
                      styles.fontSizeButtonText,
                      fontSize === size && styles.fontSizeButtonTextActive,
                    ]}
                  >
                    {size === 'small' ? 'صغير' : size === 'medium' ? 'متوسط' : 'كبير'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.fontSizeValue}>
              الحجم الحالي: {fontSize === 'small' ? 'صغير' : fontSize === 'medium' ? 'متوسط' : 'كبير'}
            </Text>
          </View>

          {/* Display Density */}
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>كثافة عرض البطاقات</Text>
            <View style={styles.densityButtons}>
              {['مريح', 'مضغوط'].map((density) => (
                <TouchableOpacity
                  key={density}
                  style={[styles.densityButton]}
                  onPress={() => {}}
                >
                  <Text style={styles.densityButtonText}>{density}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* ===== ADVANCED SETTINGS SECTION ===== */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚙️ الإعدادات المتقدمة</Text>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>شكل شعار المختبر</Text>
            <View style={styles.logoShapeButtons}>
              {['دائري', 'مربع دائري', 'مربع'].map((shape) => (
                <TouchableOpacity
                  key={shape}
                  style={[styles.logoShapeButton]}
                  onPress={() => {}}
                >
                  <Text style={styles.logoShapeButtonText}>{shape}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>موضع شعار المختبر</Text>
            <View style={styles.logoPositionButtons}>
              {['سياسي', 'عضوي'].map((position) => (
                <TouchableOpacity
                  key={position}
                  style={[styles.logoPositionButton]}
                  onPress={() => {}}
                >
                  <Text style={styles.logoPositionButtonText}>{position}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>حجم شعار المختبر</Text>
            <View style={styles.logoSizeButtons}>
              {['صغير', 'متوسط', 'كبير', 'كبير جداً'].map((size) => (
                <TouchableOpacity
                  key={size}
                  style={[styles.logoSizeButton]}
                  onPress={() => {}}
                >
                  <Text style={styles.logoSizeButtonText}>{size}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Logo Border Toggle */}
          <View style={styles.settingItemRow}>
            <View>
              <Text style={styles.settingLabel}>إظهار إطار حول الشعار</Text>
              <Text style={styles.settingDescription}>إضافة حدود حول الشعار</Text>
            </View>
            <Switch
              value={false}
              onValueChange={() => {}}
              trackColor={{ false: colors.line, true: colors.seal }}
              thumbColor={colors.seal}
            />
          </View>
        </View>

        {/* ===== BACKUP & DATA SECTION ===== */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💾 النسخ الاحتياطي والبيانات</Text>

          <ThemedButton
            title="عمل نسخة احتياطية الآن"
            variant="secondary"
            icon="☁️"
            onPress={() => {}}
          />

          <ThemedButton
            title="استرجاع من النسخة"
            variant="secondary"
            icon="↩️"
            style={{ marginTop: SPACING[2] }}
            onPress={() => {}}
          />

          <ThemedButton
            title="تصدير البيانات"
            variant="secondary"
            icon="📤"
            style={{ marginTop: SPACING[2] }}
            onPress={() => {}}
          />

          <ThemedButton
            title="حذف جميع البيانات"
            variant="danger"
            icon="🗑️"
            style={{ marginTop: SPACING[2] }}
            onPress={() => {}}
          />
        </View>

        {/* ===== INFO SECTION ===== */}
        <View style={[styles.section, styles.infoSection]}>
          <Text style={styles.infoTitle}>📱 معلومات التطبيق</Text>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>الإصدار</Text>
            <Text style={styles.infoValue}>1.0.0</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>آخر تحديث</Text>
            <Text style={styles.infoValue}>23 سبتمبر 2026</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>المطور</Text>
            <Text style={styles.infoValue}>فريق التطوير</Text>
          </View>
        </View>
      </ScrollView>
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
    content: {
      paddingBottom: SPACING[8],
    },

    // ===== Section =====
    section: {
      paddingHorizontal: SPACING[4],
      paddingVertical: SPACING[4],
      borderBottomWidth: 1,
      borderBottomColor: colors.line,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.navy,
      marginBottom: SPACING[4],
      fontFamily: 'Tajawal-Bold',
    },

    // ===== Setting Item =====
    settingItem: {
      marginBottom: SPACING[4],
    },
    settingItemRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: SPACING[3],
      borderBottomWidth: 1,
      borderBottomColor: colors.line,
    },
    settingLabel: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.ink,
      marginBottom: SPACING[1],
      fontFamily: 'Tajawal-Bold',
    },
    settingDescription: {
      fontSize: 12,
      color: colors.inkSub,
      fontFamily: 'Tajawal',
    },

    // ===== Input =====
    input: {
      backgroundColor: colors.panel,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: BORDER_RADIUS.md,
      paddingHorizontal: SPACING[3],
      paddingVertical: SPACING[2],
      color: colors.ink,
      fontSize: 14,
      textAlign: 'right',
      fontFamily: 'Tajawal',
    },

    // ===== Theme Presets =====
    themePresets: {
      flexDirection: 'row',
      gap: SPACING[2],
      marginVertical: SPACING[3],
      justifyContent: 'center',
    },
    themePresetButton: {
      width: 48,
      height: 48,
      borderRadius: 24,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    themePresetActive: {
      borderColor: colors.ink,
      ...SHADOWS.md,
    },
    checkmark: {
      color: '#FFFFFF',
      fontSize: 20,
      fontWeight: '900',
      textAlign: 'center',
      lineHeight: 48,
    },

    // ===== Font Size =====
    fontSizeButtons: {
      flexDirection: 'row',
      gap: SPACING[2],
      marginVertical: SPACING[3],
    },
    fontSizeButton: {
      flex: 1,
      paddingVertical: SPACING[2],
      paddingHorizontal: SPACING[2],
      borderRadius: BORDER_RADIUS.md,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.panel,
      justifyContent: 'center',
      alignItems: 'center',
    },
    fontSizeButtonActive: {
      backgroundColor: colors.seal,
      borderColor: colors.seal,
    },
    fontSizeButtonText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.ink,
      fontFamily: 'Tajawal',
    },
    fontSizeButtonTextActive: {
      color: '#FFFFFF',
      fontWeight: '700',
    },
    fontSizeValue: {
      fontSize: 12,
      color: colors.seal,
      fontWeight: '600',
      marginTop: SPACING[2],
      textAlign: 'center',
      fontFamily: 'Tajawal',
    },

    // ===== Density Buttons =====
    densityButtons: {
      flexDirection: 'row',
      gap: SPACING[2],
      marginVertical: SPACING[3],
    },
    densityButton: {
      flex: 1,
      paddingVertical: SPACING[2],
      borderRadius: BORDER_RADIUS.md,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.panel,
      justifyContent: 'center',
      alignItems: 'center',
    },
    densityButtonText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.ink,
      fontFamily: 'Tajawal',
    },

    // ===== Logo Shape Buttons =====
    logoShapeButtons: {
      flexDirection: 'row',
      gap: SPACING[2],
      marginVertical: SPACING[3],
    },
    logoShapeButton: {
      flex: 1,
      paddingVertical: SPACING[2],
      borderRadius: BORDER_RADIUS.md,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.panel,
      justifyContent: 'center',
      alignItems: 'center',
    },
    logoShapeButtonText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.ink,
      fontFamily: 'Tajawal',
    },

    // ===== Logo Position Buttons =====
    logoPositionButtons: {
      flexDirection: 'row',
      gap: SPACING[2],
      marginVertical: SPACING[3],
    },
    logoPositionButton: {
      flex: 1,
      paddingVertical: SPACING[2],
      borderRadius: BORDER_RADIUS.md,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.panel,
      justifyContent: 'center',
      alignItems: 'center',
    },
    logoPositionButtonText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.ink,
      fontFamily: 'Tajawal',
    },

    // ===== Logo Size Buttons =====
    logoSizeButtons: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: SPACING[2],
      marginVertical: SPACING[3],
    },
    logoSizeButton: {
      flex: 1,
      minWidth: '48%',
      paddingVertical: SPACING[2],
      borderRadius: BORDER_RADIUS.md,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.panel,
      justifyContent: 'center',
      alignItems: 'center',
    },
    logoSizeButtonText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.ink,
      fontFamily: 'Tajawal',
    },

    // ===== Info Section =====
    infoSection: {
      backgroundColor: colors.panel,
      borderRadius: BORDER_RADIUS.lg,
      marginHorizontal: SPACING[4],
      borderWidth: 1,
      borderColor: colors.line,
    },
    infoTitle: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.navy,
      marginBottom: SPACING[3],
      fontFamily: 'Tajawal-Bold',
    },
    infoItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: SPACING[2],
      borderBottomWidth: 1,
      borderBottomColor: colors.line,
    },
    infoLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.inkSub,
      fontFamily: 'Tajawal',
    },
    infoValue: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.ink,
      fontFamily: 'Tajawal-Bold',
    },
  });
 
