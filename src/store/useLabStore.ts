// src/store/useLabStore.ts - محدّث مع theme management

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeType, ColorMode } from '../styles/theme';

export interface Patient {
  id: string;
  name: string;
  seq: string;
  gender: string;
  age: string;
  date: string;
  notes?: string;
  blood?: Record<string, any>;
  chem?: Record<string, any>;
  urine?: Record<string, any>;
  serology?: Record<string, any>;
  stool?: Record<string, any>;
  preg?: Record<string, any>;
  includeBlood: boolean;
  includeChem: boolean;
  includeUrine: boolean;
  includeSerology: boolean;
  includeStool: boolean;
  includePreg: boolean;
}

export interface Settings {
  center: string;
  directorate: string;
  googleDriveAccessToken?: string;
  googleDriveRefreshToken?: string;
  lastBackup?: string;
  printSettings?: {
    printHeader?: boolean;
    printPatientInfo?: boolean;
    printNotes?: boolean;
  };
}

interface LabStoreState {
  // ===== Data =====
  patients: Patient[];
  settings: Settings;
  auditLog: Array<{
    timestamp: string;
    action: string;
    patientName: string;
  }>;

  // ===== Theme & Appearance =====
  darkMode: boolean;
  theme: ThemeType;
  fontSize: 'small' | 'medium' | 'large';

  // ===== Actions =====
  addPatient: (patient: Patient) => Promise<void>;
  updatePatient: (id: string, updates: Partial<Patient>) => Promise<void>;
  deletePatient: (id: string) => Promise<void>;
  updateSettings: (settings: Partial<Settings>) => Promise<void>;
  addAuditLog: (action: string, patientName: string) => Promise<void>;
  clearAuditLog: () => Promise<void>;

  // ===== Theme Actions =====
  toggleDarkMode: () => Promise<void>;
  setTheme: (theme: ThemeType) => Promise<void>;
  setFontSize: (size: 'small' | 'medium' | 'large') => Promise<void>;

  // ===== Persist =====
  loadFromStorage: () => Promise<void>;
}

const STORAGE_KEYS = {
  PATIENTS: 'lab_patients',
  SETTINGS: 'lab_settings',
  AUDIT_LOG: 'lab_audit',
  DARK_MODE: 'lab_darkMode',
  THEME: 'lab_theme',
  FONT_SIZE: 'lab_fontSize',
};

export const useLabStore = create<LabStoreState>((set, get) => ({
  // ===== Initial State =====
  patients: [],
  settings: {
    center: 'مختبري',
    directorate: 'الإدارة',
  },
  auditLog: [],
  darkMode: false,
  theme: 'default' as ThemeType,
  fontSize: 'medium',

  // ===== Patient Actions =====
  addPatient: async (patient: Patient) => {
    const state = get();
    const newPatients = [...state.patients, patient];
    set({ patients: newPatients });
    await AsyncStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(newPatients));
    await get().addAuditLog('إضافة مريض', patient.name);
  },

  updatePatient: async (id: string, updates: Partial<Patient>) => {
    const state = get();
    const newPatients = state.patients.map((p) => (p.id === id ? { ...p, ...updates } : p));
    set({ patients: newPatients });
    await AsyncStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(newPatients));
    const patient = newPatients.find((p) => p.id === id);
    if (patient) {
      await get().addAuditLog('تحديث مريض', patient.name);
    }
  },

  deletePatient: async (id: string) => {
    const state = get();
    const patient = state.patients.find((p) => p.id === id);
    const newPatients = state.patients.filter((p) => p.id !== id);
    set({ patients: newPatients });
    await AsyncStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(newPatients));
    if (patient) {
      await get().addAuditLog('حذف مريض', patient.name);
    }
  },

  // ===== Settings Actions =====
  updateSettings: async (settings: Partial<Settings>) => {
    const state = get();
    const newSettings = { ...state.settings, ...settings };
    set({ settings: newSettings });
    await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(newSettings));
  },

  // ===== Audit Actions =====
  addAuditLog: async (action: string, patientName: string) => {
    const state = get();
    const newLog = {
      timestamp: new Date().toISOString(),
      action,
      patientName,
    };
    const newAuditLog = [...state.auditLog, newLog];
    set({ auditLog: newAuditLog });
    await AsyncStorage.setItem(STORAGE_KEYS.AUDIT_LOG, JSON.stringify(newAuditLog));
  },

  clearAuditLog: async () => {
    set({ auditLog: [] });
    await AsyncStorage.setItem(STORAGE_KEYS.AUDIT_LOG, JSON.stringify([]));
  },

  // ===== Theme Actions =====
  toggleDarkMode: async () => {
    const state = get();
    const newDarkMode = !state.darkMode;
    set({ darkMode: newDarkMode });
    await AsyncStorage.setItem(STORAGE_KEYS.DARK_MODE, JSON.stringify(newDarkMode));
  },

  setTheme: async (theme: ThemeType) => {
    set({ theme });
    await AsyncStorage.setItem(STORAGE_KEYS.THEME, theme);
  },

  setFontSize: async (size: 'small' | 'medium' | 'large') => {
    set({ fontSize: size });
    await AsyncStorage.setItem(STORAGE_KEYS.FONT_SIZE, size);
  },

  // ===== Persist from Storage =====
  loadFromStorage: async () => {
    try {
      const [patientsStr, settingsStr, auditStr, darkModeStr, themeStr, fontSizeStr] =
        await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.PATIENTS),
          AsyncStorage.getItem(STORAGE_KEYS.SETTINGS),
          AsyncStorage.getItem(STORAGE_KEYS.AUDIT_LOG),
          AsyncStorage.getItem(STORAGE_KEYS.DARK_MODE),
          AsyncStorage.getItem(STORAGE_KEYS.THEME),
          AsyncStorage.getItem(STORAGE_KEYS.FONT_SIZE),
        ]);

      const updates: Partial<LabStoreState> = {};

      if (patientsStr) {
        updates.patients = JSON.parse(patientsStr);
      }
      if (settingsStr) {
        updates.settings = JSON.parse(settingsStr);
      }
      if (auditStr) {
        updates.auditLog = JSON.parse(auditStr);
      }
      if (darkModeStr) {
        updates.darkMode = JSON.parse(darkModeStr);
      }
      if (themeStr) {
        updates.theme = themeStr as ThemeType;
      }
      if (fontSizeStr) {
        updates.fontSize = fontSizeStr as 'small' | 'medium' | 'large';
      }

      set(updates);
    } catch (error) {
      console.error('Error loading from storage:', error);
    }
  },
}));
 
