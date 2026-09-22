import React from 'react';
import {ScrollView,View,Text,StyleSheet} from 'react-native';
import {TEST_SECTIONS,SECTION_KEYS} from '../utils/constants';
import {useLabStore} from '../store/useLabStore';
import {getTheme} from '../utils/theme';
export default function CatalogScreen(){
 const {settings}=useLabStore(); const theme=getTheme(settings);
 return <ScrollView style={[styles.root,{backgroundColor:theme.background}]} contentContainerStyle={{padding:12}}>
  <Text style={[styles.h,{color:theme.primary}]}>🗂 دليل الفحوصات والقيم الطبيعية</Text>
  {SECTION_KEYS.map(k=>{const sec=TEST_SECTIONS[k];return <View style={[styles.card,{backgroundColor:theme.surface,borderColor:theme.border}]} key={k}>
    <Text style={[styles.title,{color:theme.primary}]}>{sec.icon} {sec.label}</Text>
    {sec.fields.map(f=><View style={[styles.row,{borderTopColor:theme.border}]} key={f.key}><Text style={[styles.normal,{color:theme.muted}]}>{settings.customRanges?.[`${k}.${f.key}`]||f.normal}</Text><Text style={[styles.name,{color:theme.text}]}>{f.label}</Text></View>)}
  </View>})}
 </ScrollView>
}
const styles=StyleSheet.create({root:{flex:1},h:{fontSize:21,fontWeight:'900',textAlign:'right',marginBottom:12},card:{borderRadius:15,padding:14,marginBottom:12,borderWidth:1},title:{fontSize:18,fontWeight:'900',textAlign:'right',marginBottom:8},row:{flexDirection:'row-reverse',justifyContent:'space-between',paddingVertical:9,borderTopWidth:1},name:{fontWeight:'700'},normal:{fontSize:12}})
