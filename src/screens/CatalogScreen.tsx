import React from 'react';
import {ScrollView,View,Text,StyleSheet} from 'react-native';
import {TEST_SECTIONS,SECTION_KEYS} from '../utils/constants';
import {useLabStore} from '../store/useLabStore';
export default function CatalogScreen(){
 const {settings}=useLabStore();
 return <ScrollView style={styles.root} contentContainerStyle={{padding:12}}><Text style={styles.h}>🗂 دليل الفحوصات والقيم الطبيعية</Text>{SECTION_KEYS.map(k=>{const sec=TEST_SECTIONS[k];return <View style={styles.card} key={k}><Text style={styles.title}>{sec.icon} {sec.label}</Text>{sec.fields.map(f=><View style={styles.row} key={f.key}><Text style={styles.normal}>{settings.customRanges?.[`${k}.${f.key}`]||f.normal}</Text><Text style={styles.name}>{f.label}</Text></View>)}</View>})}</ScrollView>
}
const styles=StyleSheet.create({root:{flex:1,backgroundColor:'#f4f7f6'},h:{fontSize:21,fontWeight:'900',textAlign:'right',color:'#1d3b36',marginBottom:12},card:{backgroundColor:'#fff',borderRadius:15,padding:14,marginBottom:12},title:{fontSize:18,fontWeight:'900',textAlign:'right',color:'#1d3b36',marginBottom:8},row:{flexDirection:'row-reverse',justifyContent:'space-between',paddingVertical:8,borderTopWidth:1,borderTopColor:'#edf0ef'},name:{fontWeight:'700'},normal:{color:'#666',fontSize:12}})
