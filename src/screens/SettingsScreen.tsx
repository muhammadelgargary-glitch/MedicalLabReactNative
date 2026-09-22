import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';

import { useLabStore } from '../store/useLabStore';
import {getTheme} from '../utils/theme';
import { exportBackup, importBackup } from '../services/exportService';

import {
  configureGoogleSignIn,
  getSavedGoogleUser,
  signInWithGoogle,
  restoreGoogleSession,
  signOutGoogle,
  uploadBackupToDrive,
  restoreLatestBackupFromDrive,
  getDriveBackupSummary,
  type GoogleUser,
  type DriveBackupPayload,
} from '../services/googleDriveService';

const THEMES = [
  { key: 'default', name: 'الافتراضي', color: '#1d3b36' },
  { key: 'blue', name: 'أزرق طبي', color: '#1565c0' },
  { key: 'purple', name: 'بنفسجي', color: '#6a1b9a' },
  { key: 'teal', name: 'تركوازي', color: '#00796b' },
  { key: 'rose', name: 'وردي', color: '#ad1457' },
  { key: 'amber', name: 'كهرماني', color: '#ef6c00' },
];

const FONTS = [
  'Tajawal',
  'Zain',
  'Cairo',
  'Almarai',
  'Changa',
  'IBM Plex Sans Arabic',
];

const FONT_SIZES = [
  { key: 12, name: 'صغير' },
  { key: 14, name: 'متوسط' },
  { key: 17, name: 'كبير' },
];

const PRINT_LAYOUTS = [
  { key: 'auto', name: 'تلقائي' },
  { key: '1', name: 'تقرير واحد' },
  { key: '2', name: 'تقريران' },
  { key: '2stack', name: 'تقريران متتاليان' },
  { key: '3', name: '3 تقارير' },
  { key: '4', name: '4 تقارير' },
];

const PAPER_OPTIONS = [
  { key: 'A4', name: 'A4' },
  { key: 'A5', name: 'A5' },
  { key: 'Letter', name: 'Letter' },
];

const LOGO_POSITIONS = [
  { key: 'right', name: 'يمين' },
  { key: 'center', name: 'وسط' },
  { key: 'left', name: 'يسار' },
];

const LOGO_SIZES = [
  { key: 16, name: 'صغير' },
  { key: 24, name: 'متوسط' },
  { key: 32, name: 'كبير' },
];

