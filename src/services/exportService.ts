import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as XLSX from 'xlsx';

import {
  TEST_SECTIONS,
  SECTION_KEYS,
} from '../utils/constants';

import {
  todayISO,
  displayDate,
} from '../utils/helpers';

/* =========================================================
   TYPES
========================================================= */

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

/* =========================================================
   DEFAULT PRINT SETTINGS
========================================================= */

const DEFAULT_PRINT_SETTINGS: Required<PrintOptions> = {
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

  footerText: 'مع تمنياتنا بالصحة والعافية',

  showBorder: true,
  borderColor: '#777777',

  showNormal: true,
};

/* =========================================================
   HELPERS
========================================================= */

async function ensureShare() {
  try {
    return await Sharing.isAvailableAsync();
  } catch {
    return false;
  }
}

function esc(value: any): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function hasValue(value: any): boolean {
  return String(value ?? '').trim().length > 0;
}

function safeNumber(value: any): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/* =========================================================
   PRINT SETTINGS
========================================================= */

function getPrintSettings(
  settings: any = {},
  options: PrintOptions = {},
): Required<PrintOptions> {
  const saved =
    settings?.printSettings &&
    typeof settings.printSettings === 'object'
      ? settings.printSettings
      : {};

  return {
    ...DEFAULT_PRINT_SETTINGS,
    ...saved,
    ...options,
  };
}

/* =========================================================
   PAGE CSS
========================================================= */

function getPageCss(
  print: Required<PrintOptions>,
): string {
  const paper = print.paper || 'A4';
  const orientation =
    print.orientation || 'portrait';

  return `
    @page {
      size: ${paper} ${orientation};
      margin:
        ${safeNumber(print.marginTop)}mm
        ${safeNumber(print.marginRight)}mm
        ${safeNumber(print.marginBottom)}mm
        ${safeNumber(print.marginLeft)}mm;
    }

    * {
      box-sizing: border-box;
    }

    html,
    body {
      margin: 0;
      padding: 0;
      direction: rtl;
      font-family: "${esc(
        print.fontFamily || 'Tajawal',
      )}", Arial, sans-serif;
      color: #222;
      background: #fff;
      font-size: ${safeNumber(print.fontSize)}px;
    }

    body {
      width: 100%;
    }

    table {
      border-collapse: collapse;
      width: 100%;
    }

    img {
      max-width: 100%;
    }

    .page {
      width: 100%;
    }

    .avoid-break {
      break-inside: avoid;
      page-break-inside: avoid;
    }

    .section {
      break-inside: avoid;
      page-break-inside: avoid;
    }

    .print-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
    }

    .print-table th,
    .print-table td {
      padding: 6px;
      text-align: right;
      font-size: ${safeNumber(
        print.tableFontSize,
      )}px;
      border: ${
        print.showBorder
          ? `1px solid ${esc(
              print.borderColor,
            )}`
          : 'none'
      };
    }

    .print-table th {
      font-weight: 900;
      background: #f1f4f3;
    }

    .footer {
      margin-top: 18px;
      text-align: center;
      color: #777;
      font-size: 11px;
    }

    .signature {
      margin-top: 28px;
      display: flex;
      justify-content: space-between;
      gap: 20px;
    }

    .signature-box {
      flex: 1;
      text-align: center;
      min-height: 60px;
    }

    @media print {
      body {
        background: #fff;
      }
    }
  `;
}

/* =========================================================
   SECTION HELPERS
========================================================= */

function getSectionData(
  patient: any,
  sectionKey: string,
): any {
  const section =
    TEST_SECTIONS[
      sectionKey as keyof typeof TEST_SECTIONS
    ];

  if (!section) return {};

  return (
    patient?.[section.dataKey] || {}
  );
}

function getSectionResults(
  patient: any,
  sectionKey: string,
) {
  const section =
    TEST_SECTIONS[
      sectionKey as keyof typeof TEST_SECTIONS
    ];

  if (!section) return [];

  const data = getSectionData(
    patient,
    sectionKey,
  );

  return section.fields
    .map(field => ({
      ...field,
      value: data?.[field.key] ?? '',
    }))
    .filter(item => hasValue(item.value));
}

function getIncludedSections(
  patient: any,
) {
  return SECTION_KEYS.filter(
    key =>
      !!patient?.[
        `include${key}`
      ],
  );
}

/* =========================================================
   BACKUP DATA
========================================================= */

