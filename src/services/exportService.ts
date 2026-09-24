import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import * as DocumentPicker from 'expo-document-picker';
import * as XLSX from 'xlsx';

import { TEST_SECTIONS, SECTION_KEYS } from '../utils/constants';
import { todayISO, displayDate } from '../utils/helpers';

export type PrintOptions = {
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
  logoShape?: 'circle' | 'rounded' | 'square';
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
};

export type StatsTest = {
  name: string;
  count: number;
};

export type StatsSection = {
  key: string;
  name: string;
  count: number;
  tests: StatsTest[];
};

export type LabStats = {
  total: number;
  today: number;
  males: number;
  females: number;
  sections: StatsSection[];
};

/*
 * البيانات الإضافية للنسخة الاحتياطية.
 *
 * جميع هذه الحقول اختيارية حتى تبقى النسخ القديمة
 * التي تحتوي فقط على patients/settings/auditLog
 * قابلة للاسترجاع.
 */
export type BackupExtraData = {
  catalog?: any[];
  prices?: Record<string, number>;
  references?: Record<string, any>;
  criticalValues?: Record<string, any>;
  appPreferences?: Record<string, any>;
};

export type BackupData = {
  app: 'lab-app';
  version: number;
  exportedAt: string;

  patients: any[];
  settings: any;
  auditLog: any[];

  /*
   * البيانات الجديدة.
   * اختيارية للتوافق مع النسخ القديمة.
   */
  catalog?: any[];
  prices?: Record<string, number>;
  references?: Record<string, any>;
  criticalValues?: Record<string, any>;
  appPreferences?: Record<string, any>;
};

const DEFAULT_PRINT_SETTINGS: Required<PrintOptions> = {
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
  logoShape: 'rounded',

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
};

async function ensureShare() {
  try {
    return await Sharing.isAvailableAsync();
  } catch {
    return false;
  }
}