export default function SettingsScreen() {
  const {
    settings,
    setSetting,
    patients,
    auditLog,
    importBackupData,
    addAudit,
  } = useLabStore();

  const theme = getTheme(settings);

  const [modal, setModal] = useState(false);
  const [pending, setPending] = useState<any>(null);

  const [googleUser, setGoogleUser] = useState<GoogleUser | null>(null);
  const [driveBusy, setDriveBusy] = useState(false);
  const [driveSummary, setDriveSummary] = useState<any>(null);

  const [labModal, setLabModal] = useState<
    null | 'center' | 'directorate' | 'reportTitle' | 'footerText'
  >(null);
  const [labText, setLabText] = useState('');

  const [priceName, setPriceName] = useState('');
  const [priceValue, setPriceValue] = useState('');

  const [criticalName, setCriticalName] = useState('');
  const [criticalLow, setCriticalLow] = useState('');
  const [criticalHigh, setCriticalHigh] = useState('');

  const printSettings = settings.printSettings || {};

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        await configureGoogleSignIn();

        const saved = await getSavedGoogleUser();

        if (mounted && saved) {
          setGoogleUser(saved);
        }

        const restored = await restoreGoogleSession();

        if (mounted && restored) {
          setGoogleUser(restored.user);
          await refreshDriveSummary();
        }
      } catch {}
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const refreshDriveSummary = async () => {
    try {
      const summary = await getDriveBackupSummary();
      setDriveSummary(summary);
    } catch {
      setDriveSummary(null);
    }
  };

  const updatePrint = async (key: string, value: any) => {
    await setSetting('printSettings', {
      ...settings.printSettings,
      [key]: value,
    });
  };

  const updateSetting = async (key: string, value: any) => {
    await setSetting(key, value);
  };

  const backup = async () => {
    try {
      await exportBackup({
        patients,
        settings,
        auditLog,
      });

      Alert.alert(
        'تم',
        'تم إنشاء النسخة الاحتياطية ويمكنك حفظها أو إرسالها.'
      );
    } catch (e: any) {
      Alert.alert(
        'خطأ',
        e?.message || 'تعذر إنشاء النسخة الاحتياطية.'
      );
    }
  };

  const importFile = async () => {
    try {
      const data = await importBackup();

      if (!data) return;

      setPending(data);
      setModal(true);
    } catch (e: any) {
      Alert.alert(
        'خطأ في الاستيراد',
        e?.message || 'ملف غير صالح.'
      );
    }
  };

  const apply = async (mode: 'restore' | 'merge') => {
    if (!pending) return;

    try {
      await importBackupData(mode, pending);

      addAudit(
        mode === 'restore'
          ? 'استعادة نسخة محلية'
          : 'دمج نسخة محلية',
        'backup',
        mode === 'restore'
          ? 'تم استبدال البيانات بالنسخة الاحتياطية المحلية'
          : 'تم دمج النسخة الاحتياطية المحلية مع البيانات الحالية'
      );

      setModal(false);
      setPending(null);

      Alert.alert(
        'تم الاستيراد',
        mode === 'restore'
          ? 'تم استبدال البيانات الحالية بنجاح.'
          : 'تم دمج البيانات بنجاح.'
      );
    } catch (e: any) {
      Alert.alert(
        'خطأ',
        e?.message || 'تعذر استيراد النسخة.'
      );
    }
  };

  const signIn = async () => {
    try {
      setDriveBusy(true);

      const result = await signInWithGoogle();

      setGoogleUser(result.user);

      await refreshDriveSummary();

      Alert.alert(
        'تم تسجيل الدخول',
        `تم تسجيل الدخول بالحساب:\n${result.user.email}`
      );
    } catch (e: any) {
      console.log('GOOGLE SIGN-IN ERROR:', e);

      const code =
        e?.code ||
        e?.statusCodes ||
        e?.nativeErrorCode ||
        'NO_ERROR_CODE';

      const message =
        e?.message ||
        e?.toString?.() ||
        'خطأ غير معروف';

      Alert.alert(
        'فشل تسجيل الدخول إلى Google',
        `رمز الخطأ: ${code}\n\n${message}`
      );
    } finally {
      setDriveBusy(false);
    }
  };

  const driveBackup = async () => {
    try {
      setDriveBusy(true);

      const payload: DriveBackupPayload = {
        app: 'lab-app',
        version: 5,
        exportedAt: new Date().toISOString(),
        patients,
        settings,
        auditLog,
      };

      await uploadBackupToDrive(payload);

      addAudit(
        'رفع نسخة احتياطية إلى Google Drive',
        'backup',
        'تم إنشاء نسخة سحابية والاحتفاظ بآخر النسخ'
      );

      await refreshDriveSummary();

      Alert.alert(
        'تم',
        'تم رفع النسخة الاحتياطية إلى Google Drive.'
      );
    } catch (e: any) {
      Alert.alert(
        'فشل النسخ إلى Drive',
        e?.message || 'تعذر رفع النسخة.'
      );
    } finally {
      setDriveBusy(false);
    }
  };

  const driveRestore = async () => {
    try {
      setDriveBusy(true);

      const data = await restoreLatestBackupFromDrive();

      if (!data) {
        Alert.alert(
          'لا توجد نسخة',
          'لم يتم العثور على نسخة مختبر في Google Drive.'
        );
        return;
      }

      Alert.alert(
        'استعادة من Google Drive',
        `تم العثور على أحدث نسخة تحتوي على ${data.patients.length} مريض.\nهل تريد استبدال البيانات الحالية بها؟`,
        [
          {
            text: 'إلغاء',
            style: 'cancel',
          },
          {
            text: 'استعادة',
            style: 'destructive',
            onPress: async () => {
              try {
                await importBackupData('restore', data);

                addAudit(
                  'استيراد نسخة من Google Drive',
                  'backup',
                  'تم استعادة أحدث نسخة سحابية'
                );

                Alert.alert(
                  'تم',
                  'تم استعادة أحدث نسخة من Google Drive بنجاح.'
                );
              } catch (e: any) {
                Alert.alert(
                  'خطأ',
                  e?.message || 'تعذر استعادة النسخة.'
                );
              }
            },
          },
        ]
      );
    } catch (e: any) {
      Alert.alert(
        'فشل الاستعادة من Drive',
        e?.message || 'تعذر تحميل النسخة.'
      );
    } finally {
      setDriveBusy(false);
    }
  };

  const signOut = async () => {
    try {
      setDriveBusy(true);

      await signOutGoogle();

      setGoogleUser(null);
      setDriveSummary(null);

      addAudit(
        'تسجيل الخروج من حساب Google',
        'backup',
        'تم تسجيل الخروج من حساب Google'
      );
    } catch (e: any) {
      Alert.alert(
        'خطأ',
        e?.message || 'تعذر تسجيل الخروج.'
      );
    } finally {
      setDriveBusy(false);
    }
  };

  const openLabEditor = (
    key: 'center' | 'directorate' | 'reportTitle' | 'footerText'
  ) => {
    setLabModal(key);
    setLabText(
      key === 'reportTitle'
        ? printSettings.reportTitle || ''
        : key === 'footerText'
        ? printSettings.footerText || ''
        : settings[key] || ''
    );
  };

  const saveLabText = async () => {
    if (!labModal) return;

    if (!labText.trim()) {
      Alert.alert('تنبيه', 'يرجى إدخال النص.');
      return;
    }

    if (labModal === 'reportTitle') {
      await updatePrint('reportTitle', labText.trim());
    } else if (labModal === 'footerText') {
      await updatePrint('footerText', labText.trim());
    } else {
      await updateSetting(labModal, labText.trim());
    }

    setLabModal(null);
  };

  const addPrice = async () => {
    const name = priceName.trim();

    if (!name) {
      Alert.alert('تنبيه', 'أدخل اسم الفحص.');
      return;
    }

    const value = Number(priceValue);

    if (!Number.isFinite(value) || value < 0) {
      Alert.alert('تنبيه', 'أدخل سعرًا صحيحًا.');
      return;
    }

    const prices = {
      ...(settings.testPrices || {}),
      [name]: value,
    };

    await updateSetting('testPrices', prices);

    setPriceName('');
    setPriceValue('');

    Alert.alert('تم', 'تم حفظ سعر الفحص.');
  };

  const deletePrice = async (name: string) => {
    const prices = {
      ...(settings.testPrices || {}),
    };

    delete prices[name];

    await updateSetting('testPrices', prices);
  };

  const addCriticalRange = async () => {
    const name = criticalName.trim();

    if (!name) {
      Alert.alert('تنبيه', 'أدخل اسم الفحص.');
      return;
    }

    const low =
      criticalLow.trim() === ''
        ? ''
        : Number(criticalLow);

    const high =
      criticalHigh.trim() === ''
        ? ''
        : Number(criticalHigh);

    if (
      (low !== '' && !Number.isFinite(low)) ||
      (high !== '' && !Number.isFinite(high))
    ) {
      Alert.alert('تنبيه', 'أدخل حدودًا رقمية صحيحة.');
      return;
    }

    const ranges = {
      ...(settings.criticalRanges || {}),
      [name]: {
        low,
        high,
      },
    };

    await updateSetting('criticalRanges', ranges);

    setCriticalName('');
    setCriticalLow('');
    setCriticalHigh('');

    Alert.alert('تم', 'تم حفظ الحدود الحرجة.');
  };

  const deleteCriticalRange = async (name: string) => {
    const ranges = {
      ...(settings.criticalRanges || {}),
    };

    delete ranges[name];

    await updateSetting('criticalRanges', ranges);
  };

  const resetPrintSettings = async () => {
    const defaults = {
      paper: 'A4',
      orientation: 'portrait',
      layout: 'auto',
      gap: 4,
      marginTop: 8,
      marginRight: 8,
      marginBottom: 8,
      marginLeft: 8,
      fontSize: 13,
      tableFontSize: 11,
      fontFamily: 'Tajawal',
      showLogo: true,
      logoPosition: 'right',
      logoSize: 24,
      reportTitle: 'تقرير الفحوصات المخبرية',
      showCenter: true,
      showDirectorate: true,
      showDate: true,
      showSeq: true,
      showNotes: true,
      showFooter: true,
      showBorder: true,
      borderColor: '#777777',
      showNormal: true,
      footerText: 'مع تمنياتنا بالصحة والعافية',
    };

    await setSetting('printSettings', defaults);

    Alert.alert(
      'تم',
      'تمت إعادة إعدادات الطباعة إلى الإعدادات الافتراضية.'
    );
  };

  const changeLogo = () => {
    Alert.alert(
      'الشعار',
      'إضافة/اختيار صورة الشعار سيتم ربطها في المرحلة الخاصة بإدارة الملفات والشعار.'
    );
  };

  const printSettingNumber = (
    key: string,
    defaultValue: number
  ) => {
    const value = Number(printSettings[key]);

    return Number.isFinite(value)
      ? value
      : defaultValue;
  };

  const renderChoice = (
    items: { key: any; name: string }[],
    selected: any,
    onSelect: (value: any) => void
  ) => {
    return (
      <View style={styles.chips}>
        {items.map((item) => {
          const active = selected === item.key;

          return (
            <TouchableOpacity
              key={String(item.key)}
              onPress={() => onSelect(item.key)}
              style={[
                styles.chip,
                active && styles.chipOn,
              ]}
            >
              <Text
                style={
                  active
                    ? styles.chipOnText
                    : styles.chipText
                }
              >
                {item.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderNumberInput = (
    label: string,
    value: number,
    onChange: (value: number) => void,
    min?: number,
    max?: number
  ) => {
    return (
      <View style={styles.numberRow}>
        <Text style={styles.numberLabel}>{label}</Text>

        <TextInput
          value={String(value)}
          onChangeText={(text) => {
            const n = Number(text);

            if (!Number.isFinite(n)) return;

            let result = n;

            if (typeof min === 'number') {
              result = Math.max(min, result);
            }

            if (typeof max === 'number') {
              result = Math.min(max, result);
            }

            onChange(result);
          }}
          keyboardType="numeric"
          style={styles.numberInput}
        />
      </View>
    );
  };

  const renderSwitch = (
    label: string,
    value: boolean,
    onChange: (value: boolean) => void
  ) => {
    return (
      <View style={styles.switchRow}>
        <Text style={styles.switchText}>{label}</Text>

        <Switch
          value={!!value}
          onValueChange={onChange}
        />
      </View>
    );
  };

  const prices = settings.testPrices || {};
  const priceEntries = Object.entries(prices);

  const criticalRanges = settings.criticalRanges || {};
  const criticalEntries = Object.entries(criticalRanges);

  return (
    <ScrollView
      style={[styles.root, {backgroundColor: theme.background}]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={[styles.h, {color: theme.primary}]}>
        ⚙ إعدادات المختبر
      </Text>

      {/* ===================== بيانات المختبر ===================== */}

      <View style={[styles.card, {backgroundColor: theme.surface, borderColor: theme.border}]}>
        <Text style={[styles.title, {color: theme.primary}]}>
          🏥 بيانات المختبر
        </Text>

        <Text style={[styles.label, {color: theme.text}]}>
          اسم المركز / المختبر
        </Text>

        <TouchableOpacity
          style={[styles.value, {backgroundColor: theme.input, borderColor: theme.border}]}
          onPress={() => openLabEditor('center')}
        >
          <Text style={[styles.valueText, {color: theme.text}]}>
            {settings.center ||
              'مركز الرعاية الصحية الأولية'}
          </Text>
        </TouchableOpacity>

        <Text style={[styles.label, {color: theme.text}]}>
          المديرية / القطاع
        </Text>

        <TouchableOpacity
          style={[styles.value, {backgroundColor: theme.input, borderColor: theme.border}]}
          onPress={() =>
            openLabEditor('directorate')
          }
        >
          <Text style={[styles.valueText, {color: theme.text}]}>
            {settings.directorate ||
              'دائرة الصحة / قطاع الرعاية'}
          </Text>
        </TouchableOpacity>

        <Text style={[styles.label, {color: theme.text}]}>
          الشعار
        </Text>

        <TouchableOpacity
          style={styles.btn2}
          onPress={changeLogo}
        >
          <Text style={styles.btn2Text}>
            🖼️ إدارة شعار المختبر
          </Text>
        </TouchableOpacity>

        {settings.logo ? (
          <Text style={styles.successText}>
            ✓ يوجد شعار محفوظ
          </Text>
        ) : (
          <Text style={[styles.note, {color: theme.muted}]}>
            لم يتم تحديد شعار حاليًا.
          </Text>
        )}
      </View>

      {/* ===================== المظهر ===================== */}

      <View style={[styles.card, {backgroundColor: theme.surface, borderColor: theme.border}]}>
        <Text style={[styles.title, {color: theme.primary}]}>
          🎨 المظهر والألوان
        </Text>

        <Text style={[styles.label, {color: theme.text}]}>
          الثيم
        </Text>

        <View style={styles.themeGrid}>
          {THEMES.map((theme) => {
            const active =
              settings.theme === theme.key;

            return (
              <TouchableOpacity
                key={theme.key}
                onPress={() =>
                  updateSetting(
                    'theme',
                    theme.key
                  )
                }
                style={[
                  styles.themeItem,
                  active && styles.themeItemActive,
                ]}
              >
                <View
                  style={[
                    styles.themeCircle,
                    {
                      backgroundColor:
                        theme.color,
                    },
                  ]}
                />

                <Text
                  style={[
                    styles.themeText,
                    active &&
                      styles.themeTextActive,
                  ]}
                >
                  {theme.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.label, {color: theme.text}]}>
          اللون المخصص
        </Text>

        <View style={styles.colorRow}>
          <TextInput
            value={settings.customAccent || ''}
            onChangeText={(text) =>
              updateSetting(
                'customAccent',
                text
              )
            }
            placeholder="#1d3b36"
            style={styles.colorInput}
            autoCapitalize="none"
          />

          <View
            style={[
              styles.colorPreview,
              {
                backgroundColor:
                  settings.customAccent ||
                  '#1d3b36',
              },
            ]}
          />
        </View>

        <Text style={[styles.note, {color: theme.muted}]}>
          أدخل لونًا بصيغة HEX مثل #1d3b36.
        </Text>

        {renderSwitch(
          'الوضع الداكن',
          !!settings.darkMode,
          (value) =>
            updateSetting(
              'darkMode',
              value
            )
        )}

        <Text style={[styles.label, {color: theme.text}]}>
          حجم الخط
        </Text>

        {renderChoice(
          FONT_SIZES,
          Number(settings.fontSizePx || 14),
          (value) =>
            updateSetting(
              'fontSizePx',
              value
            )
        )}

        <Text style={[styles.label, {color: theme.text}]}>
          نوع الخط
        </Text>

        {renderChoice(
          FONTS.map((font) => ({
            key: font,
            name: font,
          })),
          settings.fontFamily ||
            'Tajawal',
          (value) =>
            updateSetting(
              'fontFamily',
              value
            )
        )}

        <Text style={[styles.label, {color: theme.text}]}>
          كثافة الواجهة
        </Text>

        {renderChoice(
          [
            {
              key: 'comfortable',
              name: 'مريحة',
            },
            {
              key: 'compact',
              name: 'مضغوطة',
            },
          ],
          settings.density ||
            'comfortable',
          (value) =>
            updateSetting(
              'density',
              value
            )
        )}

        <Text style={[styles.label, {color: theme.text}]}>
          شكل الأيقونات
        </Text>

        {renderChoice(
          [
            {
              key: 'circle',
              name: 'دائرية',
            },
            {
              key: 'rounded',
              name: 'مستديرة',
            },
            {
              key: 'square',
              name: 'مربعة',
            },
          ],
          settings.iconShape ||
            'circle',
          (value) =>
            updateSetting(
              'iconShape',
              value
            )
        )}

        <Text style={[styles.label, {color: theme.text}]}>
          حجم الشعار
        </Text>

        {renderChoice(
          [
            {
              key: 'small',
              name: 'صغير',
            },
            {
              key: 'medium',
              name: 'متوسط',
            },
            {
              key: 'large',
              name: 'كبير',
            },
          ],
          settings.logoSize ||
            'medium',
          (value) =>
            updateSetting(
              'logoSize',
              value
            )
        )}

        {renderSwitch(
          'إطار الشعار',
          settings.logoBorder !== false,
          (value) =>
            updateSetting(
              'logoBorder',
              value
            )
        )}
      </View>

      {/* ===================== الأسعار ===================== */}

      <View style={[styles.card, {backgroundColor: theme.surface, borderColor: theme.border}]}>
        <Text style={[styles.title, {color: theme.primary}]}>
          💰 أسعار الفحوصات
        </Text>

        {renderSwitch(
          'تفعيل الأسعار',
          !!settings.pricesEnabled,
          (value) =>
            updateSetting(
              'pricesEnabled',
              value
            )
        )}

        {settings.pricesEnabled && (
          <>
            <Text style={[styles.note, {color: theme.muted}]}>
              أضف سعر كل فحص. سيتم استخدام هذه
              البيانات لاحقًا في شاشة المريض
              والفاتورة والإحصائيات.
            </Text>

            <TextInput
              value={priceName}
              onChangeText={setPriceName}
              placeholder="اسم الفحص"
              style={[styles.input, {backgroundColor: theme.input, borderColor: theme.border, color: theme.text}]}
              textAlign="right"
            />

            <TextInput
              value={priceValue}
              onChangeText={setPriceValue}
              placeholder="السعر"
              keyboardType="numeric"
              style={[styles.input, {backgroundColor: theme.input, borderColor: theme.border, color: theme.text}]}
              textAlign="right"
            />

            <TouchableOpacity
              style={styles.btn}
              onPress={addPrice}
            >
              <Text style={styles.btnText}>
                ➕ إضافة / تحديث سعر
              </Text>
            </TouchableOpacity>

            {priceEntries.length > 0 && (
              <View style={styles.listBox}>
                {priceEntries.map(
                  ([name, price]) => (
                    <View
                      key={name}
                      style={styles.listRow}
                    >
                      <TouchableOpacity
                        onPress={() =>
                          deletePrice(name)
                        }
                      >
                        <Text
                          style={
                            styles.deleteText
                          }
                        >
                          حذف
                        </Text>
                      </TouchableOpacity>

                      <Text
                        style={styles.listText}
                      >
                        {name} — {String(price)}
                      </Text>
                    </View>
                  )
                )}
              </View>
            )}
          </>
        )}
      </View>

      {/* ===================== القيم الحرجة ===================== */}

      <View style={[styles.card, {backgroundColor: theme.surface, borderColor: theme.border}]}>
        <Text style={[styles.title, {color: theme.primary}]}>
          🚨 القيم الحرجة والتنبيهات
        </Text>

        {renderSwitch(
          'تفعيل تنبيهات القيم الحرجة',
          !!settings.criticalAlertsEnabled,
          (value) =>
            updateSetting(
              'criticalAlertsEnabled',
              value
            )
        )}

        <Text style={[styles.note, {color: theme.muted}]}>
          يمكن تحديد الحد الأدنى والأعلى للفحوصات
          التي تريد مراقبتها.
        </Text>

        <TextInput
          value={criticalName}
          onChangeText={setCriticalName}
          placeholder="اسم الفحص"
          style={[styles.input, {backgroundColor: theme.input, borderColor: theme.border, color: theme.text}]}
          textAlign="right"
        />

        <View style={styles.inlineInputs}>
          <TextInput
            value={criticalLow}
            onChangeText={setCriticalLow}
            placeholder="الحد الأدنى"
            keyboardType="numeric"
            style={[
              styles.input,
              styles.halfInput,
            ]}
            textAlign="right"
          />

          <TextInput
            value={criticalHigh}
            onChangeText={setCriticalHigh}
            placeholder="الحد الأعلى"
            keyboardType="numeric"
            style={[
              styles.input,
              styles.halfInput,
            ]}
            textAlign="right"
          />
        </View>

        <TouchableOpacity
          style={styles.btn}
          onPress={addCriticalRange}
        >
          <Text style={styles.btnText}>
            ➕ حفظ الحدود الحرجة
          </Text>
        </TouchableOpacity>

        {criticalEntries.length > 0 && (
          <View style={styles.listBox}>
            {criticalEntries.map(
              ([name, range]: any) => (
                <View
                  key={name}
                  style={styles.listRow}
                >
                  <TouchableOpacity
                    onPress={() =>
                      deleteCriticalRange(
                        name
                      )
                    }
                  >
                    <Text
                      style={
                        styles.deleteText
                      }
                    >
                      حذف
                    </Text>
                  </TouchableOpacity>

                  <Text
                    style={styles.listText}
                  >
                    {name} — من{' '}
                    {String(
                      range?.low ?? ''
                    )}{' '}
                    إلى{' '}
                    {String(
                      range?.high ?? ''
                    )}
                  </Text>
                </View>
              )
            )}
          </View>
        )}
      </View>

      {/* ===================== الإحصائيات ===================== */}

      <View style={[styles.card, {backgroundColor: theme.surface, borderColor: theme.border}]}>
        <Text style={[styles.title, {color: theme.primary}]}>
          📊 إعدادات الإحصائيات
        </Text>

        {renderSwitch(
          'إظهار توزيع الجنس',
          settings.statsShowGender !== false,
          (value) =>
            updateSetting(
              'statsShowGender',
              value
            )
        )}

        {renderSwitch(
          'إظهار المخطط',
          settings.statsShowChart !== false,
          (value) =>
            updateSetting(
              'statsShowChart',
              value
            )
        )}

        {renderSwitch(
          'إظهار التفاصيل تلقائيًا',
          !!settings.statsAutoDetails,
          (value) =>
            updateSetting(
              'statsAutoDetails',
              value
            )
        )}
      </View>

      {/* ===================== Google Drive ===================== */}

      <View style={[styles.card, {backgroundColor: theme.surface, borderColor: theme.border}]}>
        <Text style={[styles.title, {color: theme.primary}]}>
          ☁️ Google Drive — النسخ الاحتياطي
        </Text>

        <View style={styles.accountBox}>
          <View style={{ flex: 1 }}>
            <Text style={styles.accountName}>
              {googleUser?.name ||
                'غير متصل بحساب Google'}
            </Text>

            <Text style={styles.desc}>
              {googleUser?.email ||
                'سجّل الدخول لتمكين النسخ السحابي والاستعادة.'}
            </Text>
          </View>

          <Text style={styles.accountIcon}>
            {googleUser ? '✓' : '🔑'}
          </Text>
        </View>

        {!googleUser ? (
          <TouchableOpacity
            style={styles.btn}
            onPress={signIn}
            disabled={driveBusy}
          >
            <Text style={styles.btnText}>
              {driveBusy
                ? 'جاري الاتصال...'
                : '🔑 تسجيل الدخول بحساب Google'}
            </Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity
              style={styles.btn}
              onPress={driveBackup}
              disabled={driveBusy}
            >
              <Text style={styles.btnText}>
                ☁️ رفع نسخة إلى Google Drive
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.btn2}
              onPress={driveRestore}
              disabled={driveBusy}
            >
              <Text style={styles.btn2Text}>
                ♻️ استعادة أحدث نسخة من Drive
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.btnDanger}
              onPress={signOut}
              disabled={driveBusy}
            >
              <Text style={styles.btnDangerText}>
                تسجيل الخروج من Google
              </Text>
            </TouchableOpacity>

            {driveSummary && (
              <Text style={styles.driveMeta}>
                📦 النسخ المحفوظة:{' '}
                {driveSummary.retained} /{' '}
                {driveSummary.retention}
                {driveSummary.latest
                  ?.modifiedTime
                  ? `\n📅 آخر نسخة: ${new Date(
                      driveSummary.latest.modifiedTime
                    ).toLocaleString('ar-IQ')}`
                  : ''}
              </Text>
            )}
          </>
        )}

        {driveBusy && (
          <ActivityIndicator
            style={{ marginTop: 10 }}
          />
        )}

        <Text style={[styles.note, {color: theme.muted}]}>
          يتم استخدام صلاحية Google Drive الخاصة
          بالتطبيق لملفات النسخ التي ينشئها
          التطبيق فقط.
        </Text>
      </View>

      {/* ===================== النسخ المحلي ===================== */}

      <View style={[styles.card, {backgroundColor: theme.surface, borderColor: theme.border}]}>
        <Text style={[styles.title, {color: theme.primary}]}>
          💾 النسخ الاحتياطي والاستيراد المحلي
        </Text>

        <Text style={styles.desc}>
          النسخة تشمل المرضى والإعدادات وسجل
          التعديلات.
        </Text>

        <TouchableOpacity
          style={styles.btn}
          onPress={backup}
        >
          <Text style={styles.btnText}>
            📤 إنشاء ومشاركة نسخة احتياطية
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.btn2}
          onPress={importFile}
        >
          <Text style={styles.btn2Text}>
            📥 استيراد نسخة احتياطية
          </Text>
        </TouchableOpacity>
      </View>

      {/* ===================== النسخ التلقائي ===================== */}

      <View style={[styles.card, {backgroundColor: theme.surface, borderColor: theme.border}]}>
        <Text style={[styles.title, {color: theme.primary}]}>
          🔄 النسخ التلقائي إلى Google Drive
        </Text>

        <Text style={[styles.label, {color: theme.text}]}>
          وضع النسخ التلقائي
        </Text>

        {renderChoice(
          [
            {
              key: 'off',
              name: 'إيقاف',
            },
            {
              key: 'daily',
              name: 'يومي',
            },
            {
              key: 'weekly',
              name: 'أسبوعي',
            },
          ],
          settings.autoDriveBackupMode ||
            'off',
          (value) =>
            updateSetting(
              'autoDriveBackupMode',
              value
            )
        )}

        {renderNumberInput(
          'عدد النسخ المحتفظ بها',
          Number(
            settings.driveBackupRetention ||
              5
          ),
          (value) =>
            updateSetting(
              'driveBackupRetention',
              value
            ),
          1,
          50
        )}
      </View>

      {/* ===================== الطباعة ===================== */}

      <View style={[styles.card, {backgroundColor: theme.surface, borderColor: theme.border}]}>
        <Text style={[styles.title, {color: theme.primary}]}>
          🖨️ إعدادات الطباعة المتقدمة
        </Text>

        <Text style={styles.sectionSubtitle}>
          الصفحة والتخطيط
        </Text>

        <Text style={[styles.label, {color: theme.text}]}>
          حجم الورق
        </Text>

        {renderChoice(
          PAPER_OPTIONS,
          printSettings.paper || 'A4',
          (value) =>
            updatePrint('paper', value)
        )}

        <Text style={[styles.label, {color: theme.text}]}>
          اتجاه الصفحة
        </Text>

        {renderChoice(
          [
            {
              key: 'portrait',
              name: 'عمودي',
            },
            {
              key: 'landscape',
              name: 'أفقي',
            },
          ],
          printSettings.orientation ||
            'portrait',
          (value) =>
            updatePrint(
              'orientation',
              value
            )
        )}

        <Text style={[styles.label, {color: theme.text}]}>
          عدد التقارير في الصفحة
        </Text>

        {renderChoice(
          PRINT_LAYOUTS,
          printSettings.layout ||
            'auto',
          (value) =>
            updatePrint(
              'layout',
              value
            )
        )}

        {renderNumberInput(
          'المسافة بين التقارير',
          printSettingNumber(
            'gap',
            4
          ),
          (value) =>
            updatePrint('gap', value),
          0,
          30
        )}

        <Text style={styles.sectionSubtitle}>
          الهوامش
        </Text>

        {renderNumberInput(
          'الهامش العلوي',
          printSettingNumber(
            'marginTop',
            8
          ),
          (value) =>
            updatePrint(
              'marginTop',
              value
            ),
          0,
          50
        )}

        {renderNumberInput(
          'الهامش الأيمن',
          printSettingNumber(
            'marginRight',
            8
          ),
          (value) =>
            updatePrint(
              'marginRight',
              value
            ),
          0,
          50
        )}

        {renderNumberInput(
          'الهامش السفلي',
          printSettingNumber(
            'marginBottom',
            8
          ),
          (value) =>
            updatePrint(
              'marginBottom',
              value
            ),
          0,
          50
        )}

        {renderNumberInput(
          'الهامش الأيسر',
          printSettingNumber(
            'marginLeft',
            8
          ),
          (value) =>
            updatePrint(
              'marginLeft',
              value
            ),
          0,
          50
        )}

        <Text style={styles.sectionSubtitle}>
          الخط
        </Text>

        <Text style={[styles.label, {color: theme.text}]}>
          نوع الخط
        </Text>

        {renderChoice(
          FONTS.map((font) => ({
            key: font,
            name: font,
          })),
          printSettings.fontFamily ||
            'Tajawal',
          (value) =>
            updatePrint(
              'fontFamily',
              value
            )
        )}

        {renderNumberInput(
          'حجم خط التقرير',
          printSettingNumber(
            'fontSize',
            13
          ),
          (value) =>
            updatePrint(
              'fontSize',
              value
            ),
          8,
          22
        )}

        {renderNumberInput(
          'حجم خط الجدول',
          printSettingNumber(
            'tableFontSize',
            11
          ),
          (value) =>
            updatePrint(
              'tableFontSize',
              value
            ),
          7,
          18
        )}

        <Text style={styles.sectionSubtitle}>
          الشعار
        </Text>

        {renderSwitch(
          'إظهار الشعار',
          printSettings.showLogo !== false,
          (value) =>
            updatePrint(
              'showLogo',
              value
            )
        )}

        <Text style={[styles.label, {color: theme.text}]}>
          مكان الشعار
        </Text>

        {renderChoice(
          LOGO_POSITIONS,
          printSettings.logoPosition ||
            'right',
          (value) =>
            updatePrint(
              'logoPosition',
              value
            )
        )}

        <Text style={[styles.label, {color: theme.text}]}>
          حجم الشعار
        </Text>

        {renderChoice(
          LOGO_SIZES,
          Number(
            printSettings.logoSize || 24
          ),
          (value) =>
            updatePrint(
              'logoSize',
              value
            )
        )}

        <Text style={styles.sectionSubtitle}>
          معلومات التقرير
        </Text>

        <Text style={[styles.label, {color: theme.text}]}>
          عنوان التقرير
        </Text>

        <TouchableOpacity
          style={[styles.value, {backgroundColor: theme.input, borderColor: theme.border}]}
          onPress={() =>
            openLabEditor('reportTitle')
          }
        >
          <Text style={[styles.valueText, {color: theme.text}]}>
            {printSettings.reportTitle ||
              'تقرير الفحوصات المخبرية'}
          </Text>
        </TouchableOpacity>

        {renderSwitch(
          'إظهار اسم المركز',
          printSettings.showCenter !== false,
          (value) =>
            updatePrint(
              'showCenter',
              value
            )
        )}

        {renderSwitch(
          'إظهار المديرية',
          printSettings.showDirectorate !== false,
          (value) =>
            updatePrint(
              'showDirectorate',
              value
            )
        )}

        {renderSwitch(
          'إظهار التاريخ',
          printSettings.showDate !== false,
          (value) =>
            updatePrint(
              'showDate',
              value
            )
        )}

        {renderSwitch(
          'إظهار التسلسل',
          printSettings.showSeq !== false,
          (value) =>
            updatePrint(
              'showSeq',
              value
            )
        )}

        {renderSwitch(
          'إظهار الملاحظات',
          printSettings.showNotes !== false,
          (value) =>
            updatePrint(
              'showNotes',
              value
            )
        )}

        {renderSwitch(
          'إظهار القيم الطبيعية',
          printSettings.showNormal !== false,
          (value) =>
            updatePrint(
              'showNormal',
              value
            )
        )}

        <Text style={styles.sectionSubtitle}>
          التذييل والإطار
        </Text>

        {renderSwitch(
          'إظهار التذييل',
          printSettings.showFooter !== false,
          (value) =>
            updatePrint(
              'showFooter',
              value
            )
        )}

        <Text style={[styles.label, {color: theme.text}]}>
          نص التذييل
        </Text>

        <TouchableOpacity
          style={[styles.value, {backgroundColor: theme.input, borderColor: theme.border}]}
          onPress={() =>
            openLabEditor('footerText')
          }
        >
          <Text style={[styles.valueText, {color: theme.text}]}>
            {printSettings.footerText ||
              'مع تمنياتنا بالصحة والعافية'}
          </Text>
        </TouchableOpacity>

        {renderSwitch(
          'إظهار إطار التقرير',
          printSettings.showBorder !== false,
          (value) =>
            updatePrint(
              'showBorder',
              value
            )
        )}

        <Text style={[styles.label, {color: theme.text}]}>
          لون الإطار
        </Text>

        <View style={styles.colorRow}>
          <TextInput
            value={
              printSettings.borderColor ||
              '#777777'
            }
            onChangeText={(text) =>
              updatePrint(
                'borderColor',
                text
              )
            }
            placeholder="#777777"
            style={styles.colorInput}
            autoCapitalize="none"
          />

          <View
            style={[
              styles.colorPreview,
              {
                backgroundColor:
                  printSettings.borderColor ||
                  '#777777',
              },
            ]}
          />
        </View>

        <TouchableOpacity
          style={styles.btn}
          onPress={resetPrintSettings}
        >
          <Text style={styles.btnText}>
            🔄 إعادة إعدادات الطباعة الافتراضية
          </Text>
        </TouchableOpacity>
      </View>

      {/* ===================== حالة المشروع ===================== */}

      <View style={[styles.card, {backgroundColor: theme.surface, borderColor: theme.border}]}>
        <Text style={[styles.title, {color: theme.primary}]}>
          📋 حالة المشروع
        </Text>

        <Text style={styles.desc}>
          عدد المرضى: {patients.length}
        </Text>

        <Text style={styles.desc}>
          سجل التعديلات: {auditLog.length}
        </Text>

        <Text style={styles.desc}>
          التخزين: AsyncStorage
        </Text>

        <Text style={[styles.note, {color: theme.muted}]}>
          جميع الإعدادات يتم حفظها تلقائيًا عند
          تغييرها.
        </Text>
      </View>

      {/* ===================== Modal الاستيراد ===================== */}

      <Modal
        visible={modal}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setModal(false)
        }
      >
        <View style={styles.overlay}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>
              استيراد النسخة الاحتياطية
            </Text>

            <Text style={styles.desc}>
              النسخة تحتوي على{' '}
              {pending?.patients?.length ||
                0}{' '}
              مريض.
            </Text>

            <TouchableOpacity
              style={styles.btn}
              onPress={() =>
                apply('restore')
              }
            >
              <Text style={styles.btnText}>
                ♻️ استبدال البيانات الحالية
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.btn2}
              onPress={() =>
                apply('merge')
              }
            >
              <Text style={styles.btn2Text}>
                ➕ دمج مع البيانات الحالية
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() =>
                setModal(false)
              }
              style={styles.cancelButton}
            >
              <Text>إلغاء</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ===================== Modal النصوص ===================== */}

      <Modal
        visible={!!labModal}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setLabModal(null)
        }
      >
        <View style={styles.overlay}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>
              {labModal === 'center'
                ? 'اسم المختبر'
                : labModal === 'directorate'
                ? 'المديرية / القطاع'
                : labModal === 'reportTitle'
                ? 'عنوان التقرير'
                : 'نص التذييل'}
            </Text>

            <TextInput
              value={labText}
              onChangeText={setLabText}
              autoFocus
              style={[styles.input, {backgroundColor: theme.input, borderColor: theme.border, color: theme.text}]}
              textAlign="right"
              multiline
            />

            <TouchableOpacity
              style={styles.btn}
              onPress={saveLabText}
            >
              <Text style={styles.btnText}>
                حفظ
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() =>
                setLabModal(null)
              }
              style={styles.cancelButton}
            >
              <Text>إلغاء</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f4f7f6',
  },

  content: {
    padding: 12,
    paddingBottom: 40,
  },

  h: {
    fontSize: 23,
    fontWeight: '900',
    textAlign: 'right',
    color: '#1d3b36',
    marginBottom: 14,
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 15,
    marginBottom: 12,
    elevation: 2,
  },

  title: {
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'right',
    color: '#1d3b36',
    marginBottom: 12,
  },

  sectionSubtitle: {
    fontSize: 15,
    fontWeight: '900',
    textAlign: 'right',
    color: '#1d3b36',
    marginTop: 16,
    marginBottom: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#e4e9e7',
    paddingBottom: 7,
  },

  label: {
    textAlign: 'right',
    fontWeight: '800',
    marginTop: 9,
    marginBottom: 6,
    color: '#26332f',
  },

  value: {
    borderWidth: 1,
    borderColor: '#ccd6d2',
    borderRadius: 10,
    padding: 12,
    alignItems: 'flex-end',
    backgroundColor: '#fafcfb',
  },

  valueText: {
    textAlign: 'right',
    color: '#26332f',
    fontWeight: '600',
  },

  desc: {
    textAlign: 'right',
    color: '#555',
    lineHeight: 22,
    marginBottom: 3,
  },

  note: {
    fontSize: 11,
    color: '#777',
    textAlign: 'right',
    marginTop: 10,
    lineHeight: 18,
  },

  successText: {
    color: '#16734b',
    textAlign: 'right',
    marginTop: 8,
    fontWeight: '800',
  },

  switchRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 7,
    minHeight: 42,
  },

  switchText: {
    flex: 1,
    textAlign: 'right',
    color: '#26332f',
    fontWeight: '600',
  },

  btn: {
    marginTop: 12,
    backgroundColor: '#1d3b36',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },

  btnText: {
    color: '#fff',
    fontWeight: '900',
  },

  btn2: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#1d3b36',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#fff',
  },

  btn2Text: {
    color: '#1d3b36',
    fontWeight: '900',
  },

  btnDanger: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#b33a3a',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },

  btnDangerText: {
    color: '#b33a3a',
    fontWeight: '800',
  },

  chips: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
  },

  chip: {
    borderWidth: 1,
    borderColor: '#ccd6d2',
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: '#fff',
  },

  chipOn: {
    backgroundColor: '#1d3b36',
    borderColor: '#1d3b36',
  },

  chipText: {
    color: '#26332f',
    fontWeight: '600',
  },

  chipOnText: {
    color: '#fff',
    fontWeight: '800',
  },

  themeGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 9,
  },

  themeItem: {
    width: '31%',
    minHeight: 78,
    borderWidth: 1,
    borderColor: '#d9e0dd',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },

  themeItemActive: {
    borderColor: '#1d3b36',
    borderWidth: 2,
    backgroundColor: '#f1f6f4',
  },

  themeCircle: {
    width: 27,
    height: 27,
    borderRadius: 50,
    marginBottom: 6,
  },

  themeText: {
    fontSize: 11,
    color: '#555',
    textAlign: 'center',
  },

  themeTextActive: {
    color: '#1d3b36',
    fontWeight: '900',
  },

  colorRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
  },

  colorInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccd6d2',
    borderRadius: 10,
    padding: 11,
    textAlign: 'left',
    backgroundColor: '#fff',
  },

  colorPreview: {
    width: 43,
    height: 43,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ccd6d2',
  },

  input: {
    borderWidth: 1,
    borderColor: '#ccd6d2',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginTop: 8,
    backgroundColor: '#fff',
  },

  inlineInputs: {
    flexDirection: 'row-reverse',
    gap: 8,
  },

  halfInput: {
    flex: 1,
  },

  numberRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 6,
  },

  numberLabel: {
    flex: 1,
    textAlign: 'right',
    color: '#26332f',
    fontWeight: '600',
  },

  numberInput: {
    width: 90,
    borderWidth: 1,
    borderColor: '#ccd6d2',
    borderRadius: 9,
    padding: 9,
    textAlign: 'center',
    backgroundColor: '#fff',
  },

  listBox: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#e0e6e3',
    borderRadius: 10,
    overflow: 'hidden',
  },

  listRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#edf0ef',
  },

  listText: {
    flex: 1,
    textAlign: 'right',
    color: '#26332f',
    marginRight: 10,
  },

  deleteText: {
    color: '#b33a3a',
    fontWeight: '900',
  },

  accountBox: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#e0e6e3',
    borderRadius: 12,
    padding: 12,
  },

  accountIcon: {
    fontSize: 26,
  },

  accountName: {
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'right',
    color: '#1d3b36',
  },

  driveMeta: {
    textAlign: 'right',
    marginTop: 10,
    color: '#52605b',
    lineHeight: 22,
  },

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },

  dialog: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    width: '100%',
    maxHeight: '90%',
  },

  dialogTitle: {
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'right',
    marginBottom: 10,
    color: '#1d3b36',
  },

  cancelButton: {
    padding: 13,
    alignItems: 'center',
  },
}); 