export async function buildBackupData(
  patients: any[],
  settings: any,
  auditLog: any[] = [],
) {
  return {
    app: 'lab-app',
    version: 2,
    exportedAt: new Date().toISOString(),
    patients: patients || [],
    settings: settings || {},
    auditLog: auditLog || [],
  };
}

/* =========================================================
   EXPORT BACKUP JSON
========================================================= */

export async function exportBackup(
  patients: any[],
  settings: any,
  auditLog: any[] = [],
) {
  const data = await buildBackupData(
    patients,
    settings,
    auditLog,
  );

  const json = JSON.stringify(
    data,
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

  const available =
    await ensureShare();

  if (available) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/json',
      dialogTitle:
        'تصدير النسخة الاحتياطية',
    });
  }

  return uri;
}

/* =========================================================
   PICK BACKUP FILE
========================================================= */

export async function pickBackupFile() {
  const result =
    await DocumentPicker.getDocumentAsync({
      type: [
        'application/json',
        'text/json',
        '*/*',
      ],
      copyToCacheDirectory: true,
      multiple: false,
    });

  if (
    result.canceled ||
    !result.assets?.length
  ) {
    return null;
  }

  return result.assets[0];
}

/* =========================================================
   IMPORT BACKUP
========================================================= */

export async function importBackupFile() {
  const file =
    await pickBackupFile();

  if (!file) return null;

  const content =
    await FileSystem.readAsStringAsync(
      file.uri,
    );

  const data = JSON.parse(content);

  return data;
}

/* =========================================================
   MERGE BACKUP
========================================================= */

export function mergeBackupData(
  currentPatients: any[],
  backupPatients: any[],
) {
  const current =
    Array.isArray(currentPatients)
      ? currentPatients
      : [];

  const incoming =
    Array.isArray(backupPatients)
      ? backupPatients
      : [];

  const map = new Map<string, any>();

  current.forEach(patient => {
    if (patient?.id) {
      map.set(patient.id, patient);
    }
  });

  incoming.forEach(patient => {
    if (patient?.id) {
      map.set(patient.id, patient);
    }
  });

  return Array.from(map.values());
}

/* =========================================================
   PATIENT REPORT HTML
========================================================= */

