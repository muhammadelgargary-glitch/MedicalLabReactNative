import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLabStore, Patient } from '../store/useLabStore';
import { TEST_SECTIONS, SECTION_KEYS, SectionKey } from '../utils/constants';
import { exportPatientPdf, printPatient } from '../services/exportService';
import { displayDate } from '../utils/helpers';
import { getColors } from '../styles/colors';
import { resolveFontFamily, fontScale } from '../styles/design';
import { SHADOWS } from '../styles/spacing';

export default function PatientReportScreen({route,navigation}:any){
  const id=route.params?.id;
  const patients=useLabStore(s=>s.patients);
  const settings=useLabStore(s=>s.settings);
  const deletePatient=useLabStore(s=>s.deletePatient);
  const dark=useLabStore(s=>s.darkMode); const theme=useLabStore(s=>s.theme); const family=useLabStore(s=>s.fontFamily); const size=useLabStore(s=>s.fontSize);
  const patient=patients.find(p=>p.id===id);
  const colors=getColors(dark,theme);
  const styles=createStyles(colors,resolveFontFamily(family),fontScale(size));
  const [busy,setBusy]=useState<'pdf'|'print'|null>(null);
  const sections=useMemo(()=>patient?SECTION_KEYS.filter(k=>!!(patient as any)[`include${k}`]):[],[patient]);

  if(!patient)return <View style={styles.missing}><Text style={styles.missingTitle}>السجل غير موجود</Text><TouchableOpacity onPress={()=>navigation.goBack()}><Text style={styles.link}>رجوع</Text></TouchableOpacity></View>;

  const run=async(type:'pdf'|'print')=>{
    try{setBusy(type);const options=settings.printSettings||{};if(type==='pdf')await exportPatientPdf(patient,settings,options);else await printPatient(patient,settings,options);Alert.alert('تم',type==='pdf'?'تم إنشاء ومشاركة التقرير.':'تم إرسال التقرير للطباعة.')}catch(e:any){Alert.alert('خطأ',e?.message||'تعذر تنفيذ العملية.')}finally{setBusy(null)}
  };
  const remove=()=>Alert.alert('حذف السجل','هل تريد حذف هذا السجل نهائيًا؟',[{text:'إلغاء',style:'cancel'},{text:'حذف',style:'destructive',onPress:async()=>{await deletePatient(patient.id);navigation.goBack()}}]);

  return <SafeAreaView style={styles.container}><ScrollView contentContainerStyle={styles.content}>
    <View style={styles.topbar}><TouchableOpacity onPress={()=>navigation.goBack()} style={styles.iconButton}><Text style={styles.iconText}>‹</Text></TouchableOpacity><View style={{flex:1}}><Text style={styles.kicker}>تقرير طبي</Text><Text style={styles.topTitle}>{patient.name}</Text></View><TouchableOpacity onPress={()=>navigation.navigate('PatientForm',{id:patient.id})} style={styles.editButton}><Text style={styles.editText}>تعديل</Text></TouchableOpacity></View>

    <View style={styles.paper}>
      <View style={styles.reportHeader}>
        <View style={styles.brand}>
          {settings.logo?<View style={[styles.logoWrap,{borderRadius:settings.logoShape==='circle'?999:settings.logoShape==='square'?5:14,width:settings.logoSize||56,height:settings.logoSize||56}]}><Image source={{uri:settings.logo}} style={{width:'100%',height:'100%'}} resizeMode="contain"/></View>:<View style={styles.logoPlaceholder}><Text style={styles.logoMark}>LAB</Text></View>}
          <View style={{flex:1}}><Text style={styles.center}>{settings.center||'مختبر طبي'}</Text><Text style={styles.directorate}>{settings.directorate||'الإدارة'}</Text></View>
        </View>
        <View style={styles.reportLine}/>
        <Text style={styles.reportTitle}>{settings.reportTitle||'تقرير الفحوصات المخبرية'}</Text>
      </View>

      <View style={styles.patientInfo}>
        <Info label="اسم المريض" value={patient.name} styles={styles}/>
        <Info label="رقم السجل" value={patient.seq} styles={styles}/>
        <Info label="العمر" value={patient.age} styles={styles}/>
        <Info label="الجنس" value={patient.gender} styles={styles}/>
        <Info label="التاريخ" value={displayDate(patient.date)} styles={styles}/>
      </View>

      {sections.map((key:SectionKey)=><ReportSection key={key} patient={patient} sectionKey={key} styles={styles}/>)}
      {patient.notes?<View style={styles.notes}><Text style={styles.notesLabel}>ملاحظات</Text><Text style={styles.notesText}>{patient.notes}</Text></View>:null}
      <Text style={styles.footer}>{settings.footerText||'مع تمنياتنا بالصحة والعافية'}</Text>
    </View>

    <View style={styles.actions}>
      <TouchableOpacity disabled={!!busy} onPress={()=>run('pdf')} style={styles.primaryAction}>{busy==='pdf'?<ActivityIndicator color="#fff"/>:<><Text style={styles.actionIcon}>⇩</Text><Text style={styles.primaryText}>حفظ ومشاركة PDF</Text></>}</TouchableOpacity>
      <TouchableOpacity disabled={!!busy} onPress={()=>run('print')} style={styles.secondaryAction}>{busy==='print'?<ActivityIndicator color={colors.navy}/>:<><Text style={styles.actionIconDark}>▣</Text><Text style={styles.secondaryText}>طباعة مباشرة</Text></>}</TouchableOpacity>
      <TouchableOpacity onPress={()=>navigation.navigate('MultiPrint')} style={styles.secondaryAction}><Text style={styles.secondaryText}>طباعة عدة تقارير</Text></TouchableOpacity>
      <TouchableOpacity onPress={remove} style={styles.deleteAction}><Text style={styles.deleteText}>حذف السجل</Text></TouchableOpacity>
    </View>
  </ScrollView></SafeAreaView>;
}

