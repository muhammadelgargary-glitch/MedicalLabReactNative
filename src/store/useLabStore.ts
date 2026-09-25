import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeType } from '../styles/theme';
import { buildDefaultTestCatalog } from '../utils/constants';

export type FontSizeKey = 'small' | 'medium' | 'large' | number;
export type FontFamilyKey = 'sans' | 'serif' | 'mono';
export type DensityKey = 'comfortable' | 'compact';
export type PrintTemplateKey = 'classic' | 'modern' | 'compact' | 'minimal';

export interface PatientPricing {
  total: number;
  paid: number;
  remaining: number | null;
  complete: boolean;
  currency: 'IQD';
  pricedAt: string;
}

export interface PrintSettings {
  paper?: 'A4' | 'A5' | 'Letter';
  orientation?: 'portrait' | 'landscape';
  layout?: 'auto' | '1' | '2' | '2stack' | '3' | '4';
  gap?: number;
  marginTop?: number;
  marginRight?: number;
  marginBottom?: number;
  marginLeft?: number;
  fontSize?: number;
  tableFontSize?: number;
  fontFamily?: string;
  showLogo?: boolean;
  logoPosition?: 'right' | 'left' | 'center';
  logoSize?: number;
  reportTitle?: string;
  showCenter?: boolean;
  showDirectorate?: boolean;
  showDate?: boolean;
  showSeq?: boolean;
  showNotes?: boolean;
  showFooter?: boolean;
  footerText?: string;
  showBorder?: boolean;
  borderColor?: string;
  showNormal?: boolean;

  /* إعدادات الشعار الإضافية المستخدمة حالياً في شاشة الطباعة */
  logoShape?: 'circle' | 'rounded' | 'square';
  logoBorder?: boolean;
  template?: PrintTemplateKey;
  showPrice?: boolean;
  showPaid?: boolean;
  showRemaining?: boolean;
  showAbbreviation?: boolean;
}

/**
 * معلومات الفحص القابلة للتعديل.
 *
 * ملاحظة مهمة:
 * referenceRange و criticalValue لا يتم افتراض قيم طبية جديدة لهما.
 * الفحوصات الموجودة مسبقاً تحتفظ بالقيمة الموجودة في constants.
 */
export interface TestMetadata {
  id: string;
  key: string;
  name: string;
  abbreviation: string;

  section:
    | 'Blood'
    | 'Chem'
    | 'Urine'
    | 'Serology'
    | 'Stool'
    | 'Preg';

  tube: string;
  specimen: string;
  notes: string;

  /**
   * القيمة المرجعية التي تظهر في التقرير.
   * نحتفظ بالقيمة الحالية للفحوصات القديمة.
   */
  referenceRange: string;

  /**
   * القيمة الحرجة.
   * تترك فارغة إذا لم يحددها المستخدم/البيانات الأصلية.
   */
  criticalValue: string;

  /**
   * سعر الفحص.
   */
  price: number;

  enabled: boolean;
}

export interface Settings {
  center: string;
  directorate: string;
  logo?: string;
  logoShape?: 'circle' | 'rounded' | 'square';
  logoSize?: number;
  logoPosition?: 'right' | 'left' | 'center';
  logoBorder?: boolean;
  reportTitle?: string;
  footerText?: string;
  printSettings?: PrintSettings;

  googleDriveAccessToken?: string;
  googleDriveRefreshToken?: string;
  lastBackup?: string;
}

export interface Patient {
  id: string;
  name: string;
  seq: string;
  gender: string;
  age: string;
  date: string;
  notes?: string;

  blood?: Record<string, any>;
  chem?: Record<string, any>;
  urine?: Record<string, any>;
  serology?: Record<string, any>;
  stool?: Record<string, any>;
  preg?: Record<string, any>;

  includeBlood: boolean;
  includeChem: boolean;
  includeUrine: boolean;
  includeSerology: boolean;
  includeStool: boolean;
  includePreg: boolean;

  /** الفحوصات المحددة فعلياً للمريض بصيغة Section.field */
  selectedTests?: string[];

  /** بيانات التسعير والدفع للمريض */
  pricing?: PatientPricing;
}

export interface AuditEntry {
  timestamp: string;
  action: string;
  patientName: string;
}

export interface CriticalAlert {
  id: string;
  timestamp: string;
  patientId: string;
  patientName: string;
  testKey: string;
  testName: string;
  value: string;
  rule: string;
}

