// src/screens/PatientFormScreen.tsx - نموذج المريض احترافي

import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Switch,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLabStore, Patient } from '../store/useLabStore';
import { createTheme } from '../styles/theme';
import { getColors } from '../styles/colors';
import { SPACING, BORDER_RADIUS, SHADOWS, FLEX_CENTERS } from '../styles/spacing';
import ThemedButton from '../components/ThemedButton';
import { v4 as uuidv4 } from 'uuid';

interface PatientFormScreenProps {
  route: {
    params?: {
      id?: string;
    };
  };
  navigation: any;
}

export default function PatientFormScreen({ route, navigation }: PatientFormScreenProps) {
  const patientId = route.params?.id;
  const patients = useLabStore((s) => s.patients);
  const addPatient = useLabStore((s) => s.addPatient);
  const updatePatient = useLabStore((s) => s.updatePatient);
  const isDark = useLabStore((s) => s.darkMode);
  const themeType = useLabStore((s) => s.theme);

  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [seq, setSeq] = useState('');
  const [gender, setGender] = useState('ذكر');
  const [age, setAge] = useState('');
  const [notes, setNotes] = useState('');
  const [includeBlood, setIncludeBlood] = useState(false);
  const [includeChem, setIncludeChem] = useState(false);
  const [includeUrine, setIncludeUrine] = useState(false);
  const [includeSerology, setIncludeSerology] = useState(false);
  const [includeStool, setIncludeStool] = useState(false);
  const [includePreg, setIncludePreg] = useState(false);

  const colors = getColors(isDark, themeType);
  const styles = createStyles(colors);

  useEffect(() => {
    if (patientId) {
      const patient = patients.find((p) => p.id === patientId);
      if (patient) {
        setName(patient.name);
        setSeq(patient.seq);
        setGender(patient.gender);
        setAge(patient.age);
        setNotes(patient.notes || '');
        setIncludeBlood(patient.includeBlood);
        setIncludeChem(patient.includeChem);
        setIncludeUrine(patient.includeUrine);
        setIncludeSerology(patient.includeSerology);
        setIncludeStool(patient.includeStool);
        setIncludePreg(patient.includePreg);
      }
    }
  }, [patientId]);

  const handleSubmit = async () => {
    if (!name.trim() || !seq.trim() || !age.trim()) {
      Alert.alert('تحذير', 'يرجى ملء جميع البيانات المطلوبة');
      return;
    }

    if (!includeBlood && !includeChem && !includeUrine && !includeSerology && !includeStool && !includePreg) {
      Alert.alert('تحذير', 'يرجى تحديد نوع فحص واحد على الأقل');
      return;
    }

    try {
      setLoading(true);

      if (patientId) {
        await updatePatient(patientId, {
          name,
          seq,
          gender,
          age,
          notes,
          includeBlood,
          includeChem,
          includeUrine,
          includeSerology,
          includeStool,
          includePreg,
        });
        Alert.alert('نجاح', 'تم تحديث بيانات المريض');
      } else {
        const newPatient: Patient = {
          id: uuidv4(),
          name,
          seq,
          gender,
          age,
          date: new Date().toISOString().split('T')[0],
          notes,
          blood: {},
          chem: {},
          urine: {},
          serology: {},
          stool: {},
          preg: {},
          includeBlood,
          includeChem,
          includeUrine,
          includeSerology,
          includeStool,
          includePreg,
        };
        await addPatient(newPatient);
        Alert.alert('نجاح', 'تم إضافة المريض بنجاح');
      }

      navigation.goBack();
    } catch (error: any) {
      Alert.alert('خطأ', error.message || 'حدث خطأ أثناء حفظ البيانات');
    } finally {
      setLoading(false);
    }
  };

  const testTypes = [
    { id: 'blood', label: 'فحوصات الدم', icon: '🩸', value: includeBlood, setter: setIncludeBlood },
    { id: 'chem', label: 'كيمياء الدم', icon: '🧬', value: includeChem, setter: setIncludeChem },
    { id: 'urine', label: 'تحليل البول', icon: '💧', value: includeUrine, setter: setIncludeUrine },
    { id: 'serology', label: 'الأمصال', icon: '🧪', value: includeSerology, setter: setIncludeSerology },
    { id: 'stool', label: 'تحليل البراز', icon: '🪳', value: includeStool, setter: setIncludeStool },
    { id: 'preg', label: 'اختبار الحمل', icon: '🤰', value: includePreg, setter: setIncludePreg },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* ===== HEADER ===== */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {patientId ? '✏️ تعديل المريض' : '➕ إضافة مريض جديد'}
          </Text>
        </View>

        {/* ===== PERSONAL INFO ===== */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👤 البيانات الشخصية</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>اسم المريض *</Text>
            <TextInput
              style={styles.input}
              placeholder="أدخل اسم المريض"
              placeholderTextColor={colors.inkSub}
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.label}>رقم السجل *</Text>
              <TextInput
                style={styles.input}
                placeholder="رقم السجل"
                placeholderTextColor={colors.inkSub}
                value={seq}
                onChangeText={setSeq}
              />
            </View>

            <View style={[styles.formGroup, { flex: 1, marginLeft: SPACING[2] }]}>
              <Text style={styles.label}>العمر *</Text>
              <TextInput
                style={styles.input}
                placeholder="العمر"
                placeholderTextColor={colors.inkSub}
                value={age}
                onChangeText={setAge}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>النوع</Text>
            <View style={styles.genderButtons}>
              {['ذكر', 'أنثى'].map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[
                    styles.genderButton,
                    gender === g && styles.genderButtonActive,
                  ]}
                  onPress={() => setGender(g)}
                >
                  <Text
                    style={[
                      styles.genderButtonText,
                      gender === g && styles.genderButtonTextActive,
                    ]}
                  >
                    {g === 'ذكر' ? '♂️ ذكر' : '♀️ أنثى'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* ===== TEST TYPES ===== */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🧪 اختر الفحوصات المطلوبة</Text>
          <Text style={styles.sectionDescription}>تحديد واحد على الأقل مطلوب</Text>

          <View style={styles.testTypesGrid}>
            {testTypes.map((test) => (
              <TouchableOpacity
                key={test.id}
                style={[
                  styles.testTypeButton,
                  test.value && styles.testTypeButtonActive,
                ]}
                onPress={() => test.setter(!test.value)}
              >
                <Text style={styles.testTypeIcon}>{test.icon}</Text>
                <Text
                  style={[
                    styles.testTypeLabel,
                    test.value && styles.testTypeLabelActive,
                  ]}
                >
                  {test.label}
                </Text>
                {test.value && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ===== NOTES ===== */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📝 ملاحظات</Text>

          <TextInput
            style={[styles.input, styles.notesInput]}
            placeholder="أضف ملاحظات إضافية..."
            placeholderTextColor={colors.inkSub}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* ===== ACTIONS ===== */}
        <View style={styles.section}>
          <ThemedButton
            title={patientId ? '✏️ تحديث المريض' : '➕ إضافة المريض'}
            variant="primary"
            size="lg"
            loading={loading}
            onPress={handleSubmit}
          />

          <ThemedButton
            title="إلغاء"
            variant="secondary"
            size="lg"
            style={{ marginTop: SPACING[2] }}
            onPress={() => navigation.goBack()}
          />
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
    contentContainer: {
      paddingBottom: SPACING[8],
    },

    // ===== Header =====
    header: {
      backgroundColor: colors.headerBg,
      paddingHorizontal: SPACING[4],
      paddingVertical: SPACING[4],
      marginBottom: SPACING[4],
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: colors.headerText,
      fontFamily: 'Tajawal-Bold',
    },

    // ===== Section =====
    section: {
      paddingHorizontal: SPACING[4],
      marginBottom: SPACING[4],
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.navy,
      marginBottom: SPACING[2],
      fontFamily: 'Tajawal-Bold',
    },
    sectionDescription: {
      fontSize: 12,
      color: colors.inkSub,
      marginBottom: SPACING[3],
      fontFamily: 'Tajawal',
    },

    // ===== Form =====
    formGroup: {
      marginBottom: SPACING[4],
    },
    row: {
      flexDirection: 'row',
      marginBottom: SPACING[4],
    },
    label: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.ink,
      marginBottom: SPACING[1],
      fontFamily: 'Tajawal-Bold',
    },
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
    notesInput: {
      minHeight: 100,
      textAlign: 'right',
      textAlignVertical: 'top',
    },

    // ===== Gender Buttons =====
    genderButtons: {
      flexDirection: 'row',
      gap: SPACING[2],
    },
    genderButton: {
      flex: 1,
      paddingVertical: SPACING[2],
      borderRadius: BORDER_RADIUS.md,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.panel,
      ...FLEX_CENTERS.center,
    },
    genderButtonActive: {
      backgroundColor: colors.seal,
      borderColor: colors.seal,
    },
    genderButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.ink,
      fontFamily: 'Tajawal',
    },
    genderButtonTextActive: {
      color: '#FFFFFF',
      fontWeight: '700',
    },

    // ===== Test Types Grid =====
    testTypesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: SPACING[2],
    },
    testTypeButton: {
      width: '48%',
      paddingVertical: SPACING[3],
      paddingHorizontal: SPACING[2],
      borderRadius: BORDER_RADIUS.lg,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.panel,
      alignItems: 'center',
      gap: SPACING[1],
    },
    testTypeButtonActive: {
      backgroundColor: colors.seal,
      borderColor: colors.seal,
    },
    testTypeIcon: {
      fontSize: 24,
    },
    testTypeLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.ink,
      textAlign: 'center',
      fontFamily: 'Tajawal',
    },
    testTypeLabelActive: {
      color: '#FFFFFF',
      fontWeight: '700',
    },
    checkmark: {
      position: 'absolute',
      top: SPACING[2],
      right: SPACING[2],
      fontSize: 20,
      color: '#FFFFFF',
    },
  });
 
