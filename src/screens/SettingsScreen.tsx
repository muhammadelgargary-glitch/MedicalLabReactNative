import React,{useEffect,useState} from 'react';
import {ScrollView,View,Text,TouchableOpacity,StyleSheet,Switch,Alert,Modal,TextInput,ActivityIndicator} from 'react-native';
import {useLabStore} from '../store/useLabStore';
import {exportBackup,importBackup} from '../services/exportService';
import {
  configureGoogleSignIn,
  getSavedGoogleUser,
  signInWithGoogle,
  restoreGoogleSession,
  signOutGoogle,
  uploadBackupToDrive,
  restoreLatestBackupFromDrive,
  getDriveBackupSummary,
  type GoogleUser,
  type DriveBackupPayload,
} from '../services/googleDriveService';

export default function SettingsScreen(){
 const {settings,setSetting,patients,auditLog,importBackupData,addAudit}=useLabStore();
 const [modal,setModal]=useState(false); const [pending,setPending]=useState<any>(null);
 const [paper,setPaper]=useState(settings.printSettings?.paper||'A4');
 const [orientation,setOrientation]=useState(settings.printSettings?.orientation||'portrait');
 const [normal,setNormal]=useState(settings.printSettings?.showNormal!==false);
 const [googleUser,setGoogleUser]=useState<GoogleUser|null>(null);
 const [driveBusy,setDriveBusy]=useState(false);
 const [driveSummary,setDriveSummary]=useState<any>(null);
 const [labModal,setLabModal]=useState<null|'center'|'directorate'>(null);
 const [labText,setLabText]=useState('');

 useEffect(()=>{
   let mounted=true;
   (async()=>{
     try{
       await configureGoogleSignIn();
       const saved=await getSavedGoogleUser();
       if(mounted && saved) setGoogleUser(saved);
       const restored=await restoreGoogleSession();
       if(mounted && restored){ setGoogleUser(restored.user); await refreshDriveSummary(); }
     }catch{}
   })();
   return ()=>{mounted=false;};
 },[]);

 const refreshDriveSummary=async()=>{
   try{ const s=await getDriveBackupSummary(); setDriveSummary(s); }catch{ setDriveSummary(null); }
 };

 const backup=async()=>{try{await exportBackup({patients,settings,auditLog});Alert.alert('تم','تم إنشاء النسخة الاحتياطية ويمكنك حفظها أو إرسالها.')}catch(e:any){Alert.alert('خطأ',e.message||'تعذر إنشاء النسخة.')}};
 const importFile=async()=>{
   try{
    const data=await importBackup(); if(!data) return;
    setPending(data); setModal(true);
   }catch(e:any){Alert.alert('خطأ في الاستيراد',e.message||'ملف غير صالح.')}
 };
 const apply=async(mode:'restore'|'merge')=>{
   if(!pending)return;
   try{
     await importBackupData(mode,pending);
     addAudit(mode==='restore'?'استعادة نسخة محلية':'دمج نسخة محلية','backup',mode==='restore'?'تم استبدال البيانات بالنسخة الاحتياطية المحلية':'تم دمج النسخة الاحتياطية المحلية مع البيانات الحالية');
     setModal(false); setPending(null);
     Alert.alert('تم الاستيراد',mode==='restore'?'تم استبدال البيانات الحالية بنجاح.':'تم دمج البيانات بنجاح.');
   }catch(e:any){Alert.alert('خطأ',e.message||'تعذر استيراد النسخة.')}
 };

 const signIn=async()=>{
   try{
     setDriveBusy(true);
     const result=await signInWithGoogle();
     setGoogleUser(result.user);
     await refreshDriveSummary();
     Alert.alert('تم تسجيل الدخول',`تم تسجيل الدخول بالحساب:\n${result.user.email}`);
   }catch(e:any){Alert.alert('فشل تسجيل الدخول إلى Google',e.message||'تأكد من إعداد OAuth وSHA-1.')}finally{setDriveBusy(false)}
 };

 const driveBackup=async()=>{
   try{
     setDriveBusy(true);
     const payload:DriveBackupPayload={app:'lab-app',version:5,exportedAt:new Date().toISOString(),patients,settings,auditLog};
     await uploadBackupToDrive(payload);
     addAudit('رفع نسخة احتياطية إلى Google Drive','backup','تم إنشاء نسخة سحابية والاحتفاظ بآخر 5 نسخ');
     await refreshDriveSummary();
     Alert.alert('تم','تم رفع النسخة الاحتياطية إلى Google Drive.');
   }catch(e:any){Alert.alert('فشل النسخ إلى Drive',e.message||'تعذر رفع النسخة.')}finally{setDriveBusy(false)}
 };

 const driveRestore=async()=>{
   try{
     setDriveBusy(true);
     const data=await restoreLatestBackupFromDrive();
     if(!data){Alert.alert('لا توجد نسخة','لم يتم العثور على نسخة مختبر في Google Drive.');return;}
     Alert.alert('استعادة من Google Drive',`تم العثور على أحدث نسخة تحتوي على ${data.patients.length} مريض.\nهل تريد استبدال البيانات الحالية بها؟`,[
       {text:'إلغاء',style:'cancel'},
       {text:'استعادة',style:'destructive',onPress:async()=>{
         try{
           await importBackupData('restore',data);
           addAudit('استيراد نسخة من Google Drive','backup','تم استعادة أحدث نسخة سحابية');
           Alert.alert('تم','تم استعادة أحدث نسخة من Google Drive بنجاح.');
         }catch(e:any){Alert.alert('خطأ',e.message||'تعذر استعادة النسخة.')}
       }}
     ]);
   }catch(e:any){Alert.alert('فشل الاستعادة من Drive',e.message||'تعذر تحميل النسخة.')}finally{setDriveBusy(false)}
 };

 const signOut=async()=>{
   try{setDriveBusy(true);await signOutGoogle();setGoogleUser(null);setDriveSummary(null);addAudit('تسجيل الخروج من حساب Google','backup','تم تسجيل الخروج من حساب Google');}
   catch(e:any){Alert.alert('خطأ',e.message||'تعذر تسجيل الخروج.')}finally{setDriveBusy(false)}
 };

 const openLabEditor=(key:'center'|'directorate')=>{setLabModal(key);setLabText(settings[key]||'')};
 const saveLabText=async()=>{if(labModal && labText.trim()) await setSetting(labModal,labText.trim());setLabModal(null)};
 const savePrint=async()=>{await setSetting('printSettings',{...settings.printSettings,paper,orientation,showNormal:normal});Alert.alert('تم','تم حفظ إعدادات الطباعة.')};

 return <ScrollView style={styles.root} contentContainerStyle={{padding:12}}>
  <Text style={styles.h}>⚙ إعدادات المختبر</Text>

  <View style={styles.card}><Text style={styles.title}>بيانات المختبر</Text>
   <Text style={styles.label}>اسم المختبر</Text>
   <TouchableOpacity style={styles.value} onPress={()=>openLabEditor('center')}><Text>{settings.center}</Text></TouchableOpacity>
   <Text style={styles.label}>المديرية / القطاع</Text>
   <TouchableOpacity style={styles.value} onPress={()=>openLabEditor('directorate')}><Text>{settings.directorate}</Text></TouchableOpacity>
  </View>

  <View style={styles.card}><Text style={styles.title}>المظهر</Text>
   <View style={styles.switchRow}><Text>الوضع الداكن</Text><Switch value={!!settings.darkMode} onValueChange={v=>setSetting('darkMode',v)}/></View>
  </View>

  <View style={styles.card}><Text style={styles.title}>☁️ Google Drive — النسخ الاحتياطي السحابي</Text>
   <View style={styles.accountBox}>
    <View style={{flex:1}}><Text style={styles.accountName}>{googleUser?.name||'غير متصل بحساب Google'}</Text><Text style={styles.desc}>{googleUser?.email||'سجّل الدخول لتمكين النسخ السحابي والاستعادة.'}</Text></View>
    <Text style={styles.accountIcon}>{googleUser?'✓':'🔑'}</Text>
   </View>
   {!googleUser ? <TouchableOpacity style={styles.btn} onPress={signIn} disabled={driveBusy}><Text style={styles.btnText}>{driveBusy?'جاري الاتصال...':'🔑 تسجيل الدخول بحساب Google'}</Text></TouchableOpacity> : <>
     <TouchableOpacity style={styles.btn} onPress={driveBackup} disabled={driveBusy}><Text style={styles.btnText}>☁️ رفع نسخة إلى Google Drive</Text></TouchableOpacity>
     <TouchableOpacity style={styles.btn2} onPress={driveRestore} disabled={driveBusy}><Text style={styles.btn2Text}>♻️ استعادة أحدث نسخة من Drive</Text></TouchableOpacity>
     <TouchableOpacity style={styles.btnDanger} onPress={signOut} disabled={driveBusy}><Text style={styles.btnDangerText}>تسجيل الخروج من Google</Text></TouchableOpacity>
     {driveSummary&&<Text style={styles.driveMeta}>📦 النسخ المحفوظة: {driveSummary.retained} / {driveSummary.retention}{driveSummary.latest?.modifiedTime?`\n📅 آخر نسخة: ${new Date(driveSummary.latest.modifiedTime).toLocaleString('ar-IQ')}`:''}</Text>}
   </>}
   {driveBusy&&<ActivityIndicator style={{marginTop:10}}/>}
   <Text style={styles.note}>يتم استخدام صلاحية Google Drive الخاصة بالتطبيق فقط لملفات النسخ التي ينشئها هذا التطبيق. يتم الاحتفاظ بآخر 5 نسخ.</Text>
  </View>

  <View style={styles.card}><Text style={styles.title}>💾 النسخ الاحتياطي والاستيراد المحلي</Text>
   <Text style={styles.desc}>النسخة تشمل المرضى والإعدادات وسجل التعديلات. يمكنك استعادة النسخة بالكامل أو دمجها مع البيانات الحالية.</Text>
   <TouchableOpacity style={styles.btn} onPress={backup}><Text style={styles.btnText}>📤 إنشاء ومشاركة نسخة احتياطية</Text></TouchableOpacity>
   <TouchableOpacity style={styles.btn2} onPress={importFile}><Text style={styles.btn2Text}>📥 استيراد نسخة احتياطية</Text></TouchableOpacity>
  </View>

  <View style={styles.card}><Text style={styles.title}>🖨 الطباعة المتقدمة</Text>
   <Text style={styles.label}>حجم الورق</Text>
   <View style={styles.chips}>{['A4','Letter'].map(x=><TouchableOpacity key={x} onPress={()=>setPaper(x)} style={[styles.chip,paper===x&&styles.chipOn]}><Text style={paper===x?styles.chipOnText:undefined}>{x}</Text></TouchableOpacity>)}</View>
   <Text style={styles.label}>اتجاه الصفحة</Text>
   <View style={styles.chips}>{[['portrait','عمودي'],['landscape','أفقي']].map(([x,t])=><TouchableOpacity key={x} onPress={()=>setOrientation(x)} style={[styles.chip,orientation===x&&styles.chipOn]}><Text style={orientation===x?styles.chipOnText:undefined}>{t}</Text></TouchableOpacity>)}</View>
   <View style={styles.switchRow}><Text>إظهار القيم الطبيعية</Text><Switch value={normal} onValueChange={setNormal}/></View>
   <TouchableOpacity style={styles.btn} onPress={savePrint}><Text style={styles.btnText}>💾 حفظ إعدادات الطباعة</Text></TouchableOpacity>
  </View>

  <View style={styles.card}><Text style={styles.title}>حالة المشروع</Text><Text style={styles.desc}>عدد المرضى: {patients.length}</Text><Text style={styles.desc}>سجل التعديلات: {auditLog.length}</Text><Text style={styles.desc}>التخزين محلي Native باستخدام AsyncStorage.</Text></View>

  <Modal visible={modal} transparent animationType="fade" onRequestClose={()=>setModal(false)}>
   <View style={styles.overlay}><View style={styles.dialog}><Text style={styles.dialogTitle}>استيراد النسخة الاحتياطية</Text>
    <Text style={styles.desc}>النسخة تحتوي على {pending?.patients?.length||0} مريض.</Text>
    <TouchableOpacity style={styles.btn} onPress={()=>apply('restore')}><Text style={styles.btnText}>♻️ استبدال البيانات الحالية</Text></TouchableOpacity>
    <TouchableOpacity style={styles.btn2} onPress={()=>apply('merge')}><Text style={styles.btn2Text}>➕ دمج مع البيانات الحالية</Text></TouchableOpacity>
    <TouchableOpacity onPress={()=>setModal(false)} style={{padding:12,alignItems:'center'}}><Text>إلغاء</Text></TouchableOpacity>
   </View></View>
  </Modal>

  <Modal visible={!!labModal} transparent animationType="fade" onRequestClose={()=>setLabModal(null)}>
   <View style={styles.overlay}><View style={styles.dialog}><Text style={styles.dialogTitle}>{labModal==='center'?'اسم المختبر':'المديرية / القطاع'}</Text>
    <TextInput value={labText} onChangeText={setLabText} autoFocus style={styles.input} textAlign="right" />
    <TouchableOpacity style={styles.btn} onPress={saveLabText}><Text style={styles.btnText}>حفظ</Text></TouchableOpacity>
    <TouchableOpacity onPress={()=>setLabModal(null)} style={{padding:12,alignItems:'center'}}><Text>إلغاء</Text></TouchableOpacity>
   </View></View>
  </Modal>
 </ScrollView>
}
const styles=StyleSheet.create({
 root:{flex:1,backgroundColor:'#f4f7f6'},h:{fontSize:22,fontWeight:'900',textAlign:'right',color:'#1d3b36',marginBottom:12},
 card:{backgroundColor:'#fff',borderRadius:16,padding:15,marginBottom:12},title:{fontSize:18,fontWeight:'900',textAlign:'right',color:'#1d3b36',marginBottom:12},
 label:{textAlign:'right',fontWeight:'700',marginTop:8,marginBottom:5},value:{borderWidth:1,borderColor:'#ccd6d2',borderRadius:10,padding:12,alignItems:'flex-end'},
 switchRow:{flexDirection:'row-reverse',justifyContent:'space-between',alignItems:'center',marginVertical:7},desc:{textAlign:'right',color:'#555',lineHeight:22},
 btn:{marginTop:12,backgroundColor:'#1d3b36',padding:14,borderRadius:12,alignItems:'center'},btnText:{color:'#fff',fontWeight:'900'},
 btn2:{marginTop:10,borderWidth:1,borderColor:'#1d3b36',padding:14,borderRadius:12,alignItems:'center'},btn2Text:{color:'#1d3b36',fontWeight:'900'},
 btnDanger:{marginTop:10,borderWidth:1,borderColor:'#b33a3a',padding:12,borderRadius:12,alignItems:'center'},btnDangerText:{color:'#b33a3a',fontWeight:'800'},
 chips:{flexDirection:'row-reverse',gap:8},chip:{borderWidth:1,borderColor:'#ccd6d2',paddingHorizontal:16,paddingVertical:9,borderRadius:999},chipOn:{backgroundColor:'#1d3b36',borderColor:'#1d3b36'},chipOnText:{color:'#fff'},
 overlay:{flex:1,backgroundColor:'rgba(0,0,0,.45)',alignItems:'center',justifyContent:'center',padding:20},dialog:{backgroundColor:'#fff',borderRadius:18,padding:18,width:'100%'},dialogTitle:{fontSize:20,fontWeight:'900',textAlign:'right',marginBottom:10},input:{borderWidth:1,borderColor:'#ccd6d2',borderRadius:10,padding:12,fontSize:16},
 accountBox:{flexDirection:'row-reverse',alignItems:'center',gap:12,borderWidth:1,borderColor:'#e0e6e3',borderRadius:12,padding:12},accountIcon:{fontSize:26},accountName:{fontSize:16,fontWeight:'900',textAlign:'right',color:'#1d3b36'},driveMeta:{textAlign:'right',marginTop:10,color:'#52605b',lineHeight:22},note:{fontSize:11,color:'#777',textAlign:'right',marginTop:10,lineHeight:18}
});
