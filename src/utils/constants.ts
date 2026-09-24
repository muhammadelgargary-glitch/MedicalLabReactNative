export type SectionKey =
  | 'Blood'
  | 'Chem'
  | 'Urine'
  | 'Serology'
  | 'Stool'
  | 'Preg';

export type FieldDef = {
  key: string;
  label: string;
  normal: string;

  /**
   * بيانات إضافية اختيارية لدليل الفحوصات.
   *
   * تركناها اختيارية حتى تبقى كل الأكواد القديمة
   * التي تستخدم FieldDef متوافقة.
   */
  abbreviation?: string;
  tube?: string;
  specimen?: string;
  notes?: string;

  /**
   * لا نضع critical هنا كقيمة افتراضية
   * حتى لا نخترع قيمة طبية.
   */
  critical?: string;
};

/**
 * الأقسام الحالية للمختبر.
 *
 * لا نحذف أي قسم من الأقسام الأصلية.
 */
export const TEST_SECTIONS: Record<
  SectionKey,
  {
    key: SectionKey;
    dataKey: string;
    label: string;
    icon: string;
    fields: FieldDef[];
  }
> = {
  Blood: {
    key: 'Blood',
    dataKey: 'blood',
    label: 'دم',
    icon: '🩸',

    fields: [
      {
        key: 'hb',
        label: 'Hb',
        normal: '12 - 17 g/dl',
        abbreviation: 'Hb',
      },

      {
        key: 'pcv',
        label: 'PCV',
        normal: '36 - 50 %',
        abbreviation: 'PCV',
      },

      {
        key: 'wbc',
        label: 'WBC',
        normal: '4,000 - 11,000 /µl',
        abbreviation: 'WBC',
      },

      {
        key: 'esr',
        label: 'ESR',
        normal: '0 - 20 mm/hr',
        abbreviation: 'ESR',
      },

      {
        key: 'abo',
        label: 'ABO GROUP',
        normal: '—',
        abbreviation: 'ABO',
      },

      {
        key: 'plt',
        label: 'PLT',
        normal: '150,000 - 450,000 /µl',
        abbreviation: 'PLT',
      },
    ],
  },

  Chem: {
    key: 'Chem',
    dataKey: 'chem',
    label: 'كيمياء',
    icon: '🧪',

    fields: [
      {
        key: 'fbs',
        label: 'FBS',
        normal: '70 - 110 mg/dl',
        abbreviation: 'FBS',
      },

      {
        key: 'rbs',
        label: 'RBS',
        normal: '70 - 140 mg/dl',
        abbreviation: 'RBS',
      },

      {
        key: 'urea',
        label: 'Urea',
        normal: '15 - 45 mg/dl',
        abbreviation: 'Urea',
      },

      {
        key: 'creat',
        label: 'Creatinine',
        normal: '0.6 - 1.3 mg/dl',
        abbreviation: 'Creat',
      },

      {
        key: 'uric',
        label: 'Uric Acid',
        normal: '3.5 - 7.2 mg/dl',
        abbreviation: 'UA',
      },

      {
        key: 'chol',
        label: 'Cholesterol',
        normal: '< 200 mg/dl',
        abbreviation: 'CHOL',
      },

      {
        key: 'trig',
        label: 'Triglycerides',
        normal: '< 150 mg/dl',
        abbreviation: 'TG',
      },
    ],
  },

  Urine: {
    key: 'Urine',
    dataKey: 'urine',
    label: 'بول',
    icon: '💧',

    fields: [
      {
        key: 'color',
        label: 'Color',
        normal: 'Yellow',
      },

      {
        key: 'appearance',
        label: 'Appearance',
        normal: 'Clear',
      },

      {
        key: 'ph',
        label: 'pH',
        normal: '4.5 - 8.0',
      },

      {
        key: 'protein',
        label: 'Protein',
        normal: 'Negative',
      },

      {
        key: 'glucose',
        label: 'Glucose',
        normal: 'Negative',
      },

      {
        key: 'rbc',
        label: 'RBC /HPF',
        normal: '0 - 2 /HPF',
      },

      {
        key: 'pus',
        label: 'Pus Cells',
        normal: '0 - 5 /HPF',
      },

      {
        key: 'epithelial',
        label: 'Epithelial',
        normal: 'Few',
      },

      {
        key: 'crystals',
        label: 'Crystals',
        normal: 'Nill',
      },
    ],
  },

  Serology: {
    key: 'Serology',
    dataKey: 'serology',
    label: 'مصليات',
    icon: '🧬',

    fields: [
      {
        key: 'crp',
        label: 'CRP',
        normal: 'Negative (< 6 mg/L)',
        abbreviation: 'CRP',
      },

      {
        key: 'rf',
        label: 'RF',
        normal: 'Negative (< 14 IU/ml)',
        abbreviation: 'RF',
      },

      {
        key: 'aso',
        label: 'ASO',
        normal: 'Negative (< 200 IU/ml)',
        abbreviation: 'ASO',
      },

      {
        key: 'hpylori',
        label: 'H. pylori',
        normal: 'Negative',
        abbreviation: 'H. pylori',
      },

      {
        key: 'widal',
        label: 'Widal',
        normal: 'Titer < 1:80',
        abbreviation: 'Widal',
      },
    ],
  },

  Stool: {
    key: 'Stool',
    dataKey: 'stool',
    label: 'براز',
    icon: '💩',

    fields: [
      {
        key: 'color',
        label: 'Color',
        normal: 'Brown',
      },

      {
        key: 'consistency',
        label: 'Consistency',
        normal: 'Formed',
      },

      {
        key: 'mucus',
        label: 'Mucus',
        normal: 'Nill',
      },

      {
        key: 'ova',
        label: 'Ova / Parasites',
        normal: 'Nill',
      },
    ],
  },

  Preg: {
    key: 'Preg',
    dataKey: 'preg',
    label: 'حمل / هرمونات',
    icon: '🤰',

    fields: [
      {
        key: 'preg',
        label: 'Pregnancy Test',
        normal: 'Negative',
      },

      {
        key: 'tsh',
        label: 'TSH',
        normal: '0.4 - 4.0 mIU/L',
        abbreviation: 'TSH',
      },
    ],
  },
};

