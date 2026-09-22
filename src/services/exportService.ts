import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as XLSX from 'xlsx';

import {
  TEST_SECTIONS,
  SECTION_KEYS,
  SectionKey,
} from '../utils/constants';

import {
  todayISO,
  displayDate,
} from '../utils/helpers';

/* =========================================================
   Types
========================================================= */

type PrintOptions = {
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

  logoUri?: string;
  labCenter?: string;
  directorate?: string;
};

type StatsTest = {
  name: string;
  count: number;
};

type StatsSection = {
  key: SectionKey;
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
   Default Print Settings
========================================================= */

const DEFAULT_PRINT_SETTINGS: PrintOptions = {
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
  fontFamily: 'Tajawal, Arial, Tahoma, sans-serif',

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
   General Helpers
========================================================= */

const ensureShare = async (
  uri: string,
  mime?: string,
) => {
  try {
    const available =
      await Sharing.isAvailableAsync();

    if (!available) {
      return;
    }

    await Sharing.shareAsync(uri, {
      mimeType: mime,
    });
  } catch (error) {
    console.log(
      'Sharing error:',
      error,
    );
  }
};

const esc = (value: any): string => {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

const hasValue = (value: any) => {
  return (
    value !== null &&
    value !== undefined &&
    String(value).trim() !== ''
  );
};

const safeNumber = (
  value: any,
  fallback: number,
) => {
  const n = Number(value);

  return Number.isFinite(n)
    ? n
    : fallback;
};

/* =========================================================
   Print Settings
========================================================= */

const getPrintSettings = (
  settings: any = {},
  options: PrintOptions = {},
): Required<
  Omit<
    PrintOptions,
    'logoUri' | 'labCenter' | 'directorate'
  >
> & {
  logoUri: string;
  labCenter: string;
  directorate: string;
} => {
  const saved =
    settings?.printSettings || {};

  const merged: any = {
    ...DEFAULT_PRINT_SETTINGS,
    ...saved,
    ...options,
  };

  return {
    paper:
      merged.paper === 'A5'
        ? 'A5'
        : merged.paper === 'Letter'
        ? 'Letter'
        : 'A4',

    orientation:
      merged.orientation === 'landscape'
        ? 'landscape'
        : 'portrait',

    layout:
      ['auto', '1', '2', '2stack', '3', '4'].includes(
        merged.layout,
      )
        ? merged.layout
        : 'auto',

    gap: safeNumber(
      merged.gap,
      4,
    ),

    marginTop: safeNumber(
      merged.marginTop,
      8,
    ),

    marginRight: safeNumber(
      merged.marginRight,
      8,
    ),

    marginBottom: safeNumber(
      merged.marginBottom,
      8,
    ),

    marginLeft: safeNumber(
      merged.marginLeft,
      8,
    ),

    fontSize: safeNumber(
      merged.fontSize,
      13,
    ),

    tableFontSize: safeNumber(
      merged.tableFontSize,
      11,
    ),

    fontFamily:
      merged.fontFamily ||
      'Tajawal, Arial, Tahoma, sans-serif',

    showLogo:
      merged.showLogo !== false,

    logoPosition:
      merged.logoPosition === 'left'
        ? 'left'
        : merged.logoPosition === 'center'
        ? 'center'
        : 'right',

    logoSize: safeNumber(
      merged.logoSize,
      24,
    ),

    reportTitle:
      merged.reportTitle ||
      'تقرير الفحوصات المخبرية',

    showCenter:
      merged.showCenter !== false,

    showDirectorate:
      merged.showDirectorate !== false,

    showDate:
      merged.showDate !== false,

    showSeq:
      merged.showSeq !== false,

    showNotes:
      merged.showNotes !== false,

    showFooter:
      merged.showFooter !== false,

    footerText:
      merged.footerText ||
      'مع تمنياتنا بالصحة والعافية',

    showBorder:
      merged.showBorder !== false,

    borderColor:
      merged.borderColor ||
      '#777777',

    showNormal:
      merged.showNormal !== false,

    logoUri:
      options.logoUri ??
      settings?.logo ??
      '',

    labCenter:
      options.labCenter ??
      settings?.center ??
      '',

    directorate:
      options.directorate ??
      settings?.directorate ??
      '',
  } as any;
};

/* =========================================================
   Page CSS
========================================================= */

const getPageCss = (
  printSettings: ReturnType<
    typeof getPrintSettings
  >,
) => {
  const borderColor =
    printSettings.borderColor ||
    '#777777';

  const border =
    printSettings.showBorder
      ? `1px solid ${borderColor}`
      : 'none';

  const fontFamily =
    printSettings.fontFamily ||
    'Arial, Tahoma, sans-serif';

  return `
    @page {
      size: ${printSettings.paper} ${printSettings.orientation};
      margin:
        ${printSettings.marginTop}mm
        ${printSettings.marginRight}mm
        ${printSettings.marginBottom}mm
        ${printSettings.marginLeft}mm;
    }

    * {
      box-sizing: border-box;
    }

    html,
    body {
      margin: 0;
      padding: 0;
      direction: rtl;
      background: #ffffff;
      color: #111111;
      font-family: ${esc(fontFamily)};
    }

    body {
      font-size: ${printSettings.fontSize}px;
      line-height: 1.45;
    }

    table {
      width: 100%;
      border-collapse: collapse;
    }

    th,
    td {
      border: ${border};
      padding: 7px 6px;
      text-align: center;
      vertical-align: middle;
      font-size: ${printSettings.tableFontSize}px;
    }

    th {
      background: #eeeeee;
      font-weight: 900;
    }

    .no-border,
    .no-border td,
    .no-border th {
      border: none !important;
    }

    .avoid-break {
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .page-break {
      page-break-before: always;
      break-before: page;
    }
  `;
};

/* =========================================================
   Patient Data Helpers
========================================================= */

const getSectionData = (
  patient: any,
  sectionKey: SectionKey,
) => {
  const section =
    TEST_SECTIONS[sectionKey];

  if (!section) {
    return null;
  }

  const included =
    patient?.[
      `include${sectionKey}`
    ] === true;

  if (!included) {
    return null;
  }

  return (
    patient?.[
      section.dataKey
    ] || {}
  );
};

const getSectionResults = (
  patient: any,
  sectionKey: SectionKey,
) => {
  const section =
    TEST_SECTIONS[sectionKey];

  if (!section) {
    return [];
  }

  const data =
    getSectionData(
      patient,
      sectionKey,
    );

  if (!data) {
    return [];
  }

  return section.fields
    .map(field => ({
      key: field.key,
      label: field.label,
      normal: field.normal,
      value:
        data?.[field.key] ?? '',
    }))
    .filter(item =>
      hasValue(item.value),
    );
};

const getIncludedSections = (
  patient: any,
) => {
  return SECTION_KEYS.filter(
    key =>
      patient?.[
        `include${key}`
      ] === true,
  );
};

/* =========================================================
   Backup
========================================================= */

export type BackupPayload = {
  app: 'lab-app';
  version: number;
  exportedAt: string;
  patients: any[];
  settings: any;
  auditLog: any[];
};

export const exportBackup =
  async (
    data: BackupPayload,
  ) => {
    const fileName =
      `lab_backup_${todayISO()}.json`;

    const uri =
      `${FileSystem.cacheDirectory}${fileName}`;

    await FileSystem.writeAsStringAsync(
      uri,
      JSON.stringify(
        data,
        null,
        2,
      ),
      {
        encoding:
          FileSystem.EncodingType.UTF8,
      },
    );

    await ensureShare(
      uri,
      'application/json',
    );

    return uri;
  };

export const importBackup =
  async () => {
    const result =
      await DocumentPicker.getDocumentAsync(
        {
          type: 'application/json',
          copyToCacheDirectory: true,
          multiple: false,
        },
      );

    if (result.canceled) {
      return null;
    }

    const asset =
      result.assets?.[0];

    if (!asset?.uri) {
      throw new Error(
        'لم يتم اختيار ملف النسخة الاحتياطية.',
      );
    }

    const content =
      await FileSystem.readAsStringAsync(
        asset.uri,
        {
          encoding:
            FileSystem.EncodingType.UTF8,
        },
      );

    let parsed: any;

    try {
      parsed =
        JSON.parse(content);
    } catch {
      throw new Error(
        'ملف النسخة الاحتياطية غير صالح.',
      );
    }

    if (
      parsed?.app !== 'lab-app' ||
      !Array.isArray(
        parsed?.patients,
      )
    ) {
      throw new Error(
        'هذا الملف ليس نسخة احتياطية صحيحة للمختبر.',
      );
    }

    return {
      patients:
        parsed.patients,

      settings:
        parsed.settings ?? {},

      auditLog:
        Array.isArray(
          parsed.auditLog,
        )
          ? parsed.auditLog
          : [],

      version:
        parsed.version ?? 1,

      exportedAt:
        parsed.exportedAt ?? '',
    };
  };

/* =========================================================
   Restore / Merge
========================================================= */

export const mergeOrRestoreBackup =
  async (
    mode:
      | 'restore'
      | 'merge',
    data: {
      patients: any[];
      settings?: any;
      auditLog?: any[];
    },
  ) => {
    const PATIENTS_KEY =
      'lab_patients_db';

    const SETTINGS_KEY =
      'lab_settings_db';

    const AUDIT_KEY =
      'lab_audit_log';

    if (mode === 'restore') {
      await AsyncStorage.setItem(
        PATIENTS_KEY,
        JSON.stringify(
          data.patients ?? [],
        ),
      );

      await AsyncStorage.setItem(
        SETTINGS_KEY,
        JSON.stringify(
          data.settings ?? {},
        ),
      );

      await AsyncStorage.setItem(
        AUDIT_KEY,
        JSON.stringify(
          data.auditLog ?? [],
        ),
      );

      return {
        patients:
          data.patients ?? [],

        settings:
          data.settings ?? {},

        auditLog:
          data.auditLog ?? [],
      };
    }

    const currentPatientsRaw =
      await AsyncStorage.getItem(
        PATIENTS_KEY,
      );

    const currentSettingsRaw =
      await AsyncStorage.getItem(
        SETTINGS_KEY,
      );

    const currentAuditRaw =
      await AsyncStorage.getItem(
        AUDIT_KEY,
      );

    let currentPatients: any[] =
      [];

    let currentSettings: any =
      {};

    let currentAudit: any[] =
      [];

    try {
      currentPatients =
        currentPatientsRaw
          ? JSON.parse(
              currentPatientsRaw,
            )
          : [];
    } catch {
      currentPatients = [];
    }

    try {
      currentSettings =
        currentSettingsRaw
          ? JSON.parse(
              currentSettingsRaw,
            )
          : {};
    } catch {
      currentSettings = {};
    }

    try {
      currentAudit =
        currentAuditRaw
          ? JSON.parse(
              currentAuditRaw,
            )
          : [];
    } catch {
      currentAudit = [];
    }

    const patientsMap =
      new Map<string, any>();

    [
      ...currentPatients,
      ...(data.patients ?? []),
    ].forEach(
      (patient: any) => {
        const id =
          patient?.id ??
          `${patient?.seq ?? ''}-${patient?.date ?? ''}-${patient?.name ?? ''}`;

        patientsMap.set(
          String(id),
          patient,
        );
      },
    );

    const mergedPatients =
      Array.from(
        patientsMap.values(),
      );

    const mergedSettings = {
      ...currentSettings,
      ...(data.settings ?? {}),
      printSettings: {
        ...(currentSettings
          ?.printSettings ?? {}),
        ...(data.settings
          ?.printSettings ?? {}),
      },
    };

    const mergedAudit = [
      ...currentAudit,
      ...(data.auditLog ?? []),
    ].slice(0, 500);

    await AsyncStorage.setItem(
      PATIENTS_KEY,
      JSON.stringify(
        mergedPatients,
      ),
    );

    await AsyncStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify(
        mergedSettings,
      ),
    );

    await AsyncStorage.setItem(
      AUDIT_KEY,
      JSON.stringify(
        mergedAudit,
      ),
    );

    return {
      patients:
        mergedPatients,

      settings:
        mergedSettings,

      auditLog:
        mergedAudit,
    };
  };

/* =========================================================
   Patient Report HTML
========================================================= */

const buildPatientReportHtml =
  (
    patient: any,
    settings: any = {},
    options: PrintOptions = {},
  ) => {
    const ps =
      getPrintSettings(
        settings,
        options,
      );

    let sectionsHtml = '';

    for (
      const sectionKey of
      SECTION_KEYS
    ) {
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
        continue;
      }

      const rows =
        results
          .map(
            result => `
              <tr>
                <td>
                  ${esc(
                    result.label,
                  )}
                </td>

                <td class="result">
                  ${esc(
                    result.value,
                  )}
                </td>

                ${
                  ps.showNormal
                    ? `
                      <td>
                        ${esc(
                          result.normal,
                        )}
                      </td>
                    `
                    : ''
                }
              </tr>
            `,
          )
          .join('');

      sectionsHtml += `
        <div class="section avoid-break">

          <div class="section-title">
            ${esc(section.icon)}
            ${esc(section.label)}
          </div>

          <table>

            <thead>
              <tr>
                <th>الفحص</th>
                <th>النتيجة</th>

                ${
                  ps.showNormal
                    ? `
                      <th>
                        القيمة الطبيعية
                      </th>
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
    }

    const logoHtml =
      ps.showLogo &&
      hasValue(ps.logoUri)
        ? `
          <div
            class="logo-wrap"
            style="text-align:${esc(
              ps.logoPosition,
            )};"
          >
            <img
              src="${esc(
                ps.logoUri,
              )}"
              class="logo"
              style="
                width:${Math.max(
                  10,
                  ps.logoSize,
                )}mm;
              "
            />
          </div>
        `
        : '';

    const infoRows = `
      <tr>

        ${
          ps.showSeq
            ? `
              <td class="label">
                التسلسل
              </td>

              <td>
                ${esc(
                  patient?.seq ?? '',
                )}
              </td>
            `
            : ''
        }

        ${
          ps.showDate
            ? `
              <td class="label">
                التاريخ
              </td>

              <td>
                ${esc(
                  patient?.date
                    ? displayDate(
                        patient.date,
                      )
                    : '',
                )}
              </td>
            `
            : ''
        }

      </tr>

      <tr>

        <td class="label">
          اسم المريض
        </td>

        <td colspan="3">
          ${esc(
            patient?.name ?? '',
          )}
        </td>

      </tr>

      <tr>

        <td class="label">
          العمر
        </td>

        <td>
          ${esc(
            patient?.age ?? '',
          )}
        </td>

        <td class="label">
          الجنس
        </td>

        <td>
          ${esc(
            patient?.gender ?? '',
          )}
        </td>

      </tr>
    `;

    const notes =
      hasValue(
        patient?.notes,
      )
        ? String(
            patient.notes,
          )
        : '';

    return `
      <!DOCTYPE html>

      <html
        lang="ar"
        dir="rtl"
      >

      <head>

        <meta
          charset="UTF-8"
        />

        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        />

        <style>

          ${getPageCss(ps)}

          .container {
            width: 100%;
          }

          .header {
            text-align: center;
            margin-bottom: 14px;
          }

          .logo-wrap {
            margin-bottom: 6px;
          }

          .logo {
            max-height: 35mm;
            height: auto;
            object-fit: contain;
          }

          .center-name {
            font-size: 20px;
            font-weight: 900;
            margin-bottom: 5px;
          }

          .directorate {
            font-size: 14px;
            margin-bottom: 5px;
          }

          .report-title {
            font-size: 18px;
            font-weight: 900;
            margin-top: 10px;
            padding: 9px;
            border-top: 2px solid #222;
            border-bottom: 2px solid #222;
          }

          .patient-info {
            margin-top: 12px;
            margin-bottom: 15px;
          }

          .patient-info .label {
            font-weight: 900;
            background: #f3f3f3;
          }

          .section {
            margin-top: 14px;
          }

          .section-title {
            font-size: 15px;
            font-weight: 900;
            background: #e8e8e8;
            border: 1px solid ${esc(
              ps.borderColor,
            )};
            padding: 8px;
            text-align: center;
          }

          .result {
            font-weight: 900;
          }

          .notes {
            margin-top: 18px;
            border: ${
              ps.showBorder
                ? `1px solid ${esc(
                    ps.borderColor,
                  )}`
                : 'none'
            };
            padding: 10px;
            min-height: 45px;
          }

          .notes-title {
            font-weight: 900;
            margin-bottom: 5px;
          }

          .signatures {
            margin-top: 30px;
          }

          .signatures td {
            width: 50%;
            height: 60px;
            vertical-align: bottom;
          }

          .footer {
            margin-top: 18px;
            text-align: center;
            font-size: 10px;
            color: #666;
          }

        </style>

      </head>

      <body>

        <div class="container">

          <div class="header">

            ${logoHtml}

            ${
              ps.showCenter &&
              hasValue(ps.labCenter)
                ? `
                  <div class="center-name">
                    ${esc(
                      ps.labCenter,
                    )}
                  </div>
                `
                : ''
            }

            ${
              ps.showDirectorate &&
              hasValue(ps.directorate)
                ? `
                  <div class="directorate">
                    ${esc(
                      ps.directorate,
                    )}
                  </div>
                `
                : ''
            }

            <div class="report-title">
              ${esc(
                ps.reportTitle,
              )}
            </div>

          </div>

          <table class="patient-info">
            ${infoRows}
          </table>

          ${
            sectionsHtml ||
            `
              <div
                style="
                  text-align:center;
                  padding:20px;
                "
              >
                لا توجد نتائج مسجلة.
              </div>
            `
          }

          ${
            ps.showNotes &&
            notes
              ? `
                <div class="notes">

                  <div class="notes-title">
                    الملاحظات
                  </div>

                  <div>
                    ${esc(notes)}
                  </div>

                </div>
              `
              : ''
          }

          <table
            class="signatures no-border"
          >
            <tr>

              <td>
                اسم المختبر / الموظف
                <br />
                ______________________
              </td>

              <td>
                توقيع المختبر
                <br />
                ______________________
              </td>

            </tr>
          </table>

          ${
            ps.showFooter
              ? `
                <div class="footer">
                  ${esc(
                    ps.footerText,
                  )}
                </div>
              `
              : ''
          }

        </div>

      </body>

      </html>
    `;
  };

/* =========================================================
   Patient PDF
========================================================= */

export const exportPatientPdf =
  async (
    patient: any,
    settings: any = {},
    options: PrintOptions = {},
  ) => {
    const html =
      buildPatientReportHtml(
        patient,
        settings,
        options,
      );

    const result =
      await Print.printToFileAsync({
        html,
      });

    await ensureShare(
      result.uri,
      'application/pdf',
    );

    return result.uri;
  };

/* =========================================================
   Patient Print
========================================================= */

export const printPatient =
  async (
    patient: any,
    settings: any = {},
    options: PrintOptions = {},
  ) => {
    const html =
      buildPatientReportHtml(
        patient,
        settings,
        options,
      );

    await Print.printAsync({
      html,
    });
  };

/* =========================================================
   Excel Export
========================================================= */

export const exportPatientsExcel =
  async (
    patients: any[],
  ) => {
    const list =
      patients ?? [];

    const patientRows =
      list.map(
        patient => ({
          'رقم السجل':
            patient?.seq ?? '',

          'اسم المريض':
            patient?.name ?? '',

          'العمر':
            patient?.age ?? '',

          'الجنس':
            patient?.gender ?? '',

          'التاريخ':
            patient?.date ?? '',

          'ملاحظات':
            patient?.notes ?? '',
        }),
      );

    const resultRows: any[] =
      [];

    for (
      const patient of list
    ) {
      for (
        const sectionKey of
        SECTION_KEYS
      ) {
        const section =
          TEST_SECTIONS[
            sectionKey
          ];

        const results =
          getSectionResults(
            patient,
            sectionKey,
          );

        for (
          const result of results
        ) {
          resultRows.push({
            'رقم السجل':
              patient?.seq ?? '',

            'اسم المريض':
              patient?.name ?? '',

            'العمر':
              patient?.age ?? '',

            'الجنس':
              patient?.gender ?? '',

            'التاريخ':
              patient?.date ?? '',

            'القسم':
              section.label,

            'الفحص':
              result.label,

            'النتيجة':
              result.value,

            'القيمة الطبيعية':
              result.normal,

            'ملاحظات':
              patient?.notes ?? '',
          });
        }
      }
    }

    const stats =
      getStats(list);

    const statsRows =
      stats.sections.map(
        section => ({
          'القسم':
            section.name,

          'عدد المرضى':
            section.count,

          'عدد النتائج':
            section.tests.reduce(
              (
                total,
                test,
              ) =>
                total +
                test.count,
              0,
            ),
        }),
      );

    const workbook =
      XLSX.utils.book_new();

    const patientsSheet =
      XLSX.utils.json_to_sheet(
        patientRows,
      );

    const resultsSheet =
      XLSX.utils.json_to_sheet(
        resultRows,
      );

    const statsSheet =
      XLSX.utils.json_to_sheet(
        statsRows,
      );

    XLSX.utils.book_append_sheet(
      workbook,
      patientsSheet,
      'المرضى',
    );

    XLSX.utils.book_append_sheet(
      workbook,
      resultsSheet,
      'النتائج',
    );

    XLSX.utils.book_append_sheet(
      workbook,
      statsSheet,
      'الإحصائيات',
    );

    const sheets = [
      patientsSheet,
      resultsSheet,
      statsSheet,
    ];

    for (
      const sheet of sheets
    ) {
      const range =
        XLSX.utils.decode_range(
          sheet['!ref'] ||
            'A1:A1',
        );

      const widths: any[] =
        [];

      for (
        let c = range.s.c;
        c <= range.e.c;
        c++
      ) {
        let max = 12;

        for (
          let r = range.s.r;
          r <= range.e.r;
          r++
        ) {
          const cell =
            sheet[
              XLSX.utils.encode_cell({
                r,
                c,
              })
            ];

          if (
            cell?.v !==
            undefined &&
            cell?.v !==
            null
          ) {
            max =
              Math.max(
                max,
                String(
                  cell.v,
                ).length + 2,
              );
          }
        }

        widths.push({
          wch: Math.min(
            max,
            35,
          ),
        });
      }

      sheet['!cols'] =
        widths;
    }

    const excelBase64 =
      XLSX.write(
        workbook,
        {
          type: 'base64',
          bookType: 'xlsx',
        },
      );

    const fileName =
      `سجلات_المختبر_${todayISO()}.xlsx`;

    const uri =
      `${FileSystem.cacheDirectory}${fileName}`;

    await FileSystem.writeAsStringAsync(
      uri,
      excelBase64,
      {
        encoding:
          FileSystem.EncodingType.Base64,
      },
    );

    await ensureShare(
      uri,
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );

    return uri;
  };

/* =========================================================
   Statistics
========================================================= */

export const getStats = (
  patients: any[],
): LabStats => {
  const list =
    patients ?? [];

  const today =
    todayISO();

  const total =
    list.length;

  const todayCount =
    list.filter(
      patient =>
        patient?.date ===
        today,
    ).length;

  const males =
    list.filter(
      patient => {
        const gender =
          String(
            patient?.gender ??
              '',
          )
            .trim()
            .toLowerCase();

        return (
          gender === 'ذكر' ||
          gender === 'male'
        );
      },
    ).length;

  const females =
    list.filter(
      patient => {
        const gender =
          String(
            patient?.gender ??
              '',
          )
            .trim()
            .toLowerCase();

        return (
          gender === 'أنثى' ||
          gender === 'female'
        );
      },
    ).length;

  const sections: StatsSection[] =
    [];

  for (
    const sectionKey of
    SECTION_KEYS
  ) {
    const section =
      TEST_SECTIONS[
        sectionKey
      ];

    const patientsWithSection =
      list.filter(
        patient =>
          patient?.[
            `include${sectionKey}`
          ] === true,
      );

    if (
      patientsWithSection.length ===
      0
    ) {
      continue;
    }

    const tests: StatsTest[] =
      section.fields
        .map(field => {
          const count =
            patientsWithSection.filter(
              patient => {
                const value =
                  patient?.[
                    section.dataKey
                  ]?.[field.key];

                return hasValue(
                  value,
                );
              },
            ).length;

          return {
            name: field.label,
            count,
          };
        })
        .filter(
          test =>
            test.count > 0,
        );

    sections.push({
      key: sectionKey,
      name: section.label,
      count:
        patientsWithSection.length,
      tests,
    });
  }

  return {
    total,
    today: todayCount,
    males,
    females,
    sections,
  };
};

/* =========================================================
   Statistics PDF HTML
========================================================= */

const buildStatsHtml =
  (
    stats: LabStats,
    settings: any = {},
    options: PrintOptions = {},
  ) => {
    const ps =
      getPrintSettings(
        settings,
        options,
      );

    const logoHtml =
      ps.showLogo &&
      hasValue(ps.logoUri)
        ? `
          <div
            class="logo-wrap"
            style="text-align:${esc(
              ps.logoPosition,
            )};"
          >
            <img
              src="${esc(
                ps.logoUri,
              )}"
              class="logo"
              style="
                width:${Math.max(
                  10,
                  ps.logoSize,
                )}mm;
              "
            />
          </div>
        `
        : '';

    let sectionRows = '';

    for (
      const section of
      stats.sections
    ) {
      for (
        const test of
        section.tests
      ) {
        sectionRows += `
          <tr>

            <td>
              ${esc(
                section.name,
              )}
            </td>

            <td>
              ${esc(
                test.name,
              )}
            </td>

            <td>
              ${esc(
                test.count,
              )}
            </td>

          </tr>
        `;
      }
    }

    return `
      <!DOCTYPE html>

      <html
        lang="ar"
        dir="rtl"
      >

      <head>

        <meta charset="UTF-8" />

        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        />

        <style>

          ${getPageCss(ps)}

          .header {
            text-align: center;
            margin-bottom: 18px;
          }

          .logo-wrap {
            margin-bottom: 6px;
          }

          .logo {
            max-height: 30mm;
            height: auto;
            object-fit: contain;
          }

          .center {
            font-size: 20px;
            font-weight: 900;
          }

          .directorate {
            margin-top: 4px;
            font-size: 13px;
          }

          .title {
            margin-top: 12px;
            padding: 10px;
            border-top: 2px solid #222;
            border-bottom: 2px solid #222;
            font-size: 18px;
            font-weight: 900;
          }

          .summary {
            margin-bottom: 20px;
          }

          .summary td,
          .summary th {
            width: 25%;
          }

          .number {
            font-size: 18px;
            font-weight: 900;
          }

          .section-summary {
            margin-top: 18px;
            margin-bottom: 18px;
          }

          .section-summary-title {
            font-weight: 900;
            background: #eeeeee;
            padding: 7px;
          }

          .footer {
            margin-top: 20px;
            text-align: center;
            font-size: 10px;
            color: #666;
          }

        </style>

      </head>

      <body>

        <div class="header">

          ${logoHtml}

          ${
            ps.showCenter &&
            hasValue(
              ps.labCenter,
            )
              ? `
                <div class="center">
                  ${esc(
                    ps.labCenter,
                  )}
                </div>
              `
              : ''
          }

          ${
            ps.showDirectorate &&
            hasValue(
              ps.directorate,
            )
              ? `
                <div class="directorate">
                  ${esc(
                    ps.directorate,
                  )}
                </div>
              `
              : ''
          }

          <div class="title">
            التقرير الإحصائي الطبي
          </div>

        </div>

        <table class="summary">

          <thead>
            <tr>
              <th>إجمالي المرضى</th>
              <th>سجلات اليوم</th>
              <th>ذكور</th>
              <th>إناث</th>
            </tr>
          </thead>

          <tbody>
            <tr>

              <td class="number">
                ${esc(
                  stats.total,
                )}
              </td>

              <td class="number">
                ${esc(
                  stats.today,
                )}
              </td>

              <td class="number">
                ${esc(
                  stats.males,
                )}
              </td>

              <td class="number">
                ${esc(
                  stats.females,
                )}
              </td>

            </tr>
          </tbody>

        </table>

        ${
          stats.sections.length
            ? `
              <table>

                <thead>
                  <tr>
                    <th>القسم</th>
                    <th>الفحص</th>
                    <th>عدد النتائج</th>
                  </tr>
                </thead>

                <tbody>
                  ${sectionRows}
                </tbody>

              </table>
            `
            : `
              <div
                style="
                  text-align:center;
                  padding:20px;
                "
              >
                لا توجد بيانات فحوصات.
              </div>
            `
        }

        ${
          ps.showFooter
            ? `
              <div class="footer">
                ${esc(
                  ps.footerText,
                )}
              </div>
            `
            : ''
        }

      </body>

      </html>
    `;
  };

/* =========================================================
   Statistics PDF
========================================================= */

export const exportStatsPdf =
  async (
    stats: LabStats,
    settings: any = {},
    options: PrintOptions = {},
  ) => {
    const html =
      buildStatsHtml(
        stats,
        settings,
        options,
      );

    const result =
      await Print.printToFileAsync({
        html,
      });

    await ensureShare(
      result.uri,
      'application/pdf',
    );

    return result.uri;
  };

/* =========================================================
   Print Statistics
========================================================= */

export const printStats =
  async (
    stats: LabStats,
    settings: any = {},
    options: PrintOptions = {},
  ) => {
    const html =
      buildStatsHtml(
        stats,
        settings,
        options,
      );

    await Print.printAsync({
      html,
    });
  };};
