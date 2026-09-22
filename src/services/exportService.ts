import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as XLSX from 'xlsx';

import {TEST_SECTIONS, SECTION_KEYS} from '../utils/constants';
import {todayISO, displayDate} from '../utils/helpers';

/* =========================================================
   Helpers
========================================================= */

const ensureShare = async (uri: string, mime?: string) => {
  try {
    const available = await Sharing.isAvailableAsync();

    if (available) {
      await Sharing.shareAsync(uri, {
        mimeType: mime,
      });
    }
  } catch (error) {
    console.log('Sharing error:', error);
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

const getPrintSettings = (
  settings: any = {},
  options: any = {},
) => {
  const saved = settings?.printSettings || {};

  return {
    paper:
      options.paper ??
      saved.paper ??
      'A4',

    orientation:
      options.orientation ??
      saved.orientation ??
      'portrait',

    showNormal:
      options.showNormal ??
      (saved.showNormal !== false),

    logoUri:
      options.logoUri ??
      settings?.logo ??
      '',

    labCenter:
      options.labCenter ??
      settings?.labCenter ??
      settings?.centerName ??
      '',

    directorate:
      options.directorate ??
      settings?.directorate ??
      settings?.healthDirectorate ??
      '',
  };
};

const getPageCss = (
  paper: string,
  orientation: string,
) => {
  const safePaper =
    paper === 'Letter'
      ? 'Letter'
      : 'A4';

  const safeOrientation =
    orientation === 'landscape'
      ? 'landscape'
      : 'portrait';

  return `
    @page {
      size: ${safePaper} ${safeOrientation};
      margin: 12mm;
    }

    * {
      box-sizing: border-box;
    }

    html,
    body {
      margin: 0;
      padding: 0;
      direction: rtl;
      font-family: Arial, Tahoma, sans-serif;
      color: #111;
      background: #fff;
    }

    body {
      font-size: 12px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
    }

    th,
    td {
      border: 1px solid #777;
      padding: 7px 6px;
      text-align: center;
      vertical-align: middle;
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
  `;
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

export const exportBackup = async (
  data: BackupPayload,
) => {
  const fileName = `lab_backup_${todayISO()}.json`;

  const uri =
    `${FileSystem.cacheDirectory}${fileName}`;

  await FileSystem.writeAsStringAsync(
    uri,
    JSON.stringify(data, null, 2),
    {
      encoding: FileSystem.EncodingType.UTF8,
    },
  );

  await ensureShare(
    uri,
    'application/json',
  );

  return uri;
};

export const importBackup = async () => {
  const result =
    await DocumentPicker.getDocumentAsync({
      type: 'application/json',
      copyToCacheDirectory: true,
      multiple: false,
    });

  if (result.canceled) {
    return null;
  }

  const asset = result.assets?.[0];

  if (!asset?.uri) {
    throw new Error(
      'لم يتم اختيار ملف النسخة الاحتياطية.',
    );
  }

  const content =
    await FileSystem.readAsStringAsync(
      asset.uri,
      {
        encoding: FileSystem.EncodingType.UTF8,
      },
    );

  let parsed: any;

  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error(
      'ملف النسخة الاحتياطية غير صالح.',
    );
  }

  if (
    parsed?.app !== 'lab-app' ||
    !Array.isArray(parsed?.patients)
  ) {
    throw new Error(
      'هذا الملف ليس نسخة احتياطية صحيحة للمختبر.',
    );
  }

  return {
    patients: parsed.patients,
    settings: parsed.settings ?? {},
    auditLog: Array.isArray(parsed.auditLog)
      ? parsed.auditLog
      : [],
    version: parsed.version ?? 1,
    exportedAt: parsed.exportedAt ?? '',
  };
};

/* =========================================================
   Restore / Merge
========================================================= */

export const mergeOrRestoreBackup = async (
  mode: 'restore' | 'merge',
  data: {
    patients: any[];
    settings?: any;
    auditLog?: any[];
  },
) => {
  const PATIENTS_KEY = 'lab_patients_db';
  const SETTINGS_KEY = 'lab_settings_db';
  const AUDIT_KEY = 'lab_audit_log';

  if (mode === 'restore') {
    await AsyncStorage.setItem(
      PATIENTS_KEY,
      JSON.stringify(data.patients ?? []),
    );

    await AsyncStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify(data.settings ?? {}),
    );

    await AsyncStorage.setItem(
      AUDIT_KEY,
      JSON.stringify(data.auditLog ?? []),
    );

    return {
      patients: data.patients ?? [],
      settings: data.settings ?? {},
      auditLog: data.auditLog ?? [],
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

  const currentPatients =
    currentPatientsRaw
      ? JSON.parse(currentPatientsRaw)
      : [];

  const currentSettings =
    currentSettingsRaw
      ? JSON.parse(currentSettingsRaw)
      : {};

  const currentAudit =
    currentAuditRaw
      ? JSON.parse(currentAuditRaw)
      : [];

  const patientsMap = new Map();

  [
    ...currentPatients,
    ...(data.patients ?? []),
  ].forEach((patient: any) => {
    const id =
      patient?.id ??
      `${patient?.seq ?? ''}-${patient?.date ?? ''}-${patient?.name ?? ''}`;

    patientsMap.set(id, patient);
  });

  const mergedPatients =
    Array.from(patientsMap.values());

  const mergedSettings = {
    ...currentSettings,
    ...(data.settings ?? {}),
  };

  const mergedAudit = [
    ...currentAudit,
    ...(data.auditLog ?? []),
  ];

  await AsyncStorage.setItem(
    PATIENTS_KEY,
    JSON.stringify(mergedPatients),
  );

  await AsyncStorage.setItem(
    SETTINGS_KEY,
    JSON.stringify(mergedSettings),
  );

  await AsyncStorage.setItem(
    AUDIT_KEY,
    JSON.stringify(mergedAudit),
  );

  return {
    patients: mergedPatients,
    settings: mergedSettings,
    auditLog: mergedAudit,
  };
};

/* =========================================================
   Patient Report HTML
========================================================= */

const buildPatientReportHtml = (
  patient: any,
  settings: any = {},
  options: any = {},
) => {
  const printSettings =
    getPrintSettings(settings, options);

  const {
    paper,
    orientation,
    showNormal,
    logoUri,
    labCenter,
    directorate,
  } = printSettings;

  const sections: any[] = [];

  for (const sectionKey of SECTION_KEYS) {
    const section =
      TEST_SECTIONS[sectionKey];

    if (!section) continue;

    const tests =
      patient?.results?.[sectionKey] ??
      patient?.sections?.[sectionKey] ??
      patient?.tests?.[sectionKey];

    if (!tests) continue;

    let sectionRows = '';

    const testList = Array.isArray(tests)
      ? tests
      : Object.entries(tests).map(
          ([testKey, value]) => ({
            testKey,
            value,
          }),
        );

    for (const item of testList) {
      let testName = '';
      let resultValue = '';
      let normalValue = '';

      if (
        typeof item === 'object' &&
        item !== null &&
        'testKey' in item
      ) {
        testName =
          section?.tests?.[item.testKey]?.name ??
          item.testKey;

        if (
          typeof item.value === 'object' &&
          item.value !== null
        ) {
          resultValue =
            item.value.result ??
            item.value.value ??
            '';

          normalValue =
            item.value.normal ??
            item.value.reference ??
            '';
        } else {
          resultValue =
            item.value ?? '';
        }
      } else {
        testName =
          item?.name ??
          item?.test ??
          '';

        resultValue =
          item?.result ??
          item?.value ??
          '';

        normalValue =
          item?.normal ??
          item?.reference ??
          '';
      }

      if (
        !testName &&
        !resultValue &&
        !normalValue
      ) {
        continue;
      }

      sectionRows += `
        <tr>
          <td>${esc(testName)}</td>
          <td>${esc(resultValue)}</td>
          ${
            showNormal
              ? `<td>${esc(normalValue)}</td>`
              : ''
          }
        </tr>
      `;
    }

    if (!sectionRows) continue;

    sections.push(`
      <div class="section">
        <div class="section-title">
          ${esc(section?.title ?? section?.name ?? sectionKey)}
        </div>

        <table>
          <thead>
            <tr>
              <th>الفحص</th>
              <th>النتيجة</th>
              ${
                showNormal
                  ? '<th>القيمة الطبيعية</th>'
                  : ''
              }
            </tr>
          </thead>

          <tbody>
            ${sectionRows}
          </tbody>
        </table>
      </div>
    `);
  }

  const notes =
    patient?.notes ??
    patient?.note ??
    '';

  const logoHtml = logoUri
    ? `
      <div class="logo-wrap">
        <img
          src="${esc(logoUri)}"
          class="logo"
        />
      </div>
    `
    : '';

  return `
    <!DOCTYPE html>

    <html lang="ar" dir="rtl">

    <head>
      <meta charset="UTF-8" />

      <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
      />

      <style>

        ${getPageCss(
          paper,
          orientation,
        )}

        .container {
          width: 100%;
        }

        .header {
          text-align: center;
          margin-bottom: 14px;
        }

        .logo-wrap {
          text-align: center;
          margin-bottom: 5px;
        }

        .logo {
          max-width: 90px;
          max-height: 90px;
          object-fit: contain;
        }

        .center-name {
          font-size: 20px;
          font-weight: bold;
          margin-bottom: 5px;
        }

        .directorate {
          font-size: 14px;
          margin-bottom: 3px;
        }

        .report-title {
          font-size: 18px;
          font-weight: bold;
          margin-top: 10px;
          padding: 8px;
          border-top: 2px solid #222;
          border-bottom: 2px solid #222;
        }

        .patient-info {
          margin-top: 12px;
          margin-bottom: 15px;
        }

        .patient-info td {
          width: 25%;
        }

        .label {
          font-weight: bold;
          background: #f3f3f3;
        }

        .section {
          margin-top: 15px;
          page-break-inside: avoid;
        }

        .section-title {
          font-size: 15px;
          font-weight: bold;
          background: #e8e8e8;
          border: 1px solid #777;
          padding: 8px;
          text-align: center;
        }

        .notes {
          margin-top: 18px;
          border: 1px solid #777;
          padding: 10px;
          min-height: 55px;
        }

        .notes-title {
          font-weight: bold;
          margin-bottom: 5px;
        }

        .signatures {
          margin-top: 35px;
        }

        .signatures td {
          width: 50%;
          height: 60px;
          vertical-align: bottom;
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

      <div class="container">

        <div class="header">

          ${logoHtml}

          ${
            labCenter
              ? `<div class="center-name">
                  ${esc(labCenter)}
                 </div>`
              : ''
          }

          ${
            directorate
              ? `<div class="directorate">
                  ${esc(directorate)}
                 </div>`
              : ''
          }

          <div class="report-title">
            تقرير نتائج الفحوصات المختبرية
          </div>

        </div>

        <table class="patient-info">

          <tr>
            <td class="label">التسلسل</td>
            <td>${esc(patient?.seq ?? patient?.dailySeq ?? '')}</td>

            <td class="label">التاريخ</td>
            <td>${esc(
              patient?.date
                ? displayDate(patient.date)
                : '',
            )}</td>
          </tr>

          <tr>
            <td class="label">اسم المريض</td>
            <td colspan="3">
              ${esc(patient?.name ?? '')}
            </td>
          </tr>

          <tr>
            <td class="label">العمر</td>
            <td>
              ${esc(patient?.age ?? '')}
            </td>

            <td class="label">الجنس</td>
            <td>
              ${esc(patient?.gender ?? '')}
            </td>
          </tr>

        </table>

        ${sections.join('')}

        ${
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

        <table class="signatures no-border">

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

        <div class="footer">
          تم إصدار التقرير بتاريخ
          ${esc(todayISO())}
        </div>

      </div>

    </body>
    </html>
  `;
};

/* =========================================================
   Patient PDF
========================================================= */

export const exportPatientPdf = async (
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

export const printPatient = async (
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

export const exportPatientsExcel = async (
  patients: any[],
) => {
  const rows: any[] = [];

  for (const patient of patients ?? []) {
    for (const sectionKey of SECTION_KEYS) {
      const section =
        TEST_SECTIONS[sectionKey];

      if (!section) continue;

      const tests =
        patient?.results?.[sectionKey] ??
        patient?.sections?.[sectionKey] ??
        patient?.tests?.[sectionKey];

      if (!tests) continue;

      const testList = Array.isArray(tests)
        ? tests
        : Object.entries(tests).map(
            ([testKey, value]) => ({
              testKey,
              value,
            }),
          );

      for (const item of testList) {
        let testName = '';
        let resultValue = '';
        let normalValue = '';

        if (
          typeof item === 'object' &&
          item !== null &&
          'testKey' in item
        ) {
          testName =
            section?.tests?.[item.testKey]?.name ??
            item.testKey;

          if (
            typeof item.value === 'object' &&
            item.value !== null
          ) {
            resultValue =
              item.value.result ??
              item.value.value ??
              '';

            normalValue =
              item.value.normal ??
              item.value.reference ??
              '';
          } else {
            resultValue =
              item.value ?? '';
          }
        } else {
          testName =
            item?.name ??
            item?.test ??
            '';

          resultValue =
            item?.result ??
            item?.value ??
            '';

          normalValue =
            item?.normal ??
            item?.reference ??
            '';
        }

        rows.push({
          'رقم السجل':
            patient?.seq ??
            patient?.dailySeq ??
            '',

          'اسم المريض':
            patient?.name ?? '',

          'العمر':
            patient?.age ?? '',

          'الجنس':
            patient?.gender ?? '',

          'التاريخ':
            patient?.date ?? '',

          'القسم':
            section?.title ??
            section?.name ??
            sectionKey,

          'الفحص':
            testName,

          'النتيجة':
            resultValue,

          'القيمة الطبيعية':
            normalValue,

          'الملاحظات':
            patient?.notes ??
            patient?.note ??
            '',
        });
      }
    }
  }

  const worksheet =
    XLSX.utils.json_to_sheet(rows);

  const workbook =
    XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    'المرضى والفحوصات',
  );

  const excelBase64 =
    XLSX.write(workbook, {
      type: 'base64',
      bookType: 'xlsx',
    });

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
) => {
  const list = patients ?? [];

  const today = todayISO();

  const total = list.length;

  const todayCount =
    list.filter(
      patient =>
        patient?.date === today,
    ).length;

  const males =
    list.filter(
      patient =>
        patient?.gender === 'ذكر' ||
        patient?.gender === 'male' ||
        patient?.gender === 'Male',
    ).length;

  const females =
    list.filter(
      patient =>
        patient?.gender === 'أنثى' ||
        patient?.gender === 'female' ||
        patient?.gender === 'Female',
    ).length;

  const sections: Record<
    string,
    {
      count: number;
      tests: Record<string, number>;
    }
  > = {};

  for (const patient of list) {
    for (const sectionKey of SECTION_KEYS) {
      const section =
        TEST_SECTIONS[sectionKey];

      if (!section) continue;

      const tests =
        patient?.results?.[sectionKey] ??
        patient?.sections?.[sectionKey] ??
        patient?.tests?.[sectionKey];

      if (!tests) continue;

      if (!sections[sectionKey]) {
        sections[sectionKey] = {
          count: 0,
          tests: {},
        };
      }

      sections[sectionKey].count++;

      const testList = Array.isArray(tests)
        ? tests
        : Object.entries(tests).map(
            ([testKey, value]) => ({
              testKey,
              value,
            }),
          );

      for (const item of testList) {
        let testName = '';

        if (
          typeof item === 'object' &&
          item !== null &&
          'testKey' in item
        ) {
          testName =
            section?.tests?.[item.testKey]?.name ??
            item.testKey;
        } else {
          testName =
            item?.name ??
            item?.test ??
            '';
        }

        if (!testName) continue;

        sections[sectionKey].tests[testName] =
          (sections[sectionKey].tests[testName] ?? 0) + 1;
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
   Statistics PDF
========================================================= */

export const exportStatsPdf = async (
  stats: any,
  settings: any = {},
  options: any = {},
) => {
  const printSettings =
    getPrintSettings(settings, options);

  const {
    paper,
    orientation,
    logoUri,
    labCenter,
    directorate,
  } = printSettings;

  const sectionRows =
    Object.entries(
      stats?.sections ?? {},
    )
      .map(
        ([sectionKey, sectionData]: any) => {
          const section =
            TEST_SECTIONS[sectionKey];

          const testRows =
            Object.entries(
              sectionData?.tests ?? {},
            )
              .map(
                ([testName, count]) => `
                  <tr>
                    <td>
                      ${esc(
                        section?.title ??
                        section?.name ??
                        sectionKey,
                      )}
                    </td>

                    <td>
                      ${esc(testName)}
                    </td>

                    <td>
                      ${esc(count)}
                    </td>
                  </tr>
                `,
              )
              .join('');

          return testRows;
        },
      )
      .join('');

  const logoHtml = logoUri
    ? `
      <div class="logo-wrap">
        <img
          src="${esc(logoUri)}"
          class="logo"
        />
      </div>
    `
    : '';

  const html = `
    <!DOCTYPE html>

    <html lang="ar" dir="rtl">

    <head>

      <meta charset="UTF-8" />

      <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
      />

      <style>

        ${getPageCss(
          paper,
          orientation,
        )}

        .header {
          text-align: center;
          margin-bottom: 20px;
        }

        .logo-wrap {
          text-align: center;
        }

        .logo {
          max-width: 80px;
          max-height: 80px;
        }

        .center {
          font-size: 20px;
          font-weight: bold;
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
          font-weight: bold;
        }

        .summary {
          margin-bottom: 20px;
        }

        .summary td {
          width: 25%;
        }

        .summary .number {
          font-size: 18px;
          font-weight: bold;
        }

        .section-title {
          margin-top: 18px;
          margin-bottom: 5px;
          font-size: 15px;
          font-weight: bold;
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
          labCenter
            ? `<div class="center">
                ${esc(labCenter)}
               </div>`
            : ''
        }

        ${
          directorate
            ? `<div class="directorate">
                ${esc(directorate)}
               </div>`
            : ''
        }

        <div class="title">
          إحصائيات المختبر
        </div>

      </div>

      <table class="summary">

        <tr>

          <th>إجمالي المرضى</th>
          <th>مرضى اليوم</th>
          <th>الذكور</th>
          <th>الإناث</th>

        </tr>

        <tr>

          <td class="number">
            ${esc(stats?.total ?? 0)}
          </td>

          <td class="number">
            ${esc(stats?.today ?? 0)}
          </td>

          <td class="number">
            ${esc(stats?.males ?? 0)}
          </td>

          <td class="number">
            ${esc(stats?.females ?? 0)}
          </td>

        </tr>

      </table>

      <table>

        <thead>

          <tr>

            <th>القسم</th>
            <th>الفحص</th>
            <th>عدد الفحوصات</th>

          </tr>

        </thead>

        <tbody>

          ${sectionRows || `
            <tr>
              <td colspan="3">
                لا توجد بيانات
              </td>
            </tr>
          `}

        </tbody>

      </table>

      <div class="footer">
        تاريخ التقرير:
        ${esc(todayISO())}
      </div>

    </body>

    </html>
  `;

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

export const printStats = async (
  stats: any,
  settings: any = {},
  options: any = {},
) => {
  const printSettings =
    getPrintSettings(settings, options);

  const {
    paper,
    orientation,
  } = printSettings;

  const sectionRows =
    Object.entries(
      stats?.sections ?? {},
    )
      .map(
        ([sectionKey, sectionData]: any) => {
          const section =
            TEST_SECTIONS[sectionKey];

          return Object.entries(
            sectionData?.tests ?? {},
          )
            .map(
              ([testName, count]) => `
                <tr>
                  <td>
                    ${esc(
                      section?.title ??
                      section?.name ??
                      sectionKey,
                    )}
                  </td>

                  <td>
                    ${esc(testName)}
                  </td>

                  <td>
                    ${esc(count)}
                  </td>
                </tr>
              `,
            )
            .join('');
        },
      )
      .join('');

  const html = `
    <!DOCTYPE html>

    <html lang="ar" dir="rtl">

    <head>

      <meta charset="UTF-8" />

      <style>

        ${getPageCss(
          paper,
          orientation,
        )}

        h1 {
          text-align: center;
          margin-bottom: 20px;
        }

        .summary {
          margin-bottom: 20px;
        }

      </style>

    </head>

    <body>

      <h1>
        إحصائيات المختبر
      </h1>

      <table class="summary">

        <tr>
          <th>إجمالي المرضى</th>
          <th>اليوم</th>
          <th>الذكور</th>
          <th>الإناث</th>
        </tr>

        <tr>
          <td>${esc(stats?.total ?? 0)}</td>
          <td>${esc(stats?.today ?? 0)}</td>
          <td>${esc(stats?.males ?? 0)}</td>
          <td>${esc(stats?.females ?? 0)}</td>
        </tr>

      </table>

      <table>

        <thead>

          <tr>
            <th>القسم</th>
            <th>الفحص</th>
            <th>العدد</th>
          </tr>

        </thead>

        <tbody>
          ${sectionRows}
        </tbody>

      </table>

    </body>

    </html>
  `;

  await Print.printAsync({
    html,
  });
};