function esc(v: any) {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function hasValue(v: any) {
  return String(v ?? '').trim().length > 0;
}

function safeNumber(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function getPrintSettings(
  settings: any = {},
  options: PrintOptions = {},
): Required<PrintOptions> {
  return {
    ...DEFAULT_PRINT_SETTINGS,
    ...(settings?.printSettings || {}),
    ...options,

    logoShape:
      options.logoShape ||
      settings?.logoShape ||
      settings?.printSettings?.logoShape ||
      DEFAULT_PRINT_SETTINGS.logoShape,

    logoSize:
      options.logoSize ||
      settings?.logoSize ||
      settings?.printSettings?.logoSize ||
      DEFAULT_PRINT_SETTINGS.logoSize,

    logoPosition:
      options.logoPosition ||
      settings?.logoPosition ||
      settings?.printSettings?.logoPosition ||
      DEFAULT_PRINT_SETTINGS.logoPosition,
  };
}

function logoRadius(shape: string) {
  if (shape === 'circle') return '50%';
  if (shape === 'square') return '4px';
  return '16px';
}

function pageCss(p: Required<PrintOptions>) {
  return `
    @page{
      size:${p.paper} ${p.orientation};
      margin:${safeNumber(p.marginTop)}mm
             ${safeNumber(p.marginRight)}mm
             ${safeNumber(p.marginBottom)}mm
             ${safeNumber(p.marginLeft)}mm;
    }

    *{
      box-sizing:border-box;
    }

    html,body{
      margin:0;
      padding:0;
      direction:rtl;
      background:#fff;
      color:#18221f;
      font-family:"${esc(p.fontFamily)}",Arial,sans-serif;
      font-size:${safeNumber(p.fontSize)}px;
    }

    body{
      width:100%;
    }

    table{
      border-collapse:collapse;
      width:100%;
    }

    .page{
      width:100%;
    }

    .avoid-break{
      break-inside:avoid;
      page-break-inside:avoid;
    }

    .report-card{
      border:1px solid #D6DFDB;
      border-radius:10px;
      padding:12px;
      background:#fff;
      break-inside:avoid;
      page-break-inside:avoid;
    }

    .report-header{
      border-bottom:2px solid #0F766E;
      padding-bottom:10px;
      margin-bottom:10px;
    }

    .brand-row{
      display:flex;
      align-items:center;
      gap:12px;
    }

    .brand-copy{
      flex:1;
    }

    .brand-name{
      font-size:19px;
      font-weight:900;
      color:#0B4F4A;
    }

    .brand-sub{
      font-size:10px;
      color:#66756F;
      margin-top:2px;
    }

    .report-title{
      font-size:16px;
      font-weight:900;
      text-align:center;
      color:#17211E;
      margin-top:9px;
    }

    .patient-table{
      margin-top:8px;
    }

    .patient-table td{
      border:1px solid ${esc(p.borderColor)};
      padding:6px 7px;
      font-size:${Math.max(10, p.tableFontSize)}px;
    }

    .patient-table .label{
      background:#F2F7F5;
      font-weight:800;
      width:18%;
      color:#51605A;
    }

    .section{
      margin-top:10px;
    }

    .section-title{
      background:#0F766E;
      color:#fff;
      padding:6px 8px;
      font-weight:900;
      border-radius:7px 7px 0 0;
    }

    .result-table th,
    .result-table td{
      border:${
        p.showBorder
          ? `1px solid ${esc(p.borderColor)}`
          : 'none'
      };
      padding:5px 6px;
      font-size:${safeNumber(p.tableFontSize)}px;
    }

    .result-table th{
      background:#EEF6F4;
      color:#17312C;
      font-weight:900;
    }

    .result-table td.value{
      text-align:center;
      font-weight:900;
      color:#0F766E;
    }

    .result-table td.normal{
      direction:ltr;
      text-align:left;
      color:#66756F;
    }

    .notes{
      margin-top:10px;
      border:1px solid ${esc(p.borderColor)};
      background:#FAFCFB;
      border-radius:7px;
      padding:8px;
    }

    .footer{
      margin-top:12px;
      text-align:center;
      color:#718079;
      font-size:10px;
    }

    .multi{
      display:flex;
      flex-wrap:wrap;
      gap:${safeNumber(p.gap)}mm;
      align-items:flex-start;
    }

    .multi.one .report-card{
      width:100%;
    }

    .multi.two .report-card{
      width:calc(50% - ${safeNumber(p.gap) / 2}mm);
    }

    .multi.three .report-card{
      width:calc(
        33.333% -
        ${safeNumber(p.gap) * 0.67}mm
      );
    }

    .multi.four .report-card{
      width:calc(
        25% -
        ${safeNumber(p.gap) * 0.75}mm
      );
    }

    .multi.two-stack .report-card{
      width:100%;
    }

    @media print{
      body{
        background:#fff;
      }
    }
  `;
}

function getSectionResults(patient: any, key: any) {
  const section = TEST_SECTIONS[key];

  if (!section) return [];

  const data = patient?.[section.dataKey] || {};

  return section.fields
    .map((field: any) => ({
      ...field,
      value: data[field.key] ?? '',
    }))
    .filter((x: any) => hasValue(x.value));
}

function getIncludedSections(patient: any) {
  return SECTION_KEYS.filter(
    (key) => !!patient?.[`include${key}`],
  );
}

function reportBody(
  patient: any,
  settings: any,
  p: Required<PrintOptions>,
) {
  const logo =
    typeof settings?.logo === 'string'
      ? settings.logo
      : '';

  const radius = logoRadius(p.logoShape);

  const logoHtml =
    p.showLogo && logo
      ? `
        <img
          src="${esc(logo)}"
          style="
            width:${safeNumber(p.logoSize)}px;
            height:${safeNumber(p.logoSize)}px;
            object-fit:contain;
            border-radius:${radius};
            ${
              settings?.logoBorder
                ? 'border:1px solid #D6DFDB;padding:3px;'
                : ''
            }
          "
        />
      `
      : '';

  const brand =
    p.showCenter ||
    p.showDirectorate ||
    logoHtml
      ? (
        p.logoPosition === 'center'
          ? `
            <div style="text-align:center">
              ${logoHtml}

              <div
                class="brand-copy"
                style="margin-top:5px"
              >
                ${
                  p.showCenter &&
                  hasValue(settings?.center)
                    ? `
                      <div class="brand-name">
                        ${esc(settings.center)}
                      </div>
                    `
                    : ''
                }

                ${
                  p.showDirectorate &&
                  hasValue(settings?.directorate)
                    ? `
                      <div class="brand-sub">
                        ${esc(settings.directorate)}
                      </div>
                    `
                    : ''
                }
              </div>
            </div>
          `
          : `
            <div class="brand-row">
              ${
                p.logoPosition === 'left'
                  ? logoHtml
                  : ''
              }

              <div class="brand-copy">
                ${
                  p.showCenter &&
                  hasValue(settings?.center)
                    ? `
                      <div class="brand-name">
                        ${esc(settings.center)}
                      </div>
                    `
                    : ''
                }

                ${
                  p.showDirectorate &&
                  hasValue(settings?.directorate)
                    ? `
                      <div class="brand-sub">
                        ${esc(settings.directorate)}
                      </div>
                    `
                    : ''
                }
              </div>

              ${
                p.logoPosition !== 'left'
                  ? logoHtml
                  : ''
              }
            </div>
          `
      )
      : '';

  const info = `
    <table class="patient-table">
      <tbody>
        <tr>
          <td class="label">اسم المريض</td>
          <td>${esc(patient?.name)}</td>

          <td class="label">رقم السجل</td>
          <td>${esc(patient?.seq)}</td>
        </tr>

        <tr>
          <td class="label">العمر</td>
          <td>${esc(patient?.age)}</td>

          <td class="label">الجنس</td>
          <td>${esc(patient?.gender)}</td>
        </tr>

        ${
          p.showDate
            ? `
              <tr>
                <td class="label">التاريخ</td>
                <td colspan="3">
                  ${esc(
                    displayDate(
                      patient?.date || '',
                    ),
                  )}
                </td>
              </tr>
            `
            : ''
        }
      </tbody>
    </table>
  `;

  const sections = getIncludedSections(patient)
    .map((key: any) => {
      const section = TEST_SECTIONS[key];

      const rows = getSectionResults(patient, key)
        .map(
          (item: any) => `
            <tr>
              <td>${esc(item.label)}</td>

              <td class="value">
                ${esc(item.value)}
              </td>

              ${
                p.showNormal
                  ? `
                    <td class="normal">
                      ${esc(item.normal)}
                    </td>
                  `
                  : ''
              }
            </tr>
          `,
        )
        .join('');

      if (!rows) return '';

      return `
        <div class="section avoid-break">

          <div class="section-title">
            ${esc(section.label)}
          </div>

          <table class="result-table">
            <thead>
              <tr>
                <th>اسم الفحص</th>
                <th>النتيجة</th>

                ${
                  p.showNormal
                    ? '<th>القيمة الطبيعية</th>'
                    : ''
                }
              </tr>
            </thead>

            <tbody>
              ${rows}
            </tbody>
          </table>

        </div>
      `;
    })
    .join('');

  const notes =
    p.showNotes && hasValue(patient?.notes)
      ? `
        <div class="notes">
          <strong>ملاحظات:</strong>
          ${esc(patient.notes)}
        </div>
      `
      : '';

  const footer =
    p.showFooter
      ? `
        <div class="footer">
          ${esc(p.footerText)}
        </div>
      `
      : '';

  return `
    <div class="report-card">

      <div class="report-header">
        ${brand}

        <div class="report-title">
          ${esc(p.reportTitle)}
        </div>
      </div>

      ${info}
      ${sections}
      ${notes}
      ${footer}

    </div>
  `;
}

export function buildPatientReportHtml(
  patient: any,
  settings: any = {},
  options: PrintOptions = {},
) {
  const p = getPrintSettings(
    settings,
    options,
  );

  return `
    <!doctype html>
    <html dir="rtl">
      <head>
        <meta charset="UTF-8"/>
        <style>
          ${pageCss(p)}
        </style>
      </head>

      <body>
        <div class="page">
          ${reportBody(patient, settings, p)}
        </div>
      </body>
    </html>
  `;
}

export function buildMultiplePatientReportsHtml(
  patients: any[],
  settings: any = {},
  options: PrintOptions = {},
) {
  const p = getPrintSettings(
    settings,
    options,
  );

  const layoutClass =
    p.layout === 'auto'
      ? 'one'
      : p.layout === '2stack'
        ? 'two-stack'
        : ['1', '2', '3', '4'].includes(
            p.layout,
          )
          ? p.layout
          : 'one';

  const cards = (patients || [])
    .map((patient) =>
      reportBody(patient, settings, p),
    )
    .join('');

  return `
    <!doctype html>
    <html dir="rtl">
      <head>
        <meta charset="UTF-8"/>
        <style>
          ${pageCss(p)}
        </style>
      </head>

      <body>
        <div class="page">
          <div class="multi ${layoutClass}">
            ${cards}
          </div>
        </div>
      </body>
    </html>
  `;
}

export async function exportPatientPdf(
  patient: any,
  settings: any = {},
  options: PrintOptions = {},
) {
  const html = buildPatientReportHtml(
    patient,
    settings,
    options,
  );

  const { uri } =
    await Print.printToFileAsync({
      html,
    });

  if (await ensureShare()) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: 'مشاركة تقرير المريض',
    });
  }

  return uri;
}

