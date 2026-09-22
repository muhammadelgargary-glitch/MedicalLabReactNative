import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Platform,
  Alert
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useLabStore } from '../store/useLabStore';
import { PALETTE, SHADOWS } from '../utils/constants';
import { exportToPdfAndShare, printReport } from '../services/exportService';

export const PatientReportScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { patientId } = route.params || {};

  const { patients, settings, themeMode } = useLabStore();
  const isDark = themeMode === 'dark';
  const colors = isDark ? PALETTE.dark : PALETTE.light;

  const patient = patients.find((p) => p.id === patientId);

  if (!patient) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.notFoundContainer}>
          <Text style={[styles.notFoundText, { color: colors.textPrimary }]}>المريض غير موجود</Text>
          <TouchableOpacity style={[styles.btn, { backgroundColor: colors.primary }]} onPress={() => navigation.goBack()}>
            <Text style={styles.btnText}>الرجوع</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handlePrint = async () => {
    try {
      await printReport(patient, settings);
    } catch (e: any) {
      Alert.alert('خطأ', 'تعذر إرسال التقرير للطباعة');
    }
  };

  const handleExportPDF = async () => {
    try {
      await exportToPdfAndShare(patient, settings);
    } catch (e: any) {
      Alert.alert('خطأ', 'تعذر إنشاء ملف PDF');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Action Header */}
      <View style={[styles.actionBar, { backgroundColor: colors.card, borderBottomColor: colors.cardBorder }]}>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.primary }]} onPress={handlePrint}>
          <Text style={styles.actionBtnText}>🖨️ طباعة</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.accent }]} onPress={handleExportPDF}>
          <Text style={styles.actionBtnText}>📄 تصدير PDF</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.cardBorder }]} onPress={() => navigation.goBack()}>
          <Text style={[styles.actionBtnText, { color: colors.textPrimary }]}>إغلاق</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Medical Paper Simulation */}
        <View style={[styles.paper, SHADOWS.md, { backgroundColor: '#ffffff', borderColor: '#cbd5e1' }]}>
          
          {/* Header Section */}
          <View style={styles.paperHeader}>
            {settings.logoUri ? (
              <Image source={{ uri: settings.logoUri }} style={styles.logo} resizeMode="contain" />
            ) : null}
            <View style={styles.headerTitleContainer}>
              <Text style={styles.labNameAr}>{settings.labName || 'مختبر التحليلات الطبية'}</Text>
              <Text style={styles.labNameEn}>{settings.labNameEn || 'Medical Laboratory'}</Text>
              <Text style={styles.labSubText}>{settings.subTitle || 'تشخيص دقيق .. رعاية متكاملة'}</Text>
            </View>
          </View>

          <View style={styles.dividerDouble} />

          {/* Patient Details Grid */}
          <View style={styles.patientInfoBox}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>اسم المريض:</Text>
              <Text style={styles.infoValue}>{patient.name}</Text>
              <Text style={styles.infoLabel}>العمر / الجنس:</Text>
              <Text style={styles.infoValue}>{patient.age} سنة / {patient.gender === 'male' ? 'ذكر' : 'أنثى'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>تاريخ الفحص:</Text>
              <Text style={styles.infoValue}>{patient.createdAt ? new Date(patient.createdAt).toLocaleDateString('ar-IQ') : '-'}</Text>
              <Text style={styles.infoLabel}>الطبيب المعالج:</Text>
              <Text style={styles.infoValue}>{patient.doctorName || 'الدكتور المحول'}</Text>
            </View>
          </View>

          {/* Tests Table */}
          <View style={styles.tableContainer}>
            <View style={styles.tableHeader}>
              <Text style={[styles.th, { flex: 2 }]}>اسم الفحص / Test Name</Text>
              <Text style={[styles.th, { flex: 1.2 }]}>النتيجة / Result</Text>
              <Text style={[styles.th, { flex: 1 }]}>الوحدة / Unit</Text>
              <Text style={[styles.th, { flex: 1.8 }]}>المعدل الطبيعي / Normal Range</Text>
            </View>

            {patient.tests && patient.tests.length > 0 ? (
              patient.tests.map((test, index) => {
                const isAbnormal = test.isAbnormal;
                return (
                  <View key={test.id || index.toString()} style={[styles.tableRow, index % 2 === 1 && styles.tableRowEven]}>
                    <Text style={[styles.td, styles.tdName, { flex: 2 }]}>{test.name}</Text>
                    <Text style={[styles.td, styles.tdResult, isAbnormal && styles.abnormalText, { flex: 1.2 }]}>
                      {test.result} {isAbnormal ? ' ⚠️' : ''}
                    </Text>
                    <Text style={[styles.td, { flex: 1 }]}>{test.unit || '-'}</Text>
                    <Text style={[styles.td, { flex: 1.8 }]}>{test.normalRange || '-'}</Text>
                  </View>
                );
              })
            ) : (
              <View style={styles.noTestsRow}>
                <Text style={styles.noTestsText}>لا توجد نتائج فحوصات مسجلة لهذا المريض.</Text>
              </View>
            )}
          </View>

          {/* Report Footer */}
          {patient.notes ? (
            <View style={styles.notesSection}>
              <Text style={styles.notesTitle}>ملاحظات الفحص:</Text>
              <Text style={styles.notesText}>{patient.notes}</Text>
            </View>
          ) : null}

          <View style={styles.paperFooter}>
            <View style={styles.signatureBox}>
              <Text style={styles.signatureTitle}>توقيع وتصديق المختبر</Text>
              <Text style={styles.signatureSub}>Approved By Laboratory Director</Text>
            </View>
            <View style={styles.contactFooter}>
              <Text style={styles.contactText}>{settings.address || 'العنوان: بغداد - العراق'}</Text>
              <Text style={styles.contactText}>هاتف: {settings.phone || '07700000000'}</Text>
            </View>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  actionBar: {
    flexDirection: 'row-reverse',
    padding: 12,
    justifyContent: 'space-around',
    borderBottomWidth: 1,
  },
  actionBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  actionBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  scrollContent: {
    padding: 16,
    alignItems: 'center',
  },
  paper: {
    width: '100%',
    maxWidth: 800,
    borderRadius: 4,
    borderWidth: 1,
    padding: 24,
  },
  paperHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  logo: {
    width: 70,
    height: 70,
  },
  headerTitleContainer: {
    alignItems: 'flex-end',
    flex: 1,
  },
  labNameAr: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  labNameEn: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0284c7',
  },
  labSubText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  dividerDouble: {
    height: 3,
    backgroundColor: '#0284c7',
    marginVertical: 12,
  },
  patientInfoBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#334155',
  },
  infoValue: {
    fontSize: 13,
    color: '#0f172a',
  },
  tableContainer: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row-reverse',
    backgroundColor: '#0f172a',
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  th: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12,
    textAlign: 'right',
  },
  tableRow: {
    flexDirection: 'row-reverse',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  tableRowEven: {
    backgroundColor: '#f8fafc',
  },
  td: {
    fontSize: 12,
    color: '#334155',
    textAlign: 'right',
  },
  tdName: {
    fontWeight: 'bold',
    color: '#0f172a',
  },
  tdResult: {
    fontWeight: 'bold',
  },
  abnormalText: {
    color: '#ef4444',
  },
  noTestsRow: {
    padding: 20,
    alignItems: 'center',
  },
  noTestsText: {
    color: '#94a3b8',
    fontSize: 13,
  },
  notesSection: {
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fef3c7',
    padding: 10,
    borderRadius: 4,
    marginBottom: 20,
  },
  notesTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#b45309',
  },
  notesText: {
    fontSize: 12,
    color: '#78350f',
    marginTop: 2,
  },
  paperFooter: {
    marginTop: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  signatureBox: {
    alignItems: 'center',
  },
  signatureTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  signatureSub: {
    fontSize: 10,
    color: '#94a3b8',
  },
  contactFooter: {
    alignItems: 'flex-start',
  },
  contactText: {
    fontSize: 10,
    color: '#64748b',
  },
  notFoundContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notFoundText: {
    fontSize: 16,
    marginBottom: 16,
  },
  btn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  btnText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
});
 
