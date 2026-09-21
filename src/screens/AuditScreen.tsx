import React from 'react';
import {FlatList,View,Text,StyleSheet} from 'react-native';
import {useLabStore} from '../store/useLabStore';
export default function AuditScreen(){
 const logs=useLabStore(s=>s.auditLog);
 return <View style={styles.root}><FlatList data={logs} keyExtractor={x=>x.id} contentContainerStyle={{padding:12}} ListHeaderComponent={<Text style={styles.h}>📝 سجل التعديلات ({logs.length})</Text>} renderItem={({item})=><View style={styles.card}><Text style={styles.action}>{item.action}</Text><Text style={styles.details}>{item.details}</Text><Text style={styles.date}>{new Date(item.at).toLocaleString('ar-IQ')}</Text></View>}/></View>
}
const styles=StyleSheet.create({root:{flex:1,backgroundColor:'#f4f7f6'},h:{fontSize:22,fontWeight:'900',textAlign:'right',color:'#1d3b36',marginBottom:10},card:{backgroundColor:'#fff',borderRadius:14,padding:13,marginBottom:9,borderWidth:1,borderColor:'#e1e6e3'},action:{fontWeight:'900',textAlign:'right',fontSize:16},details:{textAlign:'right',marginTop:5,color:'#555'},date:{textAlign:'right',fontSize:11,color:'#888',marginTop:7}})