export async function printPatient(
  patient: any,
  settings: any = {},
  options: PrintOptions = {},
) {
  await Print.printAsync({
    html: buildPatientReportHtml(
      patient,
      settings,
      options,
    ),
  });
}

export async function exportMultiplePatientsPdf(
  patients: any[],
  settings: any = {},
  options: PrintOptions = {},
) {
  const html =
    buildMultiplePatientReportsHtml(
      patients,
      settings,
      options,
    );

  const { uri } =
    await Print.printToFileAsync({
      html,
    });

  if (await ensureShare()) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: 'مشاركة التقارير',
    });
  }

  return uri;
}

export async function printMultiplePatients(
  patients: any[],
  settings: any = {},
  options: PrintOptions = {},
) {
  await Print.printAsync({
    html: buildMultiplePatientReportsHtml(
      patients,
      settings,
      options,
    ),
  });
}

/* =========================================================
   BACKUP / RESTORE
   ========================================================= */

/*
 * بناء بيانات النسخة الاحتياطية.
 *
 * الإصدار أصبح 4.
 *
 * الحقول الأساسية القديمة محفوظة كما هي:
 * - patients
 * - settings
 * - auditLog
 *
 * والحقول الجديدة اختيارية:
 * - catalog
 * - prices
 * - references
 * - criticalValues
 * - appPreferences
 *
 * هذا يسمح باسترجاع النسخ القديمة بدون مشاكل.
 */
