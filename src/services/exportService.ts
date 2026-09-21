import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as XLSX from 'xlsx';
import {TEST_SECTIONS, SECTION_KEYS} from '../utils/constants';
import {todayISO, displayDate} from '../utils/helpers';

const ensureShare=async(uri:string,mime?:string)=>{
  if(await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri,{mimeType:mime});
};

export type BackupPayload = {
  app:'lab-app';
  version:number;
  exportedAt:string;
  patients:any[];
  settings:any;
  auditLog:any[];
};

export async function exportBackup(data:any){
  const payload:BackupPayload={
    app:'lab-app',
    version:4,
    exportedAt:new Date().toISOString(),
    patients:data.patients||[],
    settings:data.settings||{},
    auditLog:data.auditLog||[]
  };
  const name=`lab_backup_${todayISO()}.json`;
  const uri=FileSystem.cacheDirectory+name;
  await FileSystem.writeAsStringAsync(uri,JSON.stringify(payload,null,2),{});
  await ensureShare(uri,'application/json');
  return uri;
}

export async function importBackup(){
  const picked=await DocumentPicker.getDocumentAsync({
    type:'application/json',
    copyToCacheDirectory:true,
    multiple:false
  });
  if(picked.canceled) return null;
  const asset=picked.assets?.[0];
  if(!asset?.uri) return null;

  const raw=await FileSystem.readAsStringAsync(asset.uri);
  const data=JSON.parse(raw);
  if(!data || data.app!=='lab-app' || !Array.isArray(data.patients)){
    throw new Error('ملف النسخة الاحتياطية غير صالح أو ليس ملف مختبر.');
  }
  return {
    patients:data.patients,
    settings:data.settings||{},
    auditLog:Array.isArray(data.auditLog)?data.auditLog:[],
    version:data.version||1,
    exportedAt:data.exportedAt||null
  };
}

export async function mergeOrRestoreBackup(mode:'restore'|'merge', data:any){
  if(mode==='restore'){
    await AsyncStorage.multiSet([
      ['lab_patients_db',JSON.stringify(data.patients||[])],
      ['lab_settings_db',JSON.stringify(data.settings||{})],
      ['lab_audit_log',JSON.stringify(data.auditLog||[])]
    ]);
  }else{
    const [p,s,a]=await Promise.all([
      AsyncStorage.getItem('lab_patients_db'),
      AsyncStorage.getItem('lab_settings_db'),
      AsyncStorage.getItem('lab_audit_log')
    ]);
    const currentPatients=p?JSON.parse(p):[];
    const currentSettings=s?JSON.parse(s):{};
    const currentAudit=a?JSON.parse(a):[];
    const map=new Map(currentPatients.map((x:any)=>[x.id,x]));
    (data.patients||[]).forEach((x:any)=>map.set(x.id,x));
    await AsyncStorage.multiSet([
      ['lab_patients_db',JSON.stringify([...map.values()])],
      ['lab_settings_db',JSON.stringify({...currentSettings,...(data.settings||{})})],
      ['lab_audit_log',JSON.stringify([...(data.auditLog||[]),...currentAudit].slice(0,500))]
    ]);
  }
}

