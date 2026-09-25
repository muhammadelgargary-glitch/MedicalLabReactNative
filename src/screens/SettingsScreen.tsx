import React, { useEffect, useState } from 'react';
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

import { useLabStore } from '../store/useLabStore';
import { getColors } from '../styles/colors';
import { resolveFontFamily, fontScale } from '../styles/design';
import { SHADOWS } from '../styles/spacing';

import {
  exportBackup,
  importBackupFile,
  mergeBackupData,
} from '../services/exportService';

import {
  getSavedGoogleUser,
  restoreLatestBackupFromDrive,
  signInWithGoogle,
  signOutGoogle,
  uploadBackupToDrive,
} from '../services/googleDriveService';

export default function SettingsScreen({ navigation }: any) {
  const dark = useLabStore((s) => s.darkMode);
  const theme = useLabStore((s) => s.theme);
  const familyKey = useLabStore((s) => s.fontFamily);
  const size = useLabStore((s) => s.fontSize);

  const settings = useLabStore((s) => s.settings);
  const patients = useLabStore((s) => s.patients);
  const auditLog = useLabStore((s) => s.auditLog);
  const criticalAlerts = useLabStore((s) => s.criticalAlerts);
  const criticalAlertsEnabled = useLabStore((s) => s.criticalAlertsEnabled);

  // البيانات الجديدة
  const testCatalog = useLabStore((s) => s.testCatalog);
  const testPrices = useLabStore((s) => s.testPrices);

  const updateSettings = useLabStore((s) => s.updateSettings);
  const replacePatients = useLabStore((s) => s.replacePatients);
  const replaceAuditLog = useLabStore((s) => s.replaceAuditLog);
  const clearCriticalAlerts = useLabStore((s) => s.clearCriticalAlerts);
  const addCriticalAlert = useLabStore((s) => s.addCriticalAlert);
  const setCriticalAlertsEnabled = useLabStore((s) => s.setCriticalAlertsEnabled);

  // استرجاع دليل الفحوصات والأسعار
  const replaceCatalogAndPrices = useLabStore(
    (s) => s.replaceCatalogAndPrices,
  );

  const clearAllData = useLabStore((s) => s.clearAllData);

  const colors = getColors(dark, theme);
  const styles = createStyles(
    colors,
    resolveFontFamily(familyKey),
    fontScale(size),
  );

  const [center, setCenter] = useState(settings.center || '');
  const [directorate, setDirectorate] = useState(
    settings.directorate || '',
  );

  const [googleUser, setGoogleUser] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setCenter(settings.center || '');
    setDirectorate(settings.directorate || '');
  }, [settings.center, settings.directorate]);

  useEffect(() => {
    getSavedGoogleUser()
      .then(setGoogleUser)
      .catch(() => {});
  }, []);

  /*
   * حفظ معلومات المختبر
   */
  const saveLab = async () => {
    try {
      await updateSettings({
        center: center.trim() || 'مختبري',
        directorate: directorate.trim() || 'الإدارة',
      });

      navigation.getParent?.()?.navigate('Home');
      Alert.alert('تم الحفظ', 'تم حفظ معلومات المختبر بنجاح.');
    } catch (e: any) {
      Alert.alert(
        'خطأ',
        e?.message || 'تعذر حفظ معلومات المختبر.',
      );
    }
  };

  /*
   * إنشاء نسخة احتياطية محلية
   *
   * النسخة تشمل:
   * - المرضى
   * - إعدادات المختبر
   * - سجل التعديلات
   * - دليل الفحوصات
   * - أسعار الفحوصات
   */
  const localBackup = async () => {
    try {
      setBusy(true);

      await exportBackup(
        patients,
        settings,
        auditLog,
        {
          catalog: testCatalog,
          prices: testPrices,
          appPreferences: {
            criticalAlerts,
            criticalAlertsEnabled,
          },
        },
      );

      Alert.alert(
        'تم',
        'تم إنشاء النسخة الاحتياطية وحفظ جميع بيانات المختبر.',
      );
    } catch (e: any) {
      Alert.alert(
        'خطأ',
        e?.message || 'تعذر إنشاء النسخة الاحتياطية.',
      );
    } finally {
      setBusy(false);
    }
  };

  /*
   * استرجاع النسخة الاحتياطية المحلية
   *
   * يدعم النسخ القديمة والجديدة.
   */
  const localRestore = async () => {
    try {
      setBusy(true);

      const data: any = await importBackupFile();

      if (!data || !Array.isArray(data.patients)) {
        throw new Error('ملف النسخة غير صالح.');
      }

      /*
       * دمج المرضى مع البيانات الموجودة.
       * هذا يحافظ على السلوك السابق ولا يحذف
       * سجلات الجهاز الحالية.
       */
      const merged = mergeBackupData(
        patients,
        data.patients,
      );

      await replacePatients(merged);

      /*
       * سجل التعديلات اختياري حتى تبقى
       * النسخ القديمة متوافقة.
       */
      if (Array.isArray(data.auditLog)) {
        await replaceAuditLog(data.auditLog);
      }

      if (data.appPreferences?.criticalAlertsEnabled !== undefined) {
        await setCriticalAlertsEnabled(data.appPreferences.criticalAlertsEnabled !== false);
      }
      if (Array.isArray(data.appPreferences?.criticalAlerts)) {
        // سجل التنبيهات جزء من النسخة، ونحافظ على البيانات الموجودة إذا لم يوجد الحقل.
        const restoredAlerts = data.appPreferences.criticalAlerts;
        await clearCriticalAlerts();
        for (const alert of restoredAlerts.slice(0, 200)) {
          await addCriticalAlert({
            patientId: alert.patientId || '',
            patientName: alert.patientName || '',
            testKey: alert.testKey || '',
            testName: alert.testName || '',
            value: alert.value || '',
            rule: alert.rule || '',
          });
        }
      }

      /*
       * إعدادات المختبر
       */
      if (data.settings) {
        await updateSettings(data.settings);
      }

      /*
       * دليل الفحوصات والأسعار
       *
       * إذا كانت النسخة قديمة فلن تكون هذه
       * الحقول موجودة، ولذلك لا نفعل شيئاً.
       */
      if (
        Array.isArray(data.catalog) ||
        (data.prices && typeof data.prices === 'object')
      ) {
        await replaceCatalogAndPrices(
          Array.isArray(data.catalog)
            ? data.catalog
            : testCatalog,
          data.prices &&
          typeof data.prices === 'object'
            ? data.prices
            : testPrices,
        );
      }

      Alert.alert(
        'تم الاسترجاع',
        `تم استرجاع البيانات بنجاح.\nعدد سجلات المرضى: ${merged.length}`,
      );
    } catch (e: any) {
      if (e?.message !== 'User canceled') {
        Alert.alert(
          'خطأ',
          e?.message || 'تعذر استرجاع النسخة الاحتياطية.',
        );
      }
    } finally {
      setBusy(false);
    }
  };

  /*
   * رفع نسخة احتياطية إلى Google Drive
   */
  const driveBackup = async () => {
    try {
      setBusy(true);

      const session = await signInWithGoogle();

      const payload = {
        app: 'lab-app' as const,
        version: 4,
        exportedAt: new Date().toISOString(),

        patients,
        settings,
        auditLog,

        // البيانات الجديدة
        catalog: testCatalog,
        prices: testPrices,
        appPreferences: { criticalAlerts, criticalAlertsEnabled },
      };

      await uploadBackupToDrive(payload as any);

      setGoogleUser(session.user);

      await updateSettings({
        lastBackup: new Date().toISOString(),
      });

      Alert.alert(
        'تم',
        'تم رفع نسخة احتياطية كاملة إلى Google Drive.',
      );
    } catch (e: any) {
      Alert.alert(
        'خطأ',
        e?.message || 'تعذر إنشاء النسخة الاحتياطية على Google Drive.',
      );
    } finally {
      setBusy(false);
    }
  };

  /*
   * استرجاع آخر نسخة من Google Drive
   */
  const driveRestore = async () => {
    try {
      setBusy(true);

      const data: any =
        await restoreLatestBackupFromDrive();

      if (!data) {
        throw new Error(
          'لا توجد نسخة احتياطية في Google Drive.',
        );
      }

      /*
       * المرضى
       *
       * نحافظ هنا على السلوك السابق:
       * نسخة Drive هي النسخة التي يتم استرجاعها.
       */
      await replacePatients(
        Array.isArray(data.patients)
          ? data.patients
          : [],
      );

      /*
       * سجل التعديلات
       */
      if (Array.isArray(data.auditLog)) {
        await replaceAuditLog(data.auditLog);
      }

      if (data.appPreferences?.criticalAlertsEnabled !== undefined) {
        await setCriticalAlertsEnabled(data.appPreferences.criticalAlertsEnabled !== false);
      }
      if (Array.isArray(data.appPreferences?.criticalAlerts)) {
        // سجل التنبيهات جزء من النسخة، ونحافظ على البيانات الموجودة إذا لم يوجد الحقل.
        const restoredAlerts = data.appPreferences.criticalAlerts;
        await clearCriticalAlerts();
        for (const alert of restoredAlerts.slice(0, 200)) {
          await addCriticalAlert({
            patientId: alert.patientId || '',
            patientName: alert.patientName || '',
            testKey: alert.testKey || '',
            testName: alert.testName || '',
            value: alert.value || '',
            rule: alert.rule || '',
          });
        }
      }

      /*
       * إعدادات المختبر
       */
      if (data.settings) {
        await updateSettings(data.settings);
      }

      /*
       * دليل الفحوصات والأسعار
       *
       * النسخ القديمة من Google Drive
       * لا تحتوي هذه الحقول، لذلك نبقي
       * البيانات الحالية إذا لم تكن موجودة.
       */
      if (
        Array.isArray(data.catalog) ||
        (data.prices && typeof data.prices === 'object')
      ) {
        await replaceCatalogAndPrices(
          Array.isArray(data.catalog)
            ? data.catalog
            : testCatalog,
          data.prices &&
          typeof data.prices === 'object'
            ? data.prices
            : testPrices,
        );
      }

      Alert.alert(
        'تم',
        'تم استرجاع آخر نسخة احتياطية من Google Drive بنجاح.',
      );
    } catch (e: any) {
      Alert.alert(
        'خطأ',
        e?.message ||
          'تعذر الاسترجاع من Google Drive.',
      );
    } finally {
      setBusy(false);
    }
  };

  /*
   * تسجيل الخروج من Google
   */
  const driveSignOut = async () => {
    try {
      await signOutGoogle();
      setGoogleUser(null);

      Alert.alert(
        'تم',
        'تم تسجيل الخروج من Google Drive.',
      );
    } catch (e: any) {
      Alert.alert(
        'خطأ',
        e?.message || 'تعذر تسجيل الخروج.',
      );
    }
  };

  /*
   * حذف البيانات المحلية
   *
   * clearAllData في الـStore مصمم حالياً
   * لحذف المرضى وسجل التعديلات فقط،
   * مع إبقاء الإعدادات ودليل الفحوصات.
   */
  const wipe = () =>
    Alert.alert(
      'حذف جميع البيانات',
      'سيتم حذف المرضى وسجل التعديلات من الجهاز. لا يمكن التراجع.',
      [
        {
          text: 'إلغاء',
          style: 'cancel',
        },
        {
          text: 'حذف نهائي',
          style: 'destructive',
          onPress: async () => {
            try {
              setBusy(true);

              await clearAllData();

              Alert.alert(
                'تم',
                'تم حذف البيانات المحلية.',
              );
            } catch (e: any) {
              Alert.alert(
                'خطأ',
                e?.message || 'تعذر حذف البيانات.',
              );
            } finally {
              setBusy(false);
            }
          },
        },
      ],
    );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={{ flex: 1 }}>
            <Text style={styles.kicker}>
              التحكم
            </Text>

            <Text style={styles.title}>
              إعدادات المختبر
            </Text>

            <Text style={styles.subtitle}>
              إعدادات منفصلة وواضحة بدل شاشة مزدحمة.
            </Text>
          </View>
        </View>

        <Section
          title="معلومات المختبر"
          styles={styles}
        >
          <Field
            label="اسم المختبر / المركز"
            value={center}
            onChangeText={setCenter}
            styles={styles}
          />

          <Field
            label="الإدارة / الفرع"
            value={directorate}
            onChangeText={setDirectorate}
            styles={styles}
          />

          <Action
            label="حفظ معلومات المختبر"
            onPress={saveLab}
            styles={styles}
            primary
          />
        </Section>

        <Section
          title="المظهر"
          subtitle="الثيم، الخط، الحجم والكثافة"
          styles={styles}
        >
          <NavRow
            title="إعدادات المظهر"
            subtitle="الثيمات والألوان وحجم الخط ونوعه"
            onPress={() =>
              navigation.navigate('Appearance')
            }
            styles={styles}
          />
        </Section>

        <Section
          title="إدارة المختبر"
          subtitle="الفحوصات والأسعار والتنبيهات والقيم المرجعية"
          styles={styles}
        >
          <NavRow
            title="دليل الفحوصات والقيم المرجعية"
            subtitle="إضافة وتعديل الفحوصات، العينة، الأنبوب، المرجع والقيمة الحرجة"
            onPress={() => navigation.navigate('TestCatalog')}
            styles={styles}
          />

          <NavRow
            title="إدارة أسعار الفحوصات"
            subtitle="تعديل سعر كل فحص وحفظه للمختبر"
            onPress={() => navigation.navigate('TestPrices')}
            styles={styles}
          />

          <NavRow
            title="التنبيهات الحرجة"
            subtitle="تفعيل التنبيه ومراجعة سجل القيم الحرجة"
            onPress={() => navigation.navigate('CriticalAlerts')}
            styles={styles}
          />
        </Section>

        <Section
          title="التقارير والطباعة"
          subtitle="كل خيارات التقرير في صفحة مستقلة"
          styles={styles}
        >
          <NavRow
            title="إعدادات الطباعة"
            subtitle="A4/A5، الاتجاه، الهوامش، الشعار ومحتوى التقرير"
            onPress={() =>
              navigation.navigate('PrintSettings')
            }
            styles={styles}
          />

          <NavRow
            title="طباعة عدة تقارير"
            subtitle="حدد المرضى واختر 1 أو 2 أو 3 أو 4 تقارير بالصفحة"
            onPress={() =>
              navigation.navigate('MultiPrint')
            }
            styles={styles}
          />
        </Section>

        <Section
          title="النسخ الاحتياطي والبيانات"
          subtitle="نسخة كاملة تشمل بيانات المرضى ودليل الفحوصات والأسعار"
          styles={styles}
        >
          <Action
            label="تصدير نسخة احتياطية"
            onPress={localBackup}
            styles={styles}
          />

          <Action
            label="استيراد نسخة احتياطية"
            onPress={localRestore}
            styles={styles}
          />

          <Action
            label="حذف جميع البيانات المحلية"
            onPress={wipe}
            styles={styles}
            danger
          />
        </Section>

        <Section
          title="Google Drive"
          subtitle={
            googleUser
              ? `متصل: ${
                  googleUser.email ||
                  googleUser.name ||
                  ''
                }`
              : 'غير متصل'
          }
          styles={styles}
        >
          {!googleUser ? (
            <Action
              label="تسجيل الدخول إلى Google"
              onPress={async () => {
                try {
                  setBusy(true);

                  const s =
                    await signInWithGoogle();

                  setGoogleUser(s.user);

                  Alert.alert(
                    'تم',
                    'تم تسجيل الدخول إلى Google بنجاح.',
                  );
                } catch (e: any) {
                  Alert.alert(
                    'خطأ',
                    e?.message ||
                      'تعذر تسجيل الدخول إلى Google.',
                  );
                } finally {
                  setBusy(false);
                }
              }}
              styles={styles}
              primary
            />
          ) : (
            <>
              <Action
                label="رفع نسخة إلى Google Drive"
                onPress={driveBackup}
                styles={styles}
                primary
              />

              <Action
                label="استرجاع آخر نسخة من Google Drive"
                onPress={driveRestore}
                styles={styles}
              />

              <Action
                label="تسجيل الخروج من Google"
                onPress={driveSignOut}
                styles={styles}
                danger
              />
            </>
          )}
        </Section>

        <Section
          title="التنبيهات"
          subtitle={`${criticalAlerts.length} تنبيه محفوظ • ${criticalAlertsEnabled ? 'مفعلة' : 'متوقفة'}`}
          styles={styles}
        >
          <Action label="فتح قسم التنبيهات" onPress={() => navigation.navigate('CriticalAlerts')} styles={styles} />
        </Section>

        <Section
          title="معلومات التطبيق"
          styles={styles}
        >
          <Info
            label="الإصدار"
            value="1.0.0"
            styles={styles}
          />

          <Info
            label="السجلات الحالية"
            value={String(patients.length)}
            styles={styles}
          />

          <Info
            label="الفحوصات في الدليل"
            value={String(testCatalog.length)}
            styles={styles}
          />

          <Info
            label="الأسعار المسجلة"
            value={String(
              Object.keys(testPrices || {}).length,
            )}
            styles={styles}
          />

          <Info
            label="سجل التعديلات"
            value={String(auditLog.length)}
            styles={styles}
          />
        </Section>
      </ScrollView>

      {busy && (
        <View style={styles.busy}>
          <Text style={styles.busyText}>
            جارٍ تنفيذ العملية…
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

function Section({
  title,
  subtitle,
  children,
  styles,
}: {
  title: string;
  subtitle?: string;
  children: any;
  styles: any;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>
        {title}
      </Text>

      {subtitle ? (
        <Text style={styles.sectionSubtitle}>
          {subtitle}
        </Text>
      ) : null}

      {children}
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  styles,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  styles: any;
}) {
  return (
    <View style={{ marginBottom: 10 }}>
      <Text style={styles.label}>
        {label}
      </Text>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        style={styles.input}
      />
    </View>
  );
}

function Action({
  label,
  onPress,
  styles,
  primary = false,
  danger = false,
}: {
  label: string;
  onPress: () => void;
  styles: any;
  primary?: boolean;
  danger?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.action,
        primary && styles.actionPrimary,
        danger && styles.actionDanger,
      ]}
    >
      <Text
        style={[
          styles.actionText,
          primary && styles.actionPrimaryText,
          danger && styles.actionDangerText,
        ]}
      >
        {label}
      </Text>

      <Text style={styles.arrow}>
        ‹
      </Text>
    </TouchableOpacity>
  );
}

