import React,{useEffect,useState} from 'react';
import {ScrollView,View,Text,TextInput,TouchableOpacity,StyleSheet,Alert} from 'react-native';
import {useLabStore} from '../store/useLabStore';
import {emptySectionData,SECTION_KEYS,TEST_SECTIONS,SectionKey} from '../utils/constants';
import {todayISO} from '../utils/helpers';
import SectionCard from '../components/SectionCard';

export default function PatientFormScreen({route,navigation}:any){
 const {patients,upsertPatient}=useLabStore(); const existing=patients.find(p=>p.id===route.params?.id);
 const [p,setP]=useState<any>(existing||{...emptySectionData(),name:'',seq:'',age:'',gender:'ذكر',date:todayISO(),notes:''});
 const [active,setActive]=useState<SectionKey[]>(SECTION_KEYS.filter(k=>p[`include${k}`]));
 useEffect(()=>{if(existing)setP(existing)},[existing?.id]);
 const toggle=(k:SectionKey)=>{const on=!p[`include${k}`]; setP({...p,[`include${k}`]:on});setActive(a=>on?[...a,k]:a.filter(x=>x!==k));};
 const save=async()=>{if(!p.name.trim()){Alert.alert('تنبيه','أدخل اسم المريض');return;} await upsertPatient(p);navigation.goBack();};
 return <ScrollView style={styles.root} contentContainerStyle={{padding:12,paddingBottom:40}}>
  <View style={styles.card}>
   <Text style={styles.title}>بيانات المريض</Text>
   <Input label="اسم المريض الكامل *" value={p.name} onChangeText={(v:string)=>setP({...p,name:v})}/>
   <View style={styles.row}><Input label="رقم السجل" value={p.seq} onChangeText={(v:string)=>setP({...p,seq:v})} flex/><Input label="العمر" value={p.age} onChangeText={(v:string)=>setP({...p,age:v})} flex/></View>
   <View style={styles.row}><Input label="الجنس" value={p.gender} onChangeText={(v:string)=>setP({...p,gender:v})} flex/><Input label="التاريخ YYYY-MM-DD" value={p.date} onChangeText={(v:string)=>setP({...p,date:v})} flex/></View>
   <Input label="ملاحظات" value={p.notes} onChangeText={(v:string)=>setP({...p,notes:v})}/>
  </View>
  <View style={styles.card}><Text style={styles.title}>اختيار أقسام الفحوصات</Text><View style={styles.chips}>{SECTION_KEYS.map(k=><TouchableOpacity key={k} onPress={()=>toggle(k)} style={[styles.chip,p[`include${k}`]&&styles.chipOn]}><Text style={[styles.chipText,p[`include${k}`]&&styles.chipTextOn]}>{TEST_SECTIONS[k].icon} {TEST_SECTIONS[k].label}</Text></TouchableOpacity>)}</View></View>
  {active.map(k=><SectionCard key={k} section={k} value={p[TEST_SECTIONS[k].dataKey]} onChange={v=>setP({...p,[TEST_SECTIONS[k].dataKey]:v})}/>)}
  <TouchableOpacity style={styles.save} onPress={save}><Text style={styles.saveText}>💾 حفظ السجل</Text></TouchableOpacity>
 </ScrollView>
}
function Input({label,value,onChangeText,flex}:{label:string,value:string,onChangeText:(v:string)=>void,flex?:boolean}){return <View style={{flex:flex?1:undefined,marginBottom:10}}><Text style={styles.label}>{label}</Text><TextInput value={value} onChangeText={onChangeText} style={styles.input}/></View>}
const styles=StyleSheet.create({
 root:{flex:1,backgroundColor:'#f4f7f6'},card:{backgroundColor:'#fff',borderRadius:16,padding:14,marginBottom:12,borderWidth:1,borderColor:'#e0e6e3'},title:{fontSize:19,fontWeight:'900',color:'#1d3b36',textAlign:'right',marginBottom:12},label:{fontWeight:'700',textAlign:'right',marginBottom:5},input:{borderWidth:1,borderColor:'#ccd6d2',borderRadius:10,padding:10,textAlign:'right',backgroundColor:'#fafcfc'},row:{flexDirection:'row-reverse',gap:10},chips:{flexDirection:'row-reverse',flexWrap:'wrap',gap:8},chip:{borderWidth:1,borderColor:'#ccd6d2',borderRadius:999,paddingHorizontal:12,paddingVertical:9},chipOn:{backgroundColor:'#1d3b36',borderColor:'#1d3b36'},chipText:{color:'#33413d'},chipTextOn:{color:'#fff'},save:{backgroundColor:'#1d3b36',padding:15,borderRadius:14,alignItems:'center'},saveText:{color:'#fff',fontSize:17,fontWeight:'900'}
});
