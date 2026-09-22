import React, {useMemo, useState} from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import {useLabStore} from '../store/useLabStore';
import {displayDate} from '../utils/helpers';
import {getTheme} from '../utils/theme';

import {
  exportPatientPdf,
  printPatient,
  exportPatientsExcel,
} from '../services/exportService';

export default function HomeScreen({navigation}: any) {
  const patients = useLabStore(s => s.patients);
  const settings = useLabStore(s => s.settings);
  const deletePatient = useLabStore(s => s.deletePatient);

  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const dark = !!settings?.darkMode;
  const theme = getTheme(settings);

  /* =====================================================
     ترتيب + بحث
  ===================================================== */

  const filteredPatients = useMemo(() => {
    const q = search.trim().toLowerCase();

    const sorted = [...patients].sort((a, b) => {
      const da = String(a.date || '');
      const db = String(b.date || '');

      if (da !== db) {
        return db.localeCompare(da);
      }

      const na = parseInt(String(a.seq || ''), 10);
      const nb = parseInt(String(b.seq || ''), 10);

      if (Number.isFinite(na) && Number.isFinite(nb)) {
        return nb - na;
      }

      return String(b.seq || '').localeCompare(
        String(a.seq || ''),
      );
    });

    if (!q) {
      return sorted;
    }

    return sorted.filter(p => {
      const name = String(p.name || '').toLowerCase();
      const seq = String(p.seq || '').toLowerCase();
      const date = String(p.date || '').toLowerCase();

      return (
        name.includes(q) ||
        seq.includes(q) ||
        date.includes(q)
      );
    });
  }, [patients, search]);

  /* =====================================================
     حذف
  ===================================================== */

  const openDeleteConfirm = (patient: any) => {
    Alert.alert(
      'حذف السجل',
      `هل تريد حذف سجل المريض "${patient.name || ''}"؟\n\nلا يمكن التراجع عن هذه العملية.`,
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
              await deletePatient(patient.id);
            } catch (error) {
              console.log('Delete error:', error);

              Alert.alert(
                'خطأ',
                'تعذر حذف السجل.',
              );
            }
          },
        },
      ],
    );
  };

  /* =====================================================
     طباعة تقرير المريض
  ===================================================== */

  const handlePrint = async (patient: any) => {
    try {
      setBusyId(`print-${patient.id}`);

      await printPatient(
        patient,
        settings,
        settings?.printSettings || {},
      );
    } catch (error) {
      console.log('Print error:', error);

      Alert.alert(
        'خطأ',
        'تعذر فتح الطباعة. تأكد من إعدادات الطباعة وحاول مرة أخرى.',
      );
    } finally {
      setBusyId(null);
    }
  };

  /* =====================================================
     PDF
  ===================================================== */

  const handlePdf = async (patient: any) => {
    try {
      setBusyId(`pdf-${patient.id}`);

      await exportPatientPdf(
        patient,
        settings,
        settings?.printSettings || {},
      );
    } catch (error) {
      console.log('PDF error:', error);

      Alert.alert(
        'خطأ',
        'تعذر إنشاء ملف PDF.',
      );
    } finally {
      setBusyId(null);
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
      setBusyId('excel');

      await exportPatientsExcel(
        patients,
      );
    } catch (error) {
      console.log('Excel error:', error);

      Alert.alert(
        'خطأ',
        'تعذر إنشاء ملف Excel.',
      );
    } finally {
      setBusyId(null);
    }
  };

  /* =====================================================
     بطاقة المريض
  ===================================================== */

  const renderPatient = ({item}: any) => {
    const printing =
      busyId === `print-${item.id}`;

    const pdfing =
      busyId === `pdf-${item.id}`;

    return (
      <View
        style={[
          styles.patientCard,
          {backgroundColor: theme.surface, borderColor: theme.border},
        ]}>

        {/* معلومات المريض */}

        <View style={styles.patientTop}>

          <View style={styles.patientInfo}>

            <Text
              style={[
                styles.patientName,
                {color: theme.text},
              ]}>
              {item.name || 'بدون اسم'}
            </Text>

            <Text
              style={[
                styles.patientDetails,
                {color: theme.muted},
              ]}>
              رقم السجل: {item.seq || '—'}
            </Text>

            <Text
              style={[
                styles.patientDetails,
                {color: theme.muted},
              ]}>
              التاريخ: {formatDate(item.date)}
            </Text>

            <Text
              style={[
                styles.patientDetails,
                {color: theme.muted},
              ]}>
              العمر: {item.age || '—'}    الجنس:{' '}
              {item.gender || '—'}
            </Text>

          </View>

          <View style={styles.numberCircle}>

            <Text style={styles.numberText}>
              {item.seq || '—'}
            </Text>

          </View>

        </View>

        {/* الملاحظات */}

        {item.notes ? (
          <View
            style={[
              styles.notesBox,
              {backgroundColor: theme.surfaceAlt, borderColor: theme.border},
            ]}>

            <Text
              style={[
                styles.notesText,
                {color: theme.muted},
              ]}>
              ملاحظات: {item.notes}
            </Text>

          </View>
        ) : null}

        {/* التقرير / تعديل / حذف */}

        <View style={styles.actions}>

          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.reportButton,
            ]}
            onPress={() =>
              navigation.navigate(
                'PatientReport',
                {id: item.id},
              )
            }>

            <Text style={styles.actionText}>
              📄 التقرير
            </Text>

          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.editButton,
            ]}
            onPress={() =>
              navigation.navigate(
                'PatientForm',
                {id: item.id},
              )
            }>

            <Text style={styles.actionText}>
              ✏️ تعديل
            </Text>

          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.deleteButton,
            ]}
            onPress={() =>
              openDeleteConfirm(item)
            }>

            <Text style={styles.actionText}>
              🗑 حذف
            </Text>

          </TouchableOpacity>

        </View>

        {/* الطباعة و PDF */}

        <View style={styles.printActions}>

          <TouchableOpacity
            disabled={!!busyId}
            style={[
              styles.printButton,
              dark && styles.printButtonDark,
            ]}
            onPress={() =>
              handlePrint(item)
            }>

            <Text
              style={[
                styles.printButtonText,
                dark && styles.textLight,
              ]}>
              {printing
                ? '⏳ جاري الطباعة...'
                : '🖨️ طباعة'}
            </Text>

          </TouchableOpacity>

          <TouchableOpacity
            disabled={!!busyId}
            style={styles.pdfButton}
            onPress={() =>
              handlePdf(item)
            }>

            <Text style={styles.pdfButtonText}>
              {pdfing
                ? '⏳ جاري إنشاء PDF...'
                : '📑 PDF'}
            </Text>

          </TouchableOpacity>

        </View>

      </View>
    );
  };

  /* =====================================================
     الشاشة
  ===================================================== */

  return (
    <View
      style={[
        styles.root,
        {backgroundColor: theme.background},
      ]}>

      {/* رأس الصفحة */}

      <View
        style={[
          styles.header,
          {backgroundColor: theme.header, borderBottomColor: theme.primary},
        ]}>

        <View style={styles.headerTextBox}>

          <Text
            style={[
              styles.title,
              {color: '#fff'},
            ]}>
            سجل المختبر الطبي
          </Text>

          <Text
            style={[
              styles.subtitle,
              {color: '#d6dfdb'},
            ]}>
            إدارة المرضى والنتائج المخبرية
          </Text>

        </View>

        <View style={styles.headerBadge}>

          <Text style={styles.headerBadgeNumber}>
            {patients.length}
          </Text>

          <Text style={styles.headerBadgeText}>
            سجل
          </Text>

        </View>

      </View>

      {/* الإجراءات الرئيسية */}

      <View style={styles.quickActions}>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() =>
            navigation.navigate(
              'PatientForm',
            )
          }>

          <Text style={styles.addButtonText}>
            ＋ إضافة مريض
          </Text>

        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.statsButton,
            dark && styles.statsButtonDark,
          ]}
          onPress={() =>
            navigation.navigate(
              'Stats',
            )
          }>

          <Text
            style={[
              styles.statsButtonText,
              dark && styles.textLight,
            ]}>
            📊 الإحصائيات
          </Text>

        </TouchableOpacity>

      </View>

      {/* Excel */}

      <TouchableOpacity
        disabled={!!busyId}
        style={[
          styles.excelButton,
          dark && styles.excelButtonDark,
        ]}
        onPress={handleExcel}>

        <Text
          style={[
            styles.excelButtonText,
            dark && styles.textLight,
          ]}>

          {busyId === 'excel'
            ? '⏳ جاري إنشاء ملف Excel...'
            : '📗 تصدير جميع السجلات إلى Excel'}

        </Text>

      </TouchableOpacity>

      {/* البحث */}

      <View
        style={[
          styles.searchContainer,
          {backgroundColor: theme.input, borderColor: theme.border},
        ]}>

        <Text
          style={[
            styles.searchIcon,
            dark && styles.textMuted,
          ]}>
          🔎
        </Text>

        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="ابحث باسم المريض أو رقم السجل أو التاريخ"
          placeholderTextColor={
            dark
              ? '#9aa7a3'
              : '#7b8783'
          }
          style={[
            styles.searchInput,
            dark && styles.searchInputDark,
          ]}
          textAlign="right"
          returnKeyType="search"
        />

        {search.length > 0 ? (
          <TouchableOpacity
            onPress={() =>
              setSearch('')
            }>

            <Text style={styles.clearSearch}>
              ✕
            </Text>

          </TouchableOpacity>
        ) : null}

      </View>

      {/* عنوان القائمة */}

      <View style={styles.listHeader}>

        <Text
          style={[
            styles.listTitle,
            dark && styles.textLight,
          ]}>
          سجلات المرضى
        </Text>

        <Text
          style={[
            styles.countText,
            dark && styles.textMuted,
          ]}>
          {filteredPatients.length} نتيجة
        </Text>

      </View>

      {/* القائمة */}

      <FlatList
        data={filteredPatients}
        keyExtractor={item =>
          String(item.id)
        }
        renderItem={renderPatient}
        contentContainerStyle={[
          styles.listContent,
          filteredPatients.length === 0 &&
            styles.emptyListContent,
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>

            <Text style={styles.emptyIcon}>
              {search ? '🔎' : '📋'}
            </Text>

            <Text
              style={[
                styles.emptyTitle,
                dark && styles.textLight,
              ]}>

              {search
                ? 'لا توجد نتائج'
                : 'لا توجد سجلات مرضى'}

            </Text>

            <Text
              style={[
                styles.emptyText,
                dark && styles.textMuted,
              ]}>

              {search
                ? 'جرّب البحث باسم مختلف أو رقم سجل آخر.'
                : 'ابدأ بإضافة أول مريض إلى سجل المختبر.'}

            </Text>

            {!search ? (
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() =>
                  navigation.navigate(
                    'PatientForm',
                  )
                }>

                <Text
                  style={styles.emptyButtonText}>
                  ＋ إضافة أول مريض
                </Text>

              </TouchableOpacity>
            ) : null}

          </View>
        }
      />

    </View>
  );
}

