import React, { useMemo, useRef, useState } from 'react';
import { PanResponder, SafeAreaView, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useLabStore } from '../store/useLabStore';
import { getColors, THEME_PRESETS, ThemeType } from '../styles/colors';
import { resolveFontFamily, fontScale } from '../styles/design';
import { SHADOWS } from '../styles/spacing';

const MIN_SCALE = 0.85;
const MAX_SCALE = 1.30;
const DEFAULT_SCALE = 1;

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

  const currentScale = typeof fontSize === 'number'
    ? Math.max(MIN_SCALE, Math.min(MAX_SCALE, fontSize))
    : fontScale(fontSize);
  const [trackWidth, setTrackWidth] = useState(1);
  const colors = getColors(dark, theme);
  const family = resolveFontFamily(fontFamily);
  const scale = currentScale;
  const styles = createStyles(colors, family, scale);
  const themes = Object.entries(THEME_PRESETS) as [ThemeType, { label: string; color: string }][];
  const sliderRef = useRef<View>(null);

  const setFromPosition = (x: number) => {
    const usable = Math.max(1, trackWidth - 24);
    const clamped = Math.max(0, Math.min(usable, x - 12));
    const next = MIN_SCALE + (clamped / usable) * (MAX_SCALE - MIN_SCALE);
    setFontSize(Number(next.toFixed(2)));
  };

  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (e) => setFromPosition(e.nativeEvent.locationX),
    onPanResponderMove: (e) => setFromPosition(e.nativeEvent.locationX),
  }), [trackWidth]);

  const percent = Math.round(scale * 100);
  const handleLeft = `${((scale - MIN_SCALE) / (MAX_SCALE - MIN_SCALE)) * 100}%` as any;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}><Text style={styles.backText}>‹</Text></TouchableOpacity>
          <View style={{ flex: 1 }}><Text style={styles.kicker}>التخصيص</Text><Text style={styles.title}>إعدادات المظهر</Text></View>
        </View>

        <Section title="الثيم والألوان" styles={styles}>
          <View style={styles.themeGrid}>
            {themes.map(([key, item]) => (
              <TouchableOpacity key={key} onPress={() => setTheme(key)} style={[styles.themeCard, theme === key && styles.selected]}>
                <View style={[styles.swatch, { backgroundColor: item.color }]} />
                <Text style={styles.themeLabel}>{item.label}</Text>
                {theme === key && <View style={styles.check}><Text style={styles.checkText}>✓</Text></View>}
              </TouchableOpacity>
            ))}
          </View>
          <SettingRow label="الوضع الداكن" description="مظهر مريح للإضاءة المنخفضة" value={dark} onChange={toggleDark} styles={styles} />
        </Section>

        <Section title="حجم الخط" styles={styles}>
          <View style={styles.sliderHeader}>
            <Text style={styles.help}>اسحب المؤشر لتكبير أو تصغير خط التطبيق بالكامل.</Text>
            <Text style={styles.percent}>{percent}%</Text>
          </View>
          <View
            ref={sliderRef}
            onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
            style={styles.sliderTrack}
            {...panResponder.panHandlers}
          >
            <View style={[styles.sliderFill, { width: handleLeft }]} />
            <View style={[styles.sliderHandle, { left: handleLeft }]} />
          </View>
          <View style={styles.sliderLabels}><Text style={styles.sliderLabel}>صغير</Text><Text style={styles.sliderLabel}>متوسط</Text><Text style={styles.sliderLabel}>كبير</Text></View>
          <View style={styles.preview}><Text style={styles.previewSmall}>هذه معاينة لحجم الخط</Text><Text style={styles.previewMain}>تقرير الفحوصات المخبرية</Text><Text style={styles.previewSmall}>اسم المريض • رقم السجل • النتائج</Text></View>
        </Section>

        <Section title="نوع الخط" styles={styles}>
          <ChoiceRow value={fontFamily} onChange={setFontFamily} items={[['sans', 'Sans — واضح'], ['serif', 'Serif — كلاسيكي'], ['mono', 'Mono — تقني']]} styles={styles} />
        </Section>

        <Section title="كثافة الواجهة" styles={styles}>
          <ChoiceRow value={density} onChange={setDensity} items={[['comfortable', 'مريح'], ['compact', 'مضغوط']]} styles={styles} />
          <Text style={styles.help}>تتحكم بمسافات البطاقات والعناصر.</Text>
        </Section>

        <TouchableOpacity onPress={() => setFontSize(DEFAULT_SCALE)} style={styles.resetButton}>
          <Text style={styles.resetText}>إرجاع حجم الخط إلى 100%</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children, styles }: any) { return <View style={styles.section}><Text style={styles.sectionTitle}>{title}</Text>{children}</View>; }
