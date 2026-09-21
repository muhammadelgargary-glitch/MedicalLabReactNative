import React from 'react';
import {ScrollView,View,Text,StyleSheet,TouchableOpacity} from 'react-native';
import {useLabStore} from '../store/useLabStore';
import {TEST_SECTIONS,SECTION_KEYS} from '../utils/constants';
import {exportPatientPdf,printPatient} from '../services/exportService';
import {displayDate} from '../utils/helpers';

export default function PatientReportScreen({route}:any){
 const p=useLabStore(s=>s.patients.find(x=>x.id===route.params?.id)); const settings=useLabStore(s=>s.settings);
 if(!p) return <View><Text>السجل غير موجود</Text></View>;
 return <ScrollView style={styles.root} contentContainerStyle={{padding:12}}>
  <View style={styles.paper}><Text style={styles.center}>{settings.center}</Text><Text style={styles.dir}>{settings.directorate}</Text><Text style={styles.report}>تقرير الفحوصات المخبرية</Text>
   <View style={styles.info}><Text>اسم المريض: {p.name}</Text><Text>رقم السجل: {p.seq}</Text><Text>العمر: {p.age}    الجنس: {p.gender}</Text><Text>التاريخ: {displayDate(p.date)}</Text></View>
   {SECTION_KEYS.map(k=>p[`include${k}`]?<View key={k} style={styles.sec}><Text style={styles.secTitle}>{TEST_SECTIONS[k].icon} {TEST_SECTIONS[k].label}</Text>{TEST_SECTIONS[k].fields.map(f=>{const v=p[TEST_SECTIONS[k].dataKey]?.[f.key];return String(v??'').trim()?<View style={styles.r} key={f.key}><Text style={styles.normal}>{f.normal}</Text><Text style={styles.val}>{String(v)}</Text><Text style={styles.test}>{f.label}</Text></View>:null})}</View>:null)}
   {p.notes?<Text style={styles.notes}>ملاحظات: {p.notes}</Text>:null}<Text style={styles.footer}>مع تمنياتنا بالصحة والعافية</Text>
  </View>
  <TouchableOpacity style={styles.btn} onPress={()=>exportPatientPdf(p,settings,settings.printSettings||{})}><Text style={styles.btnText}>📄 إنشاء ومشاركة PDF</Text></TouchableOpacity>
  <TouchableOpacity style={styles.btn2} onPress={()=>printPatient(p,settings,settings.printSettings||{})}><Text style={styles.btn2Text}>🖨 طباعة مباشرة</Text></TouchableOpacity>
 </ScrollView>
}
const styles=StyleSheet.create({root:{flex:1,backgroundColor:'#e9eeec'},paper:{backgroundColor:'#fff',padding:18,borderRadius:6},center:{textAlign:'center',fontSize:22,fontWeight:'900',color:'#1d3b36'},dir:{textAlign:'center',color:'#666',marginTop:4},report:{textAlign:'center',fontSize:19,fontWeight:'900',marginVertical:18},info:{borderWidth:1,borderColor:'#bbb',padding:10,gap:5},sec:{marginTop:14},secTitle:{backgroundColor:'#1d3b36',color:'#fff',padding:8,fontWeight:'900',textAlign:'right'},r:{flexDirection:'row-reverse',borderBottomWidth:1,borderColor:'#ddd',paddingVertical:8},test:{flex:1,textAlign:'right',fontWeight:'700'},val:{flex:1,textAlign:'center'},normal:{flex:1,textAlign:'left',color:'#777',fontSize:11},notes:{marginTop:15,textAlign:'right'},footer:{textAlign:'center',marginTop:20,color:'#777'},btn:{marginTop:12,backgroundColor:'#1d3b36',padding:15,borderRadius:14,alignItems:'center'},btnText:{color:'#fff',fontWeight:'900'},btn2:{marginTop:10,borderWidth:1,borderColor:'#1d3b36',padding:15,borderRadius:14,alignItems:'center'},btn2Text:{color:'#1d3b36',fontWeight:'900'}})
