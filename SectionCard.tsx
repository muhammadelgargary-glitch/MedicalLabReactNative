import React from 'react';
import {View,Text,TextInput,StyleSheet} from 'react-native';
import {TEST_SECTIONS,SectionKey} from '../utils/constants';

export default function SectionCard({section,value,onChange}:{section:SectionKey,value:any,onChange:(v:any)=>void}){
  const sec=TEST_SECTIONS[section];
  return <View style={styles.card}>
    <Text style={styles.title}>{sec.icon} {sec.label}</Text>
    {sec.fields.map(f=><View key={f.key} style={styles.row}>
      <View style={{flex:1}}><Text style={styles.label}>{f.label}</Text><Text style={styles.normal}>طبيعي: {f.normal}</Text></View>
      <TextInput value={String(value?.[f.key]??'')} onChangeText={t=>onChange({...value,[f.key]:t})} style={styles.input} placeholder="النتيجة"/>
    </View>)}
  </View>
}
const styles=StyleSheet.create({
 card:{backgroundColor:'#fff',borderRadius:16,padding:14,marginBottom:12,borderWidth:1,borderColor:'#e1e6e4'},
 title:{fontSize:18,fontWeight:'800',marginBottom:10,color:'#1d3b36',textAlign:'right'},
 row:{flexDirection:'row-reverse',alignItems:'center',gap:10,borderTopWidth:1,borderTopColor:'#edf0ef',paddingVertical:8},
 label:{fontWeight:'700',textAlign:'right'},normal:{fontSize:11,color:'#777',textAlign:'right',marginTop:2},
 input:{width:145,borderWidth:1,borderColor:'#ccd5d1',borderRadius:10,paddingHorizontal:10,paddingVertical:8,textAlign:'right',backgroundColor:'#fafcfc'}
});