function SettingRow({ label, description, value, onChange, styles }: any) { return <View style={styles.row}><View style={{ flex: 1 }}><Text style={styles.label}>{label}</Text><Text style={styles.help}>{description}</Text></View><Switch value={value} onValueChange={onChange} /></View>; }
function ChoiceRow({ value, onChange, items, styles }: any) { return <View style={styles.choices}>{items.map(([k, l]: [string, string]) => <TouchableOpacity key={k} onPress={() => onChange(k)} style={[styles.choice, value === k && styles.choiceActive]}><Text style={[styles.choiceText, value === k && styles.choiceTextActive]}>{l}</Text></TouchableOpacity>)}</View>; }

const createStyles = (c: any, fontFamily: string, scale: number) => StyleSheet.create({
  container:{flex:1,backgroundColor:c.paper},content:{paddingBottom:36},header:{backgroundColor:c.headerBg,padding:18,flexDirection:'row',alignItems:'center'},back:{width:40,height:40,borderRadius:12,backgroundColor:'rgba(255,255,255,.12)',alignItems:'center',justifyContent:'center',marginRight:12},backText:{color:'#fff',fontSize:30},kicker:{color:'#B7E8E2',fontSize:11*scale,fontWeight:'700',fontFamily},title:{color:'#fff',fontSize:23*scale,fontWeight:'900',fontFamily,marginTop:2},
  section:{margin:14,padding:16,backgroundColor:c.panel,borderRadius:18,borderWidth:1,borderColor:c.line,...SHADOWS.sm},sectionTitle:{fontSize:16*scale,fontWeight:'900',color:c.ink,fontFamily,marginBottom:14},row:{flexDirection:'row',alignItems:'center',paddingVertical:4},label:{fontSize:13*scale,fontWeight:'900',color:c.ink,fontFamily},help:{fontSize:11*scale,color:c.inkSub,fontFamily,lineHeight:18,marginTop:3},themeGrid:{flexDirection:'row',flexWrap:'wrap',gap:10},themeCard:{width:'31.5%',padding:10,borderRadius:14,borderWidth:1,borderColor:c.line,backgroundColor:c.paper,alignItems:'center',position:'relative'},selected:{borderColor:c.navy,borderWidth:2},swatch:{width:34,height:34,borderRadius:17,marginBottom:6},themeLabel:{fontSize:10*scale,color:c.ink,fontFamily,fontWeight:'800',textAlign:'center'},check:{position:'absolute',top:5,right:5,width:21,height:21,borderRadius:11,backgroundColor:c.navy,alignItems:'center',justifyContent:'center'},checkText:{color:'#fff',fontWeight:'900'},
  sliderHeader:{flexDirection:'row',alignItems:'center',gap:8},percent:{color:c.navy,fontSize:16*scale,fontWeight:'900',fontFamily},sliderTrack:{height:14,borderRadius:8,backgroundColor:c.line,marginTop:15,position:'relative',justifyContent:'center'},sliderFill:{position:'absolute',left:0,top:0,bottom:0,borderRadius:8,backgroundColor:c.navy},sliderHandle:{position:'absolute',top:-5,width:24,height:24,borderRadius:12,backgroundColor:c.panel,borderWidth:3,borderColor:c.navy,marginLeft:-12},sliderLabels:{flexDirection:'row',justifyContent:'space-between',marginTop:7},sliderLabel:{fontSize:10*scale,color:c.inkSub,fontFamily},preview:{marginTop:16,padding:14,borderRadius:14,backgroundColor:c.paper,borderWidth:1,borderColor:c.line},previewSmall:{color:c.inkSub,fontFamily,fontSize:11*scale},previewMain:{color:c.ink,fontFamily,fontSize:19*scale,fontWeight:'900',marginVertical:7},choices:{flexDirection:'row',gap:8},choice:{flex:1,minHeight:44,borderRadius:13,borderWidth:1,borderColor:c.line,backgroundColor:c.paper,alignItems:'center',justifyContent:'center'},choiceActive:{backgroundColor:c.navy,borderColor:c.navy},choiceText:{fontSize:11*scale,fontWeight:'800',color:c.ink,fontFamily,textAlign:'center'},choiceTextActive:{color:'#fff'},resetButton:{marginHorizontal:14,minHeight:48,borderRadius:14,borderWidth:1,borderColor:c.line,backgroundColor:c.panel,alignItems:'center',justifyContent:'center'},resetText:{color:c.navy,fontSize:12*scale,fontWeight:'900',fontFamily}
});
