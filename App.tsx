import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useLabStore } from './src/store/useLabStore';
import HomeScreen from './src/screens/HomeScreen';
import PatientFormScreen from './src/screens/PatientFormScreen';
import PatientReportScreen from './src/screens/PatientReportScreen';
import StatsScreen from './src/screens/StatsScreen';
import AuditScreen from './src/screens/AuditScreen';
import CatalogScreen from './src/screens/CatalogScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { configureGoogleSignIn } from './src/services/googleDriveService';

// منع إخفاء splash screen تلقائياً
SplashScreen.preventAutoHideAsync().catch((_) => {});

const Stack = createNativeStackNavigator();

/**
 * شاشة القائمة الرئيسية
 * تعرض روابط سريعة للإحصائيات والإعدادات وغيرها
 */
function HomeMenu({ navigation }: any) {
  return (
    <ScrollView style={styles.menu} contentContainerStyle={{ paddingBottom: 20 }}>
      <Text style={styles.menuTitle}>سجل المختبر الطبي</Text>
      {[
        ['📊', 'الإحصائيات', 'Stats'],
        ['📝', 'سجل التعديلات', 'Audit'],
        ['🗂', 'دليل الفحوصات', 'Catalog'],
        ['⚙', 'إعدادات المختبر', 'Settings'],
      ].map(([icon, label, route]) => (
        <TouchableOpacity
          key={route}
          style={styles.menuItem}
          onPress={() => navigation.navigate(route)}
          activeOpacity={0.7}
        >
          <Text style={styles.menuItemText}>
            {icon} {label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

/**
 * App الرئيسي
 * يتعامل مع:
 * - تحميل الخطوط العربية
 * - تحميل البيانات من AsyncStorage
 * - إعدادات Google Sign-In
 * - الملاحة بين الشاشات
 */
export default function App() {
  const hydrate = useLabStore((s) => s.hydrate);
  const hydrated = useLabStore((s) => s.hydrated);
  const dark = useLabStore((s) => s.settings.darkMode);

  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // تحميل الخطوط العربية
        await Font.loadAsync({
          'Tajawal': require('./assets/fonts/Tajawal-Regular.ttf'),
          'Tajawal-Bold': require('./assets/fonts/Tajawal-Bold.ttf'),
        });
        setFontsLoaded(true);
      } catch (e) {
        console.warn('خطأ في تحميل الخطوط:', e);
        setFontsLoaded(true); // متابعة حتى بدون خطوط
      }
    }

    prepare();
  }, []);

  useEffect(() => {
    async function loadAppData() {
      try {
        // تحميل البيانات من التخزين المحلي
        await hydrate();

        // محاولة تكوين Google Sign-In
        try {
          await configureGoogleSignIn();
        } catch (error) {
          console.warn('تحذير: لم يتم تكوين Google Sign-In:', error);
          // تابع العمل حتى لو فشل Google Sign-In
        }

        setAppReady(true);
      } catch (e) {
        console.warn('خطأ في تحميل البيانات:', e);
        setAppReady(true); // متابعة حتى بدون بيانات
      } finally {
        // إخفاء splash screen بعد التحضير
        await SplashScreen.hideAsync().catch((_) => {});
      }
    }

    if (fontsLoaded) {
      loadAppData();
    }
  }, [fontsLoaded, hydrate]);

  // شاشة التحميل
  if (!fontsLoaded || !appReady || !hydrated) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1d3b36" />
        <Text style={styles.loadingText}>جاري تحميل بيانات المختبر...</Text>
      </View>
    );
  }

  // اختيار المظهر (فاتح/غامق)
  const theme = dark
    ? { ...DarkTheme, colors: { ...DarkTheme.colors, primary: '#8bb8ad' } }
    : DefaultTheme;

  return (
    <NavigationContainer theme={theme}>
      <StatusBar style={dark ? 'light' : 'dark'} />
      <Stack.Navigator
        screenOptions={{
          headerTitleAlign: 'center',
          headerBackTitle: 'رجوع',
          animationEnabled: true,
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={({ navigation }) => ({
            title: 'سجل المختبر',
            headerRight: () => (
              <TouchableOpacity
                onPress={() => navigation.navigate('Menu')}
                style={{ marginRight: 15 }}
              >
                <Text style={{ fontSize: 24 }}>☰</Text>
              </TouchableOpacity>
            ),
          })}
        />
        <Stack.Screen
          name="Menu"
          component={HomeMenu}
          options={{ title: 'القائمة' }}
        />
        <Stack.Screen
          name="PatientForm"
          component={PatientFormScreen}
          options={{ title: 'إضافة / تعديل مريض' }}
        />
        <Stack.Screen
          name="PatientReport"
          component={PatientReportScreen}
          options={{ title: 'التقرير المخبري' }}
        />
        <Stack.Screen
          name="Stats"
          component={StatsScreen}
          options={{ title: 'الإحصائيات' }}
        />
        <Stack.Screen
          name="Audit"
          component={AuditScreen}
          options={{ title: 'سجل التعديلات' }}
        />
        <Stack.Screen
          name="Catalog"
          component={CatalogScreen}
          options={{ title: 'دليل الفحوصات' }}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ title: 'إعدادات المختبر' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f4f7f6',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: '#1d3b36',
    fontWeight: '600',
    marginTop: 12,
  },
  menu: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f4f7f6',
  },
  menuTitle: {
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'right',
    color: '#1d3b36',
    marginBottom: 18,
  },
  menuItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 14,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  menuItemText: {
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'right',
    color: '#1d3b36',
  },
});
