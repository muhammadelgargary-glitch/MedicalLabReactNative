import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  GoogleSignin,
  statusCodes,
  isErrorWithCode,
  isSuccessResponse,
} from '@react-native-google-signin/google-signin';

/* =========================================================
   GOOGLE CONFIG
   ========================================================= */

export const GOOGLE_WEB_CLIENT_ID =
  '302676179340-4e6res67d3sbf7ftg1mr7fqi3i409kt4.apps.googleusercontent.com';

export const DRIVE_SCOPE =
  'https://www.googleapis.com/auth/drive.file';

const USER_KEY = 'lab_google_user';
const LAST_BACKUP_KEY = 'lab_last_drive_backup_ts';

const RETENTION = 5;

/* =========================================================
   TYPES
   ========================================================= */

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

/* =========================================================
   INTERNAL STATE
   ========================================================= */

let configured = false;

/* =========================================================
   PLATFORM
   ========================================================= */

function assertNative() {
  if (Platform.OS === 'web') {
    throw new Error(
      'Google Sign-In Native متاح داخل تطبيق Android/iOS المبني Native فقط.'
    );
  }
}

export function isGoogleNativeAvailable() {
  return Platform.OS === 'android' || Platform.OS === 'ios';
}

/* =========================================================
   GOOGLE SIGN-IN CONFIGURATION
   ========================================================= */

export async function configureGoogleSignIn() {
  if (!isGoogleNativeAvailable()) {
    return;
  }

  if (configured) {
    return;
  }

  /*
   * webClientId يجب أن يكون OAuth Client من نوع Web
   * وليس Android.
   *
   * DRIVE_SCOPE هو صلاحية Google Drive المطلوبة
   * للنسخ الاحتياطية التي ينشئها التطبيق.
   */

  GoogleSignin.configure({
    webClientId: GOOGLE_WEB_CLIENT_ID,

    scopes: [
      DRIVE_SCOPE,
    ],

    offlineAccess: false,
  });

  configured = true;
}

/* =========================================================
   MAP GOOGLE USER
   ========================================================= */

function mapUser(user: any): GoogleUser {
  return {
    email: user?.email || '',
    name:
      user?.name ||
      user?.displayName ||
      '',
    picture:
      user?.photo ||
      user?.imageUrl ||
      undefined,
  };
}

/* =========================================================
   USER STORAGE
   ========================================================= */

