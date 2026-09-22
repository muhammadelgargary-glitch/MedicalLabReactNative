import React from 'react';
import {FlatList, View, Text, StyleSheet} from 'react-native';
import {useLabStore} from '../store/useLabStore';
import {getTheme} from '../utils/theme';
export default function AuditScreen(){
 const logs=useLabStore(s=>s.auditLog); const settings=useLabStore(s=>s.settings); const theme=getTheme(settings);
 return <View style={[styles.root,{backgroundColor:theme.background}]}><FlatList data={logs} keyExtractor={x=>x.id} contentContainerStyle={{padding:12}} ListHeaderComponent={<Text style={[styles.h,{color:theme.primary}]}>📝 سجل التعديلات ({logs.length})</Text>} renderItem={({item})=><View style={[styles.card,{backgroundColor:theme.surface,borderColor:theme.border}]}><Text style={[styles.action,{color:theme.text}]}>{item.action}</Text><Text style={[styles.details,{color:theme.muted}]}>{item.details}</Text><Text style={[styles.date,{color:theme.muted}]}>{new Date(item.at).toLocaleString('ar-IQ')}</Text></View>}/></View>
}
const styles=StyleSheet.create({root:{flex:1},h:{fontSize:22,fontWeight:'900',textAlign:'right',marginBottom:10},card:{borderRadius:14,padding:13,marginBottom:9,borderWidth:1},action:{fontWeight:'900',textAlign:'right',fontSize:16},details:{textAlign:'right',marginTop:5},date:{textAlign:'right',fontSize:11,marginTop:7}})