export async function buildBackupData(
  patients: any[],
  settings: any,
  auditLog: any[] = [],
  extraData: BackupExtraData = {},
): Promise<BackupData> {
  return {
    app: 'lab-app',

    version: 4,

    exportedAt:
      new Date().toISOString(),

    patients: Array.isArray(patients)
      ? patients
      : [],

    settings:
      settings || {},

    auditLog:
      Array.isArray(auditLog)
        ? auditLog
        : [],

    /*
     * البيانات الجديدة.
     *
     * لا نضع null أو قيم غير صالحة.
     */
    ...(Array.isArray(extraData.catalog)
      ? {
          catalog: extraData.catalog,
        }
      : {}),

    ...(extraData.prices &&
    typeof extraData.prices === 'object'
      ? {
          prices: extraData.prices,
        }
      : {}),

    ...(extraData.references &&
    typeof extraData.references === 'object'
      ? {
          references: extraData.references,
        }
      : {}),

    ...(extraData.criticalValues &&
    typeof extraData.criticalValues ===
      'object'
      ? {
          criticalValues:
            extraData.criticalValues,
        }
      : {}),

    ...(extraData.appPreferences &&
    typeof extraData.appPreferences ===
      'object'
      ? {
          appPreferences:
            extraData.appPreferences,
        }
      : {}),
  };
}

