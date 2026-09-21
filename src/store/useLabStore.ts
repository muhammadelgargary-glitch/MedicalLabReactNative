import {create} from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {TEST_SECTIONS, SECTION_KEYS, emptySectionData, SectionKey} from '../utils/constants';
import {todayISO, uid} from '../utils/helpers';

const PATIENTS_KEY='lab_patients_db';
const SETTINGS_KEY='lab_settings_db';
const AUDIT_KEY='lab_audit_log';

export type Patient = {
  id:string; name:string; seq:string; age:string; gender:string; date:string; notes:string;
  [key:string]: any;
};

const defaultSettings:any = {
  center:'مركز الرعاية الصحية الأولية',
  directorate:'دائرة الصحة / قطاع الرعاية',
  darkMode:false,
  theme:'default',
  fontSizePx:14,
  criticalAlertsEnabled:false,
  customRanges:{},
  logo:null,
  printSettings:{paper:'A4',orientation:'portrait'}
};

type Audit = {id:string; action:string; category:string; details:string; at:string; patientId?:string; patientName?:string};

type State = {
  patients:Patient[];
  settings:any;
  auditLog:Audit[];
  hydrated:boolean;
  hydrate:()=>Promise<void>;
  saveAll:()=>Promise<void>;
  addAudit:(action:string,category:string,details:string,extra?:any)=>void;
  upsertPatient:(p:Partial<Patient>)=>Promise<string>;
  deletePatient:(id:string)=>Promise<void>;
  setSetting:(key:string,value:any)=>Promise<void>;
  setPatients:(p:Patient[])=>Promise<void>;
  importBackupData:(mode:'restore'|'merge',data:any)=>Promise<void>;
};

export const useLabStore=create<State>((set,get)=>({
  patients:[],
  settings:defaultSettings,
  auditLog:[],
  hydrated:false,

  hydrate:async()=>{
    try{
      const [p,s,a]=await Promise.all([
        AsyncStorage.getItem(PATIENTS_KEY),
        AsyncStorage.getItem(SETTINGS_KEY),
        AsyncStorage.getItem(AUDIT_KEY)
      ]);
      set({
        patients:p?JSON.parse(p):[],
        settings:{...defaultSettings,...(s?JSON.parse(s):{})},
        auditLog:a?JSON.parse(a):[],
        hydrated:true
      });
    }catch(e){ set({hydrated:true}); }
  },

  saveAll:async()=>{
    const {patients,settings,auditLog}=get();
    await Promise.all([
      AsyncStorage.setItem(PATIENTS_KEY,JSON.stringify(patients)),
      AsyncStorage.setItem(SETTINGS_KEY,JSON.stringify(settings)),
      AsyncStorage.setItem(AUDIT_KEY,JSON.stringify(auditLog.slice(0,500)))
    ]);
  },

  addAudit:(action,category,details,extra={})=>{
    const item:any={id:uid('a'),action,category,details,at:new Date().toISOString(),...extra};
    const auditLog=[item,...get().auditLog].slice(0,500);
    set({auditLog});
    AsyncStorage.setItem(AUDIT_KEY,JSON.stringify(auditLog)).catch(()=>{});
  },

  upsertPatient:async(input)=>{
    const old = input.id ? get().patients.find(x=>x.id===input.id) : undefined;
    const id=input.id || uid('p');
    let seq=String(input.seq||'').trim();
    if(!seq){
      const today=todayISO();
      const nums=get().patients.filter(p=>p.date===today).map(p=>parseInt(p.seq,10)).filter(n=>Number.isFinite(n));
      seq=String((nums.length?Math.max(...nums):0)+1);
    }
    const base:any={...emptySectionData(),id,name:'',seq,age:'',gender:'ذكر',date:todayISO(),notes:'',...(old||{}),...input,id,seq};
    const patients=old?get().patients.map(p=>p.id===id?base:p):[base,...get().patients];
    set({patients});
    get().addAudit(old?'تعديل مريض':'إضافة مريض','patient',old?`تم تعديل بيانات ${base.name}`:`تمت إضافة المريض ${base.name}`,{patientId:id,patientName:base.name});
    await get().saveAll();
    return id;
  },

  deletePatient:async(id)=>{
    const p=get().patients.find(x=>x.id===id);
    set({patients:get().patients.filter(x=>x.id!==id)});
    get().addAudit('حذف مريض','patient',`تم حذف المريض ${p?.name||''}`,{patientId:id,patientName:p?.name||''});
    await get().saveAll();
  },

  setSetting:async(key,value)=>{
    const settings={...get().settings,[key]:value};
    set({settings});
    get().addAudit('تعديل إعدادات','settings',`تم تغيير الإعداد: ${key}`);
    await get().saveAll();
  },

  setPatients:async(patients)=>{
    set({patients});
    await get().saveAll();
  },

  importBackupData:async(mode,data)=>{
    const current=get();
    if(mode==='restore') {
      const settings={...defaultSettings,...(data.settings||{})};
      const auditLog=Array.isArray(data.auditLog)?data.auditLog.slice(0,500):[];
      set({patients:Array.isArray(data.patients)?data.patients:[],settings,auditLog});
    } else {
      const map=new Map(current.patients.map(p=>[p.id,p]));
      (data.patients||[]).forEach((p:any)=>map.set(p.id,p));
      const auditLog=[...(data.auditLog||[]),...current.auditLog].slice(0,500);
      set({
        patients:[...map.values()],
        settings:{...current.settings,...(data.settings||{})},
        auditLog
      });
    }
    await get().saveAll();
  }
}));
