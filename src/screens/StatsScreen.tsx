import React from 'react';
import {ScrollView,View,Text,StyleSheet,TouchableOpacity} from 'react-native';
import {useLabStore} from '../store/useLabStore';
import {getStats,exportPatientsExcel} from '../services/exportService';

export default function StatsScreen(){
 const {patients}=useLabStore(); const s=getStats(patients);
 return <ScrollView style={styles.root} contentContainerStyle={{padding:12}}>
  <Text style={styles.h}>📊 التقرير الإحصائي الطبي</Text>
  <View style={styles.grid}><Box t="إجمالي المرضى" n={s.total}/><Box t="سجلات اليوم" n={s.today}/><Box t="ذكور" n={s.males}/><Box t="إناث" n={s.females}/></View>
  <View style={styles.card}><Text style={styles.title}>توزيع الفحوصات</Text>{s.sections.map(sec=><View key={sec.key} style={styles.section}><View style={styles.line}><Text style={styles.num}>{sec.count}</Text><Text style={styles.sec}>{sec.name}</Text></View>{sec.tests.filter(t=>t.count>0).map(t=><View key={t.name} style={styles.test}><Text>{t.count}</Text><Text>{t.name}</Text></View>)}</View>)}</View>
  <TouchableOpacity style={styles.btn} onPress={()=>exportPatientsExcel(patients)}><Text style={styles.btnText}>📊 تصدير السجلات Excel</Text></TouchableOpacity>
 </ScrollView>
}
function Box({t,n}:{t:string,n:number}){return <View style={styles.box}><Text style={styles.bn}>{n}</Text><Text style={styles.bt}>{t}</Text></View>}
const styles=StyleSheet.create({root:{flex:1,backgroundColor:'#f4f7f6'},h:{fontSize:22,fontWeight:'900',textAlign:'right',color:'#1d3b36',marginBottom:12},grid:{flexDirection:'row-reverse',flexWrap:'wrap',gap:8},box:{width:'48%',backgroundColor:'#fff',borderRadius:15,padding:15,alignItems:'center'},bn:{fontSize:28,fontWeight:'900',color:'#1d3b36'},bt:{color:'#666'},card:{backgroundColor:'#fff',borderRadius:16,padding:14,marginTop:12},title:{fontSize:18,fontWeight:'900',textAlign:'right',marginBottom:10},section:{borderTopWidth:1,borderTopColor:'#e7ecea',paddingVertical:9},line:{flexDirection:'row',justifyContent:'space-between'},sec:{fontWeight:'900',fontSize:16},num:{fontWeight:'900'},test:{flexDirection:'row',justifyContent:'space-between',paddingVertical:4,paddingHorizontal:8},btn:{marginTop:12,backgroundColor:'#1d3b36',padding:15,borderRadius:14,alignItems:'center'},btnText:{color:'#fff',fontWeight:'900'}})