const esc=(v:any)=>String(v??'')
  .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
  .replace(/"/g,'&quot;');

export async function exportPatientPdf(patient:any,settings:any,options:any={}){
  const center=esc(settings.center||'مختبري');
  const directorate=esc(settings.directorate||'');
  let rows='';
  SECTION_KEYS.forEach(k=>{
    if(!patient[`include${k}`]) return;
    const sec=TEST_SECTIONS[k], d=patient[sec.dataKey]||{};
    sec.fields.forEach(f=>{
      const v=d[f.key];
      if(String(v??'').trim()!==''){
        rows+=`<tr><td>${esc(sec.label)}</td><td>${esc(f.label)}</td><td>${esc(v)}</td><td>${esc(f.normal)}</td></tr>`;
      }
    });
  });

  const orientation=options.orientation||settings.printSettings?.orientation||'portrait';
  const paper=options.paper||settings.printSettings?.paper||'A4';
  const showNormal=options.showNormal!==false;
  const logo=options.logoUri||settings.logo||'';

  const html=`<!doctype html><html><head><meta charset="utf-8"><style>
  @page{size:${paper} ${orientation};margin:12mm}
  *{box-sizing:border-box}
  body{font-family:Arial,sans-serif;direction:rtl;color:#202824;font-size:12px;margin:0}
  .header{border-bottom:2px solid #1d3b36;padding-bottom:9px;margin-bottom:12px}
  .logo{max-height:70px;max-width:120px;float:right;margin-left:12px}
  h1{font-size:20px;margin:0 0 3px;text-align:center}.dir{text-align:center;color:#666}
  .report-title{text-align:center;font-size:17px;font-weight:bold;margin-top:8px}
  .info{display:grid;grid-template-columns:1fr 1fr;border:1px solid #999;margin:10px 0}
  .info div{padding:7px;border-left:1px solid #ccc;border-bottom:1px solid #ccc}
  table{width:100%;border-collapse:collapse;page-break-inside:auto}
  thead{display:table-header-group} tr{page-break-inside:avoid;page-break-after:auto}
  th,td{border:1px solid #999;padding:6px;text-align:center}
  th{background:#1d3b36;color:#fff}.normal{color:#555}
  .notes{border:1px solid #999;padding:8px;margin-top:12px;min-height:35px}
  .sign{display:grid;grid-template-columns:1fr 1fr;gap:30px;margin-top:35px;text-align:center}
  .footer{text-align:center;color:#777;margin-top:22px;font-size:10px}
  </style></head><body>
  <div class="header">${logo?`<img class="logo" src="${esc(logo)}"/>`:''}<h1>${center}</h1><div class="dir">${directorate}</div><div class="report-title">تقرير الفحوصات المخبرية</div></div>
  <div class="info">
    <div><b>اسم المريض:</b> ${esc(patient.name)}</div><div><b>رقم السجل:</b> ${esc(patient.seq)}</div>
    <div><b>العمر:</b> ${esc(patient.age)}</div><div><b>الجنس:</b> ${esc(patient.gender)}</div>
    <div><b>التاريخ:</b> ${esc(displayDate(patient.date))}</div><div><b>عدد النتائج:</b> ${rows?rows.split('<tr>').length-1:0}</div>
  </div>
  <table><thead><tr><th>القسم</th><th>الفحص</th><th>النتيجة</th>${showNormal?'<th>القيمة الطبيعية</th>':''}</tr></thead><tbody>
  ${rows.replaceAll(/<td>(.*?)<\/td><td>(.*?)<\/td><td>(.*?)<\/td><td>(.*?)<\/td>/g,
    showNormal?'<td>$1</td><td>$2</td><td><b>$3</b></td><td class="normal">$4</td>':'<td>$1</td><td>$2</td><td><b>$3</b></td>')}
  </tbody></table>
  ${patient.notes?`<div class="notes"><b>ملاحظات:</b> ${esc(patient.notes)}</div>`:''}
  <div class="sign"><div>توقيع المختبر<br/><br/>________________</div><div>توقيع الطبيب<br/><br/>________________</div></div>
  <div class="footer">تم إنشاء التقرير إلكترونياً — ${new Date().toLocaleString('ar-IQ')}</div>
  </body></html>`;

  const {uri}=await Print.printToFileAsync({html,base64:false});
  await ensureShare(uri,'application/pdf');
  return uri;
}

export async function printPatient(patient:any,settings:any,options:any={}){
  const center=esc(settings.center||'مختبري');
  let body='';
  SECTION_KEYS.forEach(k=>{
    if(!patient[`include${k}`]) return;
    const sec=TEST_SECTIONS[k], d=patient[sec.dataKey]||{};
    body+=`<h3>${esc(sec.icon+' '+sec.label)}</h3><table><tr><th>الفحص</th><th>النتيجة</th><th>الطبيعي</th></tr>`;
    sec.fields.forEach(f=>{
      const v=d[f.key];
      if(String(v??'').trim()) body+=`<tr><td>${esc(f.label)}</td><td>${esc(v)}</td><td>${esc(f.normal)}</td></tr>`;
    });
    body+='</table>';
  });
  const html=`<html><head><meta charset="utf-8"><style>
  @page{size:${options.paper||'A4'} ${options.orientation||'portrait'};margin:12mm}
  body{font-family:Arial;direction:rtl}h1{text-align:center;color:#1d3b36}
  .meta{border:1px solid #999;padding:9px;margin:10px 0}table{width:100%;border-collapse:collapse}
  th,td{border:1px solid #999;padding:6px;text-align:center}th{background:#1d3b36;color:#fff}
  </style></head><body><h1>${center}</h1><h2 style="text-align:center">تقرير الفحوصات</h2>
  <div class="meta">المريض: <b>${esc(patient.name)}</b> — السجل: ${esc(patient.seq)} — التاريخ: ${esc(displayDate(patient.date))}</div>${body}</body></html>`;
  return Print.printAsync({html});
}

export async function exportPatientsExcel(patients:any[]){
  const rows:any[]=[['رقم السجل','اسم المريض','العمر','الجنس','التاريخ','الملاحظات','القسم','الفحص','النتيجة','القيمة الطبيعية']];
  patients.forEach(p=>{
    SECTION_KEYS.forEach(k=>{
      if(!p[`include${k}`]) return;
      const sec=TEST_SECTIONS[k], d=p[sec.dataKey]||{};
      sec.fields.forEach(f=>{
        if(String(d[f.key]??'').trim()!=='') rows.push([p.seq,p.name,p.age,p.gender,p.date,p.notes,sec.label,f.label,d[f.key],f.normal]);
      });
    });
  });
  const ws=XLSX.utils.aoa_to_sheet(rows);
  ws['!cols']=[{wch:12},{wch:28},{wch:8},{wch:10},{wch:14},{wch:30},{wch:18},{wch:25},{wch:25},{wch:25}];
  const wb=XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb,ws,'المرضى والفحوصات');
  const b=XLSX.write(wb,{type:'base64',bookType:'xlsx'});
  const uri=FileSystem.cacheDirectory+`سجلات_المختبر_${todayISO()}.xlsx`;
  await FileSystem.writeAsStringAsync(uri,b,{encoding:FileSystem.EncodingType.Base64});
  await ensureShare(uri,'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  return uri;
}

export function getStats(patients:any[]){
  const today=todayISO();
  const total=patients.length,todayCount=patients.filter(p=>p.date===today).length;
  const males=patients.filter(p=>p.gender==='ذكر').length,females=patients.filter(p=>p.gender==='أنثى').length;
  const sections=SECTION_KEYS.map(k=>{
    const sec=TEST_SECTIONS[k];
    const tests=sec.fields.map(f=>({name:f.label,count:patients.filter(p=>p[`include${k}`]&&String((p[sec.dataKey]||{})[f.key]??'').trim()!=='').length}));
    return {key:k,name:sec.label,count:tests.reduce((a,b)=>a+b.count,0),tests};
  });
  return {total,today:todayCount,males,females,sections};
}
