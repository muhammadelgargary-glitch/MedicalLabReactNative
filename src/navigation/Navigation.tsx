export const NAVIGATION_UPDATED = `
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { =================
// 📱  } from '@react-navigation/bottom-tabs';
import { useLabStore } from '../store/useLabStore';
import { getColors } from '../styles/colors';

// Screens
import HomeScreen from '../screens/HomeScreen';
import CatalogScreen from '../screens/CatalogScreen';
import PatientFormScreen from '../screens/PatientFormScreen';
import PatientReportScreen from '../screens/PatientReportScreen';
import SettingsScreen from '../screens/SettingsScreen';
import StatsScreen from '../screens/StatsScreen';
import AuditScreen from '../screens/AuditScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function CatalogStack() {
  const isDark = useLabStore((s) => s.darkMode);
  const themeType = useLabStore((s) => s.theme);
  const colors = getColors(isDark, themeType);

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: colors.paper },
      }}
    >
      <Stack.Screen name="CatalogMain" component={CatalogScreen} />
      <Stack.Screen name="PatientReport" component={PatientReportScreen} />
      <Stack.Screen name="PatientForm" component={PatientFormScreen} />
    </Stack.Navigator>
  );
}

function HomeStack() {
  const isDark = useLabStore((s) => s.darkMode);
  const themeType = useLabStore((s) => s.theme);
  const colors = getColors(isDark, themeType);

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: colors.paper },
      }}
    >
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="PatientForm" component={PatientFormScreen} />
      <Stack.Screen name="PatientReport" component={PatientReportScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Stats" component={StatsScreen} />
    </Stack.Navigator>
  );
}

function SettingsStack() {
  const isDark = useLabStore((s) => s.darkMode);
  const themeType = useLabStore((s) => s.theme);
  const colors = getColors(isDark, themeType);

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: colors.paper },
      }}
    >
      <Stack.Screen name="SettingsMain" component={SettingsScreen} />
      <Stack.Screen name="Audit" component={AuditScreen} />
    </Stack.Navigator>
  );
}

export default function Navigation() {
  const isDark = useLabStore((s) => s.darkMode);
  const themeType = useLabStore((s) => s.theme);
  const colors = getColors(isDark, themeType);

  return (
    <NavigationContainer
      theme={{
        dark: isDark,
        colors: {
          primary: colors.seal,
          background: colors.paper,
          card: colors.panel,
          text: colors.ink,
          border: colors.line,
          notification: colors.danger,
        },
      }}
    >
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colors.panel,
            borderTopColor: colors.line,
            paddingBottom: 8,
            paddingTop: 8,
            height: 65,
          },
          tabBarActiveTintColor: colors.seal,
          tabBarInactiveTintColor: colors.inkSub,
          tabBarLabelStyle: {
            fontSize: 11,
            fontFamily: 'Tajawal',
          },
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeStack}
          options={{
            tabBarLabel: 'الرئيسية',
            tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>🏠</Text>,
          }}
        />
        <Tab.Screen
          name="Catalog"
          component={CatalogStack}
          options={{
            tabBarLabel: 'السجلات',
            tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>📋</Text>,
          }}
        />
        <Tab.Screen
          name="Stats"
          component={StatsScreen}
          options={{
            tabBarLabel: 'الإحصائيات',
            tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>📊</Text>,
          }}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsStack}
          options={{
            tabBarLabel: 'الإعدادات',
            tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>⚙️</Text>,
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
`;
