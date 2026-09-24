import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeType } from '../styles/theme';

export type FontSizeKey = 'small' | 'medium' | 'large';
export type FontFamilyKey = 'sans' | 'serif' | 'mono';
export type DensityKey = 'comfortable' | 'compact';

export interface PrintSettings {
  paper?: 'A4' | 'A5' | 'Letter';
  orientation?: 'portrait' | 'landscape';
  layout?: 'auto' | '1' | '2' | '2stack' | '3' | '4';
  gap?: number;
  marginTop?: number;
  marginRight?: number;
  marginBottom?: number;
  marginLeft?: number;
  fontSize?: number;
  tableFontSize?: number;
  fontFamily?: string;
  showLogo?: boolean;
  logoPosition?: 'right' | 'left' | 'center';
  logoSize?: number;
  reportTitle?: string;
  showCenter?: boolean;
  showDirectorate?: boolean;
  showDate?: boolean;
  showSeq?: boolean;
  showNotes?: boolean;
  showFooter?: boolean;
  footerText?: string;
  showBorder?: boolean;
  borderColor?: string;
  showNormal?: boolean;
}

export interface Settings {
  center: string;
  directorate: string;
  logo?: string;
  logoShape?: 'circle' | 'rounded' | 'square';
  logoSize?: number;
  logoPosition?: 'right' | 'left' | 'center';
  logoBorder?: boolean;
  reportTitle?: string;
  footerText?: string;
  printSettings?: PrintSettings;
  googleDriveAccessToken?: string;
  googleDriveRefreshToken?: string;
  lastBackup?: string;
}

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

interface LabStoreState {
  patients: Patient[];
  settings: Settings;
  auditLog: Array<{ timestamp: string; action: string; patientName: string }>;

  darkMode: boolean;
  theme: ThemeType;
  fontSize: FontSizeKey;
  fontFamily: FontFamilyKey;
  density: DensityKey;

  hydrated: boolean;
  hydrate: () => Promise<void>;

  addPatient: (patient: Patient) => Promise<void>;
  updatePatient: (id: string, updates: Partial<Patient>) => Promise<void>;
  deletePatient: (id: string) => Promise<void>;
  updateSettings: (settings: Partial<Settings>) => Promise<void>;
  addAuditLog: (action: string, patientName: string) => Promise<void>;
  clearAuditLog: () => Promise<void>;

  toggleDarkMode: () => Promise<void>;
  setTheme: (theme: ThemeType) => Promise<void>;
  setFontSize: (size: FontSizeKey) => Promise<void>;
  setFontFamily: (family: FontFamilyKey) => Promise<void>;
  setDensity: (density: DensityKey) => Promise<void>;

  clearAllData: () => Promise<void>;
  replacePatients: (patients: Patient[]) => Promise<void>;
  replaceAuditLog: (auditLog: LabStoreState['auditLog']) => Promise<void>;
  loadFromStorage: () => Promise<void>;
}

const STORAGE_KEYS = {
  PATIENTS: 'lab_patients',
  SETTINGS: 'lab_settings',
  AUDIT_LOG: 'lab_audit',
  DARK_MODE: 'lab_darkMode',
  THEME: 'lab_theme',
  FONT_SIZE: 'lab_fontSize',
  FONT_FAMILY: 'lab_fontFamily',
  DENSITY: 'lab_density',
};

const DEFAULT_SETTINGS: Settings = {
  center: 'مختبري',
  directorate: 'الإدارة',
  logoShape: 'rounded',
  logoSize: 56,
  logoPosition: 'right',
  logoBorder: false,
  reportTitle: 'تقرير الفحوصات المخبرية',
  footerText: 'مع تمنياتنا بالصحة والعافية',
  printSettings: {
    paper: 'A4',
    orientation: 'portrait',
    layout: 'auto',
    gap: 6,
    marginTop: 8,
    marginRight: 8,
    marginBottom: 8,
    marginLeft: 8,
    fontSize: 13,
    tableFontSize: 11,
    fontFamily: 'sans-serif',
    showLogo: true,
    logoPosition: 'right',
    logoSize: 56,
    reportTitle: 'تقرير الفحوصات المخبرية',
    showCenter: true,
    showDirectorate: true,
    showDate: true,
    showSeq: true,
    showNotes: true,
    showFooter: true,
    footerText: 'مع تمنياتنا بالصحة والعافية',
    showBorder: true,
    borderColor: '#D6DFDB',
    showNormal: true,
  },
};

