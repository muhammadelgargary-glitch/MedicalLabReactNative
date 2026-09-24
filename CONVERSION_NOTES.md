# تحويل الوظائف من index.html إلى React Native

| النسخة القديمة | النسخة الجديدة |
|---|---|
| `localStorage` | `@react-native-async-storage/async-storage` |
| `state.patients` | Zustand store |
| `renderList()` | `HomeScreen` + FlatList |
| `savePatient()` | `upsertPatient()` |
| `addAudit()` | `addAudit()` داخل store |
| `renderStats()` | `StatsScreen` |
| `renderCatalog()` | `CatalogScreen` |
| `settings` | `SettingsScreen` + Zustand |
| HTML report | React Native preview + `expo-print` |
| XLSX browser export | `xlsx` + native file sharing |
| Google web OAuth | سيتم استبداله بـ Native Google Sign-In |
| Google Drive REST via browser | سيتم استبداله بطبقة Native/Drive بعد OAuth |

## مهم

هذه ليست نسخة HTML مغلفة. كل الواجهة الأساسية مبنية بـ `View`, `Text`, `TextInput`, `ScrollView`, `FlatList`, `TouchableOpacity` والتنقل Native Stack.

الميزات التي تحتاج طبقة Native إضافية قبل اعتبار المشروع مكتملاً 100% مقارنة بالملف الأصلي:
1. Google Sign-In + Google Drive.
2. استيراد النسخة الاحتياطية وإعادة الدمج.
3. إعدادات الطباعة المتقدمة والقوالب المتعددة.
4. استكمال بعض أدوات التصدير المتقدمة والبحث المتقدم والمهام المعلقة.
5. إعدادات الأسعار والقيم الحرجة المخصصة بالكامل.
