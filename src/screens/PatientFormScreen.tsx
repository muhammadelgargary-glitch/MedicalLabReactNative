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
import { useLabStore, Patient, PatientPricing } from '../store/useLabStore';
import { getColors } from '../styles/colors';
import { resolveFontFamily, fontScale } from '../styles/design';
import { SHADOWS } from '../styles/spacing';
import { uid, todayISO } from '../utils/helpers';
import ThemedButton from '../components/ThemedButton';
import { SECTION_KEYS, TEST_SECTIONS, SectionKey } from '../utils/constants';

const testId = (section: string, key: string) => `${section}.${key}`;

export default function PatientFormScreen({ route, navigation }: any) {
  const id = route.params?.id;
  const patients = useLabStore((s) => s.patients);
  const add = useLabStore((s) => s.addPatient);
  const update = useLabStore((s) => s.updatePatient);
  const testCatalog = useLabStore((s) => s.testCatalog);
  const testPrices = useLabStore((s) => s.testPrices);
  const dark = useLabStore((s) => s.darkMode);
  const theme = useLabStore((s) => s.theme);
  const family = useLabStore((s) => s.fontFamily);
  const size = useLabStore((s) => s.fontSize);

  const colors = getColors(dark, theme);
  const styles = createStyles(colors, resolveFontFamily(family), fontScale(size));

  const [name, setName] = useState('');
  const [seq, setSeq] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('ذكر');
  const [notes, setNotes] = useState('');
  const [paidAmount, setPaidAmount] = useState('0');
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const today = todayISO();
  const getNextDailySequence = (dateValue: string) => {
    let max = 0;
    patients.forEach((p) => {
      if ((p.date || '') !== dateValue) return;
      const n = parseInt(String(p.seq || '').replace(/\D/g, ''), 10);
      if (Number.isFinite(n) && n > max) max = n;
    });
    return String(max + 1);
  };

  useEffect(() => {
    if (!id) {
      setSeq(getNextDailySequence(today));
      setPaidAmount('0');
      return;
    }
    const p = patients.find((x) => x.id === id);
    if (!p) return;
    setName(p.name || '');
    setSeq(p.seq || '');
    setAge(p.age || '');
    setGender(p.gender || 'ذكر');
    setNotes(p.notes || '');
    setPaidAmount(String(p.pricing?.paid ?? 0));

    const selected: string[] = Array.isArray(p.selectedTests) && p.selectedTests.length
      ? p.selectedTests
      : SECTION_KEYS.flatMap((sectionKey) => {
          if (!(p as any)[`include${sectionKey}`]) return [];
          const data = (p as any)[TEST_SECTIONS[sectionKey].dataKey] || {};
          const keysWithResults = TEST_SECTIONS[sectionKey].fields
            .filter((field) => data[field.key] !== undefined)
            .map((field) => testId(sectionKey, field.key));
          return keysWithResults.length
            ? keysWithResults
            : getSectionTests(sectionKey).map((t: any) => testId(sectionKey, t.key || t.id));
        });
    setSelectedTests(Array.from(new Set<string>(selected as string[])));

    const opens: Record<string, boolean> = {};
    SECTION_KEYS.forEach((key) => {
      opens[key] = selected.some((x: string) => x.startsWith(`${key}.`));
    });
    setOpenSections(opens);
  }, [id, patients, testCatalog]);

  const getSectionTests = (sectionKey: SectionKey): any[] => {
    const catalog = (testCatalog || []).filter((t: any) => t?.enabled !== false && t?.section === sectionKey);
    if (catalog.length) return catalog;
    return TEST_SECTIONS[sectionKey].fields;
  };

  const sectionSelection = useMemo(() => {
    const map: Record<string, number> = {};
    SECTION_KEYS.forEach((key) => {
      map[key] = selectedTests.filter((x) => x.startsWith(`${key}.`)).length;
    });
    return map;
  }, [selectedTests]);

  const selectedItems = useMemo(() => {
    const items: any[] = [];
    SECTION_KEYS.forEach((sectionKey) => {
      getSectionTests(sectionKey).forEach((test: any) => {
        const key = test.key || test.id;
        if (selectedTests.includes(testId(sectionKey, key))) {
          items.push({ ...test, sectionKey });
        }
      });
    });
    return items;
  }, [selectedTests, testCatalog, testPrices]);

  const totalPrice = useMemo(() => selectedItems.reduce((sum, test) => {
    const key = test.key || test.id;
    const price = typeof test.price === 'number' ? test.price : Number(testPrices?.[key] || 0);
    return sum + (Number.isFinite(price) ? price : 0);
  }, 0), [selectedItems, testPrices]);

  const pricingComplete = useMemo(() => selectedItems.length > 0 && selectedItems.every((test) => {
    const key = test.key || test.id;
    const raw = typeof test.price === 'number' ? test.price : testPrices?.[key];
    return raw !== undefined && raw !== null && Number.isFinite(Number(raw)) && Number(raw) > 0;
  }), [selectedItems, testPrices]);

  const paidNumeric = Math.max(0, Number(paidAmount || 0) || 0);
  const remainingAmount = pricingComplete ? Math.max(0, totalPrice - Math.min(paidNumeric, totalPrice)) : 0;

  const toggleSection = (key: SectionKey) => {
    if (busy) return;
    setOpenSections((current) => ({ ...current, [key]: !current[key] }));
  };

  const toggleTest = (sectionKey: SectionKey, key: string) => {
    if (busy) return;
    const value = testId(sectionKey, key);
    setSelectedTests((current) => current.includes(value)
      ? current.filter((x) => x !== value)
      : [...current, value]);
    setOpenSections((current) => ({ ...current, [sectionKey]: true }));
  };

  const selectAllInSection = (sectionKey: SectionKey) => {
    const ids = getSectionTests(sectionKey).map((t: any) => testId(sectionKey, t.key || t.id));
    const allSelected = ids.length > 0 && ids.every((x) => selectedTests.includes(x));
    setSelectedTests((current) => allSelected
      ? current.filter((x) => !x.startsWith(`${sectionKey}.`))
      : Array.from(new Set([...current, ...ids])));
    setOpenSections((current) => ({ ...current, [sectionKey]: true }));
  };

  const submit = async () => {
    if (busy) return;
    const cleanName = name.trim();
    const cleanSeq = seq.trim();
    const cleanAge = age.trim();
    if (!cleanName) {
      Alert.alert('بيانات ناقصة', 'أدخل اسم المريض.');
      return;
    }
    const finalSeq = cleanSeq || getNextDailySequence(today);
    if (!selectedTests.length) {
      Alert.alert('الفحوصات المطلوبة', 'حدد فحصًا واحدًا على الأقل من الأقسام.');
      return;
    }

    try {
      setBusy(true);
      const selected: string[] = Array.from(new Set<string>(selectedTests));
      const flags: Pick<Patient, 'includeBlood' | 'includeChem' | 'includeUrine' | 'includeSerology' | 'includeStool' | 'includePreg'> = { includeBlood: false, includeChem: false, includeUrine: false, includeSerology: false, includeStool: false, includePreg: false };
      SECTION_KEYS.forEach((key) => {
        flags[`include${key}` as keyof typeof flags] = selected.some((x: string) => x.startsWith(`${key}.`));
      });

      if (id) {
        await update(id, {
          name: cleanName,
          seq: finalSeq,
          age: cleanAge,
          gender,
          notes,
          selectedTests: selected,
          pricing: buildPricing(selectedItems, paidAmount, testPrices),
          ...flags,
        });
        // بعد تعديل بيانات المريض نرجع مباشرة إلى التقرير.
        navigation.replace('PatientReport', { id });
      } else {
        const patient: Patient = {
          id: uid('patient'),
          name: cleanName,
          seq: finalSeq,
          age: cleanAge,
          gender,
          date: new Date().toISOString().slice(0, 10),
          notes,
          blood: {}, chem: {}, urine: {}, serology: {}, stool: {}, preg: {},
          selectedTests: selected,
          pricing: buildPricing(selectedItems, paidAmount, testPrices),
          ...flags,
        };
        await add(patient);
        // بعد الإضافة نرجع إلى قائمة المرضى؛ ومن بطاقة المريض يوجد زر إدخال النتائج.
        navigation.goBack();
      }
    } catch (e: any) {
      Alert.alert('خطأ', e?.message || 'تعذر حفظ السجل.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <TouchableOpacity onPress={() => !busy && navigation.goBack()} style={styles.back} disabled={busy}>
            <Text style={styles.backText}>‹</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.kicker}>السجلات</Text>
            <Text style={styles.title}>{id ? 'تعديل بيانات المريض' : 'إضافة مريض جديد'}</Text>
          </View>
        </View>

        <Section title="البيانات الأساسية" styles={styles}>
          <Field label="اسم المريض" value={name} onChangeText={setName} placeholder="مثال: أحمد محمد" styles={styles} editable={!busy} />
          <View style={styles.two}>
            <View style={{ flex: 1 }}>
              <Field label="رقم السجل" value={seq} onChangeText={setSeq} placeholder="تلقائي" styles={styles} editable={!busy} />
              <TouchableOpacity disabled={busy} onPress={() => setSeq(getNextDailySequence(today))} style={styles.autoSeqButton}><Text style={styles.autoSeqText}>↻ رقم تلقائي لليوم</Text></TouchableOpacity>
            </View>
            <View style={{ flex: 1 }}><Field label="العمر (اختياري)" value={age} onChangeText={setAge} placeholder="يمكن تركه فارغاً" keyboardType="numeric" styles={styles} editable={!busy} /></View>
          </View>
          <Text style={styles.label}>الجنس</Text>
          <View style={styles.choices}>
            {['ذكر', 'أنثى'].map((g) => (
              <TouchableOpacity key={g} onPress={() => !busy && setGender(g)} style={[styles.choice, gender === g && styles.active]}>
                <Text style={[styles.choiceText, gender === g && styles.activeText]}>{g}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Section>

        <Section title="الفحوصات المطلوبة" styles={styles}>
          <Text style={styles.help}>اختر القسم لعرض فحوصاته، ثم حدد فقط الفحوصات التي يحتاجها المريض.</Text>
          <View style={styles.sectionGrid}>
            {SECTION_KEYS.map((key) => {
              const section = TEST_SECTIONS[key];
              const count = sectionSelection[key] || 0;
              const open = !!openSections[key];
              return (
                <TouchableOpacity key={key} onPress={() => toggleSection(key)} disabled={busy} style={[styles.sectionChip, open && styles.sectionChipActive]}>
                  <Text style={styles.sectionIcon}>{section.icon}</Text>
                  <Text style={[styles.sectionChipText, open && styles.activeText]}>{section.label}</Text>
                  <Text style={[styles.countBadge, open && styles.countBadgeActive]}>{count}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Section>

        {SECTION_KEYS.map((sectionKey) => {
          if (!openSections[sectionKey]) return null;
          const section = TEST_SECTIONS[sectionKey];
          const tests = getSectionTests(sectionKey);
          const ids = tests.map((t: any) => testId(sectionKey, t.key || t.id));
          const allSelected = ids.length > 0 && ids.every((x) => selectedTests.includes(x));
          return (
            <Section key={sectionKey} title={`${section.icon} ${section.label}`} styles={styles}>
              <View style={styles.sectionTools}>
                <Text style={styles.help}>{sectionSelection[sectionKey] || 0} من {tests.length} فحص محدد</Text>
                <TouchableOpacity onPress={() => selectAllInSection(sectionKey)} style={styles.selectAll} disabled={busy}>
                  <Text style={styles.selectAllText}>{allSelected ? 'إلغاء الكل' : 'اختيار الكل'}</Text>
                </TouchableOpacity>
              </View>
              {tests.map((test: any) => {
                const key = test.key || test.id;
                const selected = selectedTests.includes(testId(sectionKey, key));
                const price = typeof test.price === 'number' ? test.price : Number(testPrices?.[key] || 0);
                return (
                  <TouchableOpacity key={key} onPress={() => toggleTest(sectionKey, key)} disabled={busy} style={[styles.testRow, selected && styles.testRowSelected]} activeOpacity={0.8}>
                    <View style={[styles.checkbox, selected && styles.checkboxSelected]}><Text style={styles.checkText}>{selected ? '✓' : ''}</Text></View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.testName}>{test.name || test.label || key}</Text>
                      <Text style={styles.testMeta}>
                        {test.abbreviation ? `${test.abbreviation} • ` : ''}{test.referenceRange || test.normal || 'القيمة المرجعية غير محددة'}
                      </Text>
                    </View>
                    <Text style={styles.testPrice}>{price > 0 ? `${price.toLocaleString('en-US')} د.ع` : 'بدون سعر'}</Text>
                  </TouchableOpacity>
                );
              })}
            </Section>
          );
        })}

        <View style={styles.summaryCard}>
          <View><Text style={styles.summaryTitle}>الفحوصات المحددة</Text><Text style={styles.summarySub}>{selectedTests.length} فحص</Text></View>
          <Text style={styles.summaryValue}>{totalPrice.toLocaleString('en-US')} د.ع</Text>
        </View>

        <Section title="الأسعار والدفع" styles={styles}>
          <View style={styles.paymentSummary}>
            <View><Text style={styles.paymentLabel}>إجمالي الفحوصات</Text><Text style={styles.paymentValue}>{totalPrice > 0 ? `${totalPrice.toLocaleString('en-US')} د.ع` : 'غير مكتمل التسعير'}</Text></View>
            <View><Text style={styles.paymentLabel}>المتبقي</Text><Text style={styles.paymentValue}>{pricingComplete ? `${remainingAmount.toLocaleString('en-US')} د.ع` : '—'}</Text></View>
          </View>
          <Field label="المبلغ المدفوع (د.ع)" value={paidAmount} onChangeText={(v) => setPaidAmount(v.replace(/[^0-9]/g, ''))} placeholder="0" keyboardType="numeric" styles={styles} editable={!busy} />
          <Text style={styles.paymentHint}>{pricingComplete ? 'يمكن تعديل المبلغ المدفوع، وسيُحسب المتبقي تلقائياً.' : 'بعض الفحوصات بلا سعر محدد؛ حدّث الأسعار من إدارة أسعار الفحوصات.'}</Text>
        </Section>

        <Section title="ملاحظات" styles={styles}>
          <TextInput value={notes} onChangeText={setNotes} multiline numberOfLines={5} textAlignVertical="top" editable={!busy} placeholder="ملاحظات اختيارية" placeholderTextColor={colors.inkSub} style={[styles.input, { minHeight: 110, paddingTop: 12 }]} />
        </Section>

        <View style={styles.actions}>
          <ThemedButton title={id ? 'حفظ التعديلات' : 'حفظ المريض'} onPress={submit} loading={busy} />
          <ThemedButton title="إلغاء" variant="secondary" onPress={() => !busy && navigation.goBack()} style={{ marginTop: 9 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}


function buildPricing(items: any[], paidText: string, prices: Record<string, number> = {}): PatientPricing {
  const getPrice = (test: any) => {
    const key = test.key || test.id;
    const raw = typeof test.price === 'number' && test.price > 0 ? test.price : prices?.[key];
    return Number(raw || 0);
  };
  const total = items.reduce((sum, test) => {
    const price = getPrice(test);
    return sum + (Number.isFinite(price) ? price : 0);
  }, 0);
  const complete = items.length > 0 && items.every((test) => getPrice(test) > 0);
  const paidRaw = Math.max(0, Number(paidText || 0) || 0);
  const paid = complete ? Math.min(paidRaw, total) : paidRaw;
  return { total, paid, remaining: complete ? Math.max(0, total - paid) : null, complete, currency: 'IQD', pricedAt: new Date().toISOString() };
}

function Section({ title, children, styles }: any) {
  return <View style={styles.section}><Text style={styles.sectionTitle}>{title}</Text>{children}</View>;
}
function Field({ label, value, onChangeText, placeholder, keyboardType, styles, editable = true }: any) {
  return <View style={{ marginBottom: 9 }}><Text style={styles.label}>{label}</Text><TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#8A9791" keyboardType={keyboardType} editable={editable} style={styles.input} /></View>;
}

const createStyles = (c: any, f: string, s: number) => StyleSheet.create({
  container:{flex:1,backgroundColor:c.paper}, content:{paddingBottom:40},
  header:{backgroundColor:c.headerBg,padding:18,flexDirection:'row',alignItems:'center'},
  back:{width:40,height:40,borderRadius:12,backgroundColor:'rgba(255,255,255,.12)',alignItems:'center',justifyContent:'center',marginRight:12}, backText:{color:'#fff',fontSize:30},
  kicker:{color:'#B7E8E2',fontSize:11*s,fontWeight:'700',fontFamily:f}, title:{color:'#fff',fontSize:22*s,fontWeight:'900',fontFamily:f,marginTop:2},
  section:{margin:14,padding:16,borderRadius:18,backgroundColor:c.panel,borderWidth:1,borderColor:c.line,...SHADOWS.sm}, sectionTitle:{fontSize:16*s,fontWeight:'900',color:c.ink,fontFamily:f,marginBottom:12},
  label:{fontSize:12*s,color:c.ink,fontWeight:'800',fontFamily:f,marginBottom:5}, input:{minHeight:46,borderRadius:13,borderWidth:1,borderColor:c.line,backgroundColor:c.paper,paddingHorizontal:12,color:c.ink,textAlign:'right',fontFamily:f,fontSize:13*s},
  two:{flexDirection:'row',gap:10}, autoSeqButton:{alignSelf:'flex-start',marginTop:5,paddingHorizontal:9,paddingVertical:6,borderRadius:9,backgroundColor:c.sealLight,borderWidth:1,borderColor:c.line}, autoSeqText:{color:c.navy,fontSize:10*s,fontWeight:'900',fontFamily:f}, choices:{flexDirection:'row',gap:8}, choice:{flex:1,minHeight:44,borderRadius:13,borderWidth:1,borderColor:c.line,backgroundColor:c.paper,alignItems:'center',justifyContent:'center'}, active:{backgroundColor:c.navy,borderColor:c.navy}, choiceText:{fontSize:13*s,fontWeight:'800',color:c.ink,fontFamily:f}, activeText:{color:'#fff'},
  help:{fontSize:11*s,color:c.inkSub,fontFamily:f,lineHeight:18,marginBottom:10}, sectionGrid:{flexDirection:'row',flexWrap:'wrap',gap:9}, sectionChip:{width:'31.5%',minHeight:82,borderRadius:15,borderWidth:1,borderColor:c.line,backgroundColor:c.paper,padding:9,alignItems:'center',justifyContent:'center'}, sectionChipActive:{backgroundColor:c.navy,borderColor:c.navy}, sectionIcon:{fontSize:22,marginBottom:3}, sectionChipText:{fontSize:11*s,fontWeight:'900',fontFamily:f,color:c.ink}, countBadge:{marginTop:4,minWidth:23,height:23,borderRadius:12,backgroundColor:c.line,color:c.ink,overflow:'hidden',textAlign:'center',fontSize:10*s,fontWeight:'900',paddingTop:4}, countBadgeActive:{backgroundColor:'rgba(255,255,255,.2)',color:'#fff'},
  sectionTools:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:8}, selectAll:{paddingHorizontal:12,paddingVertical:8,borderRadius:11,backgroundColor:c.sealLight,borderWidth:1,borderColor:c.line}, selectAllText:{color:c.navy,fontSize:11*s,fontWeight:'900',fontFamily:f},
  testRow:{minHeight:72,borderRadius:14,borderWidth:1,borderColor:c.line,backgroundColor:c.paper,padding:11,marginTop:8,flexDirection:'row',alignItems:'center',gap:10}, testRowSelected:{borderColor:c.navy,backgroundColor:c.sealLight}, checkbox:{width:28,height:28,borderRadius:9,borderWidth:2,borderColor:c.line,alignItems:'center',justifyContent:'center'}, checkboxSelected:{backgroundColor:c.navy,borderColor:c.navy}, checkText:{color:'#fff',fontSize:17,fontWeight:'900'}, testName:{color:c.ink,fontSize:13*s,fontWeight:'900',fontFamily:f,textAlign:'right'}, testMeta:{color:c.inkSub,fontSize:9.5*s,fontFamily:f,marginTop:3,textAlign:'right'}, testPrice:{color:c.navy,fontSize:10*s,fontWeight:'900',fontFamily:f,maxWidth:75,textAlign:'center'},
  paymentSummary:{flexDirection:'row',justifyContent:'space-between',gap:10,marginBottom:8,padding:13,borderRadius:14,backgroundColor:c.sealLight,borderWidth:1,borderColor:c.line}, paymentLabel:{color:c.inkSub,fontSize:10*s,fontWeight:'800',fontFamily:f}, paymentValue:{color:c.navy,fontSize:15*s,fontWeight:'900',fontFamily:f,marginTop:3}, paymentHint:{color:c.inkSub,fontSize:10*s,fontFamily:f,lineHeight:17},
  summaryCard:{marginHorizontal:14,marginTop:0,padding:16,borderRadius:16,backgroundColor:c.headerBg,flexDirection:'row',alignItems:'center',justifyContent:'space-between'}, summaryTitle:{color:'#fff',fontSize:13*s,fontWeight:'900',fontFamily:f}, summarySub:{color:'#D7EFEC',fontSize:10*s,fontFamily:f,marginTop:3}, summaryValue:{color:'#fff',fontSize:17*s,fontWeight:'900',fontFamily:f},
  actions:{margin:14,marginTop:12},
});
