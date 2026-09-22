import AsyncStorage from '@react-native-async-storage/async-storage';

export const GOOGLE_WEB_CLIENT_ID =
  '302676179340-4e6res67d3sbf7ftg1mr7fqi3i409kt4.apps.googleusercontent.com';

export const DRIVE_SCOPE =
  'https://www.googleapis.com/auth/drive.file';

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

type GoogleTokenClient = {
  requestAccessToken: (options?: {
    prompt?: string;
  }) => void;
};

let googleReadyPromise: Promise<void> | null = null;
let tokenClient: GoogleTokenClient | null = null;
let currentAccessToken: string | null = null;

/* =========================================================
   WEB GOOGLE SIGN-IN
   ========================================================= */

export function isGoogleNativeAvailable() {
  return false;
}

/**
 * تحميل Google Identity Services
 */
function loadGoogleScript(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(
      new Error('Google Sign-In متاح داخل المتصفح فقط.')
    );
  }

  if (
    (window as any).google &&
    (window as any).google.accounts &&
    (window as any).google.accounts.oauth2
  ) {
    return Promise.resolve();
  }

  if (googleReadyPromise) {
    return googleReadyPromise;
  }

  googleReadyPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(
      'script[src="https://accounts.google.com/gsi/client"]'
    );

    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () =>
        reject(
          new Error(
            'تعذر تحميل خدمة تسجيل الدخول من Google.'
          )
        )
      );
      return;
    }

    const script = document.createElement('script');

    script.src =
      'https://accounts.google.com/gsi/client';

    script.async = true;
    script.defer = true;

    script.onload = () => resolve();

    script.onerror = () => {
      reject(
        new Error(
          'تعذر تحميل Google Identity Services.'
        )
      );
    };

    document.head.appendChild(script);
  });

  return googleReadyPromise;
}

/**
 * تهيئة Google Web
 */
export async function configureGoogleSignIn() {
  await loadGoogleScript();

  if (tokenClient) {
    return;
  }

  const google = (window as any).google;

  if (
    !google ||
    !google.accounts ||
    !google.accounts.oauth2
  ) {
    throw new Error(
      'خدمة Google Identity Services غير متاحة.'
    );
  }

  tokenClient =
    google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_WEB_CLIENT_ID,

      scope: [
        'openid',
        'email',
        'profile',
        DRIVE_SCOPE,
      ].join(' '),

      callback: () => {},
    });
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
      await AsyncStorage.removeItem(USER_KEY);
    }
  } catch {}
}

/* =========================================================
   GOOGLE USER INFORMATION
   ========================================================= */