export function buildPatientReportHtml(
  patient: any,
  settings: any = {},
  options: PrintOptions = {},
): string {
  const print =
    getPrintSettings(
      settings,
      options,
    );

  const included =
    getIncludedSections(patient);

  const logo =
    settings?.logo &&
    typeof settings.logo === 'string'
      ? settings.logo
      : '';

  const logoHtml =
    print.showLogo && logo
      ? `
        <div style="
          text-align:${esc(
            print.logoPosition,
          )};
          margin-bottom:8px;
        ">
          <img
            src="${esc(logo)}"
            style="
              width:${safeNumber(
                print.logoSize,
              )}px;
              height:${safeNumber(
                print.logoSize,
              )}px;
              object-fit:contain;
            "
          />
        </div>
      `
      : '';

  const centerHtml =
    print.showCenter &&
    hasValue(settings?.center)
      ? `<div style="
          text-align:center;
          font-size:20px;
          font-weight:900;
          color:#1d3b36;
        ">${esc(
          settings.center,
        )}</div>`
      : '';

  const directorateHtml =
    print.showDirectorate &&
    hasValue(settings?.directorate)
      ? `<div style="
          text-align:center;
          margin-top:3px;
          color:#666;
        ">${esc(
          settings.directorate,
        )}</div>`
      : '';

  const patientInfoRows = [];

  patientInfoRows.push(`
    <tr>
      <th>اسم المريض</th>
      <td>${esc(
        patient?.name,
      )}</td>
    </tr>
  `);

  if (print.showSeq) {
    patientInfoRows.push(`
      <tr>
        <th>رقم السجل</th>
        <td>${esc(
          patient?.seq,
        )}</td>
      </tr>
    `);
  }

  patientInfoRows.push(`
    <tr>
      <th>العمر</th>
      <td>${esc(
        patient?.age,
      )}</td>
    </tr>
  `);

  patientInfoRows.push(`
    <tr>
      <th>الجنس</th>
      <td>${esc(
        patient?.gender,
      )}</td>
    </tr>
  `);

  if (print.showDate) {
    patientInfoRows.push(`
      <tr>
        <th>التاريخ</th>
        <td>${esc(
          displayDate(
            patient?.date ||
              '',
          ),
        )}</td>
      </tr>
    `);
  }

  const sectionsHtml =
    included
      .map(sectionKey => {
        const section =
          TEST_SECTIONS[
            sectionKey
          ];

        const results =
          getSectionResults(
            patient,
            sectionKey,
          );

        if (!results.length) {
          return '';
        }

        const rows = results
          .map(item => {
            return `
              <tr>
                <td>${esc(
                  item.label,
                )}</td>

                <td style="
                  text-align:center;
                  font-weight:800;
                ">
                  ${esc(
                    item.value,
                  )}
                </td>

                ${
                  print.showNormal
                    ? `
                      <td style="
                        direction:ltr;
                        text-align:left;
                        color:#777;
                      ">
                        ${esc(
                          item.normal,
                        )}
                      </td>
                    `
                    : ''
                }
              </tr>
            `;
          })
          .join('');

        return `
          <div class="section avoid-break"
               style="margin-top:14px;">

            <div style="
              background:#1d3b36;
              color:#fff;
              padding:8px 10px;
              border-radius:4px 4px 0 0;
              font-weight:900;
              text-align:right;
            ">
              ${esc(
                section.icon,
              )}
              ${esc(
                section.label,
              )}
            </div>

            <table class="print-table">
              <thead>
                <tr>
                  <th>الفحص</th>
                  <th>النتيجة</th>

                  ${
                    print.showNormal
                      ? `
                        <th>الطبيعي</th>
                      `
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

  const notesHtml =
    print.showNotes &&
    hasValue(patient?.notes)
      ? `
        <div style="
          margin-top:15px;
          padding:10px;
          border:1px solid #ccc;
          border-radius:5px;
          text-align:right;
        ">
          <strong>ملاحظات:</strong>
          ${esc(
            patient.notes,
          )}
        </div>
      `
      : '';

  const footerHtml =
    print.showFooter
      ? `
        <div class="footer">
          ${esc(
            print.footerText,
          )}
        </div>
      `
      : '';

  return `
    <!DOCTYPE html>
    <html dir="rtl">
      <head>
        <meta
          charset="UTF-8"
        />

        <meta
          name="viewport"
          content="width=device-width,
                   initial-scale=1.0"
        />

        <style>
          ${getPageCss(print)}
        </style>
      </head>

      <body>

        <div class="page">

          ${logoHtml}

          ${centerHtml}

          ${directorateHtml}

          <div style="
            text-align:center;
            font-size:19px;
            font-weight:900;
            margin:18px 0 14px;
          ">
            ${esc(
              print.reportTitle,
            )}
          </div>

          <table class="print-table">
            <tbody>
              ${patientInfoRows.join('')}
            </tbody>
          </table>

          ${sectionsHtml}

          ${notesHtml}

          ${footerHtml}

        </div>

      </body>
    </html>
  `;
}

/* =========================================================
   EXPORT PATIENT PDF
========================================================= */

export async function exportPatientPdf(
  patient: any,
  settings: any = {},
  options: PrintOptions = {},
) {
  const html =
    buildPatientReportHtml(
      patient,
      settings,
      options,
    );

  const {uri} =
    await Print.printToFileAsync({
      html,
    });

  const available =
    await ensureShare();

  if (available) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle:
        'مشاركة تقرير المريض',
    });
  }

  return uri;
}

/* =========================================================
   PRINT PATIENT
========================================================= */

export async function printPatient(
  patient: any,
  settings: any = {},
  options: PrintOptions = {},
) {
  const html =
    buildPatientReportHtml(
      patient,
      settings,
      options,
    );

  await Print.printAsync({
    html,
  });
}

/* =========================================================
   EXCEL HELPERS
========================================================= */

function flattenPatient(
  patient: any,
) {
  const row: any = {
    'اسم المريض':
      patient?.name || '',
    'رقم السجل':
      patient?.seq || '',
    'العمر':
      patient?.age || '',
    'الجنس':
      patient?.gender || '',
    'التاريخ':
      patient?.date || '',
    'ملاحظات':
      patient?.notes || '',
  };

  SECTION_KEYS.forEach(
    sectionKey => {
      const section =
        TEST_SECTIONS[
          sectionKey
        ];

      if (
        !patient?.[
          `include${sectionKey}`
        ]
      ) {
        return;
      }

      const data =
        patient?.[
          section.dataKey
        ] || {};

      section.fields.forEach(
        field => {
          row[
            `${section.label} - ${field.label}`
          ] =
            data?.[
              field.key
            ] ?? '';
        },
      );
    },
  );

  return row;
}

/* =========================================================
   EXPORT PATIENTS EXCEL
========================================================= */

export async function exportPatientsExcel(
  patients: any[],
) {
  const list =
    Array.isArray(patients)
      ? patients
      : [];

  const workbook =
    XLSX.utils.book_new();

  /* -------------------------------------------------------
     Sheet 1: المرضى
  ------------------------------------------------------- */

  const patientRows =
    list.map(
      flattenPatient,
    );

  const patientsSheet =
    XLSX.utils.json_to_sheet(
      patientRows,
    );

  XLSX.utils.book_append_sheet(
    workbook,
    patientsSheet,
    'المرضى',
  );

  /* -------------------------------------------------------
     Sheet 2: النتائج
  ------------------------------------------------------- */

  const resultsRows: any[] = [];

  list.forEach(
    patient => {
      SECTION_KEYS.forEach(
        sectionKey => {
          if (
            !patient?.[
              `include${sectionKey}`
            ]
          ) {
            return;
          }

          const section =
            TEST_SECTIONS[
              sectionKey
            ];

          const data =
            patient?.[
              section.dataKey
            ] || {};

          section.fields.forEach(
            field => {
              const value =
                data?.[
                  field.key
                ];

              if (!hasValue(value)) {
                return;
              }

              resultsRows.push({
                'اسم المريض':
                  patient?.name ||
                  '',
                'رقم السجل':
                  patient?.seq ||
                  '',
                'التاريخ':
                  patient?.date ||
                  '',
                'القسم':
                  section.label,
                'الفحص':
                  field.label,
                'النتيجة':
                  value,
                'الطبيعي':
                  field.normal,
              });
            },
          );
        },
      );
    },
  );

  const resultsSheet =
    XLSX.utils.json_to_sheet(
      resultsRows,
    );

  XLSX.utils.book_append_sheet(
    workbook,
    resultsSheet,
    'النتائج',
  );

  /* -------------------------------------------------------
     Sheet 3: الإحصائيات
  ------------------------------------------------------- */

  const stats =
    getStats(list);

  const statsRows: any[] = [];

  stats.sections.forEach(
    section => {
      statsRows.push({
        'القسم':
          section.name,
        'عدد السجلات':
          section.count,
        'الفحص': '',
        'عدد النتائج': '',
      });

      section.tests.forEach(
        test => {
          statsRows.push({
            'القسم':
              section.name,
            'عدد السجلات':
              '',
            'الفحص':
              test.name,
            'عدد النتائج':
              test.count,
          });
        },
      );
    },
  );

  const summaryRows = [
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

  const statsSheet =
    XLSX.utils.json_to_sheet(
      [
        ...summaryRows,
        {},
        ...statsRows,
      ],
    );

  XLSX.utils.book_append_sheet(
    workbook,
    statsSheet,
    'الإحصائيات',
  );

  /* -------------------------------------------------------
     Export
  ------------------------------------------------------- */

  const output =
    XLSX.write(
      workbook,
      {
        type: 'base64',
        bookType: 'xlsx',
      },
    );

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

  const available =
    await ensureShare();

  if (available) {
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

  const today =
    todayISO();

  const total =
    list.length;

  const todayCount =
    list.filter(
      patient =>
        patient?.date === today,
    ).length;

  const males =
    list.filter(
      patient =>
        String(
          patient?.gender ||
            '',
        )
          .trim()
          .toLowerCase() ===
        'ذكر',
    ).length;

  const females =
    list.filter(
      patient =>
        String(
          patient?.gender ||
            '',
        )
          .trim()
          .toLowerCase() ===
        'انثى' ||
        String(
          patient?.gender ||
            '',
        )
          .trim()
          .toLowerCase() ===
        'أنثى',
    ).length;

  const sections: StatsSection[] =
    SECTION_KEYS.map(
      sectionKey => {
        const section =
          TEST_SECTIONS[
            sectionKey
          ];

        const sectionPatients =
          list.filter(
            patient =>
              !!patient?.[
                `include${sectionKey}`
              ],
          );

        const tests: StatsTest[] =
          section.fields.map(
            field => {
              const count =
                sectionPatients.filter(
                  patient => {
                    const data =
                      patient?.[
                        section.dataKey
                      ] || {};

                    return hasValue(
                      data?.[
                        field.key
                      ],
                    );
                  },
                ).length;

              return {
                name:
                  field.label,
                count,
              };
            },
          );

        return {
          key:
            sectionKey,
          name:
            section.label,
          count:
            sectionPatients.length,
          tests,
        };
      },
    );

  return {
    total,
    today: todayCount,
    males,
    females,
    sections,
  };
}

/* =========================================================
   STATISTICS HTML
========================================================= */

export function buildStatsHtml(
  stats: LabStats,
  settings: any = {},
  options: PrintOptions = {},
): string {
  const print =
    getPrintSettings(
      settings,
      options,
    );

  const sectionRows =
    stats.sections
      .map(section => {

        const testRows =
          section.tests
            .filter(
              test =>
                test.count > 0,
            )
            .map(
              test => `
                <tr>
                  <td>
                    ${esc(
                      test.name,
                    )}
                  </td>

                  <td style="
                    text-align:center;
                    font-weight:900;
                  ">
                    ${test.count}
                  </td>
                </tr>
              `,
            )
            .join('');

        return `
          <div class="section avoid-break"
               style="margin-top:14px;">

            <div style="
              background:#1d3b36;
              color:#fff;
              padding:9px;
              font-weight:900;
              text-align:right;
            ">
              ${esc(
                section.name,
              )}

              <span style="
                float:left;
              ">
                ${section.count}
              </span>
            </div>

            <table class="print-table">

              <thead>
                <tr>
                  <th>الفحص</th>
                  <th>العدد</th>
                </tr>
              </thead>

              <tbody>
                ${
                  testRows ||
                  `
                    <tr>
                      <td colspan="2">
                        لا توجد نتائج مسجلة
                      </td>
                    </tr>
                  `
                }
              </tbody>

            </table>

          </div>
        `;
      })
      .join('');

  const summary = `
    <table class="print-table">
      <thead>
        <tr>
          <th>البيان</th>
          <th>العدد</th>
        </tr>
      </thead>

      <tbody>

        <tr>
          <td>إجمالي المرضى</td>
          <td style="text-align:center;font-weight:900;">
            ${stats.total}
          </td>
        </tr>

        <tr>
          <td>سجلات اليوم</td>
          <td style="text-align:center;font-weight:900;">
            ${stats.today}
          </td>
        </tr>

        <tr>
          <td>ذكور</td>
          <td style="text-align:center;font-weight:900;">
            ${stats.males}
          </td>
        </tr>

        <tr>
          <td>إناث</td>
          <td style="text-align:center;font-weight:900;">
            ${stats.females}
          </td>
        </tr>

      </tbody>
    </table>
  `;

  const center =
    print.showCenter &&
    hasValue(settings?.center)
      ? `
        <div style="
          text-align:center;
          font-size:20px;
          font-weight:900;
          color:#1d3b36;
        ">
          ${esc(
            settings.center,
          )}
        </div>
      `
      : '';

  const directorate =
    print.showDirectorate &&
    hasValue(
      settings?.directorate,
    )
      ? `
        <div style="
          text-align:center;
          color:#666;
          margin-top:3px;
        ">
          ${esc(
            settings.directorate,
          )}
        </div>
      `
      : '';

  const footer =
    print.showFooter
      ? `
        <div class="footer">
          ${esc(
            print.footerText,
          )}
        </div>
      `
      : '';

  return `
    <!DOCTYPE html>

    <html dir="rtl">

      <head>

        <meta charset="UTF-8" />

        <meta
          name="viewport"
          content="width=device-width,
                   initial-scale=1.0"
        />

        <style>
          ${getPageCss(print)}
        </style>

      </head>

      <body>

        <div class="page">

          ${center}

          ${directorate}

          <div style="
            text-align:center;
            font-size:20px;
            font-weight:900;
            margin:18px 0;
          ">
            التقرير الإحصائي الطبي
          </div>

          ${summary}

          ${sectionRows}

          ${footer}

        </div>

      </body>

    </html>
  `;
}

/* =========================================================
   EXPORT STATISTICS PDF
========================================================= */

export async function exportStatsPdf(
  stats: LabStats,
  settings: any = {},
  options: PrintOptions = {},
) {
  const html =
    buildStatsHtml(
      stats,
      settings,
      options,
    );

  const {uri} =
    await Print.printToFileAsync({
      html,
    });

  const available =
    await ensureShare();

  if (available) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle:
        'مشاركة الإحصائيات',
    });
  }

  return uri;
}

/* =========================================================
   PRINT STATISTICS
========================================================= */

export async function printStats(
  stats: LabStats,
  settings: any = {},
  options: PrintOptions = {},
) {
  const html =
    buildStatsHtml(
      stats,
      settings,
      options,
    );

  await Print.printAsync({
    html,
  });
}

/* =========================================================
   END
========================================================= */