/*
 * تصدير نسخة احتياطية محلية.
 *
 * الاستدعاءات القديمة التي تستخدم:
 *
 * exportBackup(patients, settings, auditLog)
 *
 * ستظل تعمل.
 *
 * والاستدعاءات الجديدة تستطيع إضافة:
 *
 * exportBackup(
 *   patients,
 *   settings,
 *   auditLog,
 *   {
 *     catalog,
 *     prices
 *   }
 * )
 */
export async function exportBackup(
  patients: any[],
  settings: any,
  auditLog: any[] = [],
  extraData: BackupExtraData = {},
) {
  const backup =
    await buildBackupData(
      patients,
      settings,
      auditLog,
      extraData,
    );

  const json = JSON.stringify(
    backup,
    null,
    2,
  );

  const uri =
    `${FileSystem.cacheDirectory}` +
    `lab_backup_${Date.now()}.json`;

  await FileSystem.writeAsStringAsync(
    uri,
    json,
  );

  if (await ensureShare()) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/json',
      dialogTitle:
        'تصدير النسخة الاحتياطية',
    });
  }

  return uri;
}

export async function pickBackupFile() {
  const result =
    await DocumentPicker.getDocumentAsync(
      {
        type: [
          'application/json',
          'text/json',
          '*/*',
        ],
        copyToCacheDirectory: true,
        multiple: false,
      },
    );

  if (
    result.canceled ||
    !result.assets?.length
  ) {
    return null;
  }

  return result.assets[0];
}

export async function importBackupFile() {
  const file =
    await pickBackupFile();

  if (!file) {
    return null;
  }

  const raw =
    await FileSystem.readAsStringAsync(
      file.uri,
    );

  const data =
    JSON.parse(raw);

  return data as BackupData;
}

/*
 * دمج المرضى.
 *
 * السلوك الأصلي محفوظ:
 * - يعتمد على id
 * - النسخة الاحتياطية تستبدل السجل الذي له نفس id
 * - السجلات الموجودة فقط تبقى
 */
export function mergeBackupData(
  currentPatients: any[],
  backupPatients: any[],
) {
  const map =
    new Map<string, any>();

  (currentPatients || []).forEach(
    (p) => {
      if (p?.id) {
        map.set(p.id, p);
      }
    },
  );

  (backupPatients || []).forEach(
    (p) => {
      if (p?.id) {
        map.set(p.id, p);
      }
    },
  );

  return Array.from(
    map.values(),
  );
}

/*
 * مساعد لتطبيع بيانات النسخة الاحتياطية.
 *
 * لا يستخدم حالياً لتغيير البيانات،
 * لكنه يمنع انهيار الاسترجاع إذا كانت
 * بعض الحقول غير موجودة في النسخ القديمة.
 */
export function normalizeBackupData(
  data: any,
): BackupData | null {
  if (
    !data ||
    typeof data !== 'object'
  ) {
    return null;
  }

  if (
    data.app &&
    data.app !== 'lab-app'
  ) {
    return null;
  }

  if (
    !Array.isArray(data.patients)
  ) {
    return null;
  }

  return {
    app: 'lab-app',

    version:
      Number(data.version) || 1,

    exportedAt:
      String(
        data.exportedAt ||
          '',
      ),

    patients:
      data.patients,

    settings:
      data.settings || {},

    auditLog:
      Array.isArray(data.auditLog)
        ? data.auditLog
        : [],

    ...(Array.isArray(
      data.catalog,
    )
      ? {
          catalog:
            data.catalog,
        }
      : {}),

    ...(data.prices &&
    typeof data.prices ===
      'object'
      ? {
          prices:
            data.prices,
        }
      : {}),

    ...(data.references &&
    typeof data.references ===
      'object'
      ? {
          references:
            data.references,
        }
      : {}),

    ...(data.criticalValues &&
    typeof data.criticalValues ===
      'object'
      ? {
          criticalValues:
            data.criticalValues,
        }
      : {}),

    ...(data.appPreferences &&
    typeof data.appPreferences ===
      'object'
      ? {
          appPreferences:
            data.appPreferences,
        }
      : {}),
  };
}