async function fetchGoogleUser(
  accessToken: string
): Promise<GoogleUser> {

  const response = await fetch(
    'https://www.googleapis.com/oauth2/v3/userinfo',
    {
      method: 'GET',

      headers: {
        Authorization:
          `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `تعذر الحصول على بيانات حساب Google. HTTP ${response.status}`
    );
  }

  const data =
    await response.json();

  return {
    email: data.email || '',
    name:
      data.name ||
      data.given_name ||
      data.email ||
      'Google User',
    picture:
      data.picture || undefined,
  };
}

/* =========================================================
   ACCESS TOKEN
   ========================================================= */

function requestGoogleAccessToken(
  prompt: string = ''
): Promise<string> {

  return new Promise(
    async (resolve, reject) => {

      try {
        await configureGoogleSignIn();

        if (!tokenClient) {
          reject(
            new Error(
              'لم تتم تهيئة تسجيل الدخول إلى Google.'
            )
          );
          return;
        }

        const google =
          (window as any).google;

        tokenClient =
          google.accounts.oauth2.initTokenClient({
            client_id:
              GOOGLE_WEB_CLIENT_ID,

            scope: [
              'openid',
              'email',
              'profile',
              DRIVE_SCOPE,
            ].join(' '),

            callback: (
              response: any
            ) => {

              if (
                response?.error
              ) {
                reject(
                  new Error(
                    response.error_description ||
                    response.error ||
                    'فشل تسجيل الدخول إلى Google.'
                  )
                );

                return;
              }

              if (
                !response?.access_token
              ) {
                reject(
                  new Error(
                    'Google لم يُرجع رمز الدخول.'
                  )
                );

                return;
              }

              currentAccessToken =
                response.access_token;

              resolve(
                response.access_token
              );
            },

            error_callback: (
              error: any
            ) => {

              reject(
                new Error(
                  error?.message ||
                  'تم إلغاء أو رفض تسجيل الدخول إلى Google.'
                )
              );
            },
          });

        tokenClient.requestAccessToken({
          prompt,
        });

      } catch (error: any) {

        reject(
          new Error(
            error?.message ||
            'حدث خطأ أثناء تسجيل الدخول إلى Google.'
          )
        );
      }
    }
  );
}

/* =========================================================
   GOOGLE SIGN-IN
   ========================================================= */

export async function signInWithGoogle(): Promise<{
  user: GoogleUser;
  accessToken: string;
}> {

  const accessToken =
    await requestGoogleAccessToken('consent');

  const user =
    await fetchGoogleUser(accessToken);

  await saveUser(user);

  return {
    user,
    accessToken,
  };
}

/* =========================================================
   RESTORE SESSION
   ========================================================= */

export async function restoreGoogleSession(): Promise<{
  user: GoogleUser;
  accessToken: string;
} | null> {

  const savedUser =
    await getSavedGoogleUser();

  /*
   * لا يمكننا اعتبار وجود المستخدم المخزن
   * دليلاً على أن Access Token ما زال صالحًا.
   *
   * نحاول الحصول على Token بدون إظهار نافذة
   * موافقة للمستخدم.
   */

  try {

    const accessToken =
      await requestGoogleAccessToken('');

    const user =
      await fetchGoogleUser(
        accessToken
      );

    await saveUser(user);

    return {
      user,
      accessToken,
    };

  } catch {

    /*
     * إذا كان هناك مستخدم محفوظ فقط،
     * نعيده بدون Token.
     *
     * لن نستخدمه لعمليات Drive حتى نحصل
     * على Token جديد.
     */

    void savedUser;

    return null;
  }
}

/* =========================================================
   GET DRIVE ACCESS TOKEN
   ========================================================= */

export async function getDriveAccessToken(): Promise<string> {

  if (currentAccessToken) {

    /*
     * تحقق بسيط من أن Token ما زال صالحًا.
     * إذا انتهت صلاحيته سيطلب Google Token جديد.
     */

    try {

      const testResponse =
        await fetch(
          'https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=' +
          encodeURIComponent(
            currentAccessToken
          )
        );

      if (testResponse.ok) {
        return currentAccessToken;
      }

    } catch {}
  }

  const token =
    await requestGoogleAccessToken('');

  return token;
}

/* =========================================================
   GOOGLE SIGN OUT
   ========================================================= */

export async function signOutGoogle() {

  try {

    if (currentAccessToken) {

      const google =
        (window as any).google;

      if (
        google?.accounts?.oauth2?.revoke
      ) {

        await new Promise<void>(
          resolve => {

            google.accounts.oauth2.revoke(
              currentAccessToken,
              () => resolve()
            );

          }
        );
      }
    }

  } catch {}

  currentAccessToken = null;

  tokenClient = null;

  await saveUser(null);

  await AsyncStorage.removeItem(
    LAST_BACKUP_KEY
  );
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

    } catch {}

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

  const q = encodeURIComponent(
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
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}`,
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
   UPLOAD BACKUP TO DRIVE
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

  /*
   * إنشاء ملف جديد
   */

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

  /*
   * رفع محتوى النسخة
   */

  await driveRequest(
    `https://www.googleapis.com/upload/drive/v3/files/${encodeURIComponent(metadata.id)}?uploadType=media`,
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

  /*
   * الاحتفاظ بآخر 5 نسخ
   */

  await cleanupOldBackups(
    token
  );

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

  const file =
    files[0];

  const response =
    await driveRequest(
      `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(file.id)}?alt=media`,
      token,
      {
        method: 'GET',
      }
    );

  const data =
    await response.json();

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
