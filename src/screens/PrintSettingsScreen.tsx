import React, { useEffect, useState } from 'react';
import { Alert, Image, SafeAreaView, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { useLabStore } from '../store/useLabStore';
import { getColors } from '../styles/colors';
import { resolveFontFamily, fontScale } from '../styles/design';
import { BORDER_RADIUS, SHADOWS } from '../styles/spacing';

export default function PrintSettingsScreen({ navigation }: any) {
  const dark = useLabStore((s) => s.darkMode);
  const theme = useLabStore((s) => s.theme);
  const family = useLabStore((s) => s.fontFamily);
  const fontSize = useLabStore((s) => s.fontSize);
  const settings = useLabStore((s) => s.settings);
  const updateSettings = useLabStore((s) => s.updateSettings);
  const colors = getColors(dark, theme);
  const styles = createStyles(colors, resolveFontFamily(family), fontScale(fontSize));

  const p = settings.printSettings || {};
  const [draft, setDraft] = useState<any>({...p, logoShape: p.logoShape || settings.logoShape || 'rounded', logoSize: p.logoSize || settings.logoSize || 56, logoPosition: p.logoPosition || settings.logoPosition || 'right', logoBorder: p.logoBorder ?? settings.logoBorder ?? false, template: p.template || 'classic', showPrice: p.showPrice !== false, showPaid: p.showPaid !== false, showRemaining: p.showRemaining !== false, showAbbreviation: p.showAbbreviation !== false});
  const [logo, setLogo] = useState(settings.logo || '');

  useEffect(() => { setDraft({...settings.printSettings, logoShape: settings.printSettings?.logoShape || settings.logoShape || 'rounded', logoSize: settings.printSettings?.logoSize || settings.logoSize || 56, logoPosition: settings.printSettings?.logoPosition || settings.logoPosition || 'right', logoBorder: settings.printSettings?.logoBorder ?? settings.logoBorder ?? false, template: settings.printSettings?.template || 'classic', showPrice: settings.printSettings?.showPrice !== false, showPaid: settings.printSettings?.showPaid !== false, showRemaining: settings.printSettings?.showRemaining !== false, showAbbreviation: settings.printSettings?.showAbbreviation !== false}); setLogo(settings.logo || ''); }, [settings.printSettings, settings.logo, settings.logoShape, settings.logoSize, settings.logoPosition, settings.logoBorder]);

  const set = (key:string,value:any) => setDraft((d:any)=>({...d,[key]:value}));
  const save = async () => {
    try {
      const nextPrintSettings = {
        ...draft,
        template: draft.template || 'classic',
        showPrice: false,
        showPaid: false,
        showRemaining: false,
        showAbbreviation: draft.showAbbreviation !== false,
      };

      await updateSettings({
        logo,
        logoShape: draft.logoShape || settings.logoShape || 'rounded',
        logoSize: Number(draft.logoSize || settings.logoSize || 56),
        logoPosition: draft.logoPosition || settings.logoPosition || 'right',
        logoBorder: !!draft.logoBorder,
        reportTitle: draft.reportTitle || 'تقرير الفحوصات المخبرية',
        footerText: draft.footerText || 'مع تمنياتنا بالصحة والعافية',
        printSettings: nextPrintSettings,
      });

      navigation.getParent?.()?.navigate('Home');
      Alert.alert('تم الحفظ', 'تم حفظ قالب التقرير وإعدادات الطباعة.');
    } catch (e: any) {
      Alert.alert('خطأ', e?.message || 'تعذر حفظ إعدادات الطباعة.');
    }
  };

  const pickLogo = async () => {
    const result = await DocumentPicker.getDocumentAsync({type:'image/*',copyToCacheDirectory:true,multiple:false});
    if (result.canceled || !result.assets?.length) return;
    const asset = result.assets[0];
    try {
      const base64 = await FileSystem.readAsStringAsync(asset.uri,{encoding:FileSystem.EncodingType.Base64});
      const mime = asset.mimeType || 'image/png';
      setLogo(`data:${mime};base64,${base64}`);
    } catch (e:any) { Alert.alert('خطأ','تعذر قراءة صورة الشعار.'); }
  };

  const clearLogo = () => setLogo('');

  const choice = (key:string, options:[string,string][]) => (
    <View style={styles.choices}>{options.map(([k,l])=><TouchableOpacity key={k} onPress={()=>set(key,k)} style={[styles.choice,draft[key]===k&&styles.activeChoice]}><Text style={[styles.choiceText,draft[key]===k&&styles.activeChoiceText]}>{l}</Text></TouchableOpacity>)}</View>
  );

  return <SafeAreaView style={styles.container}><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <View style={styles.header}><TouchableOpacity onPress={()=>navigation.goBack()} style={styles.back}><Text style={styles.backText}>‹</Text></TouchableOpacity><View><Text style={styles.kicker}>التقارير</Text><Text style={styles.title}>إعدادات الطباعة</Text></View></View>

    <Section title="قالب التقرير" styles={styles}>
      <Text style={styles.help}>اختر الشكل العام للتقرير. القالب الكلاسيكي قريب من تصميم التقرير السابق، وباقي القوالب تغيّر الرأس والجداول والمسافات فقط دون حذف النتائج.</Text>
      {choice('template',[['classic','كلاسيكي — مثل المشروع السابق'],['modern','حديث'],['compact','مضغوط'],['minimal','بسيط']])}
      <View style={[styles.templatePreview, draft.template === 'modern' && styles.previewModernCard, draft.template === 'compact' && styles.previewCompactCard, draft.template === 'minimal' && styles.previewMinimalCard]}>
        <View style={[styles.previewBar, draft.template === 'modern' && styles.previewModern, draft.template === 'compact' && styles.previewCompact, draft.template === 'minimal' && styles.previewMinimal]} />
        <Text style={styles.previewTitle}>{draft.reportTitle || 'تقرير الفحوصات المخبرية'}</Text>
        <View style={styles.previewPatientRow}>
          <Text style={styles.previewCell}>اسم المريض</Text><Text style={styles.previewCell}>رقم السجل</Text><Text style={styles.previewCell}>التاريخ</Text>
        </View>
        <View style={styles.previewSection}><Text style={styles.previewSectionText}>Hematology / Blood</Text></View>
        <View style={styles.previewTable}>
          <View style={styles.previewTableHead}><Text style={styles.previewHeadText}>اسم الفحص</Text><Text style={styles.previewHeadText}>النتيجة</Text><Text style={styles.previewHeadText}>القيمة المرجعية</Text></View>
          <View style={styles.previewTableRow}><Text style={styles.previewText}>Hb</Text><Text style={styles.previewText}>12</Text><Text style={styles.previewText}>12 - 17</Text></View>
          <View style={styles.previewTableRow}><Text style={styles.previewText}>PCV</Text><Text style={styles.previewText}>37</Text><Text style={styles.previewText}>36 - 50</Text></View>
          <View style={styles.previewTableRow}><Text style={styles.previewText}>ESR</Text><Text style={styles.previewText}>25</Text><Text style={styles.previewText}>0 - 20</Text></View>
        </View>
      </View>
    </Section>

    <Section title="حجم الورق واتجاهه" styles={styles}>
      {choice('paper',[['A4','A4'],['A5','A5'],['Letter','Letter']])}
      {choice('orientation',[['portrait','عمودي'],['landscape','أفقي']])}
    </Section>

    <Section title="الطباعة المتعددة" styles={styles}>
      <Text style={styles.help}>تحديد عدد التقارير في الصفحة عند استخدام «طباعة عدة تقارير».</Text>
      {choice('layout',[['auto','تلقائي'],['1','تقرير واحد'],['2','تقريران'],['2stack','تقريران عموديًا'],['3','3 تقارير'],['4','4 تقارير']])}
      <Text style={styles.label}>المسافة بين التقارير (mm)</Text>
      <TextInput keyboardType="numeric" value={String(draft.gap ?? 6)} onChangeText={(v)=>set('gap',Number(v)||0)} style={styles.input}/>
    </Section>

    <Section title="الشعار" styles={styles}>
      <View style={styles.logoPreview}>{logo ? <Image source={{uri:logo}} resizeMode="contain" style={styles.logoImage}/> : <Text style={styles.logoMissing}>لا يوجد شعار</Text>}</View>
      <View style={styles.rowButtons}><TouchableOpacity onPress={pickLogo} style={styles.primarySmall}><Text style={styles.whiteText}>{logo?'تغيير الشعار':'إضافة شعار'}</Text></TouchableOpacity>{logo?<TouchableOpacity onPress={clearLogo} style={styles.dangerSmall}><Text style={styles.whiteText}>حذف</Text></TouchableOpacity>:null}</View>
      <Text style={styles.label}>شكل الشعار</Text>{choice('logoShape',[['circle','دائري'],['rounded','مربع دائري'],['square','مربع']])}
      <Text style={styles.label}>موضع الشعار</Text>{choice('logoPosition',[['right','يمين'],['center','وسط'],['left','يسار']])}
      <Text style={styles.label}>حجم الشعار (px)</Text><TextInput keyboardType="numeric" value={String(draft.logoSize ?? settings.logoSize ?? 56)} onChangeText={(v)=>set('logoSize',Number(v)||56)} style={styles.input}/>
      <SwitchRow label="إطار حول الشعار" value={!!draft.logoBorder} onChange={(v)=>set('logoBorder',v)} styles={styles}/>
    </Section>

    <Section title="محتوى التقرير" styles={styles}>
      <Field label="عنوان التقرير" value={draft.reportTitle || ''} onChangeText={(v)=>set('reportTitle',v)} styles={styles}/>
      <Field label="النص السفلي" value={draft.footerText || ''} onChangeText={(v)=>set('footerText',v)} styles={styles}/>
      {[
        ['showCenter','اسم المختبر'],['showDirectorate','الإدارة / الفرع'],['showDate','التاريخ'],['showSeq','رقم السجل'],['showNormal','القيم الطبيعية'],['showNotes','الملاحظات'],['showFooter','التذييل'],['showBorder','حدود الجداول'],['showLogo','الشعار'],
      ].map(([k,l])=><SwitchRow key={k} label={l} value={draft[k] !== false} onChange={(v)=>set(k,v)} styles={styles}/>)}
      <Text style={styles.label}>تفاصيل إضافية</Text>
      <View style={styles.infoBox}>
        <Text style={styles.infoText}>السعر والمدفوع والمتبقي تظهر في بطاقة المريض داخل التطبيق فقط، ولن تظهر في قالب التقرير المطبوع أو PDF.</Text>
      </View>
      <SwitchRow label="اختصار اسم الفحص" value={draft.showAbbreviation !== false} onChange={(v)=>set('showAbbreviation',v)} styles={styles}/>
    </Section>

    <Section title="الخط والهوامش" styles={styles}>
      <Text style={styles.label}>خط التقرير</Text>
      {choice('fontFamily',[['sans-serif','Sans'],['serif','Serif'],['monospace','Mono']])}
      <Text style={styles.label}>حجم النص</Text><TextInput keyboardType="numeric" value={String(draft.fontSize ?? 13)} onChangeText={(v)=>set('fontSize',Number(v)||13)} style={styles.input}/>
      <Text style={styles.label}>حجم نص الجدول</Text><TextInput keyboardType="numeric" value={String(draft.tableFontSize ?? 11)} onChangeText={(v)=>set('tableFontSize',Number(v)||11)} style={styles.input}/>
      <View style={styles.marginGrid}>{[['marginTop','أعلى'],['marginRight','يمين'],['marginBottom','أسفل'],['marginLeft','يسار']].map(([k,l])=><View key={k} style={styles.marginCell}><Text style={styles.smallLabel}>{l}</Text><TextInput keyboardType="numeric" value={String(draft[k] ?? 8)} onChangeText={(v)=>set(k,Number(v)||0)} style={styles.input}/></View>)}</View>
    </Section>

    <TouchableOpacity onPress={save} style={styles.save}><Text style={styles.saveText}>حفظ إعدادات الطباعة</Text></TouchableOpacity>
  </ScrollView></SafeAreaView>;
}

function Section({title,children,styles}:{title:string;children?:any;styles:any}){return <View style={styles.section}><Text style={styles.sectionTitle}>{title}</Text>{children}</View>}
function Field({label,value,onChangeText,styles}:{label:string;value:string;onChangeText:(v:string)=>void;styles:any}){return <View><Text style={styles.label}>{label}</Text><TextInput value={value} onChangeText={onChangeText} style={styles.input}/></View>}
function SwitchRow({label,value,onChange,styles}:{label:string;value:boolean;onChange:(v:boolean)=>void;styles:any}){return <View style={styles.switchRow}><Text style={styles.label}>{label}</Text><Switch value={value} onValueChange={onChange}/></View>}

const createStyles=(colors:any,fontFamily:string,scale:number)=>StyleSheet.create({
 container:{flex:1,backgroundColor:colors.paper},content:{paddingBottom:40},header:{backgroundColor:colors.headerBg,padding:18,flexDirection:'row',alignItems:'center'},back:{width:40,height:40,borderRadius:12,backgroundColor:'rgba(255,255,255,.12)',alignItems:'center',justifyContent:'center',marginRight:12},backText:{color:'#fff',fontSize:30},kicker:{color:'#B7E8E2',fontSize:11*scale,fontWeight:'700',fontFamily},title:{color:'#fff',fontSize:23*scale,fontWeight:'900',fontFamily},section:{margin:14,padding:16,borderRadius:18,backgroundColor:colors.panel,borderWidth:1,borderColor:colors.line,...SHADOWS.sm},templatePreview:{marginTop:10,borderWidth:1,borderColor:colors.line,borderRadius:10,padding:10,backgroundColor:'#fff'},previewModernCard:{borderColor:colors.navy,borderRadius:16},previewCompactCard:{padding:7,borderRadius:6},previewMinimalCard:{borderWidth:0,borderTopWidth:2,borderTopColor:colors.navy,borderRadius:0},previewBar:{height:6,borderRadius:4,backgroundColor:'#555',marginBottom:8},previewModern:{backgroundColor:colors.navy},previewCompact:{height:4},previewMinimal:{height:2,backgroundColor:colors.navy},previewTitle:{textAlign:'center',fontSize:11*scale,fontWeight:'900',color:'#111',fontFamily,marginBottom:8},previewPatientRow:{flexDirection:'row',borderWidth:1,borderColor:'#999',marginBottom:7},previewCell:{flex:1,padding:5,borderLeftWidth:1,borderLeftColor:'#999',fontSize:8*scale,color:'#111',fontFamily,textAlign:'center'},previewSection:{backgroundColor:'#eee',borderWidth:1,borderColor:'#bbb',paddingVertical:5,alignItems:'center',marginBottom:4},previewSectionText:{fontSize:9*scale,fontWeight:'900',color:'#111',fontFamily},previewTable:{borderWidth:1,borderColor:'#777'},previewTableHead:{flexDirection:'row',backgroundColor:'#eee'},previewTableRow:{flexDirection:'row',borderTopWidth:1,borderTopColor:'#aaa'},previewHeadText:{flex:1,padding:4,fontSize:7.5*scale,fontWeight:'900',color:'#111',fontFamily,textAlign:'center',borderLeftWidth:1,borderLeftColor:'#aaa'},previewText:{flex:1,padding:4,fontSize:7.5*scale,color:'#111',fontFamily,textAlign:'center',borderLeftWidth:1,borderLeftColor:'#aaa'},sectionTitle:{fontSize:16*scale,fontWeight:'900',color:colors.ink,fontFamily,marginBottom:14},help:{fontSize:11*scale,color:colors.inkSub,fontFamily,lineHeight:18,marginBottom:10},label:{fontSize:13*scale,color:colors.ink,fontWeight:'800',fontFamily,marginTop:10,marginBottom:6},choices:{flexDirection:'row',flexWrap:'wrap',gap:8,marginBottom:8},choice:{flex:1,minWidth:92,paddingVertical:11,paddingHorizontal:8,borderRadius:12,borderWidth:1,borderColor:colors.line,backgroundColor:colors.paper,alignItems:'center'},activeChoice:{backgroundColor:colors.navy,borderColor:colors.navy},choiceText:{fontSize:11*scale,color:colors.ink,fontWeight:'700',fontFamily,textAlign:'center'},activeChoiceText:{color:'#fff'},input:{minHeight:44,borderWidth:1,borderColor:colors.line,borderRadius:12,paddingHorizontal:12,color:colors.ink,backgroundColor:colors.paper,textAlign:'right',fontFamily,fontSize:13*scale},logoPreview:{height:100,borderRadius:14,borderWidth:1,borderColor:colors.line,backgroundColor:colors.paper,alignItems:'center',justifyContent:'center'},logoImage:{width:90,height:90},logoMissing:{color:colors.inkSub,fontFamily},rowButtons:{flexDirection:'row',gap:8,marginTop:10},primarySmall:{flex:1,backgroundColor:colors.navy,borderRadius:12,minHeight:44,alignItems:'center',justifyContent:'center'},dangerSmall:{width:90,backgroundColor:colors.danger,borderRadius:12,minHeight:44,alignItems:'center',justifyContent:'center'},whiteText:{color:'#fff',fontWeight:'800',fontFamily},switchRow:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingVertical:9,borderBottomWidth:1,borderBottomColor:colors.line},infoBox:{marginTop:8,padding:11,borderRadius:12,backgroundColor:colors.sealLight,borderWidth:1,borderColor:colors.line},infoText:{fontSize:11*scale,lineHeight:18,color:colors.ink,fontFamily},marginGrid:{flexDirection:'row',flexWrap:'wrap',gap:8},marginCell:{width:'48%'},smallLabel:{fontSize:11,color:colors.inkSub,fontFamily},save:{margin:14,marginTop:0,minHeight:54,borderRadius:16,backgroundColor:colors.navy,alignItems:'center',justifyContent:'center'},saveText:{color:'#fff',fontSize:15*scale,fontWeight:'900',fontFamily}
});