export async function getSavedGoogleUser(): Promise<GoogleUser | null> {
  try {
    const raw =
      await AsyncStorage.getItem(USER_KEY);

    if (!raw) {
      return null;
    }

    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function saveUser(
  user: GoogleUser | null
) {
  try {
    if (user) {
      await AsyncStorage.setItem(
        USER_KEY,
        JSON.stringify(user)
      );
    } else {
      await AsyncStorage.removeItem(
        USER_KEY
      );
    }
  } catch {
    // لا نوقف التطبيق بسبب خطأ التخزين المحلي
  }
}

/* =========================================================
   SIGN IN
   ========================================================= */

export async function signInWithGoogle(): Promise<{
  user: GoogleUser;
  accessToken: string;
}> {
  assertNative();

  await configureGoogleSignIn();

  /*
   * التأكد من وجود Google Play Services
   */

  await GoogleSignin.hasPlayServices({
    showPlayServicesUpdateDialog: true,
  });

  /*
   * تسجيل الدخول
   */

  const response =
    await GoogleSignin.signIn();

  if (!isSuccessResponse(response)) {
    throw new Error(
      'تم إلغاء تسجيل الدخول إلى Google.'
    );
  }

  /*
   * استخراج المستخدم
   */

  const user =
    mapUser(response.data?.user);

  if (!user.email) {
    throw new Error(
      'تعذر الحصول على معلومات حساب Google.'
    );
  }

  await saveUser(user);

  /*
   * طلب صلاحية Google Drive صراحةً.
   *
   * هذا مهم لأن Drive ليس من الصلاحيات الأساسية
   * email/profile.
   */

  try {
    const scopeResponse =
      await GoogleSignin.addScopes({
        scopes: [
          DRIVE_SCOPE,
        ],
      });

    /*
     * إذا رجع null فهذا يعني أنه لا يوجد
     * مستخدم مسجل حاليًا.
     */

    if (
      scopeResponse &&
      !isSuccessResponse(scopeResponse)
    ) {
      throw new Error(
        'لم تتم الموافقة على صلاحية Google Drive.'
      );
    }
  } catch (error: any) {
    console.log(
      'GOOGLE DRIVE SCOPE ERROR:',
      error
    );

    throw new Error(
      error?.message ||
      'لم يتم منح التطبيق صلاحية الوصول إلى Google Drive.'
    );
  }

  /*
   * الحصول على Access Token بعد منح الصلاحية
   */

  const accessToken =
    await getDriveAccessToken();

  return {
    user,
    accessToken,
  };
}

/* =========================================================
   RESTORE GOOGLE SESSION
   ========================================================= */

export async function restoreGoogleSession(): Promise<{
  user: GoogleUser;
  accessToken: string;
} | null> {
  assertNative();

  await configureGoogleSignIn();

  try {
    /*
     * محاولة استعادة جلسة Google السابقة
     */

    const response =
      await GoogleSignin.signInSilently();

    if (
      !isSuccessResponse(response)
    ) {
      return null;
    }

    const user =
      mapUser(response.data?.user);

    if (!user.email) {
      return null;
    }

    await saveUser(user);

    /*
     * التأكد من صلاحية Google Drive
     */

    try {
      const scopeResponse =
        await GoogleSignin.addScopes({
          scopes: [
            DRIVE_SCOPE,
          ],
        });

      if (
        scopeResponse &&
        !isSuccessResponse(scopeResponse)
      ) {
        return null;
      }
    } catch (scopeError) {
      console.log(
        'GOOGLE DRIVE RESTORE SCOPE ERROR:',
        scopeError
      );

      return null;
    }

    /*
     * الحصول على Access Token
     */

    const accessToken =
      await getDriveAccessToken();

    return {
      user,
      accessToken,
    };

  } catch (error: any) {

    /*
     * لا توجد جلسة محفوظة
     */

    if (
      isErrorWithCode(error) &&
      error.code ===
        statusCodes.SIGN_IN_REQUIRED
    ) {
      return null;
    }

    console.log(
      'GOOGLE RESTORE SESSION ERROR:',
      error
    );

    return null;
  }
}

/* =========================================================
   GET DRIVE ACCESS TOKEN
   ========================================================= */

export async function getDriveAccessToken(): Promise<string> {
  assertNative();

  await configureGoogleSignIn();

  try {
    const tokens =
      await GoogleSignin.getTokens();

    if (
      tokens?.accessToken
    ) {
      return tokens.accessToken;
    }
  } catch (error) {
    console.log(
      'GET GOOGLE TOKENS ERROR:',
      error
    );
  }

  throw new Error(
    'تعذر الحصول على صلاحية Google Drive.'
  );
}

/* =========================================================
   SIGN OUT
   ========================================================= */

export async function signOutGoogle() {
  if (!isGoogleNativeAvailable()) {
    return;
  }

  await configureGoogleSignIn();

  try {
    await GoogleSignin.signOut();
  } catch (error) {
    console.log(
      'GOOGLE SIGN OUT ERROR:',
      error
    );
  } finally {
    await saveUser(null);

    await AsyncStorage.removeItem(
      LAST_BACKUP_KEY
    );
  }
}

/* =========================================================
   DRIVE REQUEST
   ========================================================= */

async function driveRequest(
  url: string,
  token: string,
  init: RequestInit = {}
) {
  const headers =
    new Headers(
      init.headers || {}
    );

  headers.set(
    'Authorization',
    `Bearer ${token}`
  );

  const response =
    await fetch(
      url,
      {
        ...init,
        headers,
      }
    );

  if (!response.ok) {
    let message =
      `HTTP ${response.status}`;

    try {
      const body =
        await response.json();

      message =
        body?.error?.message ||
        message;
    } catch {
      // تجاهل خطأ قراءة JSON
    }

    throw new Error(message);
  }

  return response;
}

/* =========================================================
   LIST BACKUP FILES
   ========================================================= */

async function listBackupFiles(
  token: string
) {
  const q =
    encodeURIComponent(
      "trashed = false and (name contains 'lab_backup_' or name = 'lab_backup.json')"
    );

  const url =
    `https://www.googleapis.com/drive/v3/files` +
    `?q=${q}` +
    `&pageSize=100` +
    `&orderBy=modifiedTime%20desc` +
    `&fields=files(id,name,modifiedTime,createdTime,mimeType)`;

  const response =
    await driveRequest(
      url,
      token
    );

  const body =
    await response.json();

  return (
    body.files || []
  ).sort(
    (
      a: any,
      b: any
    ) =>
      new Date(
        b.modifiedTime
      ).getTime() -
      new Date(
        a.modifiedTime
      ).getTime()
  );
}

/* =========================================================
   DELETE DRIVE FILE
   ========================================================= */

async function deleteDriveFile(
  fileId: string,
  token: string
) {
  await driveRequest(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(
      fileId
    )}`,
    token,
    {
      method: 'DELETE',
    }
  );
}

/* =========================================================
   CLEAN OLD BACKUPS
   ========================================================= */

async function cleanupOldBackups(
  token: string
) {
  const files =
    await listBackupFiles(
      token
    );

  /*
   * الاحتفاظ بآخر 5 نسخ
   */

  const old =
    files.slice(
      RETENTION
    );

  for (
    const file of old
  ) {
    await deleteDriveFile(
      file.id,
      token
    );
  }
}

/* =========================================================
   UPLOAD BACKUP TO GOOGLE DRIVE
   ========================================================= */

export async function uploadBackupToDrive(
  payload: DriveBackupPayload
) {
  const token =
    await getDriveAccessToken();

  const filename =
    `lab_backup_${new Date()
      .toISOString()
      .replace(
        /[:.]/g,
        '-'
      )}.json`;

  /* -------------------------------------------------------
     STEP 1
     إنشاء ملف النسخة الاحتياطية
     ------------------------------------------------------- */

  const metadataResponse =
    await driveRequest(
      'https://www.googleapis.com/drive/v3/files',
      token,
      {
        method: 'POST',

        headers: {
          'Content-Type':
            'application/json',
        },

        body: JSON.stringify({
          name: filename,

          mimeType:
            'application/json',
        }),
      }
    );

  const metadata =
    await metadataResponse.json();

  if (!metadata?.id) {
    throw new Error(
      'تعذر إنشاء ملف النسخة الاحتياطية في Google Drive.'
    );
  }

  /* -------------------------------------------------------
     STEP 2
     رفع محتوى النسخة
     ------------------------------------------------------- */

  await driveRequest(
    `https://www.googleapis.com/upload/drive/v3/files/${encodeURIComponent(
      metadata.id
    )}?uploadType=media`,
    token,
    {
      method: 'PATCH',

      headers: {
        'Content-Type':
          'application/json; charset=utf-8',
      },

      body: JSON.stringify(
        payload
      ),
    }
  );

  /* -------------------------------------------------------
     STEP 3
     حذف النسخ القديمة
     ------------------------------------------------------- */

  await cleanupOldBackups(
    token
  );

  /* -------------------------------------------------------
     STEP 4
     حفظ وقت آخر نسخة محليًا
     ------------------------------------------------------- */

  const now =
    Date.now();

  await AsyncStorage.setItem(
    LAST_BACKUP_KEY,
    String(now)
  );

  return {
    id: metadata.id,

    name: filename,

    modifiedTime:
      new Date(
        now
      ).toISOString(),
  };
}

/* =========================================================
   RESTORE LATEST BACKUP
   ========================================================= */

export async function restoreLatestBackupFromDrive(): Promise<
  DriveBackupPayload | null
> {
  const token =
    await getDriveAccessToken();

  const files =
    await listBackupFiles(
      token
    );

  if (!files.length) {
    return null;
  }

  /*
   * أول ملف = أحدث نسخة
   */

  const file =
    files[0];

  const response =
    await driveRequest(
      `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(
        file.id
      )}?alt=media`,
      token,
      {
        method: 'GET',
      }
    );

  const data =
    await response.json();

  /* -------------------------------------------------------
     التحقق من صحة الملف
     ------------------------------------------------------- */

  if (
    !data ||
    data.app !== 'lab-app' ||
    !Array.isArray(
      data.patients
    )
  ) {
    throw new Error(
      'ملف النسخة الموجودة في Google Drive غير صالح.'
    );
  }

  return {
    app: 'lab-app',

    version:
      Number(
        data.version || 1
      ),

    exportedAt:
      data.exportedAt ||
      file.modifiedTime ||
      new Date().toISOString(),

    patients:
      data.patients,

    settings:
      data.settings || {},

    auditLog:
      Array.isArray(
        data.auditLog
      )
        ? data.auditLog
        : [],
  };
}

/* =========================================================
   LAST BACKUP TIME
   ========================================================= */

export async function getLastDriveBackupTime() {
  try {
    const local =
      await AsyncStorage.getItem(
        LAST_BACKUP_KEY
      );

    return local
      ? Number(local)
      : null;

  } catch {
    return null;
  }
}

/* =========================================================
   DRIVE BACKUP SUMMARY
   ========================================================= */

export async function getDriveBackupSummary() {
  const token =
    await getDriveAccessToken();

  const files =
    await listBackupFiles(
      token
    );

  return {
    count:
      files.length,

    latest:
      files[0] || null,

    retained:
      Math.min(
        files.length,
        RETENTION
      ),

    retention:
      RETENTION,
  };
}