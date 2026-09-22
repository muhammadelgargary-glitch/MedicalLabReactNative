import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Patient, LabSettings } from '../store/useLabStore';

export const generatePatientReportHtml = (patient: Patient, settings: LabSettings): string => {
  const testsRows = (patient.tests || [])
    .map((test, index) => {
      const isAbnormal = test.isAbnormal;
      return `
        <tr style="background-color: ${index % 2 === 1 ? '#f8fafc' : '#ffffff'};">
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold; text-align: right;">${test.name}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right; color: ${isAbnormal ? '#ef4444' : '#0f172a'}; font-weight: bold;">
            ${test.result} ${isAbnormal ? '⚠️' : ''}
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right;">${test.unit || '-'}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right;">${test.normalRange || '-'}</td>
        </tr>
      `;
    })
    .join('');

  return `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="utf-8" />
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; color: #0f172a; background: #fff; }
        .report-box { border: 1px solid #cbd5e1; padding: 24px; border-radius: 6px; }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #0284c7; padding-bottom: 12px; margin-bottom: 16px; }
        .lab-title { text-align: right; }
        .lab-title h1 { margin: 0; font-size: 22px; color: #0f172a; }
        .lab-title h3 { margin: 2px 0; font-size: 14px; color: #0284c7; }
        .info-grid { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; margin-bottom: 20px; display: flex; flex-wrap: wrap; }
        .info-item { width: 50%; margin-bottom: 6px; font-size: 13px; }
        .info-item strong { color: #334155; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th { background-color: #0f172a; color: #ffffff; padding: 10px; font-size: 12px; text-align: right; }
        .footer { margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 12px; display: flex; justify-content: space-between; font-size: 11px; color: #64748b; }
      </style>
    </head>
    <body>
      <div class="report-box">
        <div class="header">
          <div class="lab-title">
            <h1>${settings.labName || 'مختبر التحليلات الطبية'}</h1>
            <h3>${settings.labNameEn || 'Medical Laboratory'}</h3>
          </div>
          ${settings.logoUri ? `<img src="${settings.logoUri}" style="height: 60px;" />` : ''}
        </div>

        <div class="info-grid">
          <div class="info-item"><strong>اسم المريض:</strong> ${patient.name}</div>
          <div class="info-item"><strong>العمر/الجنس:</strong> ${patient.age} سنة / ${patient.gender === 'male' ? 'ذكر' : 'أنثى'}</div>
          <div class="info-item"><strong>تاريخ الفحص:</strong> ${patient.createdAt ? new Date(patient.createdAt).toLocaleDateString('ar-IQ') : '-'}</div>
          <div class="info-item"><strong>الطبيب المعالج:</strong> ${patient.doctorName || '-'}</div>
        </div>

        <table>
          <thead>
            <tr>
              <th>اسم الفحص</th>
              <th>النتيجة</th>
              <th>الوحدة</th>
              <th>المعدل الطبيعي</th>
            </tr>
          </thead>
          <tbody>
            ${testsRows || '<tr><td colspan="4" style="text-align:center; padding:20px;">لا توجد نتائج</td></tr>'}
          </tbody>
        </table>

        ${patient.notes ? `<div style="background:#fffbeb; padding:10px; border-radius:4px; margin-bottom:20px; font-size:12px;"><strong>ملاحظات:</strong> ${patient.notes}</div>` : ''}

        <div class="footer">
          <div>توقيع وتصديق المختبر<br/>Approved By Laboratory Director</div>
          <div>${settings.address || ''} | هاتف: ${settings.phone || ''}</div>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const printReport = async (patient: Patient, settings: LabSettings) => {
  const html = generatePatientReportHtml(patient, settings);
  await Print.printAsync({ html });
};

export const exportToPdfAndShare = async (patient: Patient, settings: LabSettings) => {
  const html = generatePatientReportHtml(patient, settings);
  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri);
  }
};
 