export const SECTION_KEYS =
  Object.keys(
    TEST_SECTIONS
  ) as SectionKey[];

/**
 * إنشاء بيانات فارغة للمريض.
 *
 * نحافظ على نفس أسماء الحقول القديمة:
 * blood / chem / urine / ...
 * وكذلك includeBlood / includeChem / ...
 */
export const emptySectionData = () => {
  const out: any = {};

  SECTION_KEYS.forEach((key) => {
    out[
      TEST_SECTIONS[key].dataKey
    ] = {};

    out[`include${key}`] = false;
  });

  return out;
};

/**
 * إنشاء catalog ابتدائي من الفحوصات الموجودة
 * حالياً في constants.
 *
 * مهم:
 * - لا نضع قيم critical من عندنا.
 * - السعر الافتراضي 0.
 * - tube/specimen/notes تبقى فارغة حتى يحددها المستخدم.
 */
export function buildDefaultTestCatalog() {
  const catalog: any[] = [];

  SECTION_KEYS.forEach((sectionKey) => {
    const section =
      TEST_SECTIONS[sectionKey];

    section.fields.forEach((field) => {
      catalog.push({
        id: `${sectionKey}_${field.key}`,

        key: field.key,

        name: field.label,

        abbreviation:
          field.abbreviation ||
          field.label,

        section: sectionKey,

        tube: field.tube || '',

        specimen: field.specimen || '',

        notes: field.notes || '',

        referenceRange:
          field.normal || '',

        /*
         * لا نخترع قيمة حرجة.
         */
        criticalValue:
          field.critical || '',

        price: 0,

        enabled: true,
      });
    });
  });

  return catalog;
} 
