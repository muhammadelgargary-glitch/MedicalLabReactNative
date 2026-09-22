import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  emptySectionData,
  SectionKey,
} from '../utils/constants';
import { todayISO, uid } from '../utils/helpers';

/* =========================================================
   STORAGE KEYS
   ========================================================= */

const PATIENTS_KEY = 'lab_patients_db';
const SETTINGS_KEY = 'lab_settings_db';
const AUDIT_KEY = 'lab_audit_log';

/* =========================================================
   TYPES
   ========================================================= */

export type Patient = {
  id: string;
  name: string;
  seq: string;
  age: string;
  gender: string;
  date: string;
  notes: string;

  [key: string]: any;
};

export type PrintSettings = {
  /* الصفحة */
  paper: 'A4' | 'A5' | 'Letter';
  orientation: 'portrait' | 'landscape';

  /* تخطيط التقارير */
  layout:
    | 'auto'
    | '1'
    | '2'
    | '2stack'
    | '3'
    | '4';

  /* المسافات */
  gap: number;

  /* الهوامش بالملليمتر */
  marginTop: number;
  marginRight: number;
  marginBottom: number;
  marginLeft: number;

  /* الخط */
  fontSize: number;
  tableFontSize: number;
  fontFamily: string;

  /* الشعار */
  showLogo: boolean;
  logoPosition: 'right' | 'left' | 'center';
  logoSize: number;

  /* عنوان التقرير */
  reportTitle: string;

  /* معلومات التقرير */
  showCenter: boolean;
  showDirectorate: boolean;
  showDate: boolean;
  showSeq: boolean;
  showNotes: boolean;

  /* التذييل */
  showFooter: boolean;
  footerText: string;

  /* الإطار */
  showBorder: boolean;
  borderColor: string;

  /* إضافات متوافقة مع إعدادات الطباعة الحالية */
  showNormal: boolean;
};

export type LabSettings = {
  /* بيانات المختبر */
  center: string;
  directorate: string;

  /* المظهر */
  darkMode: boolean;
  theme:
    | 'default'
    | 'blue'
    | 'purple'
    | 'teal'
    | 'rose'
    | 'amber';

  customAccent: string | null;

  /* حجم الخط */
  fontSizePx: number;

  /* نوع الخط */
  fontFamily: string;

  /* كثافة البطاقات */
  density: 'comfortable' | 'compact';

  /* الشعار */
  logo: string | null;
  iconShape:
    | 'circle'
    | 'rounded'
    | 'square';

  logoSize:
    | 'small'
    | 'medium'
    | 'large';

  logoBorder: boolean;

  /* إعدادات النتائج والقيم الطبيعية */
  customRanges: Record<string, any>;
  criticalRanges: Record<string, any>;
  criticalAlertsEnabled: boolean;

  /* الفحوصات المخصصة */
  customTests: Record<string, any>;

  /* الإحصائيات */
  statsShowGender: boolean;
  statsShowChart: boolean;
  statsAutoDetails: boolean;

  /* الأسعار */
  pricesEnabled: boolean;
  testPrices: Record<string, number>;

  /* النسخ الاحتياطي */
  autoDriveBackupMode:
    | 'off'
    | 'daily'
    | 'weekly';

  driveBackupRetention: number;

  /* الطباعة */
  printSettings: PrintSettings;

  /* أي إعدادات إضافية من النسخ القديمة */
  [key: string]: any;
};

export type Audit = {
  id: string;
  action: string;
  category: string;
  details: string;
  at: string;
  patientId?: string;
  patientName?: string;
  [key: string]: any;
};

/* =========================================================
   DEFAULT PRINT SETTINGS
   مطابق لإعدادات المشروع السابق
   ========================================================= */

export const DEFAULT_PRINT_SETTINGS: PrintSettings = {
  paper: 'A4',
  orientation: 'portrait',

  /*
   * auto:
   * يختار التخطيط تلقائيًا حسب عدد النتائج.
   *
   * 1:
   * تقرير واحد في الصفحة.
   *
   * 2:
   * تقريران.
   *
   * 2stack:
   * تقريران فوق بعض.
   *
   * 3:
   * ثلاثة تقارير.
   *
   * 4:
   * أربعة تقارير 2 × 2.
   */
  layout: 'auto',

  /* المسافة بين التقارير */
  gap: 4,

  /* الهوامش */
  marginTop: 8,
  marginRight: 8,
  marginBottom: 8,
  marginLeft: 8,

  /* أحجام الخطوط */
  fontSize: 13,
  tableFontSize: 11,

  /* خط التقرير */
  fontFamily: 'Tajawal',

  /* الشعار */
  showLogo: true,
  logoPosition: 'right',
  logoSize: 24,

  /* عنوان التقرير */
  reportTitle: 'تقرير الفحوصات المخبرية',

  /* بيانات الرأس */
  showCenter: true,
  showDirectorate: true,
  showDate: true,
  showSeq: true,

  /* الملاحظات والتذييل */
  showNotes: true,
  showFooter: true,

  /* الإطار */
  showBorder: true,
  borderColor: '#777777',

  /* إظهار القيم الطبيعية */
  showNormal: true,

  footerText: 'مع تمنياتنا بالصحة والعافية',
};

