import React from 'react';
import {ScrollView, View, Text, StyleSheet, TouchableOpacity, Image} from 'react-native';
import {useLabStore} from '../store/useLabStore';
import {TEST_SECTIONS, SECTION_KEYS} from '../utils/constants';
import {exportPatientPdf, printPatient} from '../services/exportService';
import {displayDate} from '../utils/helpers';
import {getTheme} from '../utils/theme';

export default function PatientReportScreen({route}: any) {
  const patient = useLabStore(s => s.patients.find(x => x.id === route.params?.id));
  const settings = useLabStore(s => s.settings);
  const theme = getTheme(settings);
  const ps = settings.printSettings || ({} as any);

  if (!patient) {
    return <View style={[styles.empty, {backgroundColor: theme.background}]}><Text style={[styles.emptyText, {color: theme.text}]}>السجل غير موجود</Text></View>;
  }

  const activeSections = SECTION_KEYS.filter(k => patient[`include${k}`]);

  return (
    <ScrollView style={[styles.root, {backgroundColor: theme.background}]} contentContainerStyle={styles.content}>
      <View style={[styles.toolbar, {backgroundColor: theme.surface, borderColor: theme.border}]}>
        <View>
          <Text style={[styles.toolbarTitle, {color: theme.text}]}>معاينة ورقة الفحص</Text>
          <Text style={[styles.toolbarSub, {color: theme.muted}]}>تقرير مخبري منظم وجاهز للطباعة</Text>
        </View>
        <View style={[styles.seqPill, {backgroundColor: theme.primary}]}><Text style={styles.seqText}>{patient.seq || '—'}</Text></View>
      </View>

      <View style={[styles.paper, {backgroundColor: theme.surface, borderColor: ps.showBorder === false ? 'transparent' : (ps.borderColor || theme.border)}]}>
        <View style={[styles.paperHeader, {borderBottomColor: theme.primary}]}>
          {ps.showLogo && settings.logo ? <Image source={{uri: settings.logo}} style={[styles.logo, {width: ps.logoSize || 48, height: ps.logoSize || 48}]} /> : <View style={[styles.logoPlaceholder, {borderColor: theme.accent, backgroundColor: theme.surfaceAlt}]}><Text style={[styles.logoMark, {color: theme.accent}]}>LAB</Text></View>}
          <View style={styles.headerCenter}>
            {ps.showCenter !== false && <Text style={[styles.center, {color: theme.primary}]}>{settings.center || 'المختبر الطبي'}</Text>}
            {ps.showDirectorate !== false && <Text style={[styles.directorate, {color: theme.muted}]}>{settings.directorate || ''}</Text>}
            <Text style={[styles.reportTitle, {color: theme.text}]}>{ps.reportTitle || 'تقرير الفحوصات المخبرية'}</Text>
          </View>
          <View style={[styles.headerStamp, {borderColor: theme.accent}]}><Text style={[styles.stampText, {color: theme.accent}]}>LAB</Text><Text style={[styles.stampSmall, {color: theme.muted}]}>REPORT</Text></View>
        </View>

        <View style={[styles.patientBox, {backgroundColor: theme.surfaceAlt, borderColor: theme.border}]}>
          <Info label="اسم المريض" value={patient.name || '—'} wide />
          {ps.showSeq !== false && <Info label="رقم السجل" value={patient.seq || '—'} />}
          <Info label="العمر" value={patient.age || '—'} />
          <Info label="الجنس" value={patient.gender || '—'} />
          {ps.showDate !== false && <Info label="التاريخ" value={displayDate(patient.date)} />}
        </View>

        {activeSections.map(k => {
          const sec = TEST_SECTIONS[k];
          const values = sec.fields.filter(f => String(patient[sec.dataKey]?.[f.key] ?? '').trim());
          if (!values.length) return null;
          return (
            <View key={k} style={[styles.section, {borderColor: theme.border}]}>
              <View style={[styles.sectionHead, {backgroundColor: theme.primary}]}>
                <Text style={styles.sectionIcon}>{sec.icon}</Text>
                <Text style={styles.sectionTitle}>{sec.label}</Text>
              </View>
              <View style={styles.tableHead}>
                <Text style={[styles.headCell, {color: theme.muted}]}>الفحص</Text>
                <Text style={[styles.headCell, {color: theme.muted}]}>النتيجة</Text>
                {ps.showNormal !== false && <Text style={[styles.headCell, {color: theme.muted}]}>القيمة الطبيعية</Text>}
              </View>
              {values.map((f, i) => (
                <View key={f.key} style={[styles.resultRow, i % 2 === 1 && {backgroundColor: theme.surfaceAlt}]}>
                  <Text style={[styles.cell, styles.testCell, {color: theme.text}]}>{f.label}</Text>
                  <Text style={[styles.cell, styles.valueCell, {color: theme.primary}]}>{String(patient[sec.dataKey]?.[f.key])}</Text>
                  {ps.showNormal !== false && <Text style={[styles.cell, styles.normalCell, {color: theme.muted}]}>{f.normal}</Text>}
                </View>
              ))}
            </View>
          );
        })}

        {ps.showNotes !== false && patient.notes ? <View style={[styles.notes, {borderColor: theme.border, backgroundColor: theme.surfaceAlt}]}><Text style={[styles.notesTitle, {color: theme.primary}]}>ملاحظات</Text><Text style={[styles.notesText, {color: theme.text}]}>{patient.notes}</Text></View> : null}

        {ps.showFooter !== false && <View style={[styles.footer, {borderTopColor: theme.border}]}><Text style={[styles.footerText, {color: theme.muted}]}>{ps.footerText || 'مع تمنياتنا بالصحة والعافية'}</Text><Text style={[styles.footerCode, {color: theme.accent}]}>Medical Laboratory Report</Text></View>}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={[styles.primaryBtn, {backgroundColor: theme.accent}]} onPress={() => exportPatientPdf(patient, settings, ps)}><Text style={styles.btnText}>📄 إنشاء ومشاركة PDF</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.secondaryBtn, {borderColor: theme.primary, backgroundColor: theme.surface}]} onPress={() => printPatient(patient, settings, ps)}><Text style={[styles.secondaryText, {color: theme.primary}]}>🖨 طباعة مباشرة</Text></TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function Info({label, value, wide}: {label: string; value: string; wide?: boolean}) {
  return <View style={[styles.info, wide && styles.infoWide]}><Text style={styles.infoLabel}>{label}</Text><Text style={styles.infoValue}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  root:{flex:1}, content:{padding:12,paddingBottom:32,maxWidth:900,width:'100%',alignSelf:'center'},
  toolbar:{flexDirection:'row-reverse',alignItems:'center',justifyContent:'space-between',padding:14,borderWidth:1,borderRadius:16,marginBottom:12,elevation:2},
  toolbarTitle:{fontSize:18,fontWeight:'900',textAlign:'right'}, toolbarSub:{fontSize:12,marginTop:3,textAlign:'right'},
  seqPill:{minWidth:48,height:48,borderRadius:14,alignItems:'center',justifyContent:'center'}, seqText:{color:'#fff',fontSize:18,fontWeight:'900'},
  paper:{borderWidth:1,borderRadius:16,padding:18,elevation:3,shadowOpacity:.08,shadowRadius:14,shadowOffset:{width:0,height:5}},
  paperHeader:{minHeight:105,borderBottomWidth:2,flexDirection:'row-reverse',alignItems:'center',paddingBottom:14,marginBottom:14},
  logo:{resizeMode:'contain',marginLeft:10}, logoPlaceholder:{width:48,height:48,borderRadius:24,borderWidth:2,alignItems:'center',justifyContent:'center',marginLeft:10}, logoMark:{fontSize:12,fontWeight:'900'},
  headerCenter:{flex:1,alignItems:'center'}, center:{fontSize:21,fontWeight:'900',textAlign:'center'}, directorate:{fontSize:11,marginTop:3,textAlign:'center'}, reportTitle:{fontSize:17,fontWeight:'900',marginTop:9,textAlign:'center'},
  headerStamp:{width:58,height:58,borderWidth:2,borderRadius:12,alignItems:'center',justifyContent:'center',marginRight:8},stampText:{fontWeight:'900',fontSize:15},stampSmall:{fontSize:7,marginTop:2,fontWeight:'800'},
  patientBox:{flexDirection:'row-reverse',flexWrap:'wrap',borderWidth:1,borderRadius:12,padding:7,marginBottom:16}, info:{width:'25%',padding:7,minWidth:120},infoWide:{width:'50%'},infoLabel:{fontSize:10,color:'#718078',textAlign:'right',fontWeight:'700'},infoValue:{fontSize:13,fontWeight:'900',textAlign:'right',marginTop:3,color:'#26332f'},
  section:{borderWidth:1,borderRadius:12,overflow:'hidden',marginBottom:14}, sectionHead:{flexDirection:'row-reverse',paddingVertical:9,paddingHorizontal:12,alignItems:'center'},sectionIcon:{fontSize:17,marginLeft:7},sectionTitle:{color:'#fff',fontSize:15,fontWeight:'900',textAlign:'right'},
  tableHead:{flexDirection:'row-reverse',paddingVertical:7,paddingHorizontal:8},headCell:{flex:1,textAlign:'right',fontSize:10,fontWeight:'900'},resultRow:{flexDirection:'row-reverse',paddingVertical:9,paddingHorizontal:8,borderTopWidth:1,borderTopColor:'#e6ebe8'},cell:{flex:1,textAlign:'right',fontSize:12},testCell:{fontWeight:'800'},valueCell:{fontWeight:'900',textAlign:'center'},normalCell:{fontSize:10,textAlign:'left'},
  notes:{borderWidth:1,borderRadius:10,padding:11,marginTop:4},notesTitle:{fontWeight:'900',textAlign:'right'},notesText:{marginTop:5,lineHeight:21,textAlign:'right'},footer:{borderTopWidth:1,marginTop:18,paddingTop:12,alignItems:'center'},footerText:{fontSize:11},footerCode:{fontSize:8,marginTop:3,fontWeight:'800'},
  actions:{flexDirection:'row-reverse',gap:10,marginTop:12},primaryBtn:{flex:1,paddingVertical:14,borderRadius:13,alignItems:'center'},btnText:{color:'#fff',fontWeight:'900'},secondaryBtn:{flex:1,paddingVertical:13,borderRadius:13,borderWidth:1,alignItems:'center'},secondaryText:{fontWeight:'900'},
  empty:{flex:1,alignItems:'center',justifyContent:'center'},emptyText:{fontSize:18,fontWeight:'900'},
});
