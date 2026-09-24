import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Navigation from './src/navigation/Navigation';
import { useLabStore } from './src/store/useLabStore';
import { configureGoogleSignIn } from './src/services/googleDriveService';

export default function App() {
  const hydrate = useLabStore((s)=>s.hydrate);
  const hydrated = useLabStore((s)=>s.hydrated);
  const dark = useLabStore((s)=>s.darkMode);

  useEffect(()=>{
    hydrate();
    configureGoogleSignIn().catch(()=>{});
  },[]);

  if(!hydrated) return <View style={styles.loading}><ActivityIndicator size="large"/><Text style={styles.loadingText}>جاري تحميل بيانات المختبر…</Text></View>;

  return <>
    <StatusBar style={dark ? 'light' : 'dark'} />
    <Navigation />
  </>;
}
const styles=StyleSheet.create({
 loading:{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:'#F5F7F6',gap:12},
 loadingText:{fontSize:14,color:'#47554F',fontWeight:'700'},
});
