import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useLabStore } from '../store/useLabStore';
import { getColors, THEME_PRESETS, ThemeType } from '../styles/colors';
import { resolveFontFamily, fontScale } from '../styles/design';
import { BORDER_RADIUS, SHADOWS } from '../styles/spacing';

export default function AppearanceSettingsScreen({ navigation }: any) {
  const dark = useLabStore((s) => s.darkMode);
  const theme = useLabStore((s) => s.theme);
  const fontSize = useLabStore((s) => s.fontSize);
  const fontFamily = useLabStore((s) => s.fontFamily);
  const density = useLabStore((s) => s.density);
  const toggleDark = useLabStore((s) => s.toggleDarkMode);
  const setTheme = useLabStore((s) => s.setTheme);
  const setFontSize = useLabStore((s) => s.setFontSize);
  const setFontFamily = useLabStore((s) => s.setFontFamily);
  const setDensity = useLabStore((s) => s.setDensity);

  const colors = getColors(dark, theme);
  const family = resolveFontFamily(fontFamily);
  const styles = createStyles(colors, family, fontScale(fontSize));

  const themes = Object.entries(THEME_PRESETS) as [ThemeType, {label:string;color:string}][];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}><Text style={styles.backText}>‹</Text></TouchableOpacity>
          <View style={{flex:1}}><Text style={styles.kicker}>التخصيص</Text><Text style={styles.title}>إعدادات المظهر</Text></View>
        </View>

        <Section title="الثيم والألوان" colors={colors} styles={styles}>
          <View style={styles.themeGrid}>
            {themes.map(([key, item]) => (
              <TouchableOpacity key={key} onPress={() => setTheme(key)} style={[styles.themeCard, theme === key && styles.selected]}>
                <View style={[styles.swatch, {backgroundColor:item.color}]} />
                <Text style={styles.themeLabel}>{item.label}</Text>
                {theme === key && <View style={styles.check}><Text style={styles.checkText}>✓</Text></View>}
              </TouchableOpacity>
            ))}
          </View>
          <SettingRow label="الوضع الداكن" description="مظهر مريح للإضاءة المنخفضة" value={dark} onChange={toggleDark} colors={colors} styles={styles}/>
        </Section>

        <Section title="الخط" colors={colors} styles={styles}>
          <Text style={styles.help}>اختر نوع الخط الذي سيستخدمه التطبيق في الواجهات.</Text>
          <ChoiceRow value={fontFamily} onChange={setFontFamily} items={[
            ['sans','Sans — واضح'], ['serif','Serif — كلاسيكي'], ['mono','Mono — تقني'],
          ]} styles={styles}/>
        </Section>

        <Section title="حجم الخط" colors={colors} styles={styles}>
          <ChoiceRow value={fontSize} onChange={setFontSize} items={[
            ['small','صغير'], ['medium','متوسط'], ['large','كبير'],
          ]} styles={styles}/>
          <View style={styles.preview}><Text style={styles.previewSmall}>معاينة النص</Text><Text style={styles.previewMain}>تقرير الفحوصات المخبرية</Text></View>
        </Section>

        <Section title="كثافة الواجهة" colors={colors} styles={styles}>
          <ChoiceRow value={density} onChange={setDensity} items={[
            ['comfortable','مريح'], ['compact','مضغوط'],
          ]} styles={styles}/>
          <Text style={styles.help}>تؤثر على المسافات بين البطاقات والعناصر في الواجهات الجديدة.</Text>
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({title,children,styles}:{title:string;children:any;colors:any;styles:any}) {
  return <View style={styles.section}><Text style={styles.sectionTitle}>{title}</Text>{children}</View>;
}
function SettingRow({label,description,value,onChange,styles}:{label:string;description:string;value:boolean;onChange:()=>void;colors:any;styles:any}) {
  return <View style={styles.row}><View style={{flex:1}}><Text style={styles.label}>{label}</Text><Text style={styles.help}>{description}</Text></View><Switch value={value} onValueChange={onChange}/></View>;
}
function ChoiceRow({value,onChange,items,styles}:{value:any;onChange:(v:any)=>void;items:[string,string][];styles:any}) {
  return <View style={styles.choices}>{items.map(([k,l])=><TouchableOpacity key={k} onPress={()=>onChange(k)} style={[styles.choice,value===k&&styles.choiceActive]}><Text style={[styles.choiceText,value===k&&styles.choiceTextActive]}>{l}</Text></TouchableOpacity>)}</View>;
}

const createStyles=(colors:any,fontFamily:string,scale:number)=>StyleSheet.create({
  container:{flex:1,backgroundColor:colors.paper},content:{paddingBottom:36},
  header:{backgroundColor:colors.headerBg,padding:18,flexDirection:'row',alignItems:'center'},back:{width:40,height:40,borderRadius:12,backgroundColor:'rgba(255,255,255,.12)',alignItems:'center',justifyContent:'center',marginRight:12},backText:{color:'#fff',fontSize:30},kicker:{color:'#B7E8E2',fontSize:11*scale,fontWeight:'700',fontFamily},title:{color:'#fff',fontSize:23*scale,fontWeight:'900',fontFamily,marginTop:2},
  section:{margin:14,padding:16,backgroundColor:colors.panel,borderRadius:18,borderWidth:1,borderColor:colors.line,...SHADOWS.sm},sectionTitle:{fontSize:16*scale,fontWeight:'900',color:colors.ink,fontFamily,marginBottom:14},themeGrid:{flexDirection:'row',flexWrap:'wrap',gap:10},themeCard:{width:'31.5%',padding:10,borderRadius:14,borderWidth:1,borderColor:colors.line,alignItems:'center',position:'relative'},selected:{borderColor:colors.navy,borderWidth:2},swatch:{width:42,height:42,borderRadius:14,marginBottom:8},themeLabel:{fontSize:10*scale,color:colors.ink,fontWeight:'700',fontFamily,textAlign:'center'},check:{position:'absolute',top:5,right:5,width:20,height:20,borderRadius:10,backgroundColor:colors.navy,alignItems:'center',justifyContent:'center'},checkText:{color:'#fff',fontSize:12,fontWeight:'900'},row:{flexDirection:'row',alignItems:'center',paddingVertical:8},label:{fontSize:14*scale,color:colors.ink,fontWeight:'800',fontFamily},help:{fontSize:11*scale,color:colors.inkSub,fontFamily,lineHeight:18},choices:{flexDirection:'row',gap:8,flexWrap:'wrap'},choice:{flex:1,minWidth:90,paddingVertical:12,borderRadius:13,borderWidth:1,borderColor:colors.line,alignItems:'center',backgroundColor:colors.paper},choiceActive:{backgroundColor:colors.navy,borderColor:colors.navy},choiceText:{color:colors.ink,fontSize:12*scale,fontWeight:'700',fontFamily},choiceTextActive:{color:'#fff'},preview:{marginTop:14,padding:14,borderRadius:14,backgroundColor:colors.paper,borderWidth:1,borderColor:colors.line},previewSmall:{color:colors.inkSub,fontSize:11*scale,fontFamily},previewMain:{color:colors.ink,fontSize:18*scale,fontWeight:'900',fontFamily,marginTop:5}
});