interface LabStoreState {
  patients: Patient[];
  settings: Settings;
  auditLog: AuditEntry[];
  criticalAlerts: CriticalAlert[];
  criticalAlertsEnabled: boolean;

  /**
   * دليل الفحوصات.
   *
   * يتم تخزينه منفصلاً حتى لا نكسر patient data القديمة.
   */
  testCatalog: TestMetadata[];

  /**
   * أسعار الفحوصات.
   *
   * نحتفظ بها أيضاً في catalog، لكن هذا map يسهل الوصول السريع
   * ويتيح تطوير شاشة الأسعار لاحقاً بدون تغيير بنية المرضى.
   */
  testPrices: Record<string, number>;

  darkMode: boolean;
  theme: ThemeType;
  fontSize: FontSizeKey;
  fontFamily: FontFamilyKey;
  density: DensityKey;

  hydrated: boolean;

  hydrate: () => Promise<void>;
  loadFromStorage: () => Promise<void>;

  addPatient: (patient: Patient) => Promise<void>;
  updatePatient: (
    id: string,
    updates: Partial<Patient>
  ) => Promise<void>;
  deletePatient: (id: string) => Promise<void>;

  updateSettings: (
    settings: Partial<Settings>
  ) => Promise<void>;

  addAuditLog: (
    action: string,
    patientName: string
  ) => Promise<void>;

  clearAuditLog: () => Promise<void>;
  addCriticalAlert: (alert: Omit<CriticalAlert, 'id' | 'timestamp'>) => Promise<void>;
  clearCriticalAlerts: () => Promise<void>;
  setCriticalAlertsEnabled: (enabled: boolean) => Promise<void>;

  toggleDarkMode: () => Promise<void>;
  setTheme: (theme: ThemeType) => Promise<void>;
  setFontSize: (size: FontSizeKey) => Promise<void>;
  setFontFamily: (
    family: FontFamilyKey
  ) => Promise<void>;
  setDensity: (
    density: DensityKey
  ) => Promise<void>;

  /**
   * دليل الفحوصات
   */
  addTestMetadata: (
    test: TestMetadata
  ) => Promise<void>;

  updateTestMetadata: (
    id: string,
    updates: Partial<TestMetadata>
  ) => Promise<void>;

  deleteTestMetadata: (
    id: string
  ) => Promise<void>;

  replaceTestCatalog: (
    catalog: TestMetadata[]
  ) => Promise<void>;

  /**
   * الأسعار
   */
  setTestPrice: (
    testKey: string,
    price: number
  ) => Promise<void>;

  replaceTestPrices: (
    prices: Record<string, number>
  ) => Promise<void>;

  /**
   * النسخ والاسترجاع
   */
  clearAllData: () => Promise<void>;

  replacePatients: (
    patients: Patient[]
  ) => Promise<void>;

  replaceAuditLog: (
    auditLog: AuditEntry[]
  ) => Promise<void>;

  replaceSettings: (
    settings: Settings
  ) => Promise<void>;

  /**
   * استبدال بيانات الدليل والأسعار عند الاسترجاع.
   */
  replaceCatalogAndPrices: (
    catalog: TestMetadata[],
    prices: Record<string, number>
  ) => Promise<void>;
}

const STORAGE_KEYS = {
  PATIENTS: 'lab_patients',
  SETTINGS: 'lab_settings',
  AUDIT_LOG: 'lab_audit',

  DARK_MODE: 'lab_darkMode',
  THEME: 'lab_theme',
  FONT_SIZE: 'lab_fontSize',
  FONT_FAMILY: 'lab_fontFamily',
  DENSITY: 'lab_density',
  CRITICAL_ALERTS: 'lab_critical_alerts',
  CRITICAL_ALERTS_ENABLED: 'lab_critical_alerts_enabled',

  TEST_CATALOG: 'lab_test_catalog',
  TEST_PRICES: 'lab_test_prices',
};

/**
 * الإعدادات الافتراضية.
 */
