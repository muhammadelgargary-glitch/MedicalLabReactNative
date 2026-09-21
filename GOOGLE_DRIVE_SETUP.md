# إعداد Google Sign-In + Google Drive Native

تم دمج تسجيل الدخول الأصلي داخل React Native، وليس WebView أو Google Identity Services داخل صفحة HTML.

## ما تم دمجه

- Native Google Sign-In على Android/iOS.
- صلاحية Google Drive: `drive.file`.
- رفع نسخة المختبر إلى Drive.
- استعادة أحدث نسخة من Drive.
- الاحتفاظ بآخر 5 نسخ وحذف الأقدم.
- تسجيل الدخول الصامت عند فتح التطبيق إذا كانت جلسة Google محفوظة.
- تسجيل الخروج.
- بيانات النسخة: المرضى + الإعدادات + سجل التعديلات.
- الاستيراد المحلي ما زال يعمل أيضًا.
- الاستعادة من Drive تحدّث Zustand وAsyncStorage مباشرة، ولا تحتاج لإغلاق التطبيق وإعادة فتحه.

## مهم جدًا قبل بناء APK

المشروع يستخدم OAuth Web Client ID الموجود أصلًا في ملف `index.html` المصدر:

`302676179340-4e6res67d3sbf7ftg1mr7fqi3i409kt4.apps.googleusercontent.com`

وفي Google Cloud Console يجب التأكد من الآتي:

1. تفعيل **Google Drive API**.
2. إعداد OAuth consent screen.
3. إضافة حساب Google الذي ستختبر به ضمن **Test users** إذا كان التطبيق في وضع Testing.
4. إنشاء/التأكد من وجود **Web application OAuth Client** بالـ Web Client ID أعلاه.
5. إنشاء **Android OAuth Client**:
   - Package name: `com.medical.lab`
   - SHA-1 للتوقيع المستخدم في APK.
6. أضف SHA-1 الخاص بكل توقيع ستستخدمه لاحقًا (Debug / Release / Play App Signing).

SHA-1 الذي كان مستخدمًا في إعداد APK السابق:

`A2:C7:B5:09:BA:30:21:C8:9D:FF:03:8E:51:34:2C:9A:44:AD:7A:80`

إذا تغير توقيع EAS، يجب إضافة SHA-1 الجديد أيضًا.

## لماذا Development Build / APK خاص؟

مكتبة Google Sign-In تحتوي على Native code، لذلك لا تعمل داخل Expo Go. يجب بناء APK/AAB مخصص باستخدام EAS أو prebuild + Android build.

## البناء السحابي

```bash
npm install
npx expo prebuild --clean
npm run build:android
```

لـ APK تجريبي استخدم ملف `eas.json` والـ profile `preview`.

## ملاحظة عن Drive scope

التطبيق يطلب `https://www.googleapis.com/auth/drive.file` فقط. هذا يعني أن التطبيق يدير ملفات Drive التي أنشأها التطبيق/المسموح له بها، وليس كل ملفات Drive الخاصة بالمستخدم.
