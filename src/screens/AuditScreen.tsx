// src/screens/AuditScreen.tsx - سجل التدقيق/الفعاليات

import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useLabStore } from '../store/useLabStore';
import { createTheme } from '../styles/theme';
import { getColors } from '../styles/colors';
import { SPACING, BORDER_RADIUS, SHADOWS, FLEX_CENTERS } from '../styles/spacing';
import ThemedButton from '../components/ThemedButton';
import { displayDate } from '../utils/helpers';

interface AuditScreenProps {
  navigation: any;
}

export default function AuditScreen({ navigation }: AuditScreenProps) {
  const auditLog = useLabStore((s) => s.auditLog);
  const clearAuditLog = useLabStore((s) => s.clearAuditLog);
  const isDark = useLabStore((s) => s.darkMode);
  const themeType = useLabStore((s) => s.theme);

  const [filterAction, setFilterAction] = useState<string | null>(null);

  const colors = getColors(isDark, themeType);
  const styles = createStyles(colors);

  // Filter logs
  const filteredLogs = useMemo(() => {
    if (!filterAction) return auditLog;
    return auditLog.filter((log) => log.action.includes(filterAction));
  }, [auditLog, filterAction]);

  // Group by date
  const groupedLogs = useMemo(() => {
    const groups: Record<string, typeof auditLog> = {};
    filteredLogs.forEach((log) => {
      const date = log.timestamp.split('T')[0];
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(log);
    });
    return groups;
  }, [filteredLogs]);

  const handleClearLog = () => {
    Alert.alert('تأكيد', 'هل تريد حذف جميع السجلات؟', [
      { text: 'إلغاء' },
      {
        text: 'حذف',
        onPress: async () => {
          await clearAuditLog();
          Alert.alert('تم', 'تم حذف جميع السجلات');
        },
        style: 'destructive',
      },
    ]);
  };

  const actions = ['إضافة مريض', 'تحديث مريض', 'حذف مريض'];

  return (
    <SafeAreaView style={styles.container}>
      {/* ===== HEADER ===== */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📋 سجل الفعاليات</Text>
        <Text style={styles.headerSubtitle}>({auditLog.length} عملية)</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* ===== FILTER SECTION ===== */}
        <View style={styles.filterSection}>
          <Text style={styles.filterTitle}>الفلترة حسب النوع:</Text>
          <View style={styles.filterChips}>
            <TouchableOpacity
              style={[
                styles.filterChip,
                !filterAction && styles.filterChipActive,
              ]}
              onPress={() => setFilterAction(null)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  !filterAction && styles.filterChipTextActive,
                ]}
              >
                الكل
              </Text>
            </TouchableOpacity>

            {actions.map((action) => (
              <TouchableOpacity
                key={action}
                style={[
                  styles.filterChip,
                  filterAction === action && styles.filterChipActive,
                ]}
                onPress={() => setFilterAction(action)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    filterAction === action && styles.filterChipTextActive,
                  ]}
                >
                  {action}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ===== LOGS LIST ===== */}
        {filteredLogs.length > 0 ? (
          Object.entries(groupedLogs)
            .sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
            .map(([date, logs]) => (
              <View key={date} style={styles.dateGroup}>
                <Text style={styles.dateLabel}>{displayDate(date)}</Text>

                <View style={styles.logsContainer}>
                  {logs
                    .sort(
                      (a, b) =>
                        new Date(b.timestamp).getTime() -
                        new Date(a.timestamp).getTime()
                    )
                    .map((log, index) => (
                      <View key={index} style={styles.logItem}>
                        <View style={styles.logLeft}>
                          <Text style={styles.logAction}>
                            {getActionIcon(log.action)} {log.action}
                          </Text>
                          <Text style={styles.logPatient}>{log.patientName}</Text>
                        </View>

                        <Text style={styles.logTime}>
                          {new Date(log.timestamp).toLocaleTimeString('ar-SA')}
                        </Text>
                      </View>
                    ))}
                </View>
              </View>
            ))
        ) : (
          <View style={[styles.emptyState, FLEX_CENTERS.center]}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyText}>لا توجد عمليات مسجلة</Text>
          </View>
        )}
      </ScrollView>

      {/* ===== ACTION BUTTONS ===== */}
      {auditLog.length > 0 && (
        <View style={styles.actionsContainer}>
          <ThemedButton
            title="حذف جميع السجلات"
            variant="danger"
            size="lg"
            icon="🗑️"
            onPress={handleClearLog}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

// ===== Helper Function =====
function getActionIcon(action: string): string {
  if (action.includes('إضافة')) return '➕';
  if (action.includes('تحديث')) return '✏️';
  if (action.includes('حذف')) return '🗑️';
  return '📝';
}

// ===== STYLES =====
const createStyles = (colors: ReturnType<typeof getColors>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.paper,
    },
    contentContainer: {
      paddingBottom: SPACING[8],
    },

    // ===== Header =====
    header: {
      backgroundColor: colors.headerBg,
      paddingHorizontal: SPACING[4],
      paddingVertical: SPACING[4],
      marginBottom: SPACING[4],
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: '900',
      color: colors.headerText,
      fontFamily: 'Tajawal-Bold',
    },
    headerSubtitle: {
      fontSize: 13,
      color: colors.headerText,
      opacity: 0.7,
      marginTop: SPACING[1],
      fontFamily: 'Tajawal',
    },

    // ===== Filter Section =====
    filterSection: {
      paddingHorizontal: SPACING[4],
      marginBottom: SPACING[4],
    },
    filterTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.ink,
      marginBottom: SPACING[2],
      fontFamily: 'Tajawal-Bold',
    },
    filterChips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: SPACING[1],
    },
    filterChip: {
      paddingHorizontal: SPACING[2],
      paddingVertical: SPACING[1],
      borderRadius: BORDER_RADIUS.full,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.panel,
    },
    filterChipActive: {
      backgroundColor: colors.seal,
      borderColor: colors.seal,
    },
    filterChipText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.ink,
      fontFamily: 'Tajawal',
    },
    filterChipTextActive: {
      color: '#FFFFFF',
      fontWeight: '700',
    },

    // ===== Date Group =====
    dateGroup: {
      marginHorizontal: SPACING[4],
      marginBottom: SPACING[4],
    },
    dateLabel: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.seal,
      marginBottom: SPACING[2],
      fontFamily: 'Tajawal-Bold',
    },
    logsContainer: {
      backgroundColor: colors.panel,
      borderRadius: BORDER_RADIUS.lg,
      borderWidth: 1,
      borderColor: colors.line,
      overflow: 'hidden',
      ...SHADOWS.sm,
    },

    // ===== Log Item =====
    logItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: SPACING[3],
      paddingVertical: SPACING[3],
      borderBottomWidth: 1,
      borderBottomColor: colors.line,
    },
    logLeft: {
      flex: 1,
      marginRight: SPACING[2],
    },
    logAction: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.ink,
      marginBottom: SPACING[1],
      fontFamily: 'Tajawal-Bold',
    },
    logPatient: {
      fontSize: 12,
      color: colors.inkSub,
      fontFamily: 'Tajawal',
    },
    logTime: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.seal,
      fontFamily: 'Tajawal-Bold',
    },

    // ===== Empty State =====
    emptyState: {
      paddingVertical: SPACING[12],
    },
    emptyIcon: {
      fontSize: 56,
      marginBottom: SPACING[3],
    },
    emptyText: {
      fontSize: 16,
      color: colors.inkSub,
      fontFamily: 'Tajawal',
    },

    // ===== Actions Container =====
    actionsContainer: {
      paddingHorizontal: SPACING[4],
      paddingBottom: SPACING[4],
    },
  });
 
