import React, { useEffect, useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useLabStore, Patient } from '../store/useLabStore';
import { getColors } from '../styles/colors';
import { resolveFontFamily, fontScale } from '../styles/design';
import { BORDER_RADIUS, SHADOWS } from '../styles/spacing';
import { uid } from '../utils/helpers';
import ThemedButton from '../components/ThemedButton';
import { SECTION_KEYS, TEST_SECTIONS } from '../utils/constants';

export default function PatientFormScreen({route,navigation}:any){
  const id=route.params?.id;
  const patients=useLabStore(s=>s.patients);
  const add=useLabStore(s=>s.addPatient);
  const update=useLabStore(s=>s.updatePatient);
  const dark=useLabStore(s=>s.darkMode);
  const theme=useLabStore(s=>s.theme);
  const family=useLabStore(s=>s.fontFamily);
  const size=useLabStore(s=>s.fontSize);
  const colors=getColors(dark,theme);
  const styles=createStyles(colors,resolveFontFamily(family),fontScale(size));
  const [name,setName]=useState(''); const [seq,setSeq]=useState(''); const [age,setAge]=useState(''); const [gender,setGender]=useState('ذكر'); const [notes,setNotes]=useState('');
  const [includes,setIncludes]=useState<Record<string,boolean>>({});
  const [busy,setBusy]=useState(false);

  useEffect(()=>{
    if(!id)return;
    const p=patients.find(x=>x.id===id); if(!p)return;
    setName(p.name);setSeq(p.seq);setAge(p.age);setGender(p.gender);setNotes(p.notes||'');
    const x:any={}; SECTION_KEYS.forEach(k=>x[k]=!!(p as any)[`include${k}`]); setIncludes(x);
  },[id,patients]);

  const toggle=(key:string)=>setIncludes(v=>({...v,[key]:!v[key]}));
  const submit=async()=>{
    if(!name.trim()||!seq.trim()||!age.trim()){Alert.alert('بيانات ناقصة','أدخل الاسم ورقم السجل والعمر.');return;}
    if(!SECTION_KEYS.some(k=>includes[k])){Alert.alert('الفحوصات','حدد فحصًا واحدًا على الأقل.');return;}
    try{
      setBusy(true);
      const flags:any={}; SECTION_KEYS.forEach(k=>flags[`include${k}`]=!!includes[k]);
      if(id) await update(id,{name:name.trim(),seq:seq.trim(),age:age.trim(),gender,notes,...flags});
      else {
        const patient:Patient={id:uid('patient'),name:name.trim(),seq:seq.trim(),age:age.trim(),gender,date:new Date().toISOString().slice(0,10),notes,blood:{},chem:{},urine:{},serology:{},stool:{},preg:{},...flags};
        await add(patient);
      }
      navigation.goBack();
    }catch(e:any){Alert.alert('خطأ',e?.message||'تعذر حفظ السجل.')}finally{setBusy(false)}
  };

  return <SafeAreaView style={styles.container}><ScrollView contentContainerStyle={styles.content}>
    <View style={styles.header}><TouchableOpacity onPress={()=>navigation.goBack()} style={styles.back}><Text style={styles.backText}>‹</Text></TouchableOpacity><View><Text style={styles.kicker}>السجلات</Text><Text style={styles.title}>{id?'تعديل بيانات المريض':'إضافة مريض جديد'}</Text></View></View>
    <Section title="البيانات الأساسية" styles={styles}>
      <Field label="اسم المريض" value={name} onChangeText={setName} placeholder="مثال: أحمد محمد" styles={styles}/>
      <View style={styles.two}><View style={{flex:1}}><Field label="رقم السجل" value={seq} onChangeText={setSeq} placeholder="001" styles={styles}/></View><View style={{flex:1}}><Field label="العمر" value={age} onChangeText={setAge} placeholder="35" keyboardType="numeric" styles={styles}/></View></View>
      <Text style={styles.label}>الجنس</Text><View style={styles.choices}>{['ذكر','أنثى'].map(g=><TouchableOpacity key={g} onPress={()=>setGender(g)} style={[styles.choice,gender===g&&styles.active]}><Text style={[styles.choiceText,gender===g&&styles.activeText]}>{g}</Text></TouchableOpacity>)}</View>
    </Section>
    <Section title="الفحوصات المطلوبة" styles={styles}>
      <Text style={styles.help}>يمكن اختيار أكثر من قسم.</Text>
      <View style={styles.testGrid}>{SECTION_KEYS.map(k=>{const s=TEST_SECTIONS[k];const active=!!includes[k];return <TouchableOpacity key={k} onPress={()=>toggle(k)} style={[styles.test,active&&styles.testActive]}><View style={[styles.dot,{backgroundColor:active?colors.navy:colors.line}]}><Text style={styles.dotText}>{active?'✓':''}</Text></View><Text style={[styles.testText,active&&styles.activeText]}>{s.label}</Text></TouchableOpacity>})}</View>
    </Section>
    <Section title="ملاحظات" styles={styles}><TextInput value={notes} onChangeText={setNotes} multiline numberOfLines={5} textAlignVertical="top" placeholder="ملاحظات اختيارية" placeholderTextColor={colors.inkSub} style={[styles.input,{minHeight:110}]}/></Section>
    <View style={styles.actions}><ThemedButton title={id?'حفظ التعديلات':'حفظ المريض'} onPress={submit} loading={busy}/><ThemedButton title="إلغاء" variant="secondary" onPress={()=>navigation.goBack()} style={{marginTop:9}}/></View>
  </ScrollView></SafeAreaView>;
}
function Section({title,children,styles}:{title:string;children:any;styles:any}){return <View style={styles.section}><Text style={styles.sectionTitle}>{title}</Text>{children}</View>}
function Field({label,value,onChangeText,placeholder,keyboardType,styles}:{label:string;value:string;onChangeText:(v:string)=>void;placeholder:string;keyboardType?:any;styles:any}){return <View style={{marginBottom:9}}><Text style={styles.label}>{label}</Text><TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#8A9791" keyboardType={keyboardType} style={styles.input}/></View>}
const createStyles=(c:any,f:string,s:number)=>StyleSheet.create({
 container:{flex:1,backgroundColor:c.paper},content:{paddingBottom:40},header:{backgroundColor:c.headerBg,padding:18,flexDirection:'row',alignItems:'center'},back:{width:40,height:40,borderRadius:12,backgroundColor:'rgba(255,255,255,.12)',alignItems:'center',justifyContent:'center',marginRight:12},backText:{color:'#fff',fontSize:30},kicker:{color:'#B7E8E2',fontSize:11*s,fontWeight:'700',fontFamily:f},title:{color:'#fff',fontSize:22*s,fontWeight:'900',fontFamily:f,marginTop:2},section:{margin:14,padding:16,borderRadius:18,backgroundColor:c.panel,borderWidth:1,borderColor:c.line,...SHADOWS.sm},sectionTitle:{fontSize:16*s,fontWeight:'900',color:c.ink,fontFamily:f,marginBottom:12},label:{fontSize:12*s,color:c.ink,fontWeight:'800',fontFamily:f,marginBottom:5},input:{minHeight:46,borderRadius:13,borderWidth:1,borderColor:c.line,backgroundColor:c.paper,paddingHorizontal:12,color:c.ink,textAlign:'right',fontFamily:f,fontSize:13*s},two:{flexDirection:'row',gap:10},choices:{flexDirection:'row',gap:8},choice:{flex:1,minHeight:44,borderRadius:13,borderWidth:1,borderColor:c.line,backgroundColor:c.paper,alignItems:'center',justifyContent:'center'},active:{backgroundColor:c.navy,borderColor:c.navy},choiceText:{color:c.ink,fontSize:13*s,fontWeight:'800',fontFamily:f},activeText:{color:'#fff'},help:{color:c.inkSub,fontSize:11*s,fontFamily:f,marginBottom:10},testGrid:{flexDirection:'row',flexWrap:'wrap',gap:9},test:{width:'31.7%',minHeight:82,borderRadius:15,borderWidth:1,borderColor:c.line,backgroundColor:c.paper,alignItems:'center',justifyContent:'center',padding:9},testActive:{backgroundColor:c.sealLight,borderColor:c.navy},dot:{width:26,height:26,borderRadius:13,alignItems:'center',justifyContent:'center',marginBottom:6},dotText:{color:'#fff',fontWeight:'900'},testText:{color:c.ink,fontSize:11*s,fontWeight:'800',fontFamily:f,textAlign:'center'},actions:{paddingHorizontal:14}
});
