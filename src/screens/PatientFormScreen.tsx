// src/screens/PatientFormScreen.tsx

import React, { useEffect, useMemo, useState } from 'react';
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
import { getColors } from '../styles/colors';
import { resolveFontFamily, fontScale } from '../styles/design';
import { BORDER_RADIUS, SHADOWS } from '../styles/spacing';
import { uid } from '../utils/helpers';
import ThemedButton from '../components/ThemedButton';
import { SECTION_KEYS, TEST_SECTIONS } from '../utils/constants';

export default function PatientFormScreen({ route, navigation }: any) {
  const id = route.params?.id;

  const patients = useLabStore((s) => s.patients);
  const add = useLabStore((s) => s.addPatient);
  const update = useLabStore((s) => s.updatePatient);

  const dark = useLabStore((s) => s.darkMode);
  const theme = useLabStore((s) => s.theme);
  const family = useLabStore((s) => s.fontFamily);
  const size = useLabStore((s) => s.fontSize);

  // الكتالوج والأسعار المضافة حديثًا
  const testCatalog = useLabStore((s) => s.testCatalog);
  const testPrices = useLabStore((s) => s.testPrices);

  const colors = getColors(dark, theme);
  const styles = createStyles(
    colors,
    resolveFontFamily(family),
    fontScale(size),
  );

  const [name, setName] = useState('');
  const [seq, setSeq] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('ذكر');
  const [notes, setNotes] = useState('');

  const [includes, setIncludes] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);

  /*
   * تحميل بيانات المريض عند التعديل.
   * نحافظ على نفس الحقول القديمة بدون تغيير.
   */
  useEffect(() => {
    if (!id) return;

    const p = patients.find((x) => x.id === id);
    if (!p) return;

    setName(p.name || '');
    setSeq(p.seq || '');
    setAge(p.age || '');
    setGender(p.gender || 'ذكر');
    setNotes(p.notes || '');

    const x: Record<string, boolean> = {};

    SECTION_KEYS.forEach((k) => {
      x[k] = !!(p as any)[`include${k}`];
    });

    setIncludes(x);
  }, [id, patients]);

  const toggle = (key: string) => {
    setIncludes((v) => ({
      ...v,
      [key]: !v[key],
    }));
  };

  /*
   * الحصول على فحوصات القسم من الكتالوج.
   *
   * لا نفترض وجود أسماء أو قيم طبية جديدة.
   * إذا لم يوجد كتالوج محفوظ، نعرض ما توفر من TEST_SECTIONS
   * الموجود أصلًا في المشروع.
   */
  const getSectionTests = (sectionKey: string): any[] => {
    const catalog = Array.isArray(testCatalog)
      ? testCatalog.filter(
          (t: any) =>
            t &&
            (
              t.section === sectionKey ||
              t.sectionKey === sectionKey ||
              t.sectionId === sectionKey
            ),
        )
      : [];

    if (catalog.length > 0) {
      return catalog;
    }

    const section: any = (TEST_SECTIONS as any)[sectionKey];

    if (!section) return [];

    if (Array.isArray(section.fields)) {
      return section.fields;
    }

    if (Array.isArray(section.tests)) {
      return section.tests;
    }

    return [];
  };

  /*
   * حساب السعر الإجمالي للفحوصات الظاهرة في الأقسام المختارة.
   * لا يفرض السعر على المريض ولا يغير بياناته؛
   * هو عرض معلوماتي فقط داخل شاشة الإضافة.
   */
  const selectedTests = useMemo(() => {
    const result: any[] = [];

    SECTION_KEYS.forEach((sectionKey) => {
      if (!includes[sectionKey]) return;

      const tests = getSectionTests(sectionKey);

      tests.forEach((test: any) => {
        result.push({
          ...test,
          sectionKey,
        });
      });
    });

    return result;
  }, [includes, testCatalog, testPrices]);

  const totalPrice = useMemo(() => {
    return selectedTests.reduce((sum, test) => {
      const key = test.key || test.id;

      const catalogPrice =
        typeof test.price === 'number'
          ? test.price
          : key && typeof testPrices?.[key] === 'number'
            ? testPrices[key]
            : 0;

      return sum + Number(catalogPrice || 0);
    }, 0);
  }, [selectedTests, testPrices]);

  /*
   * حفظ المريض.
   *
   * مهم:
   * - يمنع تنفيذ العملية أكثر من مرة أثناء الحفظ.
   * - يحافظ على جميع حقول المريض القديمة.
   * - لا يغير بنية بيانات النتائج الحالية.
   */
  const submit = async () => {
    if (busy) return;

    const cleanName = name.trim();
    const cleanSeq = seq.trim();
    const cleanAge = age.trim();

    if (!cleanName || !cleanSeq || !cleanAge) {
      Alert.alert(
        'بيانات ناقصة',
        'أدخل الاسم ورقم السجل والعمر.',
      );
      return;
    }

    if (!SECTION_KEYS.some((k) => includes[k])) {
      Alert.alert(
        'الفحوصات',
        'حدد قسمًا واحدًا على الأقل.',
      );
      return;
    }

    try {
      setBusy(true);

      const flags: Record<string, boolean> = {};

      SECTION_KEYS.forEach((k) => {
        flags[`include${k}`] = !!includes[k];
      });

      if (id) {
        /*
         * تعديل سجل موجود.
         * لا نلمس النتائج القديمة أو التاريخ أو بقية الحقول.
         */
        await update(id, {
          name: cleanName,
          seq: cleanSeq,
          age: cleanAge,
          gender,
          notes,
          ...flags,
        });

        Alert.alert(
          'تم الحفظ',
          'تم حفظ تعديلات المريض بنجاح.',
          [
            {
              text: 'حسنًا',
              onPress: () => navigation.goBack(),
            },
          ],
        );
      } else {
        /*
         * إنشاء سجل جديد.
         *
         * جميع أقسام النتائج تبدأ فارغة كما كانت في المشروع.
         */
        const patient: Patient = {
          id: uid('patient'),
          name: cleanName,
          seq: cleanSeq,
          age: cleanAge,
          gender,
          date: new Date().toISOString().slice(0, 10),
          notes,

          blood: {},
          chem: {},
          urine: {},
          serology: {},
          stool: {},
          preg: {},

          ...flags,
        };

        await add(patient);

        Alert.alert(
          'تم الحفظ',
          'تمت إضافة المريض بنجاح.',
          [
            {
              text: 'حسنًا',
              onPress: () => navigation.goBack(),
            },
          ],
        );
      }
    } catch (e: any) {
      Alert.alert(
        'خطأ',
        e?.message || 'تعذر حفظ السجل.',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* رأس الصفحة */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.back}
            disabled={busy}
          >
            <Text style={styles.backText}>‹</Text>
          </TouchableOpacity>

          <View style={{ flex: 1 }}>
            <Text style={styles.kicker}>السجلات</Text>

            <Text style={styles.title}>
              {id ? 'تعديل بيانات المريض' : 'إضافة مريض جديد'}
            </Text>
          </View>
        </View>

        {/* البيانات الأساسية */}
        <Section
          title="البيانات الأساسية"
          styles={styles}
        >
          <Field
            label="اسم المريض"
            value={name}
            onChangeText={setName}
            placeholder="مثال: أحمد محمد"
            styles={styles}
            editable={!busy}
          />

          <View style={styles.two}>
            <View style={{ flex: 1 }}>
              <Field
                label="رقم السجل"
                value={seq}
                onChangeText={setSeq}
                placeholder="001"
                styles={styles}
                editable={!busy}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Field
                label="العمر"
                value={age}
                onChangeText={setAge}
                placeholder="35"
                keyboardType="numeric"
                styles={styles}
                editable={!busy}
              />
            </View>
          </View>

          <Text style={styles.label}>الجنس</Text>

          <View style={styles.choices}>
            {['ذكر', 'أنثى'].map((g) => (
              <TouchableOpacity
                key={g}
                onPress={() => !busy && setGender(g)}
                style={[
                  styles.choice,
                  gender === g && styles.active,
                ]}
              >
                <Text
                  style={[
                    styles.choiceText,
                    gender === g && styles.activeText,
                  ]}
                >
                  {g}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Section>

        {/* الأقسام */}
        <Section
          title="الفحوصات المطلوبة"
          styles={styles}
        >
          <Text style={styles.help}>
            يمكن اختيار أكثر من قسم. عند اختيار القسم ستظهر الفحوصات
            الموجودة داخله.
          </Text>

          <View style={styles.testGrid}>
            {SECTION_KEYS.map((k) => {
              const section: any = (TEST_SECTIONS as any)[k];
              const active = !!includes[k];

              return (
                <TouchableOpacity
                  key={k}
                  onPress={() => toggle(k)}
                  disabled={busy}
                  activeOpacity={0.75}
                  style={[
                    styles.test,
                    active && styles.testActive,
                  ]}
                >
                  <View
                    style={[
                      styles.dot,
                      {
                        backgroundColor: active
                          ? colors.navy
                          : colors.line,
                      },
                    ]}
                  >
                    <Text style={styles.dotText}>
                      {active ? '✓' : ''}
                    </Text>
                  </View>

                  <Text
                    style={[
                      styles.testText,
                      active && styles.activeText,
                    ]}
                  >
                    {section?.label || k}
                  </Text>

                  {active && (
                    <Text style={styles.testCount}>
                      {getSectionTests(k).length > 0
                        ? `${getSectionTests(k).length} فحص`
                        : 'الفحوصات'}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </Section>

        {/* تفاصيل الفحوصات */}
        {SECTION_KEYS.map((sectionKey) => {
          if (!includes[sectionKey]) return null;

          const section: any = (TEST_SECTIONS as any)[sectionKey];
          const tests = getSectionTests(sectionKey);

          if (!tests.length) {
            return null;
          }

          return (
            <Section
              key={`details-${sectionKey}`}
              title={`فحوصات ${section?.label || sectionKey}`}
              styles={styles}
            >
              <Text style={styles.help}>
                الفحوصات المرتبطة بهذا القسم
              </Text>

              <View style={styles.catalogList}>
                {tests.map((test: any, index: number) => {
                  const key = test.key || test.id || `test-${index}`;

                  const price =
                    typeof test.price === 'number'
                      ? test.price
                      : typeof testPrices?.[key] === 'number'
                        ? testPrices[key]
                        : 0;

                  return (
                    <View
                      key={`${sectionKey}-${key}-${index}`}
                      style={styles.catalogItem}
                    >
                      <View style={styles.catalogMain}>
                        <Text style={styles.catalogName}>
                          {test.name ||
                            test.label ||
                            test.title ||
                            key}
                        </Text>

                        {!!test.abbreviation && (
                          <Text style={styles.catalogSub}>
                            الاختصار: {test.abbreviation}
                          </Text>
                        )}

                        {!!test.specimen && (
                          <Text style={styles.catalogSub}>
                            العينة: {test.specimen}
                          </Text>
                        )}

                        {!!test.tube && (
                          <Text style={styles.catalogSub}>
                            الأنبوب: {test.tube}
                          </Text>
                        )}

                        {!!test.referenceRange && (
                          <Text style={styles.referenceText}>
                            المرجع: {test.referenceRange}
                          </Text>
                        )}

                        {!!test.notes && (
                          <Text style={styles.catalogSub}>
                            {test.notes}
                          </Text>
                        )}
                      </View>

                      <View style={styles.priceBox}>
                        <Text style={styles.priceLabel}>
                          السعر
                        </Text>

                        <Text style={styles.priceValue}>
                          {price > 0
                            ? `${price.toLocaleString('en-US')}`
                            : '—'}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </Section>
          );
        })}

        {/* ملخص السعر */}
        {selectedTests.length > 0 && totalPrice > 0 && (
          <View style={styles.totalCard}>
            <View>
              <Text style={styles.totalTitle}>
                إجمالي أسعار الفحوصات
              </Text>

              <Text style={styles.totalSub}>
                {selectedTests.length} فحص
              </Text>
            </View>

            <Text style={styles.totalValue}>
              {totalPrice.toLocaleString('en-US')}
            </Text>
          </View>
        )}

        {/* الملاحظات */}
        <Section
          title="ملاحظات"
          styles={styles}
        >
          <TextInput
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            editable={!busy}
            placeholder="ملاحظات اختيارية"
            placeholderTextColor={colors.inkSub}
            style={[
              styles.input,
              {
                minHeight: 110,
                paddingTop: 12,
              },
            ]}
          />
        </Section>

        {/* أزرار الحفظ */}
        <View style={styles.actions}>
          <ThemedButton
            title={id ? 'حفظ التعديلات' : 'حفظ المريض'}
            onPress={submit}
            loading={busy}
          />

          <ThemedButton
            title="إلغاء"
            variant="secondary"
            onPress={() => !busy && navigation.goBack()}
            style={{ marginTop: 9 }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({
  title,
  children,
  styles,
}: {
  title: string;
  children: any;
  styles: any;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>
        {title}
      </Text>

      {children}
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  styles,
  editable = true,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  keyboardType?: any;
  styles: any;
  editable?: boolean;
}) {
  return (
    <View style={{ marginBottom: 9 }}>
      <Text style={styles.label}>
        {label}
      </Text>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#8A9791"
        keyboardType={keyboardType}
        editable={editable}
        style={styles.input}
      />
    </View>
  );
}

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
      paddingBottom: 40,
    },

    header: {
      backgroundColor: c.headerBg,
      padding: 18,
      flexDirection: 'row',
      alignItems: 'center',
    },

    back: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: 'rgba(255,255,255,.12)',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },

    backText: {
      color: '#fff',
      fontSize: 30,
    },

    kicker: {
      color: '#B7E8E2',
      fontSize: 11 * s,
      fontWeight: '700',
      fontFamily: f,
    },

    title: {
      color: '#fff',
      fontSize: 22 * s,
      fontWeight: '900',
      fontFamily: f,
      marginTop: 2,
    },

    section: {
      margin: 14,
      padding: 16,
      borderRadius: 18,
      backgroundColor: c.panel,
      borderWidth: 1,
      borderColor: c.line,
      ...SHADOWS.sm,
    },

    sectionTitle: {
      fontSize: 16 * s,
      fontWeight: '900',
      color: c.ink,
      fontFamily: f,
      marginBottom: 12,
    },

    label: {
      fontSize: 12 * s,
      color: c.ink,
      fontWeight: '800',
      fontFamily: f,
      marginBottom: 5,
    },

    input: {
      minHeight: 46,
      borderRadius: 13,
      borderWidth: 1,
      borderColor: c.line,
      backgroundColor: c.paper,
      paddingHorizontal: 12,
      color: c.ink,
      textAlign: 'right',
      fontFamily: f,
      fontSize: 13 * s,
    },

    two: {
      flexDirection: 'row',
      gap: 10,
    },

    choices: {
      flexDirection: 'row',
      gap: 8,
    },

    choice: {
      flex: 1,
      minHeight: 44,
      borderRadius: 13,
      borderWidth: 1,
      borderColor: c.line,
      backgroundColor: c.paper,
      alignItems: 'center',
      justifyContent: 'center',
    },

    active: {
      backgroundColor: c.navy,
      borderColor: c.navy,
    },

    choiceText: {
      color: c.ink,
      fontSize: 13 * s,
      fontWeight: '800',
      fontFamily: f,
    },

    activeText: {
      color: '#fff',
    },

    help: {
      color: c.inkSub,
      fontSize: 11 * s,
      fontFamily: f,
      marginBottom: 10,
      lineHeight: 18 * s,
    },

    testGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 9,
    },

    test: {
      width: '31.7%',
      minHeight: 82,
      borderRadius: 15,
      borderWidth: 1,
      borderColor: c.line,
      backgroundColor: c.paper,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 9,
    },

    testActive: {
      backgroundColor: c.sealLight,
      borderColor: c.navy,
    },

    dot: {
      width: 26,
      height: 26,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 6,
    },

    dotText: {
      color: '#fff',
      fontWeight: '900',
    },

    testText: {
      color: c.ink,
      fontSize: 11 * s,
      fontWeight: '800',
      fontFamily: f,
      textAlign: 'center',
    },

    testCount: {
      marginTop: 4,
      color: c.inkSub,
      fontSize: 9 * s,
      fontFamily: f,
      textAlign: 'center',
    },

    catalogList: {
      gap: 8,
    },

    catalogItem: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: c.line,
      backgroundColor: c.paper,
      borderRadius: 14,
      padding: 11,
      minHeight: 72,
    },

    catalogMain: {
      flex: 1,
      paddingRight: 8,
    },

    catalogName: {
      color: c.ink,
      fontSize: 13 * s,
      fontWeight: '900',
      fontFamily: f,
      textAlign: 'right',
    },

    catalogSub: {
      color: c.inkSub,
      fontSize: 10 * s,
      fontFamily: f,
      marginTop: 3,
      textAlign: 'right',
    },

    referenceText: {
      color: c.navy,
      fontSize: 10 * s,
      fontWeight: '800',
      fontFamily: f,
      marginTop: 4,
      textAlign: 'right',
    },

    priceBox: {
      minWidth: 62,
      minHeight: 48,
      borderRadius: 11,
      backgroundColor: c.sealLight,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 7,
    },

    priceLabel: {
      color: c.inkSub,
      fontSize: 8 * s,
      fontFamily: f,
    },

    priceValue: {
      color: c.navy,
      fontSize: 12 * s,
      fontWeight: '900',
      fontFamily: f,
      marginTop: 2,
    },

    totalCard: {
      marginHorizontal: 14,
      marginBottom: 2,
      padding: 16,
      borderRadius: 18,
      backgroundColor: c.headerBg,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      ...SHADOWS.sm,
    },

    totalTitle: {
      color: '#fff',
      fontSize: 14 * s,
      fontWeight: '900',
      fontFamily: f,
      textAlign: 'right',
    },

    totalSub: {
      color: '#B7E8E2',
      fontSize: 10 * s,
      fontFamily: f,
      marginTop: 4,
      textAlign: 'right',
    },

    totalValue: {
      color: '#fff',
      fontSize: 20 * s,
      fontWeight: '900',
      fontFamily: f,
    },

    actions: {
      paddingHorizontal: 14,
    },
  }); 
