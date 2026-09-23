// src/screens/PatientReportScreen.tsx - إعادة تصميم كامل

import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLabStore, Patient } from '../store/useLabStore';
import { TEST_SECTIONS, SECTION_KEYS, SectionKey } from '../utils/constants';
import { exportPatientPdf, printPatient } from '../services/exportService';
import { displayDate } from '../utils/helpers';
import { createTheme } from '../styles/theme';
import { getColors, TAG_COLORS } from '../styles/colors';
import { SPACING, BORDER_RADIUS, SHADOWS } from '../styles/spacing';

interface PatientReportScreenProps {
  route: {
    params?: {
      id?: string;
    };
  };
}

export default function PatientReportScreen({ route }: PatientReportScreenProps) {
  const patientId = route.params?.id;
  const patients = useLabStore((s) => s.patients);
  const settings = useLabStore((s) => s.settings);
  const isDark = useLabStore((s) => s.darkMode);
  const themeType = useLabStore((s) => s.theme);

  const patient = patients.find((p) => p.id === patientId);
  const [loadingPDF, setLoadingPDF] = useState(false);
  const [loadingPrint, setLoadingPrint] = useState(false);

  const colors = getColors(isDark, themeType);
  const theme = createTheme(isDark, themeType);
  const styles = createStyles(colors);

  if (!patient) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.errorText}>السجل غير موجود</Text>
      </View>
    );
  }

  const handleExportPDF = async () => {
    try {
      setLoadingPDF(true);
      await exportPatientPdf(patient, settings, settings.printSettings || {});
      Alert.alert('تم', 'تم إنشاء ومشاركة ملف PDF بنجاح');
    } catch (error: any) {
      Alert.alert('خطأ', error.message || 'فشل إنشاء الـ PDF');
    } finally {
      setLoadingPDF(false);
    }
  };

  const handlePrint = async () => {
    try {
      setLoadingPrint(true);
      await printPatient(patient, settings, settings.printSettings || {});
      Alert.alert('تم', 'تم إرسال التقرير للطابعة');
    } catch (error: any) {
      Alert.alert('خطأ', error.message || 'فشل الطباعة');
    } finally {
      setLoadingPrint(false);
    }
  };

  const getActiveSections = () => {
    return SECTION_KEYS.filter((k) => patient[`include${k}`]);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* ===== HEADER SECTION ===== */}
      <View style={styles.headerSection}>
        <Text style={styles.headerTitle}>{settings.center || 'مختبري'}</Text>
        <Text style={styles.headerSubtitle}>
          {settings.directorate || 'الإدارة'}
        </Text>

        <View style={styles.divider} />

        <Text style={styles.reportTitle}>تقرير الفحوصات المخبرية</Text>
      </View>

      {/* ===== PATIENT INFO CARD ===== */}
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>اسم المريض:</Text>
          <Text style={styles.infoValue}>{patient.name}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>رقم السجل:</Text>
          <Text style={styles.infoValue}>{patient.seq}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>النوع:</Text>
          <Text style={styles.infoValue}>{patient.gender}</Text>

          <View style={styles.spacer} />

          <Text style={styles.infoLabel}>العمر:</Text>
          <Text style={styles.infoValue}>{patient.age}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>التاريخ:</Text>
          <Text style={styles.infoValue}>{displayDate(patient.date)}</Text>
        </View>
      </View>

      {/* ===== TEST SECTIONS ===== */}
      {getActiveSections().length > 0 ? (
        getActiveSections().map((sectionKey: SectionKey) => (
          <TestSection key={sectionKey} sectionKey={sectionKey} patient={patient} colors={colors} />
        ))
      ) : (
        <View style={styles.emptySection}>
          <Text style={styles.emptyText}>لا توجد فحوصات مسجلة</Text>
        </View>
      )}

      {/* ===== NOTES SECTION ===== */}
      {patient.notes && (
        <View style={styles.notesCard}>
          <Text style={styles.notesLabel}>ملاحظات:</Text>
          <Text style={styles.notesText}>{patient.notes}</Text>
        </View>
      )}

      {/* ===== FOOTER ===== */}
      <View style={styles.footerSection}>
        <Text style={styles.footerText}>مع تمنياتنا بالصحة والعافية</Text>
      </View>

      {/* ===== ACTION BUTTONS ===== */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.pdfButton]}
          onPress={handleExportPDF}
          disabled={loadingPDF}
        >
          {loadingPDF ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.actionButtonText}>📄 إنشاء ومشاركة PDF</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.printButton]}
          onPress={handlePrint}
          disabled={loadingPrint}
        >
          {loadingPrint ? (
            <ActivityIndicator color={colors.seal} />
          ) : (
            <Text style={[styles.actionButtonText, { color: colors.seal }]}>🖨️ طباعة مباشرة</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// ===== TEST SECTION COMPONENT =====
function TestSection({
  sectionKey,
  patient,
  colors,
}: {
  sectionKey: SectionKey;
  patient: Patient;
  colors: ReturnType<typeof getColors>;
}) {
  const section = TEST_SECTIONS[sectionKey];
  const testData = patient[section.dataKey] || {};
  const tagColor = TAG_COLORS[sectionKey.toLowerCase() as keyof typeof TAG_COLORS];

  const styles = createTestSectionStyles(colors);

  // Filter fields that have values
  const fieldsWithValues = section.fields.filter(
    (field) => String(testData[field.key] ?? '').trim() !== ''
  );

  if (fieldsWithValues.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <View style={[styles.sectionHeader, { backgroundColor: colors.seal }]}>
        <Text style={styles.sectionTitle}>
          {section.icon} {section.label}
        </Text>
      </View>

      <View style={styles.tableWrapper}>
        {/* Table Header */}
        <View style={[styles.tableRow, styles.tableHeader]}>
          <Text style={[styles.tableCell, styles.headerCell, { color: '#FFFFFF' }]}>الفحص</Text>
          <Text style={[styles.tableCell, styles.headerCell, { color: '#FFFFFF' }]}>النتيجة</Text>
          <Text
            style={[styles.tableCell, styles.headerCell, { textAlign: 'left', color: '#FFFFFF' }]}
          >
            المعدل الطبيعي
          </Text>
        </View>

        {/* Table Rows */}
        {fieldsWithValues.map((field, index) => (
          <View key={field.key} style={[styles.tableRow, index % 2 === 0 && styles.alternateRow]}>
            <Text style={[styles.tableCell, styles.testName]}>{field.label}</Text>
            <Text style={[styles.tableCell, styles.testValue]}>{testData[field.key]}</Text>
            <Text style={[styles.tableCell, styles.testNormal]}>{field.normal}</Text>
          </View>
        ))}
      </View>
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
      padding: SPACING[4],
      paddingBottom: SPACING[12],
    },
    errorText: {
      fontSize: 16,
      color: colors.danger,
      fontWeight: '600',
      fontFamily: 'Tajawal',
    },

    // ===== Header =====
    headerSection: {
      backgroundColor: colors.panel,
      borderRadius: BORDER_RADIUS.lg,
      padding: SPACING[4],
      marginBottom: SPACING[4],
      borderWidth: 1,
      borderColor: colors.line,
      ...SHADOWS.sm,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: '900',
      color: colors.navy,
      textAlign: 'center',
      fontFamily: 'Tajawal-Bold',
    },
    headerSubtitle: {
      fontSize: 13,
      color: colors.inkSub,
      textAlign: 'center',
      marginTop: 2,
      fontFamily: 'Tajawal',
    },
    divider: {
      height: 1,
      backgroundColor: colors.line,
      marginVertical: SPACING[4],
    },
    reportTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: colors.navy,
      textAlign: 'center',
      fontFamily: 'Tajawal-Bold',
      marginTop: SPACING[2],
    },

    // ===== Info Card =====
    infoCard: {
      backgroundColor: colors.panel,
      borderRadius: BORDER_RADIUS.lg,
      padding: SPACING[4],
      marginBottom: SPACING[4],
      borderWidth: 1,
      borderColor: colors.line,
      ...SHADOWS.sm,
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'center',
      paddingVertical: SPACING[2],
      borderBottomWidth: 1,
      borderBottomColor: colors.line,
    },
    infoLabel: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.inkSub,
      marginRight: SPACING[2],
      fontFamily: 'Tajawal-Bold',
    },
    infoValue: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.ink,
      fontFamily: 'Tajawal-Bold',
    },
    spacer: {
      flex: 1,
    },

    // ===== Empty State =====
    emptySection: {
      paddingVertical: SPACING[8],
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyText: {
      fontSize: 16,
      color: colors.inkSub,
      fontFamily: 'Tajawal',
    },

    // ===== Notes =====
    notesCard: {
      backgroundColor: colors.panel,
      borderRadius: BORDER_RADIUS.lg,
      padding: SPACING[4],
      marginBottom: SPACING[4],
      borderWidth: 1,
      borderColor: colors.line,
    },
    notesLabel: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.navy,
      marginBottom: SPACING[2],
      fontFamily: 'Tajawal-Bold',
    },
    notesText: {
      fontSize: 14,
      color: colors.ink,
      lineHeight: 22,
      textAlign: 'right',
      fontFamily: 'Tajawal',
    },

    // ===== Footer =====
    footerSection: {
      paddingVertical: SPACING[6],
      borderTopWidth: 1,
      borderTopColor: colors.line,
      marginBottom: SPACING[4],
    },
    footerText: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.inkSub,
      textAlign: 'center',
      fontFamily: 'Tajawal-Bold',
    },

    // ===== Actions =====
    actionsContainer: {
      gap: SPACING[3],
      marginBottom: SPACING[4],
    },
    actionButton: {
      paddingVertical: SPACING[3],
      borderRadius: BORDER_RADIUS.lg,
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: 48,
    },
    pdfButton: {
      backgroundColor: colors.navy,
    },
    printButton: {
      backgroundColor: colors.panel,
      borderWidth: 1,
      borderColor: colors.seal,
    },
    actionButtonText: {
      fontSize: 16,
      fontWeight: '800',
      color: '#FFFFFF',
      fontFamily: 'Tajawal-Bold',
    },
  });