function NavRow({
  title,
  subtitle,
  onPress,
  styles,
}: {
  title: string;
  subtitle: string;
  onPress: () => void;
  styles: any;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.navRow}
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.navTitle}>
          {title}
        </Text>

        <Text style={styles.navSubtitle}>
          {subtitle}
        </Text>
      </View>

      <Text style={styles.arrow}>
        ‹
      </Text>
    </TouchableOpacity>
  );
}

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
        {value}
      </Text>
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
      paddingBottom: 36,
    },

    hero: {
      backgroundColor: c.headerBg,
      padding: 20,
    },

    kicker: {
      color: '#B7E8E2',
      fontSize: 11 * s,
      fontWeight: '700',
      fontFamily: f,
    },

    title: {
      color: '#fff',
      fontSize: 25 * s,
      fontWeight: '900',
      fontFamily: f,
      marginTop: 3,
    },

    subtitle: {
      color: '#D7EFEC',
      fontSize: 11 * s,
      fontFamily: f,
      marginTop: 5,
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
    },

    sectionSubtitle: {
      fontSize: 11 * s,
      color: c.inkSub,
      fontFamily: f,
      marginTop: 3,
      marginBottom: 10,
    },

    label: {
      fontSize: 12 * s,
      fontWeight: '800',
      color: c.ink,
      fontFamily: f,
      marginBottom: 6,
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

    action: {
      minHeight: 48,
      borderRadius: 13,
      borderWidth: 1,
      borderColor: c.line,
      backgroundColor: c.paper,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      marginTop: 8,
    },

    actionPrimary: {
      backgroundColor: c.navy,
      borderColor: c.navy,
    },

    actionDanger: {
      backgroundColor: c.danger,
      borderColor: c.danger,
    },

    actionText: {
      flex: 1,
      color: c.ink,
      fontSize: 13 * s,
      fontWeight: '800',
      fontFamily: f,
    },

    actionPrimaryText: {
      color: '#fff',
    },

    actionDangerText: {
      color: '#fff',
    },

    arrow: {
      color: c.navy,
      fontSize: 26,
      fontWeight: '400',
    },

    navRow: {
      minHeight: 62,
      borderRadius: 14,
      backgroundColor: c.paper,
      borderWidth: 1,
      borderColor: c.line,
      paddingHorizontal: 14,
      marginTop: 8,
      flexDirection: 'row',
      alignItems: 'center',
    },

    navTitle: {
      color: c.ink,
      fontSize: 13 * s,
      fontWeight: '900',
      fontFamily: f,
    },

    navSubtitle: {
      color: c.inkSub,
      fontSize: 10.5 * s,
      fontFamily: f,
      marginTop: 3,
    },

    info: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: c.line,
    },

    infoLabel: {
      color: c.inkSub,
      fontFamily: f,
      fontSize: 11 * s,
    },

    infoValue: {
      color: c.ink,
      fontFamily: f,
      fontSize: 12 * s,
      fontWeight: '900',
    },

    busy: {
      position: 'absolute',
      left: 20,
      right: 20,
      bottom: 20,
      padding: 14,
      borderRadius: 14,
      backgroundColor: c.headerBg,
      alignItems: 'center',
    },

    busyText: {
      color: '#fff',
      fontFamily: f,
      fontWeight: '800',
    },
  }); 