/* =========================================================
   DEFAULT SETTINGS
   مطابق لإعدادات المشروع السابق + الحالية
   ========================================================= */

export const DEFAULT_SETTINGS: LabSettings = {
  /* بيانات المختبر */
  center: 'مركز الرعاية الصحية الأولية',
  directorate: 'دائرة الصحة / قطاع الرعاية',

  /* المظهر */
  darkMode: false,
  theme: 'default',
  customAccent: null,

  /* الخط */
  fontSizePx: 14,
  fontFamily: 'Tajawal',

  /* كثافة البطاقات */
  density: 'comfortable',

  /* الشعار */
  logo: null,
  iconShape: 'circle',
  logoSize: 'medium',
  logoBorder: true,

  /* القيم الطبيعية */
  customRanges: {},
  criticalRanges: {},
  criticalAlertsEnabled: false,

  /* الفحوصات المخصصة */
  customTests: {},

  /* الإحصائيات */
  statsShowGender: true,
  statsShowChart: true,
  statsAutoDetails: false,

  /* الأسعار */
  pricesEnabled: false,
  testPrices: {},

  /* Google Drive */
  autoDriveBackupMode: 'off',
  driveBackupRetention: 5,

  /* الطباعة */
  printSettings: {
    ...DEFAULT_PRINT_SETTINGS,
  },
};

/* =========================================================
   HELPERS
   ========================================================= */

/**
 * دمج الإعدادات بطريقة عميقة خصوصًا printSettings.
 *
 * هذا مهم جدًا حتى إذا كانت النسخة القديمة لا تحتوي
 * بعض إعدادات الطباعة الجديدة، تحصل تلقائيًا على
 * القيمة الافتراضية بدل undefined.
 */
function normalizeSettings(
  saved: any
): LabSettings {
  const source =
    saved && typeof saved === 'object'
      ? saved
      : {};

  const savedPrint =
    source.printSettings &&
    typeof source.printSettings === 'object'
      ? source.printSettings
      : {};

  return {
    ...DEFAULT_SETTINGS,
    ...source,

    customRanges:
      source.customRanges &&
      typeof source.customRanges === 'object'
        ? source.customRanges
        : {},

    criticalRanges:
      source.criticalRanges &&
      typeof source.criticalRanges === 'object'
        ? source.criticalRanges
        : {},

    customTests:
      source.customTests &&
      typeof source.customTests === 'object'
        ? source.customTests
        : {},

    testPrices:
      source.testPrices &&
      typeof source.testPrices === 'object'
        ? source.testPrices
        : {},

    printSettings: {
      ...DEFAULT_PRINT_SETTINGS,
      ...savedPrint,
    },
  };
}

/**
 * تجهيز بيانات المريض.
 *
 * يحافظ على أي حقول إضافية موجودة في النسخ
 * القديمة أو التي ستضاف لاحقًا.
 */
function normalizePatient(
  patient: any
): Patient {
  return {
    ...emptySectionData(),

    id:
      patient?.id ||
      uid('p'),

    name:
      patient?.name ||
      '',

    seq:
      String(
        patient?.seq ??
        ''
      ),

    age:
      patient?.age ||
      '',

    gender:
      patient?.gender ||
      'ذكر',

    date:
      patient?.date ||
      todayISO(),

    notes:
      patient?.notes ||
      '',

    ...patient,
  };
}

/* =========================================================
   STORE STATE
   ========================================================= */

type State = {
  patients: Patient[];

  settings: LabSettings;

  auditLog: Audit[];

  hydrated: boolean;

  /* التخزين */
  hydrate: () => Promise<void>;
  saveAll: () => Promise<void>;

  /* سجل التعديلات */
  addAudit: (
    action: string,
    category: string,
    details: string,
    extra?: any
  ) => void;

  /* المرضى */
  upsertPatient: (
    p: Partial<Patient>
  ) => Promise<string>;

  deletePatient: (
    id: string
  ) => Promise<void>;

  setPatients: (
    p: Patient[]
  ) => Promise<void>;

  /* الإعدادات */
  setSetting: (
    key: string,
    value: any
  ) => Promise<void>;

  /* النسخ الاحتياطية */
  importBackupData: (
    mode: 'restore' | 'merge',
    data: any
  ) => Promise<void>;
};

