import React, { useMemo, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useLabStore } from '../store/useLabStore';
import { getColors } from '../styles/colors';
import { resolveFontFamily, fontScale } from '../styles/design';
import { PatientCard } from '../components/PatientCard';
import ThemedButton from '../components/ThemedButton';
import { SECTION_KEYS, TEST_SECTIONS } from '../utils/constants';

export default function CatalogScreen({navigation}:any){
 const patients=useLabStore(s=>s.patients);const dark=useLabStore(s=>s.darkMode);const theme=useLabStore(s=>s.theme);const fam=useLabStore(s=>s.fontFamily);const fs=useLabStore(s=>s.fontSize);
 const c=getColors(dark,theme);const styles=createStyles(c,resolveFontFamily(fam),fontScale(fs));const [q,setQ]=useState('');const [filter,setFilter]=useState<string>('all');
 const filtered=useMemo(()=>patients.filter(p=>{const ok=!q.trim()||`${p.name} ${p.seq}`.toLowerCase().includes(q.trim().toLowerCase());if(!ok)return false;if(filter==='all')return true;return !!(p as any)[`include${filter[0].toUpperCase()}${filter.slice(1)}`]}),[patients,q,filter]);
 return <SafeAreaView style={styles.container}><ScrollView contentContainerStyle={styles.content}>
  <View style={styles.header}><Text style={styles.kicker}>السجلات</Text><Text style={styles.title}>المرضى والنتائج</Text><Text style={styles.subtitle}>{filtered.length} من أصل {patients.length} سجل</Text></View>
  <View style={styles.search}><Text style={styles.searchIcon}>⌕</Text><TextInput value={q} onChangeText={setQ} placeholder="ابحث بالاسم أو رقم السجل" placeholderTextColor={c.inkSub} style={styles.input}/></View>
  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
   <TouchableOpacity onPress={()=>setFilter('all')} style={[styles.filter,filter==='all'&&styles.active]}><Text style={[styles.filterText,filter==='all'&&styles.activeText]}>الكل</Text></TouchableOpacity>
   {SECTION_KEYS.map(k=><TouchableOpacity key={k} onPress={()=>setFilter(k.toLowerCase())} style={[styles.filter,filter===k.toLowerCase()&&styles.active]}><Text style={[styles.filterText,filter===k.toLowerCase()&&styles.activeText]}>{TEST_SECTIONS[k].label}</Text></TouchableOpacity>)}
  </ScrollView>
  {filtered.length?filtered.map(p=><PatientCard key={p.id} patient={p} onPress={()=>navigation.navigate('PatientReport',{id:p.id})}/>):<View style={styles.empty}><Text style={styles.emptyTitle}>لا توجد نتائج</Text><Text style={styles.emptyText}>جرّب تغيير البحث أو الفلتر.</Text><ThemedButton title="إضافة مريض" onPress={()=>navigation.navigate('PatientForm')} style={{marginTop:14,width:'80%'}}/></View>}
 </ScrollView>
 <TouchableOpacity style={styles.fab} onPress={()=>navigation.navigate('PatientForm')}><Text style={styles.fabText}>＋</Text></TouchableOpacity>
 </SafeAreaView>
}
const createStyles=(c:any,f:string,s:number)=>StyleSheet.create({container:{flex:1,backgroundColor:c.paper},content:{paddingBottom:40},header:{backgroundColor:c.headerBg,padding:20},kicker:{color:'#B7E8E2',fontSize:11*s,fontWeight:'700',fontFamily:f},title:{color:'#fff',fontSize:24*s,fontWeight:'900',fontFamily:f,marginTop:2},subtitle:{color:'#D7EFEC',fontSize:11*s,fontFamily:f,marginTop:4},search:{margin:14,backgroundColor:c.panel,borderWidth:1,borderColor:c.line,borderRadius:15,minHeight:50,flexDirection:'row',alignItems:'center',paddingHorizontal:12},searchIcon:{fontSize:24,color:c.navy,marginRight:6},input:{flex:1,color:c.ink,fontFamily:f,fontSize:13*s,textAlign:'right'},filters:{paddingHorizontal:14,gap:8,marginBottom:10},filter:{paddingHorizontal:14,paddingVertical:9,borderRadius:18,borderWidth:1,borderColor:c.line,backgroundColor:c.panel},active:{backgroundColor:c.navy,borderColor:c.navy},filterText:{color:c.inkSub,fontFamily:f,fontSize:11*s,fontWeight:'800'},activeText:{color:'#fff'},empty:{margin:14,padding:30,alignItems:'center',backgroundColor:c.panel,borderWidth:1,borderColor:c.line,borderRadius:18},emptyTitle:{color:c.ink,fontFamily:f,fontSize:17*s,fontWeight:'900'},emptyText:{color:c.inkSub,fontFamily:f,fontSize:11*s,marginTop:5},fab:{position:'absolute',right:18,bottom:18,width:56,height:56,borderRadius:18,backgroundColor:c.navy,alignItems:'center',justifyContent:'center',elevation:5},fabText:{color:'#fff',fontSize:28}});
