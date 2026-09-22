import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
} from 'react-native';

import {
  TEST_SECTIONS,
  SectionKey,
} from '../utils/constants';

export default function SectionCard({
  section,
  value,
  onChange,
}: {
  section: SectionKey;
  value: any;
  onChange: (v: any) => void;
}) {
  const sec = TEST_SECTIONS[section];

  const data = value || {};

  const updateField = (
    fieldKey: string,
    text: string
  ) => {
    onChange({
      ...data,
      [fieldKey]: text,
    });
  };

  return (
    <View style={styles.card}>

      {/* عنوان القسم */}
      <View style={styles.header}>
        <Text style={styles.icon}>
          {sec.icon}
        </Text>

        <Text style={styles.title}>
          {sec.label}
        </Text>
      </View>

      {/* الحقول */}
      {sec.fields.map((f, index) => {
        const currentValue = String(
          data?.[f.key] ?? ''
        );

        return (
          <View
            key={f.key}
            style={[
              styles.row,
              index === 0 && styles.firstRow,
            ]}
          >

            {/* اسم الفحص + الطبيعي */}
            <View style={styles.info}>
              <Text style={styles.label}>
                {f.label}
              </Text>

              <Text style={styles.normal}>
                الطبيعي: {f.normal}
              </Text>
            </View>

            {/* النتيجة */}
            <View style={styles.inputWrap}>
              <Text style={styles.resultLabel}>
                النتيجة
              </Text>

              <TextInput
                value={currentValue}
                onChangeText={text =>
                  updateField(f.key, text)
                }
                style={styles.input}
                placeholder="أدخل النتيجة"
                placeholderTextColor="#999"
                textAlign="right"
                autoCorrect={false}
                autoCapitalize="none"
              />
            </View>

          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e1e6e4',
  },

  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#edf0ef',
  },

  icon: {
    fontSize: 21,
    marginLeft: 7,
  },

  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '900',
    color: '#1d3b36',
    textAlign: 'right',
  },

  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#edf0ef',
    paddingVertical: 10,
  },

  firstRow: {
    borderTopWidth: 0,
  },

  info: {
    flex: 1,
    minWidth: 0,
  },

  label: {
    fontWeight: '800',
    fontSize: 15,
    color: '#263632',
    textAlign: 'right',
  },

  normal: {
    fontSize: 11,
    color: '#777',
    textAlign: 'right',
    marginTop: 3,
    lineHeight: 16,
  },

  inputWrap: {
    width: 145,
  },

  resultLabel: {
    fontSize: 11,
    color: '#777',
    textAlign: 'right',
    marginBottom: 4,
  },

  input: {
    width: '100%',
    minHeight: 44,
    borderWidth: 1,
    borderColor: '#ccd5d1',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 9,
    textAlign: 'right',
    backgroundColor: '#fafcfc',
    color: '#222',
    fontSize: 14,
  },

});