const DEFAULT_SETTINGS: Settings = {
  center: 'مختبري',
  directorate: 'الإدارة',

  logoShape: 'rounded',
  logoSize: 56,
  logoPosition: 'right',
  logoBorder: false,

  reportTitle: 'تقرير الفحوصات المخبرية',
  footerText: 'مع تمنياتنا بالصحة والعافية',

  printSettings: {
    paper: 'A4',
    orientation: 'portrait',
    layout: 'auto',

    gap: 6,

    marginTop: 8,
    marginRight: 8,
    marginBottom: 8,
    marginLeft: 8,

    fontSize: 13,
    tableFontSize: 11,
    fontFamily: 'sans-serif',

    showLogo: true,
    logoPosition: 'right',
    logoSize: 56,

    reportTitle: 'تقرير الفحوصات المخبرية',

    showCenter: true,
    showDirectorate: true,
    showDate: true,
    showSeq: true,
    showNotes: true,
    showFooter: true,

    footerText: 'مع تمنياتنا بالصحة والعافية',

    showBorder: true,
    borderColor: '#D6DFDB',
    showNormal: true,

    logoShape: 'rounded',
    logoBorder: false,
    template: 'classic',
    showPrice: false,
    showPaid: false,
    showRemaining: false,
    showAbbreviation: true,
  },
};

/**
 * تحويل بيانات catalog القديمة/غير المكتملة إلى شكل آمن.
 */
function normalizeTestMetadata(
  test: Partial<TestMetadata>,
  fallback?: Partial<TestMetadata>
): TestMetadata {
  const merged = {
    ...(fallback || {}),
    ...test,
  };

  return {
    id: String(
      merged.id ||
        merged.key ||
        ''
    ),

    key: String(
      merged.key || ''
    ),

    name: String(
      merged.name ||
        merged.abbreviation ||
        ''
    ),

    abbreviation: String(
      merged.abbreviation ||
        merged.key ||
        ''
    ),

    section:
      (merged.section ||
        'Blood') as TestMetadata['section'],

    tube: String(
      merged.tube || ''
    ),

    specimen: String(
      merged.specimen || ''
    ),

    notes: String(
      merged.notes || ''
    ),

    referenceRange: String(
      merged.referenceRange || ''
    ),

    criticalValue: String(
      merged.criticalValue || ''
    ),

    price: Number.isFinite(
      Number(merged.price)
    )
      ? Number(merged.price)
      : 0,

    enabled:
      merged.enabled !== false,
  };
}

/**
 * إنشاء map الأسعار من catalog.
 */
function buildPricesFromCatalog(
  catalog: TestMetadata[]
): Record<string, number> {
  const prices: Record<string, number> = {};

  for (const test of catalog) {
    const key =
      test.key || test.id;

    if (!key) {
      continue;
    }

    prices[key] =
      Number.isFinite(
        Number(test.price)
      )
        ? Number(test.price)
        : 0;
  }

  return prices;
}