export const useLabStore = create<LabStoreState>((set, get) => ({
  patients: [],
  settings: DEFAULT_SETTINGS,
  auditLog: [],
  darkMode: false,
  theme: 'default',
  fontSize: 'medium',
  fontFamily: 'sans',
  density: 'comfortable',
  hydrated: false,

  hydrate: async () => {
    await get().loadFromStorage();
  },

  addPatient: async (patient) => {
    const newPatients = [...get().patients, patient];
    set({ patients: newPatients });
    await AsyncStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(newPatients));
    await get().addAuditLog('إضافة مريض', patient.name);
  },

  updatePatient: async (id, updates) => {
    const newPatients = get().patients.map((p) => (p.id === id ? { ...p, ...updates } : p));
    set({ patients: newPatients });
    await AsyncStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(newPatients));
    const patient = newPatients.find((p) => p.id === id);
    if (patient) await get().addAuditLog('تحديث مريض', patient.name);
  },

  deletePatient: async (id) => {
    const patient = get().patients.find((p) => p.id === id);
    const newPatients = get().patients.filter((p) => p.id !== id);
    set({ patients: newPatients });
    await AsyncStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(newPatients));
    if (patient) await get().addAuditLog('حذف مريض', patient.name);
  },

  updateSettings: async (updates) => {
    const newSettings: Settings = {
      ...get().settings,
      ...updates,
      printSettings: {
        ...(get().settings.printSettings || {}),
        ...(updates.printSettings || {}),
      },
    };
    set({ settings: newSettings });
    await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(newSettings));
  },

  addAuditLog: async (action, patientName) => {
    const newLog = [...get().auditLog, {
      timestamp: new Date().toISOString(),
      action,
      patientName,
    }];
    set({ auditLog: newLog });
    await AsyncStorage.setItem(STORAGE_KEYS.AUDIT_LOG, JSON.stringify(newLog));
  },

  clearAuditLog: async () => {
    set({ auditLog: [] });
    await AsyncStorage.setItem(STORAGE_KEYS.AUDIT_LOG, JSON.stringify([]));
  },

  toggleDarkMode: async () => {
    const value = !get().darkMode;
    set({ darkMode: value });
    await AsyncStorage.setItem(STORAGE_KEYS.DARK_MODE, JSON.stringify(value));
  },

  setTheme: async (theme) => {
    set({ theme });
    await AsyncStorage.setItem(STORAGE_KEYS.THEME, theme);
  },

  setFontSize: async (fontSize) => {
    set({ fontSize });
    await AsyncStorage.setItem(STORAGE_KEYS.FONT_SIZE, fontSize);
  },

  setFontFamily: async (fontFamily) => {
    set({ fontFamily });
    await AsyncStorage.setItem(STORAGE_KEYS.FONT_FAMILY, fontFamily);
  },

  setDensity: async (density) => {
    set({ density });
    await AsyncStorage.setItem(STORAGE_KEYS.DENSITY, density);
  },


  replacePatients: async (patients) => {
    set({ patients });
    await AsyncStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(patients));
  },

  replaceAuditLog: async (auditLog) => {
    set({ auditLog });
    await AsyncStorage.setItem(STORAGE_KEYS.AUDIT_LOG, JSON.stringify(auditLog));
  },

  clearAllData: async () => {
    await Promise.all([
      AsyncStorage.removeItem(STORAGE_KEYS.PATIENTS),
      AsyncStorage.removeItem(STORAGE_KEYS.AUDIT_LOG),
    ]);
    set({ patients: [], auditLog: [] });
  },

  loadFromStorage: async () => {
    try {
      const values = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.PATIENTS),
        AsyncStorage.getItem(STORAGE_KEYS.SETTINGS),
        AsyncStorage.getItem(STORAGE_KEYS.AUDIT_LOG),
        AsyncStorage.getItem(STORAGE_KEYS.DARK_MODE),
        AsyncStorage.getItem(STORAGE_KEYS.THEME),
        AsyncStorage.getItem(STORAGE_KEYS.FONT_SIZE),
        AsyncStorage.getItem(STORAGE_KEYS.FONT_FAMILY),
        AsyncStorage.getItem(STORAGE_KEYS.DENSITY),
      ]);

      const [patientsStr, settingsStr, auditStr, darkStr, themeStr, fontSizeStr, fontFamilyStr, densityStr] = values;

      set({
        patients: patientsStr ? JSON.parse(patientsStr) : [],
        settings: settingsStr
          ? { ...DEFAULT_SETTINGS, ...JSON.parse(settingsStr), printSettings: {
              ...DEFAULT_SETTINGS.printSettings,
              ...(JSON.parse(settingsStr).printSettings || {}),
            }}
          : DEFAULT_SETTINGS,
        auditLog: auditStr ? JSON.parse(auditStr) : [],
        darkMode: darkStr ? JSON.parse(darkStr) : false,
        theme: (themeStr as ThemeType) || 'default',
        fontSize: (fontSizeStr as FontSizeKey) || 'medium',
        fontFamily: (fontFamilyStr as FontFamilyKey) || 'sans',
        density: (densityStr as DensityKey) || 'comfortable',
        hydrated: true,
      });
    } catch (error) {
      console.error('Error loading laboratory data:', error);
      set({ hydrated: true });
    }
  },
}));