function Info({label,value,styles}:{label:string;value:string;styles:any}){return <View style={styles.info}><Text style={styles.infoLabel}>{label}</Text><Text style={styles.infoValue}>{value||'—'}</Text></View>}
function ReportSection({patient,sectionKey,styles}:{patient:Patient;sectionKey:SectionKey;styles:any}){
  const section=TEST_SECTIONS[sectionKey];const data=(patient as any)[section.dataKey]||{};const rows=section.fields.filter(f=>String(data[f.key]??'').trim()!=='');
  if(!rows.length)return null;
  return <View style={styles.section}><View style={styles.sectionHeader}><Text style={styles.sectionTitle}>{section.label}</Text></View><View style={styles.tableHeader}><Text style={[styles.th,{flex:1.4}]}>اسم الفحص</Text><Text style={styles.th}>النتيجة</Text><Text style={[styles.th,{flex:1.1}]}>القيمة الطبيعية</Text></View>{rows.map((f,i)=><View key={f.key} style={[styles.tableRow,i%2===1&&styles.alt]}><Text style={[styles.td,{flex:1.4}]}>{f.label}</Text><Text style={[styles.td,styles.result]}>{String(data[f.key])}</Text><Text style={[styles.td,styles.normal,{flex:1.1}]}>{f.normal}</Text></View>)}</View>
}

