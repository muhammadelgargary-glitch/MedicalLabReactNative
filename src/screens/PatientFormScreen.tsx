import React, {useEffect, useState} from 'react';
import {
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';

import {useLabStore} from '../store/useLabStore';
import {
  emptySectionData,
  SECTION_KEYS,
  TEST_SECTIONS,
  SectionKey,
} from '../utils/constants';
import {todayISO} from '../utils/helpers';
import SectionCard from '../components/SectionCard';

export default function PatientFormScreen({route, navigation}: any) {
  const {patients, upsertPatient} = useLabStore();

  const existing = patients.find(
    p => p.id === route.params?.id
  );

  const [p, setP] = useState<any>(
    existing || {
      ...emptySectionData(),
      name: '',
      seq: '',
      age: '',
      gender: 'ذكر',
      date: todayISO(),
      notes: '',
    }
  );

  const [active, setActive] = useState<SectionKey[]>(
    SECTION_KEYS.filter(k => p[`include${k}`])
  );

  // عند فتح سجل موجود
  useEffect(() => {
    if (existing) {
      setP(existing);

      setActive(
        SECTION_KEYS.filter(k => existing[`include${k}`])
      );
    }
  }, [existing?.id]);

  const toggle = (k: SectionKey) => {
    const on = !p[`include${k}`];

    setP({
      ...p,
      [`include${k}`]: on,
    });

    setActive(current =>
      on
        ? current.includes(k)
          ? current
          : [...current, k]
        : current.filter(x => x !== k)
    );
  };

  const save = async () => {
    if (!String(p.name || '').trim()) {
      Alert.alert('تنبيه', 'أدخل اسم المريض');
      return;
    }

    try {
      await upsertPatient({
        ...p,
        name: String(p.name).trim(),
        age: String(p.age || '').trim(),
        gender: String(p.gender || '').trim(),
        date: String(p.date || todayISO()).trim(),
        notes: String(p.notes || '').trim(),
      });

      Alert.alert('تم الحفظ', 'تم حفظ سجل المريض بنجاح', [
        {
          text: 'موافق',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error('Patient save error:', error);

      Alert.alert(
        'خطأ',
        'حدث خطأ أثناء حفظ سجل المريض'
      );
    }
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{
        padding: 12,
        paddingBottom: 40,
      }}
      keyboardShouldPersistTaps="handled"
    >
      {/* بيانات المريض */}
      <View style={styles.card}>
        <Text style={styles.title}>بيانات المريض</Text>

        <Input
          label="اسم المريض الكامل *"
          value={p.name}
          placeholder="أدخل اسم المريض"
          onChangeText={(v: string) =>
            setP({...p, name: v})
          }
        />

        <View style={styles.row}>
          <Input
            label="رقم السجل"
            value={p.seq}
            placeholder="تلقائي"
            editable={false}
            flex
            onChangeText={(v: string) =>
              setP({...p, seq: v})
            }
          />

          <Input
            label="العمر"
            value={p.age}
            placeholder="العمر"
            keyboardType="numeric"
            flex
            onChangeText={(v: string) =>
              setP({...p, age: v})
            }
          />
        </View>

        <View style={styles.row}>
          <Input
            label="الجنس"
            value={p.gender}
            placeholder="الجنس"
            flex
            onChangeText={(v: string) =>
              setP({...p, gender: v})
            }
          />

          <Input
            label="التاريخ YYYY-MM-DD"
            value={p.date}
            placeholder="YYYY-MM-DD"
            flex
            onChangeText={(v: string) =>
              setP({...p, date: v})
            }
          />
        </View>

        <Input
          label="ملاحظات"
          value={p.notes}
          placeholder="أدخل أي ملاحظات..."
          multiline
          numberOfLines={4}
          onChangeText={(v: string) =>
            setP({...p, notes: v})
          }
        />
      </View>

      {/* اختيار الأقسام */}
      <View style={styles.card}>
        <Text style={styles.title}>
          اختيار أقسام الفحوصات
        </Text>

        <Text style={styles.helper}>
          اختر الأقسام التي تريد إدخال نتائجها للمريض
        </Text>

        <View style={styles.chips}>
          {SECTION_KEYS.map(k => {
            const selected = !!p[`include${k}`];

            return (
              <TouchableOpacity
                key={k}
                activeOpacity={0.8}
                onPress={() => toggle(k)}
                style={[
                  styles.chip,
                  selected && styles.chipOn,
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    selected && styles.chipTextOn,
                  ]}
                >
                  {TEST_SECTIONS[k].icon}{' '}
                  {TEST_SECTIONS[k].label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* أقسام الفحوصات */}
      {active.map(k => (
        <SectionCard
          key={k}
          section={k}
          value={
            p[TEST_SECTIONS[k].dataKey] || {}
          }
          onChange={v =>
            setP({
              ...p,
              [TEST_SECTIONS[k].dataKey]: v,
            })
          }
        />
      ))}

      {/* الحفظ */}
      <TouchableOpacity
        style={styles.save}
        activeOpacity={0.85}
        onPress={save}
      >
        <Text style={styles.saveText}>
          💾 حفظ السجل
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function Input({
  label,
  value,
  onChangeText,
  flex,
  editable = true,
  placeholder,
  keyboardType = 'default',
  multiline = false,
  numberOfLines,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  flex?: boolean;
  editable?: boolean;
  placeholder?: string;
  keyboardType?: any;
  multiline?: boolean;
  numberOfLines?: number;
}) {
  return (
    <View
      style={{
        flex: flex ? 1 : undefined,
        marginBottom: 10,
      }}
    >
      <Text style={styles.label}>
        {label}
      </Text>

      <TextInput
        value={value ?? ''}
        onChangeText={onChangeText}
        editable={editable}
        placeholder={placeholder}
        placeholderTextColor="#999"
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={numberOfLines}
        textAlign="right"
        textAlignVertical={
          multiline ? 'top' : 'center'
        }
        style={[
          styles.input,
          multiline && styles.multilineInput,
          !editable && styles.disabledInput,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f4f7f6',
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e6e3',
  },

  title: {
    fontSize: 19,
    fontWeight: '900',
    color: '#1d3b36',
    textAlign: 'right',
    marginBottom: 12,
  },

  helper: {
    textAlign: 'right',
    color: '#777',
    fontSize: 13,
    marginBottom: 10,
  },

  label: {
    fontWeight: '700',
    textAlign: 'right',
    marginBottom: 5,
    color: '#33413d',
  },

  input: {
    borderWidth: 1,
    borderColor: '#ccd6d2',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    textAlign: 'right',
    backgroundColor: '#fafcfc',
    color: '#222',
    minHeight: 44,
  },

  multilineInput: {
    minHeight: 100,
    paddingTop: 12,
  },

  disabledInput: {
    backgroundColor: '#eef2f0',
    color: '#777',
  },

  row: {
    flexDirection: 'row-reverse',
    gap: 10,
  },

  chips: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
  },

  chip: {
    borderWidth: 1,
    borderColor: '#ccd6d2',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: '#fff',
  },

  chipOn: {
    backgroundColor: '#1d3b36',
    borderColor: '#1d3b36',
  },

  chipText: {
    color: '#33413d',
    fontWeight: '700',
  },

  chipTextOn: {
    color: '#fff',
  },

  save: {
    backgroundColor: '#1d3b36',
    padding: 15,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 2,
  },

  saveText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '900',
  },
});