/* =========================================================
   STORE
   ========================================================= */

export const useLabStore =
  create<State>((set, get) => ({

    patients: [],

    settings: {
      ...DEFAULT_SETTINGS,
      printSettings: {
        ...DEFAULT_PRINT_SETTINGS,
      },
    },

    auditLog: [],

    hydrated: false,

    /* =====================================================
       HYDRATE
       ===================================================== */

    hydrate: async () => {

      try {

        const [
          patientsRaw,
          settingsRaw,
          auditRaw,
        ] = await Promise.all([

          AsyncStorage.getItem(
            PATIENTS_KEY
          ),

          AsyncStorage.getItem(
            SETTINGS_KEY
          ),

          AsyncStorage.getItem(
            AUDIT_KEY
          ),

        ]);

        let patients: Patient[] = [];

        let settings: LabSettings =
          normalizeSettings(null);

        let auditLog: Audit[] = [];

        /* المرضى */

        if (patientsRaw) {

          try {

            const parsed =
              JSON.parse(
                patientsRaw
              );

            if (Array.isArray(parsed)) {

              patients =
                parsed.map(
                  normalizePatient
                );

            }

          } catch {
            patients = [];
          }
        }

        /* الإعدادات */

        if (settingsRaw) {

          try {

            settings =
              normalizeSettings(
                JSON.parse(
                  settingsRaw
                )
              );

          } catch {

            settings =
              normalizeSettings(null);

          }
        }

        /* سجل التعديلات */

        if (auditRaw) {

          try {

            const parsed =
              JSON.parse(
                auditRaw
              );

            if (Array.isArray(parsed)) {
              auditLog =
                parsed.slice(
                  0,
                  500
                );
            }

          } catch {

            auditLog = [];

          }
        }

        set({
          patients,
          settings,
          auditLog,
          hydrated: true,
        });

      } catch (error) {

        console.log(
          'STORE HYDRATE ERROR:',
          error
        );

        /*
         * حتى إذا فشل التخزين، لا نبقي
         * التطبيق على شاشة التحميل للأبد.
         */

        set({
          patients: [],
          settings:
            normalizeSettings(null),
          auditLog: [],
          hydrated: true,
        });

      }

    },

    /* =====================================================
       SAVE ALL
       ===================================================== */

    saveAll: async () => {

      const {
        patients,
        settings,
        auditLog,
      } = get();

      await Promise.all([

        AsyncStorage.setItem(
          PATIENTS_KEY,
          JSON.stringify(
            patients
          )
        ),

        AsyncStorage.setItem(
          SETTINGS_KEY,
          JSON.stringify(
            settings
          )
        ),

        AsyncStorage.setItem(
          AUDIT_KEY,
          JSON.stringify(
            auditLog.slice(
              0,
              500
            )
          )
        ),

      ]);

    },

    /* =====================================================
       AUDIT
       ===================================================== */

    addAudit: (
      action,
      category,
      details,
      extra = {}
    ) => {

      const item: Audit = {

        id: uid('a'),

        action,

        category,

        details,

        at:
          new Date()
            .toISOString(),

        ...extra,

      };

      const auditLog = [
        item,
        ...get().auditLog,
      ].slice(
        0,
        500
      );

      set({
        auditLog,
      });

      AsyncStorage
        .setItem(
          AUDIT_KEY,
          JSON.stringify(
            auditLog
          )
        )
        .catch(() => {});

    },

    /* =====================================================
       ADD / EDIT PATIENT
       ===================================================== */

    upsertPatient:
      async (
        input
      ) => {

        const old =
          input.id
            ? get()
                .patients
                .find(
                  x =>
                    x.id ===
                    input.id
                )
            : undefined;

        const id =
          input.id ||
          uid('p');

        let seq =
          String(
            input.seq ||
            ''
          ).trim();

        /*
         * التسلسل اليومي
         *
         * يعاد حسابه من المرضى في نفس اليوم فقط.
         */

        if (!seq) {

          const today =
            todayISO();

          const nums =
            get()
              .patients
              .filter(
                p =>
                  p.date ===
                  today
              )
              .map(
                p =>
                  parseInt(
                    p.seq,
                    10
                  )
              )
              .filter(
                n =>
                  Number.isFinite(
                    n
                  )
              );

          seq =
            String(
              (
                nums.length
                  ? Math.max(
                      ...nums
                    )
                  : 0
              ) + 1
            );

        }

        const base: Patient = {

          ...emptySectionData(),

          id,

          name: '',

          seq,

          age: '',

          gender: 'ذكر',

          date:
            todayISO(),

          notes: '',

          /*
           * الاحتفاظ بكل بيانات المريض
           * القديمة.
           */

          ...(old || {}),

          ...input,

          id,

          seq,

        } as Patient;

        const patients =
          old

            ? get()
                .patients
                .map(
                  p =>
                    p.id === id
                      ? base
                      : p
                )

            : [
                base,
                ...get()
                  .patients,
              ];

        set({
          patients,
        });

        get().addAudit(

          old
            ? 'تعديل مريض'
            : 'إضافة مريض',

          'patient',

          old
            ? `تم تعديل بيانات ${base.name}`
            : `تمت إضافة المريض ${base.name}`,

          {
            patientId:
              id,

            patientName:
              base.name,
          }

        );

        await get()
          .saveAll();

        return id;

      },

    /* =====================================================
       DELETE PATIENT
       ===================================================== */

    deletePatient:
      async (
        id
      ) => {

        const patient =
          get()
            .patients
            .find(
              x =>
                x.id === id
            );

        /*
         * إذا لم نجد المريض، لا نعتبر العملية
         * ناجحة بصمت.
         */

        if (!patient) {
          throw new Error(
            'المريض غير موجود أو تم حذفه مسبقًا.'
          );
        }

        const patients =
          get()
            .patients
            .filter(
              p =>
                p.id !== id
            );

        set({
          patients,
        });

        get().addAudit(

          'حذف مريض',

          'patient',

          `تم حذف المريض ${
            patient.name ||
            ''
          }`,

          {
            patientId:
              id,

            patientName:
              patient.name ||
              '',
          }

        );

        await get()
          .saveAll();

      },

    /* =====================================================
       SETTING
       ===================================================== */

    setSetting:
      async (
        key,
        value
      ) => {

        let settings: LabSettings;

        /*
         * إذا كنا نعدل printSettings،
         * ندمج الإعدادات بدل استبدالها بالكامل.
         */

        if (
          key ===
          'printSettings'
        ) {

          settings =
            normalizeSettings({

              ...get()
                .settings,

              printSettings: {

                ...get()
                  .settings
                  .printSettings,

                ...(value || {}),

              },

            });

        } else {

          settings =
            normalizeSettings({

              ...get()
                .settings,

              [key]:
                value,

            });

        }

        set({
          settings,
        });

        get().addAudit(

          'تعديل إعدادات',

          'settings',

          `تم تغيير الإعداد: ${key}`

        );

        await get()
          .saveAll();

      },

    /* =====================================================
       SET PATIENTS
       ===================================================== */

    setPatients:
      async (
        patients
      ) => {

        const normalized =
          Array.isArray(
            patients
          )
            ? patients.map(
                normalizePatient
              )
            : [];

        set({
          patients:
            normalized,
        });

        await get()
          .saveAll();

      },

    /* =====================================================
       IMPORT / RESTORE BACKUP
       ===================================================== */

    importBackupData:
      async (
        mode,
        data
      ) => {

        const current =
          get();

        if (
          !data ||
          typeof data !==
            'object'
        ) {

          throw new Error(
            'بيانات النسخة الاحتياطية غير صالحة.'
          );

        }

        /* ===============================================
           RESTORE
           =============================================== */

        if (
          mode ===
          'restore'
        ) {

          const patients =
            Array.isArray(
              data.patients
            )
              ? data.patients.map(
                  normalizePatient
                )
              : [];

          const settings =
            normalizeSettings(
              data.settings
            );

          const auditLog =
            Array.isArray(
              data.auditLog
            )
              ? data.auditLog
                  .slice(
                    0,
                    500
                  )
              : [];

          set({

            patients,

            settings,

            auditLog,

          });

        }

        /* ===============================================
           MERGE
           =============================================== */

        else {

          const map =
            new Map<
              string,
              Patient
            >(
              current.patients.map(
                p => [
                  p.id,
                  p,
                ]
              )
            );

          if (
            Array.isArray(
              data.patients
            )
          ) {

            data.patients.forEach(
              (
                patient: any
              ) => {

                const normalized =
                  normalizePatient(
                    patient
                  );

                map.set(
                  normalized.id,
                  normalized
                );

              }
            );

          }

          const auditLog =
            [
              ...(Array.isArray(
                data.auditLog
              )
                ? data.auditLog
                : []),

              ...current.auditLog,

            ].slice(
              0,
              500
            );

          const settings =
            normalizeSettings({

              ...current.settings,

              ...(data.settings ||
                {}),

              printSettings: {

                ...current
                  .settings
                  .printSettings,

                ...(
                  data.settings
                    ?.printSettings ||
                  {}
                ),

              },

            });

          set({

            patients:
              Array.from(
                map.values()
              ),

            settings,

            auditLog,

          });

        }

        await get()
          .saveAll();

      },

  }));
