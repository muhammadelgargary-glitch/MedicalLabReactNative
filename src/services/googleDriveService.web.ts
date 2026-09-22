import AsyncStorage from '@react-native-async-storage/async-storage';

export const GOOGLE_WEB_CLIENT_ID =
  '302676179340-4e6res67d3sbf7ftg1mr7fqi3i409kt4.apps.googleusercontent.com';

export const DRIVE_SCOPE =
  'https://www.googleapis.com/auth/drive.file';

const USER_KEY = 'lab_google_user';
const LAST_BACKUP_KEY = 'lab_last_drive_backup_ts';

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

/*
 * Web version
 * -----------------------------
 * Google Sign-In Native يعمل فقط
 * داخل Android / iOS.
 *
 * لذلك نسخة Web لا تستورد
 * @react-native-google-signin/google-signin
 * نهائيًا.
 */

export function isGoogleNativeAvailable() {
  return false;
}

export async function configureGoogleSignIn() {
  return;
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
  if (user) {
    await AsyncStorage.setItem(
      USER_KEY,
      JSON.stringify(user)
    );
  } else {
    await AsyncStorage.removeItem(USER_KEY);
  }
}

function webGoogleError(): Error {
  return new Error(
    'تسجيل الدخول إلى Google Drive متاح داخل تطبيق Android فقط.'
  );
}

export async function signInWithGoogle(): Promise<{
  user: GoogleUser;
  accessToken: string;
}> {
  throw webGoogleError();
}

export async function restoreGoogleSession(): Promise<{
  user: GoogleUser;
  accessToken: string;
} | null> {
  return null;
}

export async function getDriveAccessToken(): Promise<string> {
  throw webGoogleError();
}

export async function signOutGoogle() {
  await saveUser(null);
  await AsyncStorage.removeItem(LAST_BACKUP_KEY);
}

export async function uploadBackupToDrive(
  payload: DriveBackupPayload
) {
  void payload;
  throw webGoogleError();
}

export async function restoreLatestBackupFromDrive(): Promise<
  DriveBackupPayload | null
> {
  throw webGoogleError();
}

export async function getLastDriveBackupTime() {
  try {
    const value = await AsyncStorage.getItem(
      LAST_BACKUP_KEY
    );

    return value ? Number(value) : null;
  } catch {
    return null;
  }
}

export async function getDriveBackupSummary() {
  throw webGoogleError();
}