/* =========================================================
   EXCEL
   ========================================================= */

function flattenPatient(patient: any) {
  return {
    'اسم المريض':
      patient?.name || '',

    'رقم السجل':
      patient?.seq || '',

    'الجنس':
      patient?.gender || '',

    'العمر':
      patient?.age || '',

    'التاريخ':
      patient?.date || '',

    'ملاحظات':
      patient?.notes || '',
  };
}

export async function exportPatientsExcel(
  patients: any[],
) {
  const list =
    Array.isArray(patients)
      ? patients
      : [];

  const wb =
    XLSX.utils.book_new();

  const patientsSheet =
    XLSX.utils.json_to_sheet(
      list.map(flattenPatient),
    );

  XLSX.utils.book_append_sheet(
    wb,
    patientsSheet,
    'المرضى',
  );

  const resultRows: any[] = [];

  list.forEach((patient) =>
    SECTION_KEYS.forEach(
      (key) => {
        if (
          !patient?.[
            `include${key}`
          ]
        ) {
          return;
        }

        const section =
          TEST_SECTIONS[key];

        const data =
          patient?.[
            section.dataKey
          ] || {};

        section.fields.forEach(
          (field) => {
            if (
              hasValue(
                data[field.key],
              )
            ) {
              resultRows.push({
                'اسم المريض':
                  patient.name || '',

                'رقم السجل':
                  patient.seq || '',

                'التاريخ':
                  patient.date || '',

                'القسم':
                  section.label,

                'الفحص':
                  field.label,

                'النتيجة':
                  data[field.key],

                'الطبيعي':
                  field.normal,
              });
            }
          },
        );
      },
    ),
  );

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(
      resultRows,
    ),
    'النتائج',
  );

  const stats =
    getStats(list);

  const summary = [
    {
      'البيان':
        'إجمالي المرضى',
      'القيمة':
        stats.total,
    },

    {
      'البيان':
        'سجلات اليوم',
      'القيمة':
        stats.today,
    },

    {
      'البيان':
        'ذكور',
      'القيمة':
        stats.males,
    },

    {
      'البيان':
        'إناث',
      'القيمة':
        stats.females,
    },
  ];

  const statRows: any[] = [];

  stats.sections.forEach(
    (s) => {
      statRows.push({
        'القسم':
          s.name,

        'عدد السجلات':
          s.count,

        'الفحص':
          '',

        'عدد النتائج':
          '',
      });

      s.tests.forEach(
        (t) => {
          statRows.push({
            'القسم':
              s.name,

            'عدد السجلات':
              '',

            'الفحص':
              t.name,

            'عدد النتائج':
              t.count,
          });
        },
      );
    },
  );

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet([
      ...summary,
      {},
      ...statRows,
    ]),
    'الإحصائيات',
  );

  const output =
    XLSX.write(wb, {
      type: 'base64',
      bookType: 'xlsx',
    });

  const uri =
    `${FileSystem.cacheDirectory}` +
    `laboratory_records_${Date.now()}.xlsx`;

  await FileSystem.writeAsStringAsync(
    uri,
    output,
    {
      encoding:
        FileSystem.EncodingType.Base64,
    },
  );

  if (await ensureShare()) {
    await Sharing.shareAsync(uri, {
      mimeType:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      dialogTitle:
        'تصدير سجلات المختبر',
    });
  }

  return uri;
}

/* =========================================================
   STATISTICS
   ========================================================= */

