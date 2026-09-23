export const APP_TSX_UPDATED = `
import React, { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import Navigation from './src/navigation/Navigation';
import { useLabStore } from './src/store/useLabStore';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const loadFromStorage = useLabStore((s) => s.loadFromStorage);

  useEffect(() => {
    async function prepare() {
      try {
        // تحميل الخطوط
        await Font.loadAsync({
          'Tajawal': require('./assets/fonts/Tajawal-Regular.ttf'),
          'Tajawal-Bold': require('./assets/fonts/Tajawal-Bold.ttf'),
          'Tajawal-ExtraBold': require('./assets/fonts/Tajawal-ExtraBold.ttf'),
        });

        // تحميل البيانات من التخزين
        await loadFromStorage();

        setFontsLoaded(true);
      } catch (e) {
        console.warn(e);
      } finally {
        await SplashScreen.hideAsync();
      }
    }

    prepare();
  }, [loadFromStorage]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <Navigation />
    </SafeAreaProvider>
  );
}
`; 