const createTestSectionStyles = (colors: ReturnType<typeof getColors>) =>
  StyleSheet.create({
    section: {
      marginBottom: SPACING[4],
      borderRadius: BORDER_RADIUS.lg,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.panel,
      ...SHADOWS.sm,
    },
    sectionHeader: {
      paddingHorizontal: SPACING[4],
      paddingVertical: SPACING[3],
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: '#FFFFFF',
      textAlign: 'right',
      fontFamily: 'Tajawal-Bold',
    },
    tableWrapper: {
      borderTopWidth: 1,
      borderTopColor: colors.line,
    },
    tableRow: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: colors.line,
      minHeight: 44,
    },
    tableHeader: {
      backgroundColor: colors.navy,
    },
    alternateRow: {
      backgroundColor: colors.paper,
    },
    tableCell: {
      flex: 1,
      paddingHorizontal: SPACING[2],
      paddingVertical: SPACING[2],
      fontSize: 12,
      fontFamily: 'Tajawal',
    },
    headerCell: {
      fontWeight: '800',
      fontFamily: 'Tajawal-Bold',
      textAlign: 'right',
    },
    testName: {
      fontWeight: '700',
      color: colors.ink,
      textAlign: 'right',
      flex: 1.5,
    },
    testValue: {
      fontWeight: '700',
      color: colors.navy,
      textAlign: 'center',
      flex: 1,
    },
    testNormal: {
      color: colors.inkSub,
      textAlign: 'left',
      fontSize: 11,
      flex: 1,
    },
  });
