import React, {useMemo, useState} from 'react';
import {
  Alert,
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';

import {useLabStore} from '../store/useLabStore';
import {getTheme} from '../utils/theme';

import {
  getStats,
  exportPatientsExcel,
  exportStatsPdf,
  printStats,
} from '../services/exportService';

export default function StatsScreen() {
  const patients = useLabStore(s => s.patients);
  const settings = useLabStore(s => s.settings);

  const [busy, setBusy] = useState<
    'pdf' | 'print' | 'excel' | null
  >(null);

  const dark = !!settings?.darkMode;
  const theme = getTheme(settings);

  const stats = useMemo(() => {
    return getStats(patients);
  }, [patients]);

  /*
   * getStats() يرجع sections كمصفوفة
   */
  const sections = stats?.sections ?? [];

  /* =====================================================
     PDF
  ===================================================== */

  const handlePdf = async () => {
    try {
      setBusy('pdf');

      await exportStatsPdf(
        stats,
        settings,
        settings?.printSettings || {},
      );
    } catch (error) {
      console.log('Statistics PDF error:', error);

      Alert.alert(
        'خطأ',
        'تعذر إنشاء ملف PDF للإحصائيات.',
      );
    } finally {
      setBusy(null);
    }
  };

  /* =====================================================
     Print
  ===================================================== */

  const handlePrint = async () => {
    try {
      setBusy('print');

      await printStats(
        stats,
        settings,
        settings?.printSettings || {},
      );
    } catch (error) {
      console.log('Statistics print error:', error);

      Alert.alert(
        'خطأ',
        'تعذر فتح الطباعة.',
      );
    } finally {
      setBusy(null);
    }
  };

  /* =====================================================
     Excel
  ===================================================== */

  const handleExcel = async () => {
    if (!patients.length) {
      Alert.alert(
        'لا توجد بيانات',
        'لا توجد سجلات مرضى لتصديرها.',
      );

      return;
    }

    try {
      setBusy('excel');

      await exportPatientsExcel(patients);
    } catch (error) {
      console.log('Statistics Excel error:', error);

      Alert.alert(
        'خطأ',
        'تعذر إنشاء ملف Excel.',
      );
    } finally {
      setBusy(null);
    }
  };

  /* =====================================================
     UI
  ===================================================== */

  return (
    <ScrollView
      style={[
        styles.root,
        {backgroundColor: theme.background},
        dark && styles.rootDark,
      ]}
      contentContainerStyle={styles.content}
    >

      {/* العنوان */}

      <Text
        style={[
          styles.h,
          dark && styles.textLight,
        ]}
      >
        📊 التقرير الإحصائي الطبي
      </Text>

      <Text
        style={[
          styles.subHeader,
          dark && styles.textMuted,
        ]}
      >
        ملخص شامل لسجلات وفحوصات المختبر
      </Text>

      {/* البطاقات الرئيسية */}

      <View style={styles.grid}>

        <Box
          t="إجمالي المرضى"
          n={stats.total}
          dark={dark}
        />

        <Box
          t="سجلات اليوم"
          n={stats.today}
          dark={dark}
        />

        <Box
          t="ذكور"
          n={stats.males}
          dark={dark}
        />

        <Box
          t="إناث"
          n={stats.females}
          dark={dark}
        />

      </View>

      {/* توزيع الفحوصات */}

      <View
        style={[
          styles.card,
          dark && styles.cardDark,
        ]}
      >

        <Text
          style={[
            styles.title,
            dark && styles.textLight,
          ]}
        >
          توزيع الفحوصات
        </Text>

        {sections.length === 0 ? (

          <View style={styles.empty}>

            <Text style={styles.emptyIcon}>
              📋
            </Text>

            <Text
              style={[
                styles.emptyText,
                dark && styles.textMuted,
              ]}
            >
              لا توجد بيانات فحوصات حتى الآن.
            </Text>

          </View>

        ) : (

          sections.map(section => {

            /*
             * getStats الجديد يرجع tests كمصفوفة:
             *
             * [
             *   {name:'Hb', count:5},
             *   {name:'WBC', count:4}
             * ]
             */

            const testEntries = (
              section.tests ?? []
            ).filter(
              test => Number(test.count) > 0,
            );

            return (
              <View
                key={section.key}
                style={[
                  styles.section,
                  dark && styles.sectionDark,
                ]}
              >

                {/* اسم القسم */}

                <View
                  style={styles.sectionHeader}
                >

                  <Text
                    style={[
                      styles.sec,
                      dark && styles.textLight,
                    ]}
                  >
                    {section.name ||
                      getSectionName(
                        section.key,
                      )}
                  </Text>

                  <View
                    style={
                      styles.sectionCount
                    }
                  >

                    <Text
                      style={
                        styles.sectionCountNumber
                      }
                    >
                      {section.count || 0}
                    </Text>

                    <Text
                      style={
                        styles.sectionCountLabel
                      }
                    >
                      سجل
                    </Text>

                  </View>

                </View>

                {/* الفحوصات */}

                {testEntries.length === 0 ? (

                  <Text
                    style={[
                      styles.noTests,
                      dark &&
                        styles.textMuted,
                    ]}
                  >
                    لا توجد فحوصات مسجلة.
                  </Text>

                ) : (

                  testEntries.map(test => (

                    <View
                      key={test.name}
                      style={[
                        styles.test,
                        dark &&
                          styles.testDark,
                      ]}
                    >

                      <Text
                        style={[
                          styles.testName,
                          dark &&
                            styles.textLight,
                        ]}
                      >
                        {test.name}
                      </Text>

                      <View
                        style={
                          styles.testBadge
                        }
                      >

                        <Text
                          style={
                            styles.testCount
                          }
                        >
                          {test.count}
                        </Text>

                      </View>

                    </View>

                  ))

                )}

              </View>
            );
          })

        )}

      </View>

      {/* أزرار التصدير */}

      <View
        style={[
          styles.actionsCard,
          dark && styles.cardDark,
        ]}
      >

        <Text
          style={[
            styles.actionsTitle,
            dark && styles.textLight,
          ]}
        >
          تصدير وطباعة التقرير
        </Text>

        {/* PDF */}

        <TouchableOpacity
          disabled={!!busy}
          style={[
            styles.pdfButton,
            !!busy && styles.disabledButton,
          ]}
          onPress={handlePdf}
        >

          <Text style={styles.buttonText}>
            {busy === 'pdf'
              ? '⏳ جاري إنشاء PDF...'
              : '📄 تصدير الإحصائيات PDF'}
          </Text>

        </TouchableOpacity>

        {/* طباعة */}

        <TouchableOpacity
          disabled={!!busy}
          style={[
            styles.printButton,
            dark && styles.printButtonDark,
            !!busy && styles.disabledButton,
          ]}
          onPress={handlePrint}
        >

          <Text
            style={[
              styles.printText,
              dark && styles.textLight,
            ]}
          >
            {busy === 'print'
              ? '⏳ جاري فتح الطباعة...'
              : '🖨️ طباعة الإحصائيات'}
          </Text>

        </TouchableOpacity>

        {/* Excel */}

        <TouchableOpacity
          disabled={!!busy}
          style={[
            styles.excelButton,
            dark && styles.excelButtonDark,
            !!busy && styles.disabledButton,
          ]}
          onPress={handleExcel}
        >

          <Text
            style={[
              styles.excelText,
              dark && styles.textLight,
            ]}
          >
            {busy === 'excel'
              ? '⏳ جاري إنشاء Excel...'
              : '📗 تصدير السجلات إلى Excel'}
          </Text>

        </TouchableOpacity>

      </View>

    </ScrollView>
  );
}

/* =========================================================
   Box
========================================================= */

function Box({
  t,
  n,
  dark,
}: {
  t: string;
  n: number;
  dark: boolean;
}) {
  return (
    <View
      style={[
        styles.box,
        dark && styles.boxDark,
      ]}
    >

      <Text style={styles.bn}>
        {n}
      </Text>

      <Text
        style={[
          styles.bt,
          dark && styles.textMuted,
        ]}
      >
        {t}
      </Text>

    </View>
  );
}

/* =========================================================
   اسم القسم
========================================================= */

function getSectionName(key: string) {
  const names: Record<string, string> = {
    Blood: 'أمراض الدم',
    Chem: 'الكيمياء',
    Urine: 'فحص البول العام',
    Serology: 'المصليات',
    Stool: 'فحص البراز',
    Preg: 'الحمل / الهرمونات',

    hematology: 'أمراض الدم',
    chemistry: 'الكيمياء',
    urine: 'فحص البول العام',
    generalUrine: 'فحص البول العام',
    blood: 'أمراض الدم',
    biochemistry: 'الكيمياء',
  };

  return names[key] || key;
}

/* =========================================================
   Styles
========================================================= */

const styles = StyleSheet.create({

  root: {
    flex: 1,
    backgroundColor: '#f4f7f6',
  },

  rootDark: {
    backgroundColor: '#101817',
  },

  content: {
    padding: 12,
    paddingBottom: 35,
  },

  h: {
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'right',
    color: '#1d3b36',
  },

  subHeader: {
    textAlign: 'right',
    color: '#687570',
    fontSize: 13,
    marginTop: 5,
    marginBottom: 14,
  },

  textLight: {
    color: '#f2f7f5',
  },

  textMuted: {
    color: '#a9b7b2',
  },

  grid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
  },

  box: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e6e3',
  },

  boxDark: {
    backgroundColor: '#182320',
    borderColor: '#293733',
  },

  bn: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1d3b36',
  },

  bt: {
    color: '#666',
    marginTop: 3,
    fontSize: 13,
    fontWeight: '700',
  },

  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#e0e6e3',
  },

  cardDark: {
    backgroundColor: '#182320',
    borderColor: '#293733',
  },

  title: {
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'right',
    marginBottom: 10,
    color: '#1d3b36',
  },

  section: {
    borderTopWidth: 1,
    borderTopColor: '#e7ecea',
    paddingVertical: 10,
  },

  sectionDark: {
    borderTopColor: '#293733',
  },

  sectionHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  sec: {
    flex: 1,
    fontWeight: '900',
    fontSize: 16,
    textAlign: 'right',
    color: '#1d3b36',
  },

  sectionCount: {
    minWidth: 58,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: '#e7efec',
    alignItems: 'center',
  },

  sectionCountNumber: {
    color: '#1d3b36',
    fontSize: 15,
    fontWeight: '900',
  },

  sectionCountLabel: {
    color: '#687570',
    fontSize: 9,
    fontWeight: '700',
  },

  test: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 7,
    paddingHorizontal: 8,
    marginTop: 4,
    borderRadius: 9,
    backgroundColor: '#f5f8f7',
  },

  testDark: {
    backgroundColor: '#202d29',
  },

  testName: {
    flex: 1,
    textAlign: 'right',
    color: '#26332f',
    fontSize: 13,
  },

  testBadge: {
    minWidth: 35,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#1d3b36',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },

  testCount: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 12,
  },

  noTests: {
    textAlign: 'right',
    color: '#777',
    fontSize: 12,
    marginTop: 7,
  },

  empty: {
    alignItems: 'center',
    paddingVertical: 25,
  },

  emptyIcon: {
    fontSize: 40,
    marginBottom: 8,
  },

  emptyText: {
    color: '#777',
    textAlign: 'center',
    fontSize: 14,
  },

  actionsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#e0e6e3',
  },

  actionsTitle: {
    textAlign: 'right',
    fontSize: 17,
    fontWeight: '900',
    color: '#1d3b36',
    marginBottom: 10,
  },

  pdfButton: {
    backgroundColor: '#1d3b36',
    padding: 15,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 5,
  },

  buttonText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 14,
  },

  printButton: {
    marginTop: 9,
    padding: 15,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1d3b36',
    backgroundColor: '#ffffff',
  },

  printButtonDark: {
    backgroundColor: '#182320',
    borderColor: '#8bb8ad',
  },

  printText: {
    color: '#1d3b36',
    fontWeight: '900',
    fontSize: 14,
  },

  excelButton: {
    marginTop: 9,
    padding: 15,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#607d74',
    backgroundColor: '#f5f8f7',
  },

  excelButtonDark: {
    backgroundColor: '#202d29',
    borderColor: '#8bb8ad',
  },

  excelText: {
    color: '#1d3b36',
    fontWeight: '900',
    fontSize: 14,
  },

  disabledButton: {
    opacity: 0.6,
  },

});
