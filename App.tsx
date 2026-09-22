import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>سجل المختبر الطبي</Text>
      <Text style={styles.text}>تم تشغيل تطبيق Web بنجاح ✅</Text>
      <Text style={styles.text}>
        إذا ظهرت هذه الصفحة، فالمشكلة داخل أحد ملفات التطبيق وليست في GitHub Pages.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  text: {
    fontSize: 17,
    textAlign: 'center',
    marginBottom: 10,
  },
});
