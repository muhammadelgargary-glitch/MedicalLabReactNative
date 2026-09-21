import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  GoogleSignin,
  statusCodes,
  isErrorWithCode,
  isSuccessResponse,
} from '@react-native-google-signin/google-signin';

export const GOOGLE_WEB_CLIENT_ID = '302676179340-4e6res67d3sbf7ftg1mr7fqi3i409kt4.apps.googleusercontent.com';
export const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
const USER_KEY = 'lab_google_user';
const LAST_BACKUP_KEY = 'lab_last_drive_backup_ts';
const RETENTION = 5;

export type GoogleUser = {
  email: string;
  name: string;
  picture?: string;
};

export type DriveBackupPayload = {
  app: 'lab-app';
  version: number;
  exportedAt: string;
  patients: any[];
  settings: any;
  auditLog: any[];
};

let configured = false;

function assertNative() {
  if (Platform.OS === 'web') throw new Error('Google Sign-In Native متاح داخل تطبيق Android/iOS المبني Native فقط.');
}

export function isGoogleNativeAvailable() {
  return Platform.OS === 'android' || Platform.OS === 'ios';
}

export async function configureGoogleSignIn() {
  if (!isGoogleNativeAvailable() || configured) return;
  GoogleSignin.configure({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    scopes: [DRIVE_SCOPE],
    offlineAccess: false,
  });
  configured = true;
}

function mapUser(user: any): GoogleUser {
  return {
    email: user?.email || '',
    name: user?.name || user?.displayName || '',
    picture: user?.photo || user?.imageUrl || undefined,
  };
}

export async function getSavedGoogleUser(): Promise<GoogleUser | null> {
  try {
    const raw = await AsyncStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function saveUser(user: GoogleUser | null) {
  if (user) await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  else await AsyncStorage.removeItem(USER_KEY);
}

export async function signInWithGoogle(): Promise<{ user: GoogleUser; accessToken: string }> {
  assertNative();
  await configureGoogleSignIn();
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

  const response = await GoogleSignin.signIn();
  if (!isSuccessResponse(response)) {
    throw new Error('تم إلغاء تسجيل الدخول إلى Google.');
  }

  const user = mapUser(response.data?.user);
  await saveUser(user);
  const accessToken = await getDriveAccessToken();
  return { user, accessToken };
}

export async function restoreGoogleSession(): Promise<{ user: GoogleUser; accessToken: string } | null> {
  assertNative();
  await configureGoogleSignIn();
  try {
    const response = await GoogleSignin.signInSilently();
    if (!isSuccessResponse(response)) return null;
    const user = mapUser(response.data?.user);
    await saveUser(user);
    const accessToken = await getDriveAccessToken();
    return { user, accessToken };
  } catch (error: any) {
    if (isErrorWithCode(error) && error.code === statusCodes.SIGN_IN_REQUIRED) return null;
    return null;
  }
}

export async function getDriveAccessToken(): Promise<string> {
  await configureGoogleSignIn();
  const tokens = await GoogleSignin.getTokens();
  if (!tokens?.accessToken) throw new Error('تعذر الحصول على صلاحية Google Drive.');
  return tokens.accessToken;
}

export async function signOutGoogle() {
  if (!isGoogleNativeAvailable()) return;
  await configureGoogleSignIn();
  try {
    await GoogleSignin.signOut();
  } finally {
    await saveUser(null);
    await AsyncStorage.removeItem(LAST_BACKUP_KEY);
  }
}

async function driveRequest(url: string, token: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers || {});
  headers.set('Authorization', `Bearer ${token}`);
  const response = await fetch(url, { ...init, headers });
  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try {
      const body = await response.json();
      message = body?.error?.message || message;
    } catch {}
    throw new Error(message);
  }
  return response;
}

async function listBackupFiles(token: string) {
  const q = encodeURIComponent("trashed = false and (name contains 'lab_backup_' or name = 'lab_backup.json')");
  const url = `https://www.googleapis.com/drive/v3/files?q=${q}&pageSize=100&orderBy=modifiedTime%20desc&fields=files(id,name,modifiedTime,createdTime,mimeType)`;
  const response = await driveRequest(url, token);
  const body = await response.json();
  return (body.files || []).sort((a: any, b: any) =>
    new Date(b.modifiedTime).getTime() - new Date(a.modifiedTime).getTime()
  );
}

async function deleteDriveFile(fileId: string, token: string) {
  await driveRequest(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}`, token, { method: 'DELETE' });
}

async function cleanupOldBackups(token: string) {
  const files = await listBackupFiles(token);
  const old = files.slice(RETENTION);
  for (const file of old) await deleteDriveFile(file.id, token);
}

export async function uploadBackupToDrive(payload: DriveBackupPayload) {
  const token = await getDriveAccessToken();
  const filename = `lab_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;

  // Step 1: create a Drive file inside the user's app-created-file space.
  const metadataResponse = await driveRequest('https://www.googleapis.com/drive/v3/files', token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: filename, mimeType: 'application/json' }),
  });
  const metadata = await metadataResponse.json();

  // Step 2: upload the JSON content to the created file.
  await driveRequest(
    `https://www.googleapis.com/upload/drive/v3/files/${encodeURIComponent(metadata.id)}?uploadType=media`,
    token,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(payload),
    }
  );

  await cleanupOldBackups(token);
  const now = Date.now();
  await AsyncStorage.setItem(LAST_BACKUP_KEY, String(now));
  return { id: metadata.id, name: filename, modifiedTime: new Date(now).toISOString() };
}

export async function restoreLatestBackupFromDrive(): Promise<DriveBackupPayload | null> {
  const token = await getDriveAccessToken();
  const files = await listBackupFiles(token);
  if (!files.length) return null;

  const file = files[0];
  const response = await driveRequest(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(file.id)}?alt=media`,
    token,
    { method: 'GET' }
  );
  const data = await response.json();
  if (!data || data.app !== 'lab-app' || !Array.isArray(data.patients)) {
    throw new Error('ملف النسخة الموجودة في Google Drive غير صالح.');
  }
  return {
    app: 'lab-app',
    version: Number(data.version || 1),
    exportedAt: data.exportedAt || file.modifiedTime || new Date().toISOString(),
    patients: data.patients,
    settings: data.settings || {},
    auditLog: Array.isArray(data.auditLog) ? data.auditLog : [],
  };
}

export async function getLastDriveBackupTime() {
  const local = await AsyncStorage.getItem(LAST_BACKUP_KEY);
  return local ? Number(local) : null;
}

export async function getDriveBackupSummary() {
  const token = await getDriveAccessToken();
  const files = await listBackupFiles(token);
  return {
    count: files.length,
    latest: files[0] || null,
    retained: Math.min(files.length, RETENTION),
    retention: RETENTION,
  };
}
