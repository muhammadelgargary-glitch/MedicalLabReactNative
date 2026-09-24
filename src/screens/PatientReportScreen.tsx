// src/screens/PatientReportScreen.tsx

import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useLabStore, Patient } from '../store/useLabStore';
import {
  TEST_SECTIONS,
  SECTION_KEYS,
  SectionKey,
} from '../utils/constants';

import {
  exportPatientPdf,
  printPatient,
} from '../services/exportService';

import { displayDate } from '../utils/helpers';
import { getColors } from '../styles/colors';
import { resolveFontFamily, fontScale } from '../styles/design';
import { SHADOWS } from '../styles/spacing';

export default function PatientReportScreen({
  route,
  navigation,
}: any) {
  const id = route.params?.id;

  const patients = useLabStore((s) => s.patients);
  const settings = useLabStore((s) => s.settings);
  const deletePatient = useLabStore((s) => s.deletePatient);

  const dark = useLabStore((s) => s.darkMode);
  const theme = useLabStore((s) => s.theme);
  const family = useLabStore((s) => s.fontFamily);
  const size = useLabStore((s) => s.fontSize);

  /*
   * الكتالوج والأسعار الجديدة.
   * لا نغير بيانات المريض؛ نستخدمها فقط لإثراء التقرير.
   */
  const testCatalog = useLabStore((s) => s.testCatalog);
  const testPrices = useLabStore((s) => s.testPrices);

  const patient = patients.find((p) => p.id === id);

  const colors = getColors(dark, theme);

  const styles = createStyles(
    colors,
    resolveFontFamily(family),
    fontScale(size),
  );

  const [busy, setBusy] = useState<'pdf' | 'print' | null>(null);

  /*
   * الأقسام التي اختارها المريض.
   * نحافظ على نفس آلية المشروع الحالية.
   */
  const sections = useMemo(
    () =>
      patient
        ? SECTION_KEYS.filter(
            (k) => !!(patient as any)[`include${k}`],
          )
        : [],
    [patient],
  );

  /*
   * البحث عن بيانات الفحص داخل الكتالوج.
   *
   * ندعم key و id حتى لا نكسر الكتالوجات القديمة
   * أو البيانات التي تم حفظها قبل إضافة نظام الكتالوج.
   */
  const findCatalogTest = (key: string) => {
    if (!Array.isArray(testCatalog)) return undefined;

    return testCatalog.find(
      (t: any) =>
        t &&
        (t.key === key || t.id === key),
    );
  };

  /*
   * تنفيذ PDF / الطباعة.
   * نفس وظائف المشروع الأصلية بدون حذف.
   */
  const run = async (type: 'pdf' | 'print') => {
    try {
      setBusy(type);

      const options = settings.printSettings || {};

      if (type === 'pdf') {
        await exportPatientPdf(
          patient!,
          settings,
          options,
        );

        Alert.alert(
          'تم',
          'تم إنشاء ومشاركة التقرير.',
        );
      } else {
        await printPatient(
          patient!,
          settings,
          options,
        );

        Alert.alert(
          'تم',
          'تم إرسال التقرير للطباعة.',
        );
      }
    } catch (e: any) {
      Alert.alert(
        'خطأ',
        e?.message || 'تعذر تنفيذ العملية.',
      );
    } finally {
      setBusy(null);
    }
  };

  /*
   * حذف السجل.
   * الوظيفة الأصلية محفوظة بالكامل.
   */
  const remove = () =>
    Alert.alert(
      'حذف السجل',
      'هل تريد حذف هذا السجل نهائيًا؟',
      [
        {
          text: 'إلغاء',
          style: 'cancel',
        },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePatient(patient!.id);
              navigation.goBack();
            } catch (e: any) {
              Alert.alert(
                'خطأ',
                e?.message || 'تعذر حذف السجل.',
              );
            }
          },
        },
      ],
    );

  if (!patient) {
    return (
      <View style={styles.missing}>
        <Text style={styles.missingTitle}>
          السجل غير موجود
        </Text>

        <TouchableOpacity
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.link}>
            رجوع
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* رأس الصفحة */}
        <View style={styles.topbar}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.iconButton}
            disabled={!!busy}
          >
            <Text style={styles.iconText}>
              ‹
            </Text>
          </TouchableOpacity>

          <View style={{ flex: 1 }}>
            <Text style={styles.kicker}>
              تقرير طبي
            </Text>

            <Text style={styles.topTitle}>
              {patient.name}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() =>
              navigation.navigate(
                'PatientForm',
                { id: patient.id },
              )
            }
            style={styles.editButton}
            disabled={!!busy}
          >
            <Text style={styles.editText}>
              تعديل
            </Text>
          </TouchableOpacity>
        </View>

        {/* ورقة التقرير */}
        <View style={styles.paper}>
          {/* رأس التقرير */}
          <View style={styles.reportHeader}>
            <View style={styles.brand}>
              {settings.logo ? (
                <View
                  style={[
                    styles.logoWrap,
                    {
                      borderRadius:
                        settings.logoShape === 'circle'
                          ? 999
                          : settings.logoShape === 'square'
                            ? 5
                            : 14,

                      width:
                        settings.logoSize || 56,

                      height:
                        settings.logoSize || 56,
                    },
                  ]}
                >
                  <Image
                    source={{
                      uri: settings.logo,
                    }}
                    style={{
                      width: '100%',
                      height: '100%',
                    }}
                    resizeMode="contain"
                  />
                </View>
              ) : (
                <View style={styles.logoPlaceholder}>
                  <Text style={styles.logoMark}>
                    LAB
                  </Text>
                </View>
              )}

              <View style={{ flex: 1 }}>
                <Text style={styles.center}>
                  {settings.center ||
                    'مختبر طبي'}
                </Text>

                <Text style={styles.directorate}>
                  {settings.directorate ||
                    'الإدارة'}
                </Text>
              </View>
            </View>

            <View style={styles.reportLine} />

            <Text style={styles.reportTitle}>
              {settings.reportTitle ||
                'تقرير الفحوصات المخبرية'}
            </Text>
          </View>

          {/* معلومات المريض */}
          <View style={styles.patientInfo}>
            <Info
              label="اسم المريض"
              value={patient.name}
              styles={styles}
            />

            <Info
              label="رقم السجل"
              value={patient.seq}
              styles={styles}
            />

            <Info
              label="العمر"
              value={patient.age}
              styles={styles}
            />

            <Info
              label="الجنس"
              value={patient.gender}
              styles={styles}
            />

            <Info
              label="التاريخ"
              value={displayDate(patient.date)}
              styles={styles}
            />
          </View>

          {/* أقسام النتائج */}
          {sections.map(
            (key: SectionKey) => (
              <ReportSection
                key={key}
                patient={patient}
                sectionKey={key}
                styles={styles}
                testCatalog={testCatalog}
                testPrices={testPrices}
              />
            ),
          )}

          {/* الملاحظات */}
          {patient.notes ? (
            <View style={styles.notes}>
              <Text style={styles.notesLabel}>
                ملاحظات
              </Text>

              <Text style={styles.notesText}>
                {patient.notes}
              </Text>
            </View>
          ) : null}

          <Text style={styles.footer}>
            {settings.footerText ||
              'مع تمنياتنا بالصحة والعافية'}
          </Text>
        </View>

        {/* أزرار العمليات */}
        <View style={styles.actions}>
          <TouchableOpacity
            disabled={!!busy}
            onPress={() => run('pdf')}
            style={styles.primaryAction}
          >
            {busy === 'pdf' ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.actionIcon}>
                  ⇩
                </Text>

                <Text style={styles.primaryText}>
                  حفظ ومشاركة PDF
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            disabled={!!busy}
            onPress={() => run('print')}
            style={styles.secondaryAction}
          >
            {busy === 'print' ? (
              <ActivityIndicator
                color={colors.navy}
              />
            ) : (
              <>
                <Text style={styles.actionIconDark}>
                  ▣
                </Text>

                <Text style={styles.secondaryText}>
                  طباعة مباشرة
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            disabled={!!busy}
            onPress={() =>
              navigation.navigate(
                'MultiPrint',
              )
            }
            style={styles.secondaryAction}
          >
            <Text style={styles.secondaryText}>
              طباعة عدة تقارير
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            disabled={!!busy}
            onPress={remove}
            style={styles.deleteAction}
          >
            <Text style={styles.deleteText}>
              حذف السجل
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* -------------------------------------------------------------------------- */
/* معلومات المريض                                                            */
/* -------------------------------------------------------------------------- */

function Info({
  label,
  value,
  styles,
}: {
  label: string;
  value: string;
  styles: any;
}) {
  return (
    <View style={styles.info}>
      <Text style={styles.infoLabel}>
        {label}
      </Text>

      <Text style={styles.infoValue}>
        {value || '—'}
      </Text>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* قسم النتائج                                                                */
/* -------------------------------------------------------------------------- */

function ReportSection({
  patient,
  sectionKey,
  styles,
  testCatalog,
  testPrices,
}: {
  patient: Patient;
  sectionKey: SectionKey;
  styles: any;
  testCatalog: any[];
  testPrices: Record<string, number>;
}) {
  const section: any =
    TEST_SECTIONS[sectionKey];

  const data =
    (patient as any)[section.dataKey] || {};

  /*
   * نعرض فقط الفحوصات التي تحتوي على نتيجة.
   */
  const rows = section.fields.filter(
    (f: any) =>
      String(
        data[f.key] ?? '',
      ).trim() !== '',
  );

  if (!rows.length) return null;

  /*
   * تحديد معلومات الكتالوج لكل فحص.
   */
  const getCatalog = (key: string) => {
    if (!Array.isArray(testCatalog)) {
      return undefined;
    }

    return testCatalog.find(
      (t: any) =>
        t &&
        (t.key === key ||
          t.id === key),
    );
  };

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {section.label}
        </Text>
      </View>

      <View style={styles.tableHeader}>
        <Text
          style={[
            styles.th,
            { flex: 1.35 },
          ]}
        >
          اسم الفحص
        </Text>

        <Text
          style={[
            styles.th,
            { flex: 1 },
          ]}
        >
          النتيجة
        </Text>

        <Text
          style={[
            styles.th,
            { flex: 1.15 },
          ]}
        >
          القيمة المرجعية
        </Text>
      </View>

      {rows.map(
        (f: any, i: number) => {
          const catalog =
            getCatalog(f.key);

          const reference =
            catalog?.referenceRange ||
            f.normal ||
            '—';

          const price =
            typeof catalog?.price ===
            'number'
              ? catalog.price
              : typeof testPrices?.[f.key] ===
                  'number'
                ? testPrices[f.key]
                : 0;

          const hasCritical =
            !!String(
              catalog?.criticalValue ||
                f.critical ||
                '',
            ).trim();

          return (
            <View
              key={f.key}
              style={[
                styles.tableRow,
                i % 2 === 1 &&
                  styles.alt,
              ]}
            >
              <View
                style={[
                  styles.tdBlock,
                  { flex: 1.35 },
                ]}
              >
                <Text
                  style={styles.td}
                >
                  {catalog?.name ||
                    f.label}
                </Text>

                {!!(
                  catalog?.abbreviation ||
                  f.abbreviation
                ) && (
                  <Text
                    style={
                      styles.metaText
                    }
                  >
                    {catalog?.abbreviation ||
                      f.abbreviation}
                  </Text>
                )}

                {!!catalog?.specimen && (
                  <Text
                    style={
                      styles.metaText
                    }
                  >
                    العينة: {catalog.specimen}
                  </Text>
                )}

                {!!catalog?.tube && (
                  <Text
                    style={
                      styles.metaText
                    }
                  >
                    الأنبوب: {catalog.tube}
                  </Text>
                )}
              </View>

              <View
                style={[
                  styles.tdBlock,
                  { flex: 1 },
                ]}
              >
                <Text
                  style={[
                    styles.td,
                    styles.result,
                  ]}
                >
                  {String(
                    data[f.key],
                  )}
                </Text>

                {hasCritical && (
                  <View
                    style={
                      styles.criticalInfo
                    }
                  >
                    <Text
                      style={
                        styles.criticalText
                      }
                    >
                      قيمة حرجة معرفة
                    </Text>
                  </View>
                )}
              </View>

              <View
                style={[
                  styles.tdBlock,
                  { flex: 1.15 },
                ]}
              >
                <Text
                  style={[
                    styles.td,
                    styles.normal,
                  ]}
                >
                  {reference}
                </Text>

                {price > 0 && (
                  <Text
                    style={
                      styles.priceText
                    }
                  >
                    السعر: {price.toLocaleString(
                      'en-US',
                    )}
                  </Text>
                )}
              </View>
            </View>
          );
        },
      )}
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* Styles                                                                     */
/* -------------------------------------------------------------------------- */

const createStyles = (
  c: any,
  f: string,
  s: number,
) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.paper,
    },

    content: {
      paddingBottom: 38,
    },

    topbar: {
      backgroundColor: c.headerBg,
      padding: 15,
      flexDirection: 'row',
      alignItems: 'center',
    },

    iconButton: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor:
        'rgba(255,255,255,.12)',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 10,
    },

    iconText: {
      color: '#fff',
      fontSize: 30,
    },

    kicker: {
      color: '#B7E8E2',
      fontSize: 10 * s,
      fontWeight: '700',
      fontFamily: f,
    },

    topTitle: {
      color: '#fff',
      fontSize: 18 * s,
      fontWeight: '900',
      fontFamily: f,
      marginTop: 2,
    },

    editButton: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 11,
      backgroundColor:
        'rgba(255,255,255,.13)',
    },

    editText: {
      color: '#fff',
      fontSize: 11 * s,
      fontWeight: '800',
      fontFamily: f,
    },

    paper: {
      margin: 14,
      padding: 14,
      backgroundColor: c.panel,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: c.line,
      ...SHADOWS.sm,
    },

    reportHeader: {
      paddingBottom: 12,
    },

    brand: {
      flexDirection: 'row',
      alignItems: 'center',
    },

    logoPlaceholder: {
      width: 56,
      height: 56,
      borderRadius: 14,
      backgroundColor: c.sealLight,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 10,
    },

    logoWrap: {
      backgroundColor: c.paper,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      marginRight: 10,
    },

    logoMark: {
      color: c.navy,
      fontSize: 10,
      fontWeight: '900',
      fontFamily: f,
    },

    center: {
      color: c.ink,
      fontSize: 19 * s,
      fontWeight: '900',
      fontFamily: f,
      textAlign: 'right',
    },

    directorate: {
      color: c.inkSub,
      fontSize: 11 * s,
      fontFamily: f,
      marginTop: 2,
      textAlign: 'right',
    },

    reportLine: {
      height: 2,
      backgroundColor: c.navy,
      marginVertical: 12,
    },

    reportTitle: {
      color: c.ink,
      fontSize: 18 * s,
      fontWeight: '900',
      fontFamily: f,
      textAlign: 'center',
    },

    patientInfo: {
      marginTop: 10,
      borderWidth: 1,
      borderColor: c.line,
      borderRadius: 12,
      overflow: 'hidden',
      flexDirection: 'row',
      flexWrap: 'wrap',
    },

    info: {
      width: '50%',
      padding: 9,
      borderBottomWidth: 1,
      borderLeftWidth: 1,
      borderColor: c.line,
    },

    infoLabel: {
      color: c.inkSub,
      fontSize: 9.5 * s,
      fontWeight: '700',
      fontFamily: f,
      textAlign: 'right',
    },

    infoValue: {
      color: c.ink,
      fontSize: 12 * s,
      fontWeight: '900',
      fontFamily: f,
      marginTop: 2,
      textAlign: 'right',
    },

    section: {
      marginTop: 12,
      borderWidth: 1,
      borderColor: c.line,
      borderRadius: 10,
      overflow: 'hidden',
    },

    sectionHeader: {
      backgroundColor: c.navy,
      paddingVertical: 8,
      paddingHorizontal: 10,
    },

    sectionTitle: {
      color: '#fff',
      fontSize: 13 * s,
      fontWeight: '900',
      fontFamily: f,
      textAlign: 'right',
    },

    tableHeader: {
      flexDirection: 'row',
      backgroundColor: c.sealLight,
      paddingVertical: 7,
    },

    tableRow: {
      flexDirection: 'row',
      borderTopWidth: 1,
      borderTopColor: c.line,
      minHeight: 48,
      alignItems: 'center',
      paddingVertical: 3,
    },

    alt: {
      backgroundColor: c.paper,
    },

    th: {
      color: c.ink,
      fontSize: 10 * s,
      fontWeight: '900',
      fontFamily: f,
      textAlign: 'right',
      paddingHorizontal: 6,
    },

    tdBlock: {
      justifyContent: 'center',
      paddingVertical: 4,
    },

    td: {
      color: c.ink,
      fontSize: 10.5 * s,
      fontFamily: f,
      textAlign: 'right',
      paddingHorizontal: 6,
    },

    result: {
      color: c.navy,
      fontWeight: '900',
      textAlign: 'center',
    },

    normal: {
      color: c.inkSub,
      fontSize: 9 * s,
      textAlign: 'right',
    },

    metaText: {
      color: c.inkSub,
      fontSize: 8.5 * s,
      fontFamily: f,
      textAlign: 'right',
      paddingHorizontal: 6,
      marginTop: 2,
    },

    priceText: {
      color: c.navy,
      fontSize: 8.5 * s,
      fontWeight: '800',
      fontFamily: f,
      textAlign: 'right',
      paddingHorizontal: 6,
      marginTop: 3,
    },

    criticalInfo: {
      marginTop: 4,
      marginHorizontal: 6,
      paddingVertical: 2,
      paddingHorizontal: 5,
      borderRadius: 5,
      backgroundColor: c.sealLight,
      alignSelf: 'center',
    },

    criticalText: {
      color: c.navy,
      fontSize: 7.5 * s,
      fontWeight: '800',
      fontFamily: f,
      textAlign: 'center',
    },

    notes: {
      marginTop: 12,
      padding: 10,
      borderRadius: 10,
      backgroundColor: c.paper,
      borderWidth: 1,
      borderColor: c.line,
    },

    notesLabel: {
      color: c.ink,
      fontSize: 11 * s,
      fontWeight: '900',
      fontFamily: f,
      textAlign: 'right',
    },

    notesText: {
      color: c.ink,
      fontSize: 11 * s,
      fontFamily: f,
      lineHeight: 19,
      marginTop: 4,
      textAlign: 'right',
    },

    footer: {
      textAlign: 'center',
      color: c.inkSub,
      fontSize: 10 * s,
      fontFamily: f,
      fontWeight: '700',
      marginTop: 14,
    },

    actions: {
      padding: 14,
      gap: 9,
    },

    primaryAction: {
      minHeight: 52,
      borderRadius: 15,
      backgroundColor: c.navy,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },

    primaryText: {
      color: '#fff',
      fontSize: 14 * s,
      fontWeight: '900',
      fontFamily: f,
    },

    secondaryAction: {
      minHeight: 50,
      borderRadius: 15,
      backgroundColor: c.panel,
      borderWidth: 1,
      borderColor: c.navy,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },

    secondaryText: {
      color: c.navy,
      fontSize: 13 * s,
      fontWeight: '900',
      fontFamily: f,
    },

    actionIcon: {
      color: '#fff',
      fontSize: 18,
    },

    actionIconDark: {
      color: c.navy,
      fontSize: 18,
    },

    deleteAction: {
      minHeight: 46,
      borderRadius: 14,
      backgroundColor: c.danger,
      alignItems: 'center',
      justifyContent: 'center',
    },

    deleteText: {
      color: '#fff',
      fontSize: 13 * s,
      fontWeight: '900',
      fontFamily: f,
    },

    missing: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.paper,
    },

    missingTitle: {
      color: c.ink,
      fontSize: 18 * s,
      fontWeight: '900',
      fontFamily: f,
    },

    link: {
      color: c.navy,
      fontWeight: '800',
      fontFamily: f,
      marginTop: 10,
    },
  }); 
