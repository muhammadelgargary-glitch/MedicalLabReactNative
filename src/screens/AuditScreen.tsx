import React, { useMemo, useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLabStore } from '../store/useLabStore';
import { getColors } from '../styles/colors';
import { resolveFontFamily, fontScale } from '../styles/design';

export default function AuditScreen(){
 const logs=useLabStore(s=>s.auditLog);const clear=useLabStore(s=>s.clearAuditLog);const dark=useLabStore(s=>s.darkMode);const theme=useLabStore(s=>s.theme);const fam=useLabStore(s=>s.fontFamily);const fs=useLabStore(s=>s.fontSize);
 const c=getColors(dark,theme);const styles=createStyles(c,resolveFontFamily(fam),fontScale(fs));const [filter,setFilter]=useState('all');
 const filtered=useMemo(()=>filter==='all'?logs:logs.filter(l=>l.action.includes(filter)),[logs,filter]);
 const clearAll=()=>Alert.alert('حذف السجل','هل تريد حذف سجل التعديلات بالكامل؟',[{text:'إلغاء',style:'cancel'},{text:'حذف',style:'destructive',onPress:async()=>{await clear();}}]);
 return <SafeAreaView style={styles.container}><ScrollView contentContainerStyle={styles.content}>
  <View style={styles.header}><Text style={styles.kicker}>التدقيق</Text><Text style={styles.title}>سجل التعديلات</Text><Text style={styles.subtitle}>{logs.length} عملية مسجلة</Text></View>
  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>{[['all','الكل'],['إضافة','إضافة'],['تحديث','تحديث'],['حذف','حذف']].map(([k,l])=><TouchableOpacity key={k} onPress={()=>setFilter(k)} style={[styles.filter,filter===k&&styles.active]}><Text style={[styles.filterText,filter===k&&styles.activeText]}>{l}</Text></TouchableOpacity>)}</ScrollView>
  {filtered.slice().reverse().map((log,i)=><View key={`${log.timestamp}-${i}`} style={styles.log}><View style={styles.dot}/><View style={{flex:1}}><Text style={styles.action}>{log.action}</Text><Text style={styles.patient}>{log.patientName||'—'}</Text><Text style={styles.time}>{new Date(log.timestamp).toLocaleString('ar-IQ')}</Text></View></View>)}
  {!filtered.length&&<View style={styles.empty}><Text style={styles.emptyTitle}>لا توجد عمليات</Text><Text style={styles.emptyText}>ستظهر هنا عمليات الإضافة والتعديل والحذف.</Text></View>}
  {logs.length>0&&<TouchableOpacity onPress={clearAll} style={styles.delete}><Text style={styles.deleteText}>حذف سجل التعديلات</Text></TouchableOpacity>}
 </ScrollView></SafeAreaView>
}
const createStyles=(c:any,f:string,s:number)=>StyleSheet.create({container:{flex:1,backgroundColor:c.paper},content:{paddingBottom:40},header:{backgroundColor:c.headerBg,padding:20},kicker:{color:'#B7E8E2',fontSize:11*s,fontFamily:f,fontWeight:'700'},title:{color:'#fff',fontSize:24*s,fontFamily:f,fontWeight:'900',marginTop:2},subtitle:{color:'#D7EFEC',fontSize:11*s,fontFamily:f,marginTop:4},filters:{padding:14,gap:8},filter:{paddingHorizontal:15,paddingVertical:9,borderRadius:18,borderWidth:1,borderColor:c.line,backgroundColor:c.panel},active:{backgroundColor:c.navy,borderColor:c.navy},filterText:{color:c.inkSub,fontFamily:f,fontSize:11*s,fontWeight:'800'},activeText:{color:'#fff'},log:{marginHorizontal:14,marginVertical:4,padding:14,borderRadius:15,borderWidth:1,borderColor:c.line,backgroundColor:c.panel,flexDirection:'row'},dot:{width:9,height:9,borderRadius:5,backgroundColor:c.navy,marginTop:5,marginRight:11},action:{color:c.ink,fontFamily:f,fontSize:13*s,fontWeight:'900'},patient:{color:c.inkSub,fontFamily:f,fontSize:11*s,marginTop:3},time:{color:c.inkSub,fontFamily:f,fontSize:9.5*s,marginTop:5},empty:{margin:14,padding:28,alignItems:'center',backgroundColor:c.panel,borderRadius:16,borderWidth:1,borderColor:c.line},emptyTitle:{color:c.ink,fontFamily:f,fontSize:16*s,fontWeight:'900'},emptyText:{color:c.inkSub,fontFamily:f,fontSize:11*s,marginTop:4},delete:{margin:14,minHeight:48,borderRadius:14,backgroundColor:c.danger,alignItems:'center',justifyContent:'center'},deleteText:{color:'#fff',fontFamily:f,fontSize:13*s,fontWeight:'900'}});
