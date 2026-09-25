import React from 'react';
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { useLabStore } from '../store/useLabStore';
import { getColors } from '../styles/colors';

import HomeScreen from '../screens/HomeScreen';
import CatalogScreen from '../screens/CatalogScreen';
import PatientFormScreen from '../screens/PatientFormScreen';
import PatientReportScreen from '../screens/PatientReportScreen';
import ResultEntryScreen from '../screens/ResultEntryScreen';
import SettingsScreen from '../screens/SettingsScreen';
import StatsScreen from '../screens/StatsScreen';
import AuditScreen from '../screens/AuditScreen';
import AppearanceSettingsScreen from '../screens/AppearanceSettingsScreen';
import PrintSettingsScreen from '../screens/PrintSettingsScreen';
import MultiPrintScreen from '../screens/MultiPrintScreen';
import TestCatalogScreen from '../screens/TestCatalogScreen';
import TestPricesScreen from '../screens/TestPricesScreen';
import CriticalAlertsScreen from '../screens/CriticalAlertsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="HomeMain"
        component={HomeScreen}
      />

      <Stack.Screen
        name="PatientForm"
        component={PatientFormScreen}
      />

      <Stack.Screen
        name="PatientReport"
        component={PatientReportScreen}
      />

      <Stack.Screen
        name="ResultEntry"
        component={ResultEntryScreen}
      />

      <Stack.Screen
        name="Stats"
        component={StatsScreen}
      />

      <Stack.Screen
        name="MultiPrint"
        component={MultiPrintScreen}
      />

      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
      />

      <Stack.Screen name="TestCatalog" component={TestCatalogScreen} />
      <Stack.Screen name="TestPrices" component={TestPricesScreen} />
      <Stack.Screen name="CriticalAlerts" component={CriticalAlertsScreen} />

      <Stack.Screen
        name="Appearance"
        component={AppearanceSettingsScreen}
      />

      <Stack.Screen
        name="PrintSettings"
        component={PrintSettingsScreen}
      />

      <Stack.Screen
        name="Audit"
        component={AuditScreen}
      />
    </Stack.Navigator>
  );
}

function CatalogStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="CatalogMain"
        component={CatalogScreen}
      />

      <Stack.Screen
        name="PatientReport"
        component={PatientReportScreen}
      />

      <Stack.Screen
        name="PatientForm"
        component={PatientFormScreen}
      />

      <Stack.Screen
        name="ResultEntry"
        component={ResultEntryScreen}
      />

      <Stack.Screen name="MultiPrint" component={MultiPrintScreen} />
      <Stack.Screen name="TestCatalog" component={TestCatalogScreen} />
      <Stack.Screen name="TestPrices" component={TestPricesScreen} />
      <Stack.Screen name="CriticalAlerts" component={CriticalAlertsScreen} />
    </Stack.Navigator>
  );
}

function SettingsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="SettingsMain"
        component={SettingsScreen}
      />

      <Stack.Screen
        name="Appearance"
        component={AppearanceSettingsScreen}
      />

      <Stack.Screen
        name="PrintSettings"
        component={PrintSettingsScreen}
      />

      <Stack.Screen
        name="MultiPrint"
        component={MultiPrintScreen}
      />

      <Stack.Screen
        name="Audit"
        component={AuditScreen}
      />

      <Stack.Screen
        name="PatientReport"
        component={PatientReportScreen}
      />

      <Stack.Screen
        name="ResultEntry"
        component={ResultEntryScreen}
      />

      <Stack.Screen name="TestCatalog" component={TestCatalogScreen} />
      <Stack.Screen name="TestPrices" component={TestPricesScreen} />
      <Stack.Screen name="CriticalAlerts" component={CriticalAlertsScreen} />
    </Stack.Navigator>
  );
}

export default function Navigation() {
  const dark = useLabStore((s) => s.darkMode);
  const theme = useLabStore((s) => s.theme);

  const colors = getColors(dark, theme);

  return (
    <NavigationContainer
      theme={{
        dark,
        colors: {
          primary: colors.navy,
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
            height: 66,
            paddingTop: 6,
            paddingBottom: 7,
          },

          tabBarActiveTintColor: colors.navy,
          tabBarInactiveTintColor: colors.inkSub,

          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '700',
          },
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeStack}
          options={{
            tabBarLabel: 'الرئيسية',
            tabBarIcon: () => (
              <Text style={{ fontSize: 19 }}>⌂</Text>
            ),
          }}
        />

        <Tab.Screen
          name="Catalog"
          component={CatalogStack}
          options={{
            tabBarLabel: 'السجلات',
            tabBarIcon: () => (
              <Text style={{ fontSize: 18 }}>▤</Text>
            ),
          }}
        />

        <Tab.Screen
          name="Stats"
          component={StatsScreen}
          options={{
            tabBarLabel: 'الإحصائيات',
            tabBarIcon: () => (
              <Text style={{ fontSize: 18 }}>▥</Text>
            ),
          }}
        />

        <Tab.Screen
          name="Settings"
          component={SettingsStack}
          options={{
            tabBarLabel: 'الإعدادات',
            tabBarIcon: () => (
              <Text style={{ fontSize: 18 }}>⚙</Text>
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
} 