const createStyles=(c:any,f:string,s:number)=>StyleSheet.create({
 container:{flex:1,backgroundColor:c.paper},content:{paddingBottom:38},topbar:{backgroundColor:c.headerBg,padding:15,flexDirection:'row',alignItems:'center'},iconButton:{width:40,height:40,borderRadius:12,backgroundColor:'rgba(255,255,255,.12)',alignItems:'center',justifyContent:'center'},iconText:{color:'#fff',fontSize:30},kicker:{color:'#B7E8E2',fontSize:10*s,fontWeight:'700',fontFamily:f},topTitle:{color:'#fff',fontSize:18*s,fontWeight:'900',fontFamily:f,marginTop:2},editButton:{paddingHorizontal:12,paddingVertical:8,borderRadius:11,backgroundColor:'rgba(255,255,255,.13)'},editText:{color:'#fff',fontSize:11*s,fontWeight:'800',fontFamily:f},
 paper:{margin:14,padding:14,backgroundColor:c.panel,borderRadius:18,borderWidth:1,borderColor:c.line,...SHADOWS.sm},reportHeader:{paddingBottom:12},brand:{flexDirection:'row',alignItems:'center'},logoPlaceholder:{width:56,height:56,borderRadius:14,backgroundColor:c.sealLight,alignItems:'center',justifyContent:'center'},logoWrap:{backgroundColor:c.paper,alignItems:'center',justifyContent:'center',overflow:'hidden'},logoMark:{color:c.navy,fontSize:10,fontWeight:'900',fontFamily:f},center:{color:c.ink,fontSize:19*s,fontWeight:'900',fontFamily:f},directorate:{color:c.inkSub,fontSize:11*s,fontFamily:f,marginTop:2},reportLine:{height:2,backgroundColor:c.navy,marginVertical:12},reportTitle:{color:c.ink,fontSize:18*s,fontWeight:'900',fontFamily:f,textAlign:'center'},
 patientInfo:{marginTop:10,borderWidth:1,borderColor:c.line,borderRadius:12,overflow:'hidden',flexDirection:'row',flexWrap:'wrap'},info:{width:'50%',padding:9,borderBottomWidth:1,borderLeftWidth:1,borderColor:c.line},infoLabel:{color:c.inkSub,fontSize:9.5*s,fontWeight:'700',fontFamily:f},infoValue:{color:c.ink,fontSize:12*s,fontWeight:'900',fontFamily:f,marginTop:2},
 section:{marginTop:12,borderWidth:1,borderColor:c.line,borderRadius:10,overflow:'hidden'},sectionHeader:{backgroundColor:c.navy,paddingVertical:8,paddingHorizontal:10},sectionTitle:{color:'#fff',fontSize:13*s,fontWeight:'900',fontFamily:f,textAlign:'right'},tableHeader:{flexDirection:'row',backgroundColor:c.sealLight,paddingVertical:7},tableRow:{flexDirection:'row',borderTopWidth:1,borderTopColor:c.line,minHeight:38,alignItems:'center'},alt:{backgroundColor:c.paper},th:{flex:1,color:c.ink,fontSize:10*s,fontWeight:'900',fontFamily:f,textAlign:'right',paddingHorizontal:6},td:{flex:1,color:c.ink,fontSize:10.5*s,fontFamily:f,textAlign:'right',paddingHorizontal:6,paddingVertical:7},result:{color:c.navy,fontWeight:'900',textAlign:'center'},normal:{color:c.inkSub,fontSize:9*s,textAlign:'left'},notes:{marginTop:12,padding:10,borderRadius:10,backgroundColor:c.paper,borderWidth:1,borderColor:c.line},notesLabel:{color:c.ink,fontSize:11*s,fontWeight:'900',fontFamily:f},notesText:{color:c.ink,fontSize:11*s,fontFamily:f,lineHeight:19,marginTop:4},footer:{textAlign:'center',color:c.inkSub,fontSize:10*s,fontFamily:f,fontWeight:'700',marginTop:14},actions:{padding:14,gap:9},primaryAction:{minHeight:52,borderRadius:15,backgroundColor:c.navy,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8},primaryText:{color:'#fff',fontSize:14*s,fontWeight:'900',fontFamily:f},secondaryAction:{minHeight:50,borderRadius:15,backgroundColor:c.panel,borderWidth:1,borderColor:c.navy,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8},secondaryText:{color:c.navy,fontSize:13*s,fontWeight:'900',fontFamily:f},actionIcon:{color:'#fff',fontSize:18},actionIconDark:{color:c.navy,fontSize:18},deleteAction:{minHeight:46,borderRadius:14,backgroundColor:c.danger,alignItems:'center',justifyContent:'center'},deleteText:{color:'#fff',fontSize:13*s,fontWeight:'900',fontFamily:f},missing:{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:c.paper},missingTitle:{color:c.ink,fontSize:18*s,fontWeight:'900',fontFamily:f},link:{color:c.navy,fontWeight:'800',fontFamily:f,marginTop:10}
});