export const useLabStore =
  create<LabStoreState>(
    (set, get) => ({
      patients: [],
      settings: DEFAULT_SETTINGS,
      auditLog: [],
      criticalAlerts: [],
      criticalAlertsEnabled: true,

      testCatalog: [],
      testPrices: {},

      darkMode: false,
      theme: 'default',
      fontSize: 'medium',
      fontFamily: 'sans',
      density: 'comfortable',

      hydrated: false,

      hydrate: async () => {
        await get().loadFromStorage();
      },

      /* =========================================================
         PATIENTS
         ========================================================= */

      addPatient: async (
        patient
      ) => {
        try {
          /*
           * التأكد من وجود معرف للمريض.
           */
          if (
            !patient ||
            !patient.id
          ) {
            throw new Error(
              'معرّف المريض غير موجود.'
            );
          }

          /*
           * التأكد من عدم وجود نفس المريض مسبقاً.
           */
          const currentPatients =
            get().patients;

          const exists =
            currentPatients.some(
              (item) =>
                item.id === patient.id
            );

          if (exists) {
            throw new Error(
              'هذا المريض موجود مسبقاً.'
            );
          }

          /*
           * إنشاء القائمة الجديدة.
           */
          const newPatients = [
            ...currentPatients,
            patient,
          ];

          /*
           * تحديث Zustand فوراً.
           */
          set({
            patients:
              newPatients,
          });

          /*
           * الحفظ الدائم.
           */
          await AsyncStorage.setItem(
            STORAGE_KEYS.PATIENTS,
            JSON.stringify(
              newPatients
            )
          );

          /*
           * سجل التعديلات لا يجب أن يمنع
           * نجاح حفظ المريض.
           */
          try {
            await get().addAuditLog(
              'إضافة مريض',
              patient.name
            );
          } catch (
            auditError
          ) {
            console.error(
              'Audit log error while adding patient:',
              auditError
            );
          }
        } catch (error) {
          console.error(
            'Error adding patient:',
            error
          );

          throw error;
        }
      },

      updatePatient: async (
        id,
        updates
      ) => {
        try {
          /*
           * البحث عن المريض الحالي.
           */
          const currentPatients =
            get().patients;

          const existingPatient =
            currentPatients.find(
              (item) =>
                item.id === id
            );

          if (
            !existingPatient
          ) {
            throw new Error(
              'المريض المطلوب غير موجود.'
            );
          }

          /*
           * تحديث الحقول المطلوبة فقط
           * مع المحافظة على جميع البيانات
           * القديمة الأخرى.
           */
          const updatedPatient: Patient =
            {
              ...existingPatient,
              ...updates,
            };

          const newPatients =
            currentPatients.map(
              (patient) =>
                patient.id === id
                  ? updatedPatient
                  : patient
            );

          /*
           * تحديث الحالة.
           */
          set({
            patients:
              newPatients,
          });

          /*
           * الحفظ الدائم.
           */
          await AsyncStorage.setItem(
            STORAGE_KEYS.PATIENTS,
            JSON.stringify(
              newPatients
            )
          );

          /*
           * تسجيل العملية بشكل مستقل.
           */
          try {
            await get().addAuditLog(
              'تحديث مريض',
              updatedPatient.name
            );
          } catch (
            auditError
          ) {
            console.error(
              'Audit log error while updating patient:',
              auditError
            );
          }
        } catch (error) {
          console.error(
            'Error updating patient:',
            error
          );

          throw error;
        }
      },

      deletePatient: async (
        id
      ) => {
        try {
          const currentPatients =
            get().patients;

          const patient =
            currentPatients.find(
              (item) =>
                item.id === id
            );

          const newPatients =
            currentPatients.filter(
              (item) =>
                item.id !== id
            );

          set({
            patients:
              newPatients,
          });

          await AsyncStorage.setItem(
            STORAGE_KEYS.PATIENTS,
            JSON.stringify(
              newPatients
            )
          );

          /*
           * سجل الحذف لا يمنع نجاح الحذف.
           */
          if (patient) {
            try {
              await get().addAuditLog(
                'حذف مريض',
                patient.name
              );
            } catch (
              auditError
            ) {
              console.error(
                'Audit log error while deleting patient:',
                auditError
              );
            }
          }
        } catch (error) {
          console.error(
            'Error deleting patient:',
            error
          );

          throw error;
        }
      },

      replacePatients: async (
        patients
      ) => {
        try {
          const safePatients =
            Array.isArray(
              patients
            )
              ? patients
              : [];

          set({
            patients:
              safePatients,
          });

          await AsyncStorage.setItem(
            STORAGE_KEYS.PATIENTS,
            JSON.stringify(
              safePatients
            )
          );
        } catch (error) {
          console.error(
            'Error replacing patients:',
            error
          );

          throw error;
        }
      },

      /* =========================================================
         SETTINGS
         ========================================================= */

      updateSettings: async (
        updates
      ) => {
        const current =
          get().settings;

        const newSettings: Settings =
          {
            ...current,
            ...updates,

            printSettings: {
              ...(current.printSettings ||
                {}),
              ...(updates.printSettings ||
                {}),
            },
          };

        set({
          settings:
            newSettings,
        });

        await AsyncStorage.setItem(
          STORAGE_KEYS.SETTINGS,
          JSON.stringify(
            newSettings
          )
        );
      },

      replaceSettings: async (
        settings
      ) => {
        const safeSettings: Settings =
          {
            ...DEFAULT_SETTINGS,
            ...(settings || {}),

            printSettings: {
              ...(DEFAULT_SETTINGS.printSettings ||
                {}),
              ...(settings?.printSettings ||
                {}),
            },
          };

        set({
          settings:
            safeSettings,
        });

        await AsyncStorage.setItem(
          STORAGE_KEYS.SETTINGS,
          JSON.stringify(
            safeSettings
          )
        );
      },

      /* =========================================================
         AUDIT LOG
         ========================================================= */

      addAuditLog: async (
        action,
        patientName
      ) => {
        const newLog: AuditEntry[] =
          [
            ...get().auditLog,
            {
              timestamp:
                new Date().toISOString(),
              action,
              patientName,
            },
          ];

        set({
          auditLog:
            newLog,
        });

        await AsyncStorage.setItem(
          STORAGE_KEYS.AUDIT_LOG,
          JSON.stringify(
            newLog
          )
        );
      },

      clearAuditLog: async () => {
        set({
          auditLog: [],
        });

        await AsyncStorage.setItem(
          STORAGE_KEYS.AUDIT_LOG,
          JSON.stringify([])
        );
      },

      addCriticalAlert: async (alert) => {
        const item: CriticalAlert = {
          ...alert,
          id: `critical_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          timestamp: new Date().toISOString(),
        };
        const next = [item, ...get().criticalAlerts].slice(0, 200);
        set({ criticalAlerts: next });
        await AsyncStorage.setItem(
          STORAGE_KEYS.CRITICAL_ALERTS,
          JSON.stringify(next),
        );
      },

      clearCriticalAlerts: async () => {
        set({ criticalAlerts: [] });
        await AsyncStorage.setItem(
          STORAGE_KEYS.CRITICAL_ALERTS,
          JSON.stringify([]),
        );
      },

      setCriticalAlertsEnabled: async (enabled) => {
        set({ criticalAlertsEnabled: enabled });
        await AsyncStorage.setItem(
          STORAGE_KEYS.CRITICAL_ALERTS_ENABLED,
          JSON.stringify(enabled),
        );
      },

      replaceAuditLog: async (
        auditLog
      ) => {
        const safeLog =
          Array.isArray(
            auditLog
          )
            ? auditLog
            : [];

        set({
          auditLog:
            safeLog,
        });

        await AsyncStorage.setItem(
          STORAGE_KEYS.AUDIT_LOG,
          JSON.stringify(
            safeLog
          )
        );
      },

      /* =========================================================
         APPEARANCE
         ========================================================= */

      toggleDarkMode:
        async () => {
          const value =
            !get().darkMode;

          set({
            darkMode:
              value,
          });

          await AsyncStorage.setItem(
            STORAGE_KEYS.DARK_MODE,
            JSON.stringify(
              value
            )
          );
        },

      setTheme: async (
        theme
      ) => {
        set({
          theme,
        });

        await AsyncStorage.setItem(
          STORAGE_KEYS.THEME,
          theme
        );
      },

      setFontSize: async (
        fontSize
      ) => {
        set({
          fontSize,
        });

        await AsyncStorage.setItem(
          STORAGE_KEYS.FONT_SIZE,
          String(fontSize)
        );
      },

      setFontFamily: async (
        fontFamily
      ) => {
        set({
          fontFamily,
        });

        await AsyncStorage.setItem(
          STORAGE_KEYS.FONT_FAMILY,
          fontFamily
        );
      },

      setDensity: async (
        density
      ) => {
        set({
          density,
        });

        await AsyncStorage.setItem(
          STORAGE_KEYS.DENSITY,
          density
        );
      },

      /* =========================================================
         TEST CATALOG
         ========================================================= */

      addTestMetadata:
        async (test) => {
          const normalized =
            normalizeTestMetadata(
              test
            );

          const current =
            get().testCatalog;

          /*
           * منع تكرار الفحص بنفس key أو id.
           */
          const exists =
            current.some(
              (item) =>
                item.key ===
                  normalized.key ||
                item.id ===
                  normalized.id
            );

          if (exists) {
            throw new Error(
              'هذا الفحص موجود مسبقاً في دليل الفحوصات.'
            );
          }

          const newCatalog = [
            ...current,
            normalized,
          ];

          const newPrices = {
            ...get().testPrices,
            [normalized.key]:
              normalized.price,
          };

          set({
            testCatalog:
              newCatalog,
            testPrices:
              newPrices,
          });

          await Promise.all([
            AsyncStorage.setItem(
              STORAGE_KEYS.TEST_CATALOG,
              JSON.stringify(
                newCatalog
              )
            ),

            AsyncStorage.setItem(
              STORAGE_KEYS.TEST_PRICES,
              JSON.stringify(
                newPrices
              )
            ),
          ]);

          await get().addAuditLog(
            'إضافة فحص إلى دليل الفحوصات',
            normalized.name
          );
        },

      updateTestMetadata:
        async (
          id,
          updates
        ) => {
          const current =
            get().testCatalog;

          const index =
            current.findIndex(
              (item) =>
                item.id === id ||
                item.key === id
            );

          if (index === -1) {
            throw new Error(
              'الفحص المطلوب غير موجود.'
            );
          }

          const old =
            current[index];

          const updated =
            normalizeTestMetadata(
              {
                ...old,
                ...updates,
              },
              old
            );

          const newCatalog = [
            ...current,
          ];

          newCatalog[index] =
            updated;

          const newPrices = {
            ...get().testPrices,
            [updated.key]:
              updated.price,
          };

          set({
            testCatalog:
              newCatalog,
            testPrices:
              newPrices,
          });

          await Promise.all([
            AsyncStorage.setItem(
              STORAGE_KEYS.TEST_CATALOG,
              JSON.stringify(
                newCatalog
              )
            ),

            AsyncStorage.setItem(
              STORAGE_KEYS.TEST_PRICES,
              JSON.stringify(
                newPrices
              )
            ),
          ]);

          await get().addAuditLog(
            'تعديل فحص في دليل الفحوصات',
            updated.name
          );
        },

      deleteTestMetadata:
        async (id) => {
          const current =
            get().testCatalog;

          const test =
            current.find(
              (item) =>
                item.id === id ||
                item.key === id
            );

          if (!test) {
            throw new Error(
              'الفحص المطلوب غير موجود.'
            );
          }

          const newCatalog =
            current.filter(
              (item) =>
                item.id !== id &&
                item.key !== id
            );

          const newPrices = {
            ...get().testPrices,
          };

          delete newPrices[
            test.key
          ];

          set({
            testCatalog:
              newCatalog,
            testPrices:
              newPrices,
          });

          await Promise.all([
            AsyncStorage.setItem(
              STORAGE_KEYS.TEST_CATALOG,
              JSON.stringify(
                newCatalog
              )
            ),

            AsyncStorage.setItem(
              STORAGE_KEYS.TEST_PRICES,
              JSON.stringify(
                newPrices
              )
            ),
          ]);

          await get().addAuditLog(
            'حذف فحص من دليل الفحوصات',
            test.name
          );
        },

      replaceTestCatalog:
        async (catalog) => {
          const safeCatalog =
            Array.isArray(
              catalog
            )
              ? catalog.map(
                  (item) =>
                    normalizeTestMetadata(
                      item
                    )
                )
              : [];

          const pricesFromCatalog =
            buildPricesFromCatalog(
              safeCatalog
            );

          /*
           * لا نحذف أسعاراً إضافية
           * موجودة مسبقاً.
           */
          const mergedPrices = {
            ...get().testPrices,
            ...pricesFromCatalog,
          };

          set({
            testCatalog:
              safeCatalog,
            testPrices:
              mergedPrices,
          });

          await Promise.all([
            AsyncStorage.setItem(
              STORAGE_KEYS.TEST_CATALOG,
              JSON.stringify(
                safeCatalog
              )
            ),

            AsyncStorage.setItem(
              STORAGE_KEYS.TEST_PRICES,
              JSON.stringify(
                mergedPrices
              )
            ),
          ]);
        },

      /* =========================================================
         TEST PRICES
         ========================================================= */

      setTestPrice: async (
        testKey,
        price
      ) => {
        const numericPrice =
          Number.isFinite(
            Number(price)
          )
            ? Number(price)
            : 0;

        const newPrices = {
          ...get().testPrices,
          [testKey]:
            numericPrice,
        };

        const newCatalog =
          get().testCatalog.map(
            (test) =>
              test.key ===
              testKey
                ? {
                    ...test,
                    price:
                      numericPrice,
                  }
                : test
          );

        set({
          testPrices:
            newPrices,
          testCatalog:
            newCatalog,
        });

        await Promise.all([
          AsyncStorage.setItem(
            STORAGE_KEYS.TEST_PRICES,
            JSON.stringify(
              newPrices
            )
          ),

          AsyncStorage.setItem(
            STORAGE_KEYS.TEST_CATALOG,
            JSON.stringify(
              newCatalog
            )
          ),
        ]);

        const test =
          get().testCatalog.find(
            (item) =>
              item.key ===
              testKey
          );

        await get().addAuditLog(
          'تعديل سعر فحص',
          test?.name ||
            testKey
        );
      },

      replaceTestPrices:
        async (prices) => {
          const safePrices =
            prices &&
            typeof prices ===
              'object'
              ? prices
              : {};

          /*
           * تحديث السعر داخل catalog
           * أيضاً حتى تبقى البيانات متزامنة.
           */
          const newCatalog =
            get().testCatalog.map(
              (test) => ({
                ...test,
                price:
                  safePrices[
                    test.key
                  ] !== undefined
                    ? Number(
                        safePrices[
                          test.key
                        ]
                      ) || 0
                    : test.price,
              })
            );

          set({
            testPrices:
              safePrices,
            testCatalog:
              newCatalog,
          });

          await Promise.all([
            AsyncStorage.setItem(
              STORAGE_KEYS.TEST_PRICES,
              JSON.stringify(
                safePrices
              )
            ),

            AsyncStorage.setItem(
              STORAGE_KEYS.TEST_CATALOG,
              JSON.stringify(
                newCatalog
              )
            ),
          ]);
        },

      replaceCatalogAndPrices:
        async (
          catalog,
          prices
        ) => {
          const safeCatalog =
            Array.isArray(
              catalog
            )
              ? catalog.map(
                  (item) =>
                    normalizeTestMetadata(
                      item
                    )
                )
              : [];

          const safePrices =
            prices &&
            typeof prices ===
              'object'
              ? prices
              : buildPricesFromCatalog(
                  safeCatalog
                );

          /*
           * إذا كان backup يحتوي على أسعار
           * منفصلة، تكون لها الأولوية.
           */
          const finalCatalog =
            safeCatalog.map(
              (test) => ({
                ...test,
                price:
                  safePrices[
                    test.key
                  ] !== undefined
                    ? Number(
                        safePrices[
                          test.key
                        ]
                      ) || 0
                    : test.price,
              })
            );

          set({
            testCatalog:
              finalCatalog,
            testPrices:
              safePrices,
          });

          await Promise.all([
            AsyncStorage.setItem(
              STORAGE_KEYS.TEST_CATALOG,
              JSON.stringify(
                finalCatalog
              )
            ),

            AsyncStorage.setItem(
              STORAGE_KEYS.TEST_PRICES,
              JSON.stringify(
                safePrices
              )
            ),
          ]);
        },

      /* =========================================================
         CLEAR
         ========================================================= */

      clearAllData:
        async () => {
          await Promise.all([
            AsyncStorage.removeItem(
              STORAGE_KEYS.PATIENTS
            ),

            AsyncStorage.removeItem(
              STORAGE_KEYS.AUDIT_LOG
            ),
            AsyncStorage.removeItem(
              STORAGE_KEYS.CRITICAL_ALERTS
            ),
          ]);

          /*
           * لا نحذف:
           * - إعدادات المختبر
           * - دليل الفحوصات
           * - الأسعار
           * - الثيم
           *
           * لأن حذف جميع البيانات الحالي خاص
           * ببيانات المرضى وسجل التعديلات.
           */
          set({
            patients: [],
            auditLog: [],
            criticalAlerts: [],
          });
        },

      /* =========================================================
         LOAD / HYDRATE
         ========================================================= */

      loadFromStorage:
        async () => {
          try {
            const values =
              await Promise.all([
                AsyncStorage.getItem(
                  STORAGE_KEYS.PATIENTS
                ),

                AsyncStorage.getItem(
                  STORAGE_KEYS.SETTINGS
                ),

                AsyncStorage.getItem(
                  STORAGE_KEYS.AUDIT_LOG
                ),

                AsyncStorage.getItem(
                  STORAGE_KEYS.DARK_MODE
                ),

                AsyncStorage.getItem(
                  STORAGE_KEYS.THEME
                ),

                AsyncStorage.getItem(
                  STORAGE_KEYS.FONT_SIZE
                ),

                AsyncStorage.getItem(
                  STORAGE_KEYS.FONT_FAMILY
                ),

                AsyncStorage.getItem(
                  STORAGE_KEYS.DENSITY
                ),

                AsyncStorage.getItem(
                  STORAGE_KEYS.CRITICAL_ALERTS
                ),

                AsyncStorage.getItem(
                  STORAGE_KEYS.CRITICAL_ALERTS_ENABLED
                ),

                AsyncStorage.getItem(
                  STORAGE_KEYS.TEST_CATALOG
                ),

                AsyncStorage.getItem(
                  STORAGE_KEYS.TEST_PRICES
                ),
              ]);

            const [
              patientsStr,
              settingsStr,
              auditStr,
              darkStr,
              themeStr,
              fontSizeStr,
              fontFamilyStr,
              densityStr,
              criticalAlertsStr,
              criticalAlertsEnabledStr,
              catalogStr,
              pricesStr,
            ] = values;

            let parsedSettings: any =
              {};

            if (settingsStr) {
              try {
                parsedSettings =
                  JSON.parse(
                    settingsStr
                  ) || {};
              } catch {
                parsedSettings =
                  {};
              }
            }

            let parsedCatalog:
              TestMetadata[] =
              [];

            if (catalogStr) {
              try {
                const value =
                  JSON.parse(
                    catalogStr
                  );

                if (
                  Array.isArray(
                    value
                  )
                ) {
                  parsedCatalog =
                    value.map(
                      (item) =>
                        normalizeTestMetadata(
                          item
                        )
                    );
                }
              } catch {
                parsedCatalog =
                  [];
              }
            }

            let parsedPrices:
              Record<
                string,
                number
              > = {};

            if (pricesStr) {
              try {
                const value =
                  JSON.parse(
                    pricesStr
                  );

                if (
                  value &&
                  typeof value ===
                    'object'
                ) {
                  parsedPrices =
                    value;
                }
              } catch {
                parsedPrices =
                  {};
              }
            }

            /*
             * إنشاء دليل افتراضي من الفحوصات الأصلية عند أول تشغيل
             * حتى تظهر شاشة دليل الفحوصات دائماً.
             */
            if (parsedCatalog.length === 0) {
              parsedCatalog = buildDefaultTestCatalog().map((item: any) =>
                normalizeTestMetadata(item),
              );
            }

            /*
             * إذا لم توجد أسعار منفصلة،
             * نأخذها من catalog.
             */
            if (
              Object.keys(
                parsedPrices
              ).length === 0 &&
              parsedCatalog.length >
                0
            ) {
              parsedPrices =
                buildPricesFromCatalog(
                  parsedCatalog
                );
            }

            /*
             * مزامنة السعر داخل catalog.
             */
            parsedCatalog =
              parsedCatalog.map(
                (test) => ({
                  ...test,

                  price:
                    parsedPrices[
                      test.key
                    ] !== undefined
                      ? Number(
                          parsedPrices[
                            test.key
                          ]
                        ) || 0
                      : test.price,
                })
              );

            /*
             * قراءة المرضى بطريقة آمنة.
             */
            let parsedPatients:
              Patient[] = [];

            if (patientsStr) {
              try {
                const value =
                  JSON.parse(
                    patientsStr
                  );

                if (
                  Array.isArray(
                    value
                  )
                ) {
                  parsedPatients =
                    value;
                }
              } catch {
                parsedPatients =
                  [];
              }
            }

            /*
             * قراءة سجل التعديلات بطريقة آمنة.
             */
            let parsedAuditLog:
              AuditEntry[] =
              [];

            if (auditStr) {
              try {
                const value =
                  JSON.parse(
                    auditStr
                  );

                if (
                  Array.isArray(
                    value
                  )
                ) {
                  parsedAuditLog =
                    value;
                }
              } catch {
                parsedAuditLog =
                  [];
              }
            }

            let parsedCriticalAlerts: CriticalAlert[] = [];
            if (criticalAlertsStr) {
              try {
                const value = JSON.parse(criticalAlertsStr);
                if (Array.isArray(value)) parsedCriticalAlerts = value;
              } catch {
                parsedCriticalAlerts = [];
              }
            }

            let parsedCriticalAlertsEnabled = true;
            if (criticalAlertsEnabledStr) {
              try {
                parsedCriticalAlertsEnabled = JSON.parse(criticalAlertsEnabledStr) !== false;
              } catch {
                parsedCriticalAlertsEnabled = true;
              }
            }

            set({
              patients:
                parsedPatients,

              settings: {
                ...DEFAULT_SETTINGS,
                ...parsedSettings,

                printSettings: {
                  ...(DEFAULT_SETTINGS.printSettings ||
                    {}),

                  ...(parsedSettings.printSettings ||
                    {}),
                },
              },

              auditLog:
                parsedAuditLog,

              criticalAlerts: parsedCriticalAlerts,
              criticalAlertsEnabled: parsedCriticalAlertsEnabled,

              darkMode: darkStr
                ? JSON.parse(
                    darkStr
                  )
                : false,

              theme:
                (themeStr as ThemeType) ||
                'default',

              fontSize:
                fontSizeStr && !Number.isNaN(Number(fontSizeStr))
                  ? Number(fontSizeStr)
                  : ((fontSizeStr as FontSizeKey) || 'medium'),

              fontFamily:
                (fontFamilyStr as FontFamilyKey) ||
                'sans',

              density:
                (densityStr as DensityKey) ||
                'comfortable',

              testCatalog:
                parsedCatalog,

              testPrices:
                parsedPrices,

              hydrated: true,
            });
          } catch (error) {
            console.error(
              'Error loading laboratory data:',
              error
            );

            /*
             * لا نوقف التطبيق إذا كانت هناك
             * بيانات قديمة أو تالفة جزئياً.
             */
            set({
              hydrated: true,
            });
          }
        },
    })
  ); 
