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
   Helpers
========================================================= */

const ensureShare = async (
  uri: string,
  mime?: string,
) => {
  try {
    const available =
      await Sharing.isAvailableAsync();

    if (available) {
      await Sharing.shareAsync(uri, {
        mimeType: mime,
      });
    }
  } catch (error) {
    console.log(
      'Sharing error:',
      error,
    );
  }
};

const esc = (
  value: any,
): string => {
  return String(value ?? '')
    .replace(
      /&/g,
      '&amp;',
    )
    .replace(
      /</g,
      '&lt;',
    )
    .replace(
      />/g,
      '&gt;',
    )
    .replace(
      /"/g,
      '&quot;',
    )
    .replace(
      /'/g,
      '&#039;',
    );
};

/* =========================================================
   Print Settings
========================================================= */

const getPrintSettings = (
  settings: any = {},
  options: any = {},
) => {
  const saved =
    settings?.printSettings || {};

  return {
    paper:
      options.paper ??
      saved.paper ??
      'A4',

    orientation:
      options.orientation ??
      saved.orientation ??
      'portrait',

    layout:
      options.layout ??
      saved.layout ??
      'auto',

    gap:
      Number(
        options.gap ??
        saved.gap ??
        4,
      ),

    marginTop:
      Number(
        options.marginTop ??
        saved.marginTop ??
        8,
      ),

    marginRight:
      Number(
        options.marginRight ??
        saved.marginRight ??
        8,
      ),

    marginBottom:
      Number(
        options.marginBottom ??
        saved.marginBottom ??
        8,
      ),

    marginLeft:
      Number(
        options.marginLeft ??
        saved.marginLeft ??
        8,
      ),

    fontSize:
      Number(
        options.fontSize ??
        saved.fontSize ??
        13,
      ),

    tableFontSize:
      Number(
        options.tableFontSize ??
        saved.tableFontSize ??
        11,
      ),

    fontFamily:
      options.fontFamily ??
      saved.fontFamily ??
      'Arial, Tahoma, sans-serif',

    showLogo:
      options.showLogo ??
      saved.showLogo ??
      true,

    logoPosition:
      options.logoPosition ??
      saved.logoPosition ??
      'right',

    logoSize:
      Number(
        options.logoSize ??
        saved.logoSize ??
        24,
      ),

    reportTitle:
      options.reportTitle ??
      saved.reportTitle ??
      'تقرير الفحوصات المخبرية',

    showCenter:
      options.showCenter ??
      saved.showCenter ??
      true,

    showDirectorate:
      options.showDirectorate ??
      saved.showDirectorate ??
      true,

    showDate:
      options.showDate ??
      saved.showDate ??
      true,

    showSeq:
      options.showSeq ??
      saved.showSeq ??
      true,

    showNotes:
      options.showNotes ??
      saved.showNotes ??
      true,

    showFooter:
      options.showFooter ??
      saved.showFooter ??
      true,

    footerText:
      options.footerText ??
      saved.footerText ??
      'مع تمنياتنا بالصحة والعافية',

    showBorder:
      options.showBorder ??
      saved.showBorder ??
      true,

    borderColor:
      options.borderColor ??
      saved.borderColor ??
      '#777777',

    showNormal:
      options.showNormal ??
      saved.showNormal ??
      true,

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
  };
};

/* =========================================================
   Page CSS
========================================================= */

const getPageCss = (
  printSettings: any,
) => {
  const paper =
    printSettings.paper === 'A5'
      ? 'A5'
      : printSettings.paper ===
        'Letter'
      ? 'Letter'
      : 'A4';

  const orientation =
    printSettings.orientation ===
    'landscape'
      ? 'landscape'
      : 'portrait';

  const borderColor =
    printSettings.borderColor ||
    '#777';

  const border =
    printSettings.showBorder !==
    false
      ? `1px solid ${borderColor}`
      : 'none';

  const fontFamily =
    printSettings.fontFamily ||
    'Arial, Tahoma, sans-serif';

  return `
    @page {
      size: ${paper} ${orientation};
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
      font-family: ${fontFamily};
      color: #111;
      background: #fff;
    }

    body {
      font-size: ${printSettings.fontSize}px;
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
      font-weight: bold;
    }

    .no-border,
    .no-border td,
    .no-border th {
      border: none !important;
    }

    .page-break {
      page-break-before: always;
    }

    .avoid-break {
      page-break-inside: avoid;
    }
  `;
};