/* =========================================================
   التاريخ
========================================================= */

function formatDate(value: any) {
  if (!value) {
    return '—';
  }

  try {
    return displayDate(
      String(value),
    );
  } catch {
    return String(value);
  }
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

  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e6e3',
  },

  headerDark: {
    backgroundColor: '#182320',
    borderBottomColor: '#293733',
  },

  headerTextBox: {
    flex: 1,
  },

  title: {
    fontSize: 23,
    fontWeight: '900',
    color: '#1d3b36',
    textAlign: 'right',
  },

  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: '#687570',
    textAlign: 'right',
  },

  headerBadge: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#1d3b36',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },

  headerBadgeNumber: {
    color: '#ffffff',
    fontSize: 19,
    fontWeight: '900',
  },

  headerBadgeText: {
    color: '#dceae6',
    fontSize: 10,
    fontWeight: '700',
  },

  quickActions: {
    flexDirection: 'row-reverse',
    gap: 10,
    paddingHorizontal: 12,
    paddingTop: 12,
  },

  addButton: {
    flex: 1,
    backgroundColor: '#1d3b36',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
  },

  statsButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#1d3b36',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  statsButtonDark: {
    backgroundColor: '#182320',
    borderColor: '#8bb8ad',
  },

  statsButtonText: {
    color: '#1d3b36',
    fontSize: 16,
    fontWeight: '900',
  },

  excelButton: {
    marginHorizontal: 12,
    marginTop: 10,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#607d74',
    paddingVertical: 12,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },

  excelButtonDark: {
    backgroundColor: '#182320',
    borderColor: '#8bb8ad',
  },

  excelButtonText: {
    color: '#1d3b36',
    fontSize: 14,
    fontWeight: '900',
  },

  searchContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginHorizontal: 12,
    marginTop: 12,
    paddingHorizontal: 12,
    minHeight: 52,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d5dfdb',
    borderRadius: 14,
  },

  searchContainerDark: {
    backgroundColor: '#182320',
    borderColor: '#293733',
  },

  searchIcon: {
    fontSize: 20,
    marginLeft: 8,
  },

  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#17201e',
    paddingVertical: 10,
  },

  searchInputDark: {
    color: '#ffffff',
  },

  clearSearch: {
    fontSize: 18,
    color: '#777',
    paddingHorizontal: 5,
  },

  listHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 17,
    paddingBottom: 8,
  },

  listTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1d3b36',
  },

  countText: {
    fontSize: 13,
    color: '#687570',
    fontWeight: '700',
  },

  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 30,
  },

  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },

  patientCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e0e6e3',
  },

  patientCardDark: {
    backgroundColor: '#182320',
    borderColor: '#293733',
  },

  patientTop: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
  },

  patientInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },

  patientName: {
    color: '#1d3b36',
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'right',
    marginBottom: 5,
  },

  patientDetails: {
    color: '#687570',
    fontSize: 13,
    textAlign: 'right',
    marginTop: 2,
  },

  textLight: {
    color: '#f2f7f5',
  },

  textMuted: {
    color: '#a9b7b2',
  },

  numberCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#e7efec',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },

  numberText: {
    color: '#1d3b36',
    fontSize: 16,
    fontWeight: '900',
  },

  notesBox: {
    backgroundColor: '#f5f8f7',
    borderRadius: 10,
    padding: 9,
    marginTop: 12,
  },

  notesBoxDark: {
    backgroundColor: '#202d29',
  },

  notesText: {
    color: '#687570',
    fontSize: 13,
    textAlign: 'right',
  },

  actions: {
    flexDirection: 'row-reverse',
    gap: 7,
    marginTop: 13,
  },

  actionButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  reportButton: {
    backgroundColor: '#1d3b36',
  },

  editButton: {
    backgroundColor: '#65736f',
  },

  deleteButton: {
    backgroundColor: '#9a4545',
  },

  actionText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },

  printActions: {
    flexDirection: 'row-reverse',
    gap: 8,
    marginTop: 9,
  },

  printButton: {
    flex: 1,
    minHeight: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1d3b36',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },

  printButtonDark: {
    backgroundColor: '#182320',
    borderColor: '#8bb8ad',
  },

  printButtonText: {
    color: '#1d3b36',
    fontSize: 13,
    fontWeight: '900',
  },

  pdfButton: {
    flex: 1,
    minHeight: 40,
    borderRadius: 10,
    backgroundColor: '#6d4a35',
    alignItems: 'center',
    justifyContent: 'center',
  },

  pdfButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
  },

  empty: {
    alignItems: 'center',
    paddingHorizontal: 30,
  },

  emptyIcon: {
    fontSize: 52,
    marginBottom: 12,
  },

  emptyTitle: {
    color: '#1d3b36',
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
  },

  emptyText: {
    color: '#687570',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 7,
    lineHeight: 22,
  },

  emptyButton: {
    marginTop: 18,
    backgroundColor: '#1d3b36',
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: 13,
  },

  emptyButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
  },

}); 