export function getStats(
  patients: any[],
): LabStats {
  const list =
    Array.isArray(patients)
      ? patients
      : [];

  const male = (v: any) =>
    String(v || '')
      .trim()
      .toLowerCase() ===
    'ذكر';

  const female = (v: any) =>
    ['انثى', 'أنثى'].includes(
      String(v || '')
        .trim()
        .toLowerCase(),
    );

  return {
    total: list.length,

    today:
      list.filter(
        (p) =>
          p?.date ===
          todayISO(),
      ).length,

    males:
      list.filter(
        (p) =>
          male(p.gender),
      ).length,

    females:
      list.filter(
        (p) =>
          female(p.gender),
      ).length,

    sections:
      SECTION_KEYS.map(
        (key) => {
          const section =
            TEST_SECTIONS[key];

          const sectionPatients =
            list.filter(
              (p) =>
                !!p?.[
                  `include${key}`
                ],
            );

          return {
            key,

            name:
              section.label,

            count:
              sectionPatients.length,

            tests:
              section.fields.map(
                (field) => ({
                  name:
                    field.label,

                  count:
                    sectionPatients.filter(
                      (p) =>
                        hasValue(
                          (
                            p?.[
                              section.dataKey
                            ] || {}
                          )[
                            field.key
                          ],
                        ),
                    ).length,
                }),
              ),
          };
        },
      ),
  };
}

/* =========================================================
   STATS PDF
   ========================================================= */

export function buildStatsHtml(
  stats: LabStats,
  settings: any = {},
  options: PrintOptions = {},
) {
  const p =
    getPrintSettings(
      settings,
      options,
    );

  const rows =
    stats.sections
      .map(
        (s) => `
          <tr>
            <td>
              ${esc(s.name)}
            </td>

            <td>
              ${s.count}
            </td>
          </tr>
        `,
      )
      .join('');

  const summary = `
    <table class="patient-table">
      <tbody>

        <tr>
          <td class="label">
            إجمالي المرضى
          </td>

          <td>
            ${stats.total}
          </td>

          <td class="label">
            سجلات اليوم
          </td>

          <td>
            ${stats.today}
          </td>
        </tr>

        <tr>
          <td class="label">
            ذكور
          </td>

          <td>
            ${stats.males}
          </td>

          <td class="label">
            إناث
          </td>

          <td>
            ${stats.females}
          </td>
        </tr>

      </tbody>
    </table>
  `;

  const detail = `
    <div class="section">

      <div class="section-title">
        تفصيل الأقسام
      </div>

      <table class="result-table">

        <thead>
          <tr>
            <th>القسم</th>
            <th>عدد السجلات</th>
          </tr>
        </thead>

        <tbody>
          ${rows}
        </tbody>

      </table>
    </div>
  `;

  const header = `
    <div class="report-header">

      <div class="brand-name">
        ${esc(
          settings?.center ||
            'المختبر',
        )}
      </div>

      <div class="brand-sub">
        ${esc(
          settings?.directorate ||
            '',
        )}
      </div>

      <div class="report-title">
        التقرير الإحصائي الطبي
      </div>

    </div>
  `;

  return `
    <!doctype html>

    <html dir="rtl">

      <head>
        <meta charset="UTF-8"/>

        <style>
          ${pageCss(p)}
        </style>
      </head>

      <body>

        <div class="page">

          <div class="report-card">

            ${header}

            ${summary}

            ${detail}

            <div class="footer">
              ${esc(p.footerText)}
            </div>

          </div>

        </div>

      </body>

    </html>
  `;
}

export async function exportStatsPdf(
  stats: LabStats,
  settings: any = {},
  options: PrintOptions = {},
) {
  const {
    uri,
  } =
    await Print.printToFileAsync({
      html: buildStatsHtml(
        stats,
        settings,
        options,
      ),
    });

  if (await ensureShare()) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle:
        'مشاركة الإحصائيات',
    });
  }

  return uri;
}

export async function printStats(
  stats: LabStats,
  settings: any = {},
  options: PrintOptions = {},
) {
  await Print.printAsync({
    html: buildStatsHtml(
      stats,
      settings,
      options,
    ),
  });
} 
