import React, { useMemo, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { useLabStore, Patient } from '../store/useLabStore';
import {
  SECTION_KEYS,
  TEST_SECTIONS,
  SectionKey,
} from '../utils/constants';
import { getColors } from '../styles/colors';
import { resolveFontFamily, fontScale } from '../styles/design';
import { SHADOWS } from '../styles/spacing';

export default function ResultEntryScreen({ route, navigation }: any) {
  const id = route.params?.id;

  const patients = useLabStore((s) => s.patients);
  const updatePatient = useLabStore((s) => s.updatePatient);
  const testCatalog = useLabStore((s) => s.testCatalog);
  const criticalAlertsEnabled = useLabStore((s) => s.criticalAlertsEnabled);
  const addCriticalAlert = useLabStore((s) => s.addCriticalAlert);

  const dark = useLabStore((s) => s.darkMode);
  const theme = useLabStore((s) => s.theme);
  const family = useLabStore((s) => s.fontFamily);
  const size = useLabStore((s) => s.fontSize);

  const colors = getColors(dark, theme);
  const styles = createStyles(
    colors,
    resolveFontFamily(family),
    fontScale(size),
  );

  const patient = patients.find((p) => p.id === id);

  const selectedTestIds = useMemo(() => {
    if (!patient) return [];
    if (Array.isArray(patient.selectedTests) && patient.selectedTests.length) {
      return patient.selectedTests;
    }
    // توافق مع المرضى القدامى الذين لم تكن لديهم قائمة selectedTests.
    return SECTION_KEYS.flatMap((sectionKey) =>
      (patient as any)[`include${sectionKey}`]
        ? TEST_SECTIONS[sectionKey].fields.map((field) => `${sectionKey}.${field.key}`)
        : [],
    );
  }, [patient]);

  const [values, setValues] = useState<Record<string, string>>(() => {
    if (!patient) return {};
    const initial: Record<string, string> = {};
    selectedTestIds.forEach((testId) => {
      const [sectionKey, fieldKey] = testId.split('.');
      const section = TEST_SECTIONS[sectionKey as SectionKey];
      const data = section ? ((patient as any)[section.dataKey] || {}) : {};
      const value = data[fieldKey];
      if (value !== undefined && value !== null) initial[testId] = String(value);
    });
    return initial;
  });

  const [saving, setSaving] = useState(false);

  const goToPatientList = () => {
    const parent = navigation.getParent?.();
    if (parent) parent.navigate('Catalog');
    else navigation.navigate('CatalogMain');
  };

  const sections = useMemo(() => {
    if (!patient) return [];
    return SECTION_KEYS.filter((key) => selectedTestIds.some((id) => id.startsWith(`${key}.`)));
  }, [patient, selectedTestIds]);

  const getSelectedFields = (sectionKey: SectionKey): any[] => {
    const allowed = new Set<string>(
      selectedTestIds
        .filter((id) => id.startsWith(`${sectionKey}.`))
        .map((id) => id.slice(sectionKey.length + 1)),
    );
    const base = TEST_SECTIONS[sectionKey].fields.filter((field) => allowed.has(field.key));
    const existing = new Set(base.map((field) => field.key));
    const custom = (testCatalog || [])
      .filter((item: any) => item?.enabled !== false && item?.section === sectionKey && allowed.has(item.key) && !existing.has(item.key))
      .map((item: any) => ({
        key: item.key,
        label: item.name || item.key,
        normal: item.referenceRange || '',
        abbreviation: item.abbreviation || '',
        tube: item.tube || '',
        specimen: item.specimen || '',
        notes: item.notes || '',
      }));
    return [...base, ...custom];
  };

  if (!patient) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.missing}>
          <Text style={styles.missingTitle}>السجل غير موجود</Text>

          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backMissing}
          >
            <Text style={styles.backMissingText}>رجوع</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const getCatalogItem = (sectionKey: SectionKey, fieldKey: string) => {
    return (
      testCatalog.find(
        (item: any) =>
          item.key === fieldKey &&
          item.section === sectionKey,
      ) ||
      testCatalog.find(
        (item: any) => item.key === fieldKey,
      )
    );
  };

  const setValue = (
    sectionKey: SectionKey,
    fieldKey: string,
    value: string,
  ) => {
    setValues((current) => ({
      ...current,
      [`${sectionKey}.${fieldKey}`]: value,
    }));
  };

  /*
   * نتحقق من القيمة الحرجة فقط إذا كانت معرفة مسبقًا
   * في كتالوج الفحوصات.
   *
   * لا توجد هنا أي قيم حرجة طبية افتراضية.
   */
  const isCriticalValue = (
    value: string,
    criticalValue: string | undefined,
  ) => {
    if (!value.trim() || !criticalValue?.trim()) return false;

    const actual = Number(value.replace(',', '.'));

    if (!Number.isFinite(actual)) return false;

    const rule = criticalValue.trim();

    const betweenMatch = rule.match(
      /^([0-9]+(?:[.,][0-9]+)?)\s*[-–]\s*([0-9]+(?:[.,][0-9]+)?)$/,
    );

    if (betweenMatch) {
      const min = Number(betweenMatch[1].replace(',', '.'));
      const max = Number(betweenMatch[2].replace(',', '.'));

      return actual < min || actual > max;
    }

    const lessMatch = rule.match(
      /^<\s*([0-9]+(?:[.,][0-9]+)?)$/,
    );

    if (lessMatch) {
      return actual < Number(lessMatch[1].replace(',', '.'));
    }

    const greaterMatch = rule.match(
      /^>\s*([0-9]+(?:[.,][0-9]+)?)$/,
    );

    if (greaterMatch) {
      return actual > Number(greaterMatch[1].replace(',', '.'));
    }

    const lessEqualMatch = rule.match(
      /^<=\s*([0-9]+(?:[.,][0-9]+)?)$/,
    );

    if (lessEqualMatch) {
      return actual <= Number(
        lessEqualMatch[1].replace(',', '.'),
      );
    }

    const greaterEqualMatch = rule.match(
      /^>=\s*([0-9]+(?:[.,][0-9]+)?)$/,
    );

    if (greaterEqualMatch) {
      return actual >= Number(
        greaterEqualMatch[1].replace(',', '.'),
      );
    }

    const equalMatch = rule.match(
      /^=\s*([0-9]+(?:[.,][0-9]+)?)$/,
    );

    if (equalMatch) {
      return actual === Number(
        equalMatch[1].replace(',', '.'),
      );
    }

    return false;
  };

  const saveResults = async () => {
    try {
      setSaving(true);

      const updatedSections: Record<string, any> = {};

      SECTION_KEYS.forEach((sectionKey) => {
        const section = TEST_SECTIONS[sectionKey];
        const currentData = { ...((patient as any)[section.dataKey] || {}) };

        getSelectedFields(sectionKey).forEach((field) => {
          const key = `${sectionKey}.${field.key}`;
          const value = values[key] || '';
          if (value.trim() === '') delete currentData[field.key];
          else currentData[field.key] = value;
        });

        updatedSections[section.dataKey] = currentData;
      });

      await updatePatient(patient.id, updatedSections);

      const criticalTests: string[] = [];

      sections.forEach((sectionKey) => {
        const section = TEST_SECTIONS[sectionKey];

        getSelectedFields(sectionKey).forEach((field) => {
          const catalogItem = getCatalogItem(
            sectionKey,
            field.key,
          );

          const criticalValue =
            catalogItem?.criticalValue ||
            (field as any).critical;

          const value =
            values[`${sectionKey}.${field.key}`] || '';

          if (
            isCriticalValue(
              value,
              criticalValue,
            )
          ) {
            criticalTests.push(
              `${catalogItem?.name || field.label}${
                criticalValue
                  ? ` — القيمة الحرجة: ${criticalValue}`
                  : ''
              }`,
            );
          }
        });
      });

      if (criticalTests.length && criticalAlertsEnabled) {
        for (const sectionKey of sections) {
          const section = TEST_SECTIONS[sectionKey];
          for (const field of getSelectedFields(sectionKey)) {
            const catalogItem = getCatalogItem(sectionKey, field.key);
            const criticalValue = catalogItem?.criticalValue || (field as any).critical || '';
            const value = values[`${sectionKey}.${field.key}`] || '';
            if (isCriticalValue(value, criticalValue)) {
              await addCriticalAlert({
                patientId: patient.id,
                patientName: patient.name,
                testKey: `${sectionKey}.${field.key}`,
                testName: catalogItem?.name || field.label,
                value,
                rule: criticalValue,
              });
            }
          }
        }
      }

      if (criticalTests.length) {
        Alert.alert(
          '⚠️ تنبيه قيمة حرجة',
          `تم حفظ النتائج، لكن توجد قيمة حرجة في:\n\n${criticalTests.join('\n')}`,
          [
            {
              text: 'مراجعة التقرير',
              onPress: () => navigation.replace('PatientReport', { id: patient.id }),
            },
            {
              text: 'حسنًا والعودة للسجلات',
              style: 'cancel',
              onPress: goToPatientList,
            },
          ],
        );
      } else {
        // الحفظ الناجح يعيد المستخدم مباشرة إلى قائمة السجلات.
        goToPatientList();
        Alert.alert('تم الحفظ', 'تم حفظ نتائج الفحوصات بنجاح.');
      }
    } catch (error: any) {
      Alert.alert(
        'خطأ',
        error?.message || 'تعذر حفظ نتائج الفحوصات.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Text style={styles.backText}>‹</Text>
          </TouchableOpacity>

          <View style={styles.headerInfo}>
            <Text style={styles.kicker}>نتائج الفحوصات</Text>

            <Text style={styles.title}>
              {patient.name}
            </Text>

            <Text style={styles.subtitle}>
              رقم السجل: {patient.seq} • العمر: {patient.age}
            </Text>
          </View>
        </View>

        <View style={styles.notice}>
          <Text style={styles.noticeIcon}>ⓘ</Text>

          <View style={{ flex: 1 }}>
            <Text style={styles.noticeTitle}>
              إدخال نتائج المريض
            </Text>

            <Text style={styles.noticeText}>
              أدخل النتائج للفحوصات المطلوبة فقط. اترك الحقل
              فارغًا إذا لم تظهر النتيجة بعد.
            </Text>
          </View>
        </View>

        {sections.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>
              لا توجد فحوصات محددة
            </Text>

            <Text style={styles.emptyText}>
              هذا السجل لا يحتوي حاليًا على أقسام فحوصات
              محددة.
            </Text>
          </View>
        ) : (
          sections.map((sectionKey) => {
            const section = TEST_SECTIONS[sectionKey];

            return (
              <View
                key={sectionKey}
                style={styles.sectionCard}
              >
                <View style={styles.sectionHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sectionTitle}>
                      {section.label}
                    </Text>

                    <Text style={styles.sectionHint}>
                      أدخل النتائج للفحوصات المطلوبة
                    </Text>
                  </View>

                  <View style={styles.sectionBadge}>
                    <Text style={styles.sectionBadgeText}>
                      {getSelectedFields(sectionKey).length}
                    </Text>
                  </View>
                </View>

                {getSelectedFields(sectionKey).map((field) => {
                  const catalogItem = getCatalogItem(
                    sectionKey,
                    field.key,
                  );

                  const value =
                    values[
                      `${sectionKey}.${field.key}`
                    ] || '';

                  const criticalValue =
                    catalogItem?.criticalValue ||
                    (field as any).critical;

                  const critical =
                    isCriticalValue(
                      value,
                      criticalValue,
                    );

                  return (
                    <View
                      key={field.key}
                      style={[
                        styles.testCard,
                        critical &&
                          styles.criticalCard,
                      ]}
                    >
                      <View style={styles.testHeader}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.testName}>
                            {catalogItem?.name ||
                              field.label}
                          </Text>

                          {catalogItem?.abbreviation ||
                          (field as any).abbreviation ? (
                            <Text
                              style={styles.abbreviation}
                            >
                              {catalogItem?.abbreviation ||
                                (field as any).abbreviation}
                            </Text>
                          ) : null}
                        </View>

                        {critical && (
                          <View
                            style={styles.criticalBadge}
                          >
                            <Text
                              style={
                                styles.criticalBadgeText
                              }
                            >
                              ⚠ قيمة حرجة
                            </Text>
                          </View>
                        )}
                      </View>

                      <TextInput
                        value={value}
                        onChangeText={(text) =>
                          setValue(
                            sectionKey,
                            field.key,
                            text,
                          )
                        }
                        placeholder={
                          field.unit
                            ? `أدخل النتيجة (${field.unit})`
                            : 'أدخل النتيجة'
                        }
                        placeholderTextColor={
                          colors.inkSub
                        }
                        style={[
                          styles.resultInput,
                          critical &&
                            styles.resultInputCritical,
                        ]}
                        textAlign="right"
                        autoCorrect={false}
                      />

                      <View style={styles.metadata}>
                        {(catalogItem?.specimen ||
                          catalogItem?.tube ||
                          (field as any).specimen ||
                          (field as any).tube) && (
                          <View style={styles.metaRow}>
                            <Text style={styles.metaLabel}>
                              العينة / الأنبوب
                            </Text>

                            <Text
                              style={styles.metaValue}
                            >
                              {catalogItem?.specimen ||
                                (field as any).specimen ||
                                '—'}
                              {(catalogItem?.tube ||
                                (field as any).tube) &&
                                ` • ${
                                  catalogItem?.tube ||
                                  (field as any).tube
                                }`}
                            </Text>
                          </View>
                        )}

                        <View style={styles.metaRow}>
                          <Text style={styles.metaLabel}>
                            القيمة المرجعية
                          </Text>

                          <Text
                            style={[
                              styles.metaValue,
                              styles.reference,
                            ]}
                          >
                            {catalogItem?.referenceRange ||
                              field.normal ||
                              '—'}
                          </Text>
                        </View>

                        {catalogItem?.price !==
                          undefined && (
                          <View style={styles.metaRow}>
                            <Text style={styles.metaLabel}>
                              السعر
                            </Text>

                            <Text
                              style={[
                                styles.metaValue,
                                styles.price,
                              ]}
                            >
                              {catalogItem.price}
                            </Text>
                          </View>
                        )}

                        {criticalValue ? (
                          <View style={styles.criticalInfo}>
                            <Text
                              style={
                                styles.criticalInfoText
                              }
                            >
                              ⚠ القيمة الحرجة المعرفة:
                              {' '}
                              {criticalValue}
                            </Text>
                          </View>
                        ) : null}

                        {catalogItem?.notes ||
                        (field as any).notes ? (
                          <Text style={styles.notes}>
                            {catalogItem?.notes ||
                              (field as any).notes}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                  );
                })}
              </View>
            );
          })
        )}

        <View style={styles.bottomActions}>
          <TouchableOpacity
            disabled={saving}
            onPress={saveResults}
            style={[
              styles.saveButton,
              saving && styles.disabled,
            ]}
          >
            <Text style={styles.saveButtonText}>
              {saving
                ? 'جارٍ الحفظ…'
                : 'حفظ جميع النتائج'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            disabled={saving}
            onPress={() => navigation.goBack()}
            style={styles.cancelButton}
          >
            <Text style={styles.cancelButtonText}>
              إلغاء
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (
  c: any,
  fontFamily: string,
  scale: number,
) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.paper,
    },

    content: {
      paddingBottom: 40,
    },

    header: {
      backgroundColor: c.headerBg,
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 18,
      flexDirection: 'row',
      alignItems: 'center',
    },

    backButton: {
      width: 42,
      height: 42,
      borderRadius: 13,
      backgroundColor: 'rgba(255,255,255,0.12)',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },

    backText: {
      color: '#fff',
      fontSize: 31,
      lineHeight: 34,
    },

    headerInfo: {
      flex: 1,
    },

    kicker: {
      color: '#B7E8E2',
      fontSize: 10 * scale,
      fontWeight: '700',
      fontFamily,
    },

    title: {
      color: '#fff',
      fontSize: 21 * scale,
      fontWeight: '900',
      fontFamily,
      marginTop: 2,
    },

    subtitle: {
      color: '#D7EFEC',
      fontSize: 11 * scale,
      fontFamily,
      marginTop: 4,
    },

    notice: {
      margin: 14,
      padding: 13,
      borderRadius: 15,
      backgroundColor: c.sealLight,
      borderWidth: 1,
      borderColor: c.line,
      flexDirection: 'row',
      alignItems: 'flex-start',
    },

    noticeIcon: {
      color: c.navy,
      fontSize: 22,
      marginRight: 10,
    },

    noticeTitle: {
      color: c.ink,
      fontSize: 13 * scale,
      fontWeight: '900',
      fontFamily,
    },

    noticeText: {
      color: c.inkSub,
      fontSize: 11 * scale,
      lineHeight: 18,
      marginTop: 3,
      fontFamily,
    },

    sectionCard: {
      marginHorizontal: 14,
      marginBottom: 14,
      padding: 12,
      borderRadius: 18,
      backgroundColor: c.panel,
      borderWidth: 1,
      borderColor: c.line,
      ...SHADOWS.sm,
    },

    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingBottom: 10,
      marginBottom: 4,
      borderBottomWidth: 1,
      borderBottomColor: c.line,
    },

    sectionTitle: {
      color: c.ink,
      fontSize: 17 * scale,
      fontWeight: '900',
      fontFamily,
    },

    sectionHint: {
      color: c.inkSub,
      fontSize: 10.5 * scale,
      fontFamily,
      marginTop: 2,
    },

    sectionBadge: {
      minWidth: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: c.navy,
      alignItems: 'center',
      justifyContent: 'center',
    },

    sectionBadgeText: {
      color: '#fff',
      fontSize: 12 * scale,
      fontWeight: '900',
      fontFamily,
    },

    testCard: {
      marginTop: 10,
      padding: 12,
      borderRadius: 15,
      backgroundColor: c.paper,
      borderWidth: 1,
      borderColor: c.line,
    },

    criticalCard: {
      borderColor: c.danger,
      borderWidth: 2,
    },

    testHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 9,
    },

    testName: {
      color: c.ink,
      fontSize: 14 * scale,
      fontWeight: '900',
      fontFamily,
    },

    abbreviation: {
      color: c.navy,
      fontSize: 10 * scale,
      fontWeight: '800',
      fontFamily,
      marginTop: 2,
    },

    resultInput: {
      minHeight: 50,
      borderRadius: 13,
      borderWidth: 1,
      borderColor: c.line,
      backgroundColor: c.panel,
      paddingHorizontal: 13,
      color: c.ink,
      fontSize: 15 * scale,
      fontWeight: '800',
      fontFamily,
    },

    resultInputCritical: {
      borderColor: c.danger,
      backgroundColor: '#FFF5F5',
    },

    metadata: {
      marginTop: 9,
      gap: 5,
    },

    metaRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 8,
    },

    metaLabel: {
      color: c.inkSub,
      fontSize: 10 * scale,
      fontFamily,
      fontWeight: '700',
    },

    metaValue: {
      flex: 1,
      color: c.ink,
      fontSize: 10.5 * scale,
      fontFamily,
      fontWeight: '700',
      textAlign: 'right',
    },

    reference: {
      color: c.navy,
    },

    price: {
      color: c.seal,
    },

    notes: {
      color: c.inkSub,
      fontSize: 10 * scale,
      lineHeight: 17,
      fontFamily,
      marginTop: 3,
    },

    criticalBadge: {
      backgroundColor: c.danger,
      borderRadius: 9,
      paddingHorizontal: 8,
      paddingVertical: 5,
      marginLeft: 8,
    },

    criticalBadgeText: {
      color: '#fff',
      fontSize: 9 * scale,
      fontWeight: '900',
      fontFamily,
    },

    criticalInfo: {
      marginTop: 4,
      paddingHorizontal: 8,
      paddingVertical: 6,
      borderRadius: 8,
      backgroundColor: '#FFF1F1',
    },

    criticalInfoText: {
      color: c.danger,
      fontSize: 9.5 * scale,
      fontWeight: '800',
      fontFamily,
      textAlign: 'right',
    },

    bottomActions: {
      paddingHorizontal: 14,
      gap: 9,
    },

    saveButton: {
      minHeight: 54,
      borderRadius: 15,
      backgroundColor: c.navy,
      alignItems: 'center',
      justifyContent: 'center',
      ...SHADOWS.sm,
    },

    saveButtonText: {
      color: '#fff',
      fontSize: 14 * scale,
      fontWeight: '900',
      fontFamily,
    },

    cancelButton: {
      minHeight: 48,
      borderRadius: 14,
      backgroundColor: c.panel,
      borderWidth: 1,
      borderColor: c.line,
      alignItems: 'center',
      justifyContent: 'center',
    },

    cancelButtonText: {
      color: c.inkSub,
      fontSize: 13 * scale,
      fontWeight: '800',
      fontFamily,
    },

    disabled: {
      opacity: 0.6,
    },

    empty: {
      margin: 14,
      padding: 28,
      borderRadius: 18,
      backgroundColor: c.panel,
      borderWidth: 1,
      borderColor: c.line,
      alignItems: 'center',
    },

    emptyTitle: {
      color: c.ink,
      fontSize: 17 * scale,
      fontWeight: '900',
      fontFamily,
    },

    emptyText: {
      color: c.inkSub,
      fontSize: 11 * scale,
      fontFamily,
      textAlign: 'center',
      marginTop: 6,
    },

    missing: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.paper,
      padding: 20,
    },

    missingTitle: {
      color: c.ink,
      fontSize: 19 * scale,
      fontWeight: '900',
      fontFamily,
    },

    backMissing: {
      marginTop: 15,
      paddingHorizontal: 22,
      paddingVertical: 11,
      borderRadius: 12,
      backgroundColor: c.navy,
    },

    backMissingText: {
      color: '#fff',
      fontSize: 13 * scale,
      fontWeight: '900',
      fontFamily,
    },
  }); 
