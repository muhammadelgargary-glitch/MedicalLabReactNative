import React, { useMemo, useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useLabStore } from '../store/useLabStore';
import { getColors } from '../styles/colors';
import { resolveFontFamily, fontScale } from '../styles/design';
import { exportMultiplePatientsPdf, printMultiplePatients } from '../services/exportService';

export default function MultiPrintScreen({ navigation }: any) {
  const patients = useLabStore((s)=>s.patients);
  const settings = useLabStore((s)=>s.settings);
  const testCatalog = useLabStore((s)=>s.testCatalog);
  const dark = useLabStore((s)=>s.darkMode);
  const theme = useLabStore((s)=>s.theme);
  const family = useLabStore((s)=>s.fontFamily);
  const size = useLabStore((s)=>s.fontSize);
  const colors = getColors(dark,theme);
  const styles = createStyles(colors,resolveFontFamily(family),fontScale(size));
  const [query,setQuery]=useState('');
  const [selected,setSelected]=useState<string[]>([]);
  const [layout,setLayout]=useState<any>(settings.printSettings?.layout || '1');
  const [busy,setBusy]=useState(false);

  const visible=useMemo(()=>patients.filter(p=>!query.trim() || `${p.name} ${p.seq}`.toLowerCase().includes(query.trim().toLowerCase())),[patients,query]);
  const toggle=(id:string)=>setSelected(s=>s.includes(id)?s.filter(x=>x!==id):[...s,id]);
  const allVisible=visible.length>0 && visible.every(p=>selected.includes(p.id));
  const selectAll=()=>setSelected(allVisible?selected.filter(id=>!visible.some(p=>p.id===id)):[...new Set([...selected,...visible.map(p=>p.id)])]);
  const chosen=patients.filter(p=>selected.includes(p.id));
  const resultCount=(p:any)=>Object.values(p.blood||{}).concat(Object.values(p.chem||{}),Object.values(p.urine||{}),Object.values(p.serology||{}),Object.values(p.stool||{}),Object.values(p.preg||{})).filter(v=>String(v??'').trim()!=='').length;
  const run=async(fn:()=>Promise<any>,message:string)=>{if(!chosen.length){Alert.alert('تنبيه','حدد تقريرًا واحدًا على الأقل.');return;}try{setBusy(true);await fn();Alert.alert('تم',message)}catch(e:any){Alert.alert('خطأ',e?.message||'تعذر تنفيذ العملية')}finally{setBusy(false)}};

  return <SafeAreaView style={styles.container}><ScrollView contentContainerStyle={styles.content}>
    <View style={styles.header}><TouchableOpacity onPress={()=>navigation.goBack()} style={styles.back}><Text style={styles.backText}>‹</Text></TouchableOpacity><View style={{flex:1}}><Text style={styles.kicker}>التقارير</Text><Text style={styles.title}>طباعة عدة تقارير</Text></View><View style={styles.count}><Text style={styles.countText}>{selected.length}</Text></View></View>
    <View style={styles.search}><TextInput value={query} onChangeText={setQuery} placeholder="ابحث في السجلات" placeholderTextColor={colors.inkSub} style={styles.input}/></View>
    <View style={styles.toolbar}><TouchableOpacity onPress={selectAll} style={styles.tool}><Text style={styles.toolText}>{allVisible?'إلغاء تحديد الظاهر':'تحديد الظاهر'}</Text></TouchableOpacity><Text style={styles.resultCount}>{visible.length} سجل</Text></View>
    <View style={styles.layoutCard}><Text style={styles.cardTitle}>تخطيط الصفحة</Text><View style={styles.choices}>{[['1','1'],['2','2'],['2stack','2 عمودي'],['3','3'],['4','4']].map(([k,l])=><TouchableOpacity key={k} onPress={()=>setLayout(k)} style={[styles.choice,layout===k&&styles.active]}><Text style={[styles.choiceText,layout===k&&styles.activeText]}>{l}</Text></TouchableOpacity>)}</View></View>
    {visible.map(p=><TouchableOpacity key={p.id} onPress={()=>toggle(p.id)} style={[styles.patient,selected.includes(p.id)&&styles.patientSelected]}>
      <View style={[styles.checkbox,selected.includes(p.id)&&styles.checkboxActive]}><Text style={styles.check}>{selected.includes(p.id)?'✓':''}</Text></View>
      <View style={{flex:1}}><Text style={styles.name}>{p.name}</Text><Text style={styles.meta}>#{p.seq || '—'} • {p.age || '—'} • {p.gender || '—'} • {resultCount(p)} نتيجة</Text></View>
    </TouchableOpacity>)}
    <View style={styles.actions}>
      <TouchableOpacity disabled={busy} onPress={()=>run(()=>printMultiplePatients(chosen,{...settings,__catalog:testCatalog},{...(settings.printSettings||{}),layout}),'تم إرسال التقارير للطباعة')} style={styles.primary}><Text style={styles.primaryText}>طباعة التقارير المحددة</Text></TouchableOpacity>
      <TouchableOpacity disabled={busy} onPress={()=>run(()=>exportMultiplePatientsPdf(chosen,{...settings,__catalog:testCatalog},{...(settings.printSettings||{}),layout}),'تم إنشاء PDF للتقارير المحددة')} style={styles.secondary}><Text style={styles.secondaryText}>إنشاء PDF ومشاركة</Text></TouchableOpacity>
    </View>
  </ScrollView>{busy&&<View style={styles.busy}><Text style={styles.busyText}>جارٍ تجهيز التقارير…</Text></View>}</SafeAreaView>;
}
const createStyles=(c:any,f:string,s:number)=>StyleSheet.create({
 container:{flex:1,backgroundColor:c.paper},content:{paddingBottom:40},header:{backgroundColor:c.headerBg,padding:18,flexDirection:'row',alignItems:'center'},back:{width:40,height:40,borderRadius:12,backgroundColor:'rgba(255,255,255,.12)',alignItems:'center',justifyContent:'center',marginRight:12},backText:{color:'#fff',fontSize:30},kicker:{color:'#B7E8E2',fontSize:11*s,fontWeight:'700',fontFamily:f},title:{color:'#fff',fontSize:21*s,fontWeight:'900',fontFamily:f,marginTop:2},count:{width:38,height:38,borderRadius:12,backgroundColor:c.seal,alignItems:'center',justifyContent:'center'},countText:{color:'#fff',fontWeight:'900',fontSize:16},search:{padding:14},input:{backgroundColor:c.panel,borderWidth:1,borderColor:c.line,borderRadius:14,minHeight:48,paddingHorizontal:14,color:c.ink,textAlign:'right',fontFamily:f},toolbar:{paddingHorizontal:14,flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:8},tool:{paddingHorizontal:13,paddingVertical:9,borderRadius:12,backgroundColor:c.sealLight},toolText:{color:c.navy,fontWeight:'800',fontFamily:f,fontSize:11*s},resultCount:{color:c.inkSub,fontFamily:f,fontSize:11*s},layoutCard:{marginHorizontal:14,marginBottom:10,padding:14,borderRadius:16,backgroundColor:c.panel,borderWidth:1,borderColor:c.line},cardTitle:{color:c.ink,fontSize:13*s,fontWeight:'900',fontFamily:f,marginBottom:10},choices:{flexDirection:'row',gap:7,flexWrap:'wrap'},choice:{paddingHorizontal:14,paddingVertical:9,borderRadius:12,borderWidth:1,borderColor:c.line,backgroundColor:c.paper},active:{backgroundColor:c.navy,borderColor:c.navy},choiceText:{color:c.ink,fontWeight:'800',fontFamily:f,fontSize:11*s},activeText:{color:'#fff'},patient:{marginHorizontal:14,marginVertical:4,padding:13,borderRadius:15,backgroundColor:c.panel,borderWidth:1,borderColor:c.line,flexDirection:'row',alignItems:'center'},patientSelected:{borderColor:c.navy,backgroundColor:c.sealLight},checkbox:{width:26,height:26,borderRadius:8,borderWidth:1.5,borderColor:c.line,marginRight:12,alignItems:'center',justifyContent:'center'},checkboxActive:{backgroundColor:c.navy,borderColor:c.navy},check:{color:'#fff',fontWeight:'900'},name:{color:c.ink,fontSize:14*s,fontWeight:'900',fontFamily:f},meta:{color:c.inkSub,fontSize:11*s,fontFamily:f,marginTop:3},actions:{padding:14,gap:9},primary:{minHeight:52,borderRadius:15,backgroundColor:c.navy,alignItems:'center',justifyContent:'center'},primaryText:{color:'#fff',fontSize:14*s,fontWeight:'900',fontFamily:f},secondary:{minHeight:52,borderRadius:15,borderWidth:1,borderColor:c.navy,backgroundColor:c.panel,alignItems:'center',justifyContent:'center'},secondaryText:{color:c.navy,fontSize:14*s,fontWeight:'900',fontFamily:f},busy:{position:'absolute',left:20,right:20,bottom:20,backgroundColor:c.headerBg,padding:13,borderRadius:14,alignItems:'center'},busyText:{color:'#fff',fontFamily:f,fontWeight:'800'}
});
