import React, {useEffect} from 'react';
import {
  ActivityIndicator,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';

import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
} from '@react-navigation/native';

import {
  createNativeStackNavigator,
} from '@react-navigation/native-stack';

import {StatusBar} from 'expo-status-bar';

import {useLabStore} from './src/store/useLabStore';

import HomeScreen from './src/screens/HomeScreen';
import PatientFormScreen from './src/screens/PatientFormScreen';
import PatientReportScreen from './src/screens/PatientReportScreen';
import StatsScreen from './src/screens/StatsScreen';
import AuditScreen from './src/screens/AuditScreen';
import CatalogScreen from './src/screens/CatalogScreen';
import SettingsScreen from './src/screens/SettingsScreen';

import {
  configureGoogleSignIn,
} from './src/services/googleDriveService';

const Stack = createNativeStackNavigator();

function HomeMenu({navigation}: any) {
  return (
    <View style={styles.menu}>
      <Text style={styles.menuTitle}>
        سجل المختبر الطبي
      </Text>

      {[
        ['📊', 'الإحصائيات', 'Stats'],
        ['📝', 'سجل التعديلات', 'Audit'],
        ['🗂', 'دليل الفحوصات', 'Catalog'],
        ['⚙', 'إعدادات المختبر', 'Settings'],
      ].map(([i, t, r]) => (
        <TouchableOpacity
          key={r}
          style={styles.item}
          onPress={() =>
            navigation.navigate(r)
          }
        >
          <Text style={styles.itemText}>
            {i} {t}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function App() {
  const hydrate = useLabStore(
    s => s.hydrate,
  );

  const hydrated = useLabStore(
    s => s.hydrated,
  );

  const dark = useLabStore(
    s => s.settings.darkMode,
  );

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await hydrate();
      } catch (error) {
        console.log(
          'HYDRATE ERROR:',
          error,
        );
      }

      /*
       * Google Sign-In Native يعمل فقط
       * داخل Android / iOS.
       *
       * لا نحاول تهيئته على GitHub Pages Web.
       */
      if (
        Platform.OS === 'android' ||
        Platform.OS === 'ios'
      ) {
        try {
          await configureGoogleSignIn();
        } catch (error) {
          console.log(
            'GOOGLE CONFIG ERROR:',
            error,
          );
        }
      }
    };

    initializeApp();
  }, []);

  if (!hydrated) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" />

        <Text>
          جاري تحميل بيانات المختبر...
        </Text>
      </View>
    );
  }

  const theme = dark
    ? {
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          primary: '#8bb8ad',
        },
      }
    : DefaultTheme;

  return (
    <NavigationContainer theme={theme}>
      <StatusBar
        style={
          dark
            ? 'light'
            : 'dark'
        }
      />

      <Stack.Navigator
        screenOptions={{
          headerTitleAlign: 'center',
          headerBackTitle: 'رجوع',
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={({navigation}) => ({
            title: 'سجل المختبر',

            headerRight: () => (
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate(
                    'Menu',
                  )
                }
              >
                <Text
                  style={{
                    fontSize: 22,
                  }}
                >
                  ☰
                </Text>
              </TouchableOpacity>
            ),
          })}
        />

        <Stack.Screen
          name="Menu"
          component={HomeMenu}
          options={{
            title: 'القائمة',
          }}
        />

        <Stack.Screen
          name="PatientForm"
          component={PatientFormScreen}
          options={{
            title:
              'إضافة / تعديل مريض',
          }}
        />

        <Stack.Screen
          name="PatientReport"
          component={
            PatientReportScreen
          }
          options={{
            title:
              'التقرير المخبري',
          }}
        />

        <Stack.Screen
          name="Stats"
          component={StatsScreen}
          options={{
            title: 'الإحصائيات',
          }}
        />

        <Stack.Screen
          name="Audit"
          component={AuditScreen}
          options={{
            title:
              'سجل التعديلات',
          }}
        />

        <Stack.Screen
          name="Catalog"
          component={CatalogScreen}
          options={{
            title:
              'دليل الفحوصات',
          }}
        />

        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            title:
              'إعدادات المختبر',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
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

  item: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 14,
    marginBottom: 10,
  },

  itemText: {
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'right',
  },
});