/* =========================================================
   Patient Data Helpers
========================================================= */

/**
 * الحصول على بيانات قسم محدد من المريض.
 *
 * البيانات الحقيقية في المشروع:
 *
 * patient.blood
 * patient.chem
 * patient.urine
 * patient.serology
 * patient.stool
 * patient.preg
 *
 * والقسم يكون فعالاً بواسطة:
 *
 * patient.includeBlood
 * patient.includeChem
 * ...
 */
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
    ];

  if (!included) {
    return null;
  }

  return (
    patient?.[
      section.dataKey
    ] || {}
  );
};

/**
 * الحصول على الفحوصات التي تحتوي فعلياً على نتيجة.
 */
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
        data?.[field.key] ??
        '',
    }))
    .filter(item =>
      String(
        item.value ?? '',
      ).trim(),
    );
};

/**
 * عدد الفحوصات المسجلة فعلياً في القسم.
 */
const getSectionResultCount = (
  patient: any,
  sectionKey: SectionKey,
) => {
  return getSectionResults(
    patient,
    sectionKey,
  ).length;
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
          FileSystem.EncodingType
            .UTF8,
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
          type:
            'application/json',
          copyToCacheDirectory:
            true,
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
            FileSystem.EncodingType
              .UTF8,
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
      parsed?.app !==
        'lab-app' ||
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

    if (
      mode ===
      'restore'
    ) {
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
      (
        patient: any,
      ) => {
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
          ?.printSettings ??
          {}),
        ...(data.settings
          ?.printSettings ??
          {}),
      },
    };

    const mergedAudit = [
      ...currentAudit,
      ...(data.auditLog ?? []),
    ].slice(
      0,
      500,
    );

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
    options: any = {},
  ) => {
    const ps =
      getPrintSettings(
        settings,
        options,
      );

    const {
      logoUri,
      labCenter,
      directorate,
    } = ps;

    let sectionsHtml =
      '';

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

      if (
        !results.length
      ) {
        continue;
      }

      let rows = '';

      for (
        const result of
        results
      ) {
        rows += `
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
        `;
      }

      sectionsHtml += `
        <div class="section avoid-break">

          <div class="section-title">
            ${esc(
              section.icon,
            )}
            ${esc(
              section.label,
            )}
          </div>

          <table>

            <thead>
              <tr>

                <th>
                  الفحص
                </th>

                <th>
                  النتيجة
                </th>

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
      logoUri
        ? `
          <div
            class="logo-wrap"
            style="
              text-align:${esc(
                ps.logoPosition,
              )};
            "
          >
            <img
              src="${esc(
                logoUri,
              )}"
              class="logo"
              style="
                width:${Math.max(
                  10,
                  ps.logoSize,
                )}mm;
                height:auto;
              "
            />
          </div>
        `
        : '';

    const seq =
      patient?.seq ??
      '';

    const date =
      patient?.date
        ? displayDate(
            patient.date,
          )
        : '';

    const notes =
      patient?.notes ??
      '';

    const infoRows =
      `
        <tr>

          ${
            ps.showSeq
              ? `
                <td class="label">
                  التسلسل
                </td>

                <td>
                  ${esc(seq)}
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
                  ${esc(date)}
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
              patient?.name ??
                '',
            )}
          </td>

        </tr>

        <tr>

          <td class="label">
            العمر
          </td>

          <td>
            ${esc(
              patient?.age ??
                '',
            )}
          </td>

          <td class="label">
            الجنس
          </td>

          <td>
            ${esc(
              patient?.gender ??
                '',
            )}
          </td>

        </tr>
      `;

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
            object-fit: contain;
          }

          .center-name {
            font-size: 20px;
            font-weight: 900;
            margin-bottom: 5px;
          }

          .directorate {
            font-size: 14px;
            margin-bottom: 4px;
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

          .label {
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
            min-height: 50px;
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
              labCenter
                ? `
                  <div class="center-name">
                    ${esc(
                      labCenter,
                    )}
                  </div>
                `
                : ''
            }

            ${
              ps.showDirectorate &&
              directorate
                ? `
                  <div class="directorate">
                    ${esc(
                      directorate,
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
    options: any = {},
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
    options: any = {},
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

    const patientRows =
      (patients ?? []).map(
        patient => ({
          'رقم السجل':
            patient?.seq ??
            '',

          'اسم المريض':
            patient?.name ??
            '',

          'العمر':
            patient?.age ??
            '',

          'الجنس':
            patient?.gender ??
            '',

          'التاريخ':
            patient?.date ??
            '',

          'الملاحظات':
            patient?.notes ??
            '',
        }),
      );

    const resultRows: any[] =
      [];

    for (
      const patient of
      patients ?? []
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
          const result of
          results
        ) {

          resultRows.push({
            'رقم السجل':
              patient?.seq ??
              '',

            'اسم المريض':
              patient?.name ??
              '',

            'العمر':
              patient?.age ??
              '',

            'الجنس':
              patient?.gender ??
              '',

            'التاريخ':
              patient?.date ??
              '',

            'القسم':
              section.label,

            'الفحص':
              result.label,

            'النتيجة':
              result.value,

            'القيمة الطبيعية':
              result.normal,

            'الملاحظات':
              patient?.notes ??
              '',
          });

        }
      }
    }

    const workbook =
      XLSX.utils.book_new();

    /* ---------------------------------------------
       Sheet 1: المرضى
    --------------------------------------------- */

    const patientsSheet =
      XLSX.utils.json_to_sheet(
        patientRows,
      );

    XLSX.utils.book_append_sheet(
      workbook,
      patientsSheet,
      'المرضى',
    );

    /* ---------------------------------------------
       Sheet 2: النتائج
    --------------------------------------------- */

    const resultsSheet =
      XLSX.utils.json_to_sheet(
        resultRows,
      );

    XLSX.utils.book_append_sheet(
      workbook,
      resultsSheet,
      'النتائج',
    );

    /* ---------------------------------------------
       Sheet 3: ملخص الأقسام
    --------------------------------------------- */

    const stats =
      getStats(
        patients,
      );

    const statsRows =
      Object.entries(
        stats.sections ?? {},
      ).map(
        (
          [
            sectionKey,
            data,
          ]: any,
        ) => {

          const section =
            TEST_SECTIONS[
              sectionKey
            ];

          return {
            'القسم':
              section?.label ??
              sectionKey,

            'عدد المرضى':
              data?.count ??
              0,

            'عدد النتائج':
              Object.values(
                data?.tests ??
                  {},
              ).reduce(
                (
                  total: number,
                  value: any,
                ) =>
                  total +
                  Number(
                    value || 0,
                  ),
                0,
              ),
          };
        },
      );

    const statsSheet =
      XLSX.utils.json_to_sheet(
        statsRows,
      );

    XLSX.utils.book_append_sheet(
      workbook,
      statsSheet,
      'الإحصائيات',
    );

    /* ---------------------------------------------
       عرض الأعمدة
    --------------------------------------------- */

    for (
      const sheet of [
        patientsSheet,
        resultsSheet,
        statsSheet,
      ]
    ) {
      const range =
        XLSX.utils.decode_range(
          sheet['!ref'] ||
            'A1:A1',
        );

      const widths: any[] =
        [];

      for (
        let c =
          range.s.c;
        c <= range.e.c;
        c++
      ) {
        let max = 12;

        for (
          let r =
            range.s.r;
          r <= range.e.r;
          r++
        ) {
          const cell =
            sheet[
              XLSX.utils.encode_cell(
                {
                  r,
                  c,
                },
              )
            ];

          if (
            cell?.v !=
            null
          ) {
            max =
              Math.max(
                max,
                String(
                  cell.v,
                ).length +
                  2,
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
          FileSystem.EncodingType
            .Base64,
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

export const getStats =
  (
    patients: any[],
  ) => {

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
        patient =>
          patient?.gender ===
            'ذكر' ||
          patient?.gender ===
            'male' ||
          patient?.gender ===
            'Male',
      ).length;

    const females =
      list.filter(
        patient =>
          patient?.gender ===
            'أنثى' ||
          patient?.gender ===
            'female' ||
          patient?.gender ===
            'Female',
      ).length;

    const sections:
      Record<
        string,
        {
          count: number;
          tests: Record<
            string,
            number
          >;
        }
      > = {};

    for (
      const patient of
      list
    ) {

      for (
        const sectionKey of
        SECTION_KEYS
      ) {

        const results =
          getSectionResults(
            patient,
            sectionKey,
          );

        /*
         * لا نضيف القسم إذا لم توجد
         * أي نتيجة فعلية.
         */

        if (
          results.length ===
          0
        ) {
          continue;
        }

        if (
          !sections[
            sectionKey
          ]
        ) {
          sections[
            sectionKey
          ] = {
            count: 0,
            tests: {},
          };
        }

        /*
         * count = عدد المرضى الذين
         * لديهم نتائج في هذا القسم.
         */

        sections[
          sectionKey
        ].count++;

        for (
          const result of
          results
        ) {

          const name =
            result.label;

          sections[
            sectionKey
          ].tests[name] =
            (
              sections[
                sectionKey
              ].tests[name] ??
              0
            ) + 1;

        }
      }
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
    stats: any,
    settings: any = {},
    options: any = {},
  ) => {

    const ps =
      getPrintSettings(
        settings,
        options,
      );

    let sectionRows =
      '';

    for (
      const sectionKey of
      Object.keys(
        stats?.sections ??
          {},
      )
    ) {

      const data =
        stats.sections[
          sectionKey
        ];

      const section =
        TEST_SECTIONS[
          sectionKey as SectionKey
        ];

      if (!section) {
        continue;
      }

      const testEntries =
        Object.entries(
          data?.tests ??
            {},
        );

      if (
        testEntries.length ===
        0
      ) {
        continue;
      }

      for (
        const [
          testName,
          count,
        ] of testEntries
      ) {

        sectionRows += `
          <tr>

            <td>
              ${esc(
                section.label,
              )}
            </td>

            <td>
              ${esc(
                testName,
              )}
            </td>

            <td>
              ${esc(
                count,
              )}
            </td>

          </tr>
        `;
      }
    }

    const logoHtml =
      ps.showLogo &&
      ps.logoUri
        ? `
          <div
            class="logo-wrap"
            style="
              text-align:${esc(
                ps.logoPosition,
              )};
            "
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

          .header {
            text-align: center;
            margin-bottom: 18px;
          }

          .logo {
            max-height: 30mm;
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

          .summary td {
            width: 25%;
          }

          .number {
            font-size: 18px;
            font-weight: 900;
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
            ps.labCenter
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
            ps.directorate
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

          <tr>

            <th>
              إجمالي المرضى
            </th>

            <th>
              سجلات اليوم
            </th>

            <th>
              ذكور
            </th>

            <th>
              إناث
            </th>

          </tr>

          <tr>

            <td class="number">
              ${esc(
                stats?.total ??
                  0,
              )}
            </td>

            <td class="number">
              ${esc(
                stats?.today ??
                  0,
              )}
            </td>

            <td class="number">
              ${esc(
                stats?.males ??
                  0,
              )}
            </td>

            <td class="number">
              ${esc(
                stats?.females ??
                  0,
              )}
            </td>

          </tr>

        </table>

        <table>

          <thead>

            <tr>

              <th>
                القسم
              </th>

              <th>
                الفحص
              </th>

              <th>
                العدد
              </th>

            </tr>

          </thead>

          <tbody>

            ${
              sectionRows ||
              `
                <tr>
                  <td colspan="3">
                    لا توجد بيانات فحوصات.
                  </td>
                </tr>
              `
            }

          </tbody>

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

      </body>

      </html>
    `;
  };

/* =========================================================
   Statistics PDF
========================================================= */

export const exportStatsPdf =
  async (
    stats: any,
    settings: any = {},
    options: any = {},
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
    stats: any,
    settings: any = {},
    options: any = {},
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
  };
