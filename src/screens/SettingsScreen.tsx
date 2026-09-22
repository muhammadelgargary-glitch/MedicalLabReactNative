import React, {
  useEffect,
  useState,
} from "react";

import {
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import * as ImagePicker from "expo-image-picker";

import {
  useLabStore,
} from "../store/useLabStore";

import {
  backupData,
  importBackupData,
} from "../services/exportService";

import {
  restoreGoogleSession,
  signInWithGoogle,
  signOutGoogle,
  uploadBackupToDrive,
  restoreLatestBackupFromDrive,
  getLastDriveBackupTime,
  getDriveBackupSummary,
} from "../services/googleDriveService";


/* =========================================
   الثوابت
========================================= */

const THEMES = [
  {
    key: "default",
    name: "زيتي",
    color: "#1d3b36",
  },
  {
    key: "blue",
    name: "أزرق",
    color: "#2563eb",
  },
  {
    key: "purple",
    name: "بنفسجي",
    color: "#7c3aed",
  },
  {
    key: "teal",
    name: "تركوازي",
    color: "#0f766e",
  },
  {
    key: "rose",
    name: "وردي",
    color: "#be123c",
  },
  {
    key: "amber",
    name: "ذهبي",
    color: "#b45309",
  },
];

const FONTS = [
  "Tajawal",
  "Zain",
  "Cairo",
  "Almarai",
  "Changa",
  "IBM Plex Sans Arabic",
];

const FONT_SIZES = [
  {
    value: 12,
    name: "صغير",
  },
  {
    value: 14,
    name: "متوسط",
  },
  {
    value: 17,
    name: "كبير",
  },
];

const PRINT_LAYOUTS = [
  {
    key: "auto",
    name: "تلقائي",
  },
  {
    key: "1",
    name: "تقرير واحد",
  },
  {
    key: "2",
    name: "تقريران",
  },
  {
    key: "2stack",
    name: "2 متراص",
  },
  {
    key: "3",
    name: "3 تقارير",
  },
  {
    key: "4",
    name: "4 تقارير",
  },
];

const PAPER_OPTIONS = [
  {
    key: "A4",
    name: "A4",
  },
  {
    key: "A5",
    name: "A5",
  },
  {
    key: "Letter",
    name: "Letter",
  },
];

const LOGO_POSITIONS = [
  {
    key: "right",
    name: "يمين",
  },
  {
    key: "center",
    name: "وسط",
  },
  {
    key: "left",
    name: "يسار",
  },
];

const LOGO_SIZES = [
  {
    key: 16,
    name: "صغير",
  },
  {
    key: 24,
    name: "متوسط",
  },
  {
    key: 32,
    name: "كبير",
  },
];


/* =========================================
   الشاشة
========================================= */

export default function SettingsScreen() {

  const {
    settings,
    setSetting,
  } = useLabStore();


  /* =======================================
     حالات Google Drive
  ======================================= */

  const [
    driveUser,
    setDriveUser,
  ] = useState<any>(null);

  const [
    driveSummary,
    setDriveSummary,
  ] = useState("");

  const [
    driveLoading,
    setDriveLoading,
  ] = useState(false);


  /* =======================================
     حالات المختبر
  ======================================= */

  const [
    newPriceTest,
    setNewPriceTest,
  ] = useState("");

  const [
    newPriceValue,
    setNewPriceValue,
  ] = useState("");


  const [
    newRangeTest,
    setNewRangeTest,
  ] = useState("");

  const [
    newRangeLow,
    setNewRangeLow,
  ] = useState("");

  const [
    newRangeHigh,
    setNewRangeHigh,
  ] = useState("");


  /* =======================================
     حالات النوافذ
  ======================================= */

  const [
    importModalVisible,
    setImportModalVisible,
  ] = useState(false);

  const [
    labEditorVisible,
    setLabEditorVisible,
  ] = useState(false);

  const [
    labEditorType,
    setLabEditorType,
  ] = useState<
    "center" | "directorate"
  >("center");

  const [
    labEditorValue,
    setLabEditorValue,
  ] = useState("");


  /* =======================================
     استعادة جلسة Google
  ======================================= */

  useEffect(() => {

    let mounted = true;

    const restore = async () => {

      try {

        const user =
          await restoreGoogleSession();

        if (
          mounted &&
          user
        ) {
          setDriveUser(user);
        }

      } catch (error) {

        console.log(
          "GOOGLE RESTORE ERROR:",
          error
        );

      }

    };

    restore();

    return () => {
      mounted = false;
    };

  }, []);


  /* =======================================
     تحديث ملخص Drive
  ======================================= */

  const refreshDriveSummary =
    async () => {

      try {

        const summary =
          await getDriveBackupSummary();

        setDriveSummary(
          summary || ""
        );

      } catch (error) {

        console.log(
          "DRIVE SUMMARY ERROR:",
          error
        );

      }

    };


  /* =======================================
     تحديث إعداد
  ======================================= */

  const updateSetting = (
    key: string,
    value: any
  ) => {

    setSetting(
      key as any,
      value
    );

  };


  /* =======================================
     تحديث إعدادات الطباعة
  ======================================= */

  const updatePrint = (
    values: any
  ) => {

    setSetting(
      "printSettings" as any,
      {
        ...settings.printSettings,
        ...values,
      }
    );

  };


  /* =======================================
     تسجيل الدخول Google
  ======================================= */

  const signIn =
    async () => {

      if (driveLoading) {
        return;
      }

      try {

        setDriveLoading(true);

        const user =
          await signInWithGoogle();

        setDriveUser(user);

        await refreshDriveSummary();

        Alert.alert(
          "تم",
          "تم تسجيل الدخول إلى Google بنجاح."
        );

      } catch (error: any) {

        console.log(
          "GOOGLE SIGN IN ERROR:",
          error
        );

        Alert.alert(
          "خطأ",
          error?.message ||
            "تعذر تسجيل الدخول إلى Google."
        );

      } finally {

        setDriveLoading(false);

      }

    };


  /* =======================================
     تسجيل الخروج Google
  ======================================= */

  const signOut =
    async () => {

      try {

        await signOutGoogle();

        setDriveUser(null);
        setDriveSummary("");

        Alert.alert(
          "تم",
          "تم تسجيل الخروج."
        );

      } catch (error: any) {

        Alert.alert(
          "خطأ",
          error?.message ||
            "تعذر تسجيل الخروج."
        );

      }

    };


  /* =======================================
     النسخ الاحتياطي إلى Drive
  ======================================= */

  const driveBackup =
    async () => {

      try {

        if (!driveUser) {

          Alert.alert(
            "تنبيه",
            "يجب تسجيل الدخول إلى Google أولاً."
          );

          return;
        }

        setDriveLoading(true);

        await uploadBackupToDrive();

        await refreshDriveSummary();

        Alert.alert(
          "تم",
          "تم إنشاء النسخة الاحتياطية على Google Drive."
        );

      } catch (error: any) {

        console.log(
          "DRIVE BACKUP ERROR:",
          error
        );

        Alert.alert(
          "خطأ",
          error?.message ||
            "تعذر إنشاء النسخة الاحتياطية."
        );

      } finally {

        setDriveLoading(false);

      }

    };


  /* =======================================
     الاستعادة من Drive
  ======================================= */

  const driveRestore =
    async () => {

      try {

        if (!driveUser) {

          Alert.alert(
            "تنبيه",
            "يجب تسجيل الدخول إلى Google أولاً."
          );

          return;
        }

        setDriveLoading(true);

        const result =
          await restoreLatestBackupFromDrive();

        if (result) {

          Alert.alert(
            "تم",
            "تمت استعادة البيانات بنجاح. سيتم تحديث التطبيق."
          );

        } else {

          Alert.alert(
            "تنبيه",
            "لم يتم العثور على نسخة احتياطية."
          );

        }

      } catch (error: any) {

        console.log(
          "DRIVE RESTORE ERROR:",
          error
        );

        Alert.alert(
          "خطأ",
          error?.message ||
            "تعذر استعادة النسخة الاحتياطية."
        );

      } finally {

        setDriveLoading(false);

      }

    };


  /* =======================================
     النسخ المحلي
  ======================================= */

  const backup =
    async () => {

      try {

        await backupData();

        Alert.alert(
          "تم",
          "تم إنشاء النسخة الاحتياطية بنجاح."
        );

      } catch (error: any) {

        Alert.alert(
          "خطأ",
          error?.message ||
            "تعذر إنشاء النسخة الاحتياطية."
        );

      }

    };


  /* =======================================
     استيراد نسخة
  ======================================= */

  const importFile =
    async () => {

      try {

        const result =
          await importBackupData();

        if (result) {

          Alert.alert(
            "تم",
            "تم استيراد البيانات بنجاح."
          );

        }

      } catch (error: any) {

        console.log(
          "IMPORT ERROR:",
          error
        );

        Alert.alert(
          "خطأ",
          error?.message ||
            "تعذر استيراد النسخة."
        );

      }

    };  /* =======================================
     حفظ بيانات المختبر
  ======================================= */

  const saveLabText = () => {

    const value =
      labEditorValue.trim();

    if (!value) {
      return;
    }

    updateSetting(
      labEditorType,
      value
    );

    setLabEditorVisible(false);

  };


  /* =======================================
     فتح محرر بيانات المختبر
  ======================================= */

  const openLabEditor = (
    type:
      | "center"
      | "directorate"
  ) => {

    setLabEditorType(type);

    setLabEditorValue(
      type === "center"
        ? settings.center
        : settings.directorate
    );

    setLabEditorVisible(true);

  };


  /* =======================================
     إضافة سعر
  ======================================= */

  const addPrice = () => {

    const test =
      newPriceTest.trim();

    const price =
      Number(newPriceValue);

    if (!test) {

      Alert.alert(
        "تنبيه",
        "اكتب اسم الفحص أولاً."
      );

      return;
    }

    if (
      Number.isNaN(price) ||
      price < 0
    ) {

      Alert.alert(
        "تنبيه",
        "أدخل سعراً صحيحاً."
      );

      return;
    }

    updateSetting(
      "testPrices",
      {
        ...(settings.testPrices || {}),
        [test]: price,
      }
    );

    setNewPriceTest("");
    setNewPriceValue("");

  };


  /* =======================================
     حذف سعر
  ======================================= */

  const deletePrice = (
    testName: string
  ) => {

    Alert.alert(
      "حذف السعر",
      `هل تريد حذف سعر فحص "${testName}"؟`,
      [
        {
          text: "إلغاء",
          style: "cancel",
        },
        {
          text: "حذف",
          style: "destructive",
          onPress: () => {

            const next = {
              ...(settings.testPrices || {}),
            };

            delete next[testName];

            updateSetting(
              "testPrices",
              next
            );

          },
        },
      ]
    );

  };


  /* =======================================
     إضافة حد حرج
  ======================================= */

  const addCriticalRange = () => {

    const test =
      newRangeTest.trim();

    const low =
      Number(newRangeLow);

    const high =
      Number(newRangeHigh);

    if (!test) {

      Alert.alert(
        "تنبيه",
        "اكتب اسم الفحص أولاً."
      );

      return;
    }

    if (
      Number.isNaN(low) ||
      Number.isNaN(high)
    ) {

      Alert.alert(
        "تنبيه",
        "أدخل القيم بشكل صحيح."
      );

      return;
    }

    if (low >= high) {

      Alert.alert(
        "تنبيه",
        "يجب أن يكون الحد الأدنى أقل من الحد الأعلى."
      );

      return;
    }

    updateSetting(
      "criticalRanges",
      {
        ...(settings.criticalRanges || {}),
        [test]: {
          low,
          high,
        },
      }
    );

    setNewRangeTest("");
    setNewRangeLow("");
    setNewRangeHigh("");

  };


  /* =======================================
     حذف حد حرج
  ======================================= */

  const deleteCriticalRange = (
    testName: string
  ) => {

    Alert.alert(
      "حذف الحد الحرج",
      `هل تريد حذف إعداد "${testName}"؟`,
      [
        {
          text: "إلغاء",
          style: "cancel",
        },
        {
          text: "حذف",
          style: "destructive",
          onPress: () => {

            const next = {
              ...(settings.criticalRanges || {}),
            };

            delete next[testName];

            updateSetting(
              "criticalRanges",
              next
            );

          },
        },
      ]
    );

  };


  /* =======================================
     تغيير شعار المختبر
  ======================================= */

  const changeLogo =
    async () => {

      try {

        const permission =
          await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (
          !permission.granted
        ) {

          Alert.alert(
            "صلاحية مطلوبة",
            "يجب السماح للتطبيق بالوصول إلى الصور لاختيار شعار المختبر."
          );

          return;
        }

        const result =
          await ImagePicker.launchImageLibraryAsync(
            {
              mediaTypes:
                ["images"],
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.8,
            }
          );

        if (
          result.canceled ||
          !result.assets ||
          !result.assets.length
        ) {
          return;
        }

        const uri =
          result.assets[0].uri;

        updateSetting(
          "logo",
          uri
        );

        Alert.alert(
          "تم",
          "تم اختيار شعار المختبر."
        );

      } catch (error: any) {

        console.log(
          "LOGO ERROR:",
          error
        );

        Alert.alert(
          "خطأ",
          error?.message ||
            "تعذر اختيار الشعار."
        );

      }

    };


  /* =======================================
     إعادة إعدادات الطباعة
  ======================================= */

  const resetPrintSettings =
    () => {

      Alert.alert(
        "إعادة الإعدادات",
        "هل تريد إعادة إعدادات الطباعة إلى الإعدادات الافتراضية؟",
        [
          {
            text: "إلغاء",
            style: "cancel",
          },
          {
            text: "إعادة",
            onPress: () => {

              updateSetting(
                "printSettings",
                {
                  paper: "A4",
                  orientation:
                    "portrait",
                  layout: "auto",
                  gap: 4,

                  marginTop: 8,
                  marginRight: 8,
                  marginBottom: 8,
                  marginLeft: 8,

                  fontSize: 13,
                  tableFontSize: 11,

                  fontFamily:
                    "Tajawal",

                  showLogo: true,

                  logoPosition:
                    "right",

                  logoSize: 24,

                  reportTitle:
                    "تقرير الفحوصات المخبرية",

                  showCenter: true,
                  showDirectorate: true,
                  showDate: true,
                  showSeq: true,
                  showNotes: true,
                  showFooter: true,

                  footerText:
                    "مع تمنياتنا بالصحة والعافية",

                  showBorder: true,

                  borderColor:
                    "#777777",

                  showNormal: true,
                }
              );

            },
          },
        ]
      );

    };


  /* =======================================
     حفظ كل الإعدادات
  ======================================= */

  const apply = () => {

    Alert.alert(
      "تم الحفظ",
      "تم حفظ إعدادات المختبر بنجاح."
    );

  };


  /* =======================================
     إدخال رقمي
  ======================================= */

  const renderNumberInput = (
    label: string,
    value: number,
    onChange: (
      value: number
    ) => void,
    min = 0,
    max = 100
  ) => {

    return (
      <View
        style={
          styles.numberRow
        }
      >

        <Text
          style={
            styles.inputLabel
          }
        >
          {label}
        </Text>

        <TextInput
          value={String(
            value ?? 0
          )}
          onChangeText={(text) => {

            if (text === "") {
              onChange(min);
              return;
            }

            const parsed =
              Number(text);

            if (
              !Number.isNaN(parsed)
            ) {

              onChange(
                Math.max(
                  min,
                  Math.min(
                    max,
                    parsed
                  )
                )
              );

            }

          }}
          keyboardType="numeric"
          style={
            styles.numberInput
          }
        />

      </View>
    );

  };


  /* =======================================
     Switch
  ======================================= */

  const renderSwitch = (
    label: string,
    value: boolean,
    onChange: (
      value: boolean
    ) => void
  ) => {

    return (
      <View
        style={
          styles.switchRow
        }
      >

        <Text
          style={
            styles.switchLabel
          }
        >
          {label}
        </Text>

        <Switch
          value={
            Boolean(value)
          }
          onValueChange={
            onChange
          }
        />

      </View>
    );

  };


  /* =======================================
     خيارات متعددة
  ======================================= */

  const renderChoice = (
    items: {
      key: any;
      name: string;
    }[],
    selected: any,
    onSelect: (
      value: any
    ) => void
  ) => {

    return (
      <View
        style={
          styles.chips
        }
      >

        {items.map(
          (item) => {

            const active =
              selected ===
              item.key;

            return (
              <TouchableOpacity
                key={String(
                  item.key
                )}
                onPress={() =>
                  onSelect(
                    item.key
                  )
                }
                style={[
                  styles.chip,
                  active &&
                    styles.chipOn,
                ]}
              >

                <Text
                  style={
                    active
                      ? styles.chipOnText
                      : styles.chipText
                  }
                >
                  {item.name}
                </Text>

              </TouchableOpacity>
            );

          }
        )}

      </View>
    );

  };


  /* =======================================
     البيانات المختصرة
  ======================================= */

  const prices =
    settings.testPrices || {};

  const criticalRanges =
    settings.criticalRanges || {};


  /* =======================================
     بداية الواجهة
  ======================================= */

  return (

    <SafeAreaView
      style={[
        styles.safe,
        settings.darkMode &&
          styles.safeDark,
      ]}
    >

      <ScrollView
        contentContainerStyle={
          styles.container
        }
        showsVerticalScrollIndicator={
          false
        }
      >

        {/* العنوان */}

        <View
          style={
            styles.header
          }
        >

          <View
            style={
              styles.headerTextBox
            }
          >

            <Text
              style={
                styles.headerTitle
              }
            >
              إعدادات المختبر
            </Text>

            <Text
              style={
                styles.headerSubtitle
              }
            >
              التحكم الكامل بإعدادات
              التطبيق
            </Text>

          </View>

          <TouchableOpacity
            onPress={apply}
            style={
              styles.saveButton
            }
          >

            <Text
              style={
                styles.saveButtonText
              }
            >
              حفظ
            </Text>

          </TouchableOpacity>

        </View>


        {/* =================================
            بيانات المختبر
        ================================= */}

        <View
          style={
            styles.section
          }
        >

          <Text
            style={
              styles.sectionTitle
            }
          >
            🏥 بيانات المختبر
          </Text>


          <Text
            style={
              styles.inputLabel
            }
          >
            اسم المركز / المختبر
          </Text>

          <TextInput
            value={
              settings.center
            }
            onChangeText={(value) =>
              updateSetting(
                "center",
                value
              )
            }
            placeholder="اسم المركز"
            style={
              styles.input
            }
          />


          <Text
            style={
              styles.inputLabel
            }
          >
            الدائرة / القطاع
          </Text>

          <TextInput
            value={
              settings.directorate
            }
            onChangeText={(value) =>
              updateSetting(
                "directorate",
                value
              )
            }
            placeholder="الدائرة / القطاع"
            style={
              styles.input
            }
          />


          <View
            style={
              styles.infoBox
            }
          >

            <Text
              style={
                styles.infoText
              }
            >
              سيتم استخدام هذه البيانات
              تلقائياً في التقارير
              المطبوعة.
            </Text>

          </View>


          <TouchableOpacity
            style={
              styles.secondaryButton
            }
            onPress={
              changeLogo
            }
          >

            <Text
              style={
                styles.secondaryButtonText
              }
            >
              🖼️ تغيير شعار المختبر
            </Text>

          </TouchableOpacity>


          {settings.logo ? (

            <Image
              source={{
                uri:
                  settings.logo,
              }}
              style={
                styles.logoPreview
              }
              resizeMode="contain"
            />

          ) : (

            <Text
              style={
                styles.smallText
              }
            >
              لم يتم اختيار شعار
            </Text>

          )}

        </View>


        {/* =================================
            المظهر
        ================================= */}

        <View
          style={
            styles.section
          }
        >

          <Text
            style={
              styles.sectionTitle
            }
          >
            🎨 المظهر والألوان
          </Text>


          <Text
            style={
              styles.inputLabel
            }
          >
            القالب
          </Text>


          <View
            style={
              styles.themeGrid
            }
          >

            {THEMES.map(
              (theme) => {

                const active =
                  settings.theme ===
                  theme.key;

                return (

                  <TouchableOpacity
                    key={
                      theme.key
                    }
                    onPress={() =>
                      updateSetting(
                        "theme",
                        theme.key
                      )
                    }
                    style={[
                      styles.themeCard,
                      active &&
                        styles.themeCardActive,
                    ]}
                  >

                    <View
                      style={[
                        styles.themeCircle,
                        {
                          backgroundColor:
                            theme.color,
                        },
                      ]}
                    />

                    <Text
                      style={
                        active
                          ? styles.themeNameActive
                          : styles.themeName
                      }
                    >
                      {
                        theme.name
                      }
                    </Text>

                  </TouchableOpacity>

                );

              }
            )}

          </View>


          <Text
            style={
              styles.inputLabel
            }
          >
            لون مخصص HEX
          </Text>

          <TextInput
            value={
              settings.customAccent ||
              ""
            }
            onChangeText={(value) =>
              updateSetting(
                "customAccent",
                value
              )
            }
            placeholder="#1d3b36"
            autoCapitalize="characters"
            style={
              styles.input
            }
          />


          {renderSwitch(
            "الوضع الداكن",
            settings.darkMode,
            (value) =>
              updateSetting(
                "darkMode",
                value
              )
          )}


          <Text
            style={
              styles.inputLabel
            }
          >
            حجم الخط
          </Text>

          {renderChoice(
            FONT_SIZES.map(
              (item) => ({
                key:
                  item.value,
                name:
                  item.name,
              })
            ),
            settings.fontSizePx,
            (value) =>
              updateSetting(
                "fontSizePx",
                value
              )
          )}


          <Text
            style={
              styles.inputLabel
            }
          >
            نوع الخط
          </Text>

          {renderChoice(
            FONTS.map(
              (font) => ({
                key: font,
                name: font,
              })
            ),
            settings.fontFamily,
            (value) =>
              updateSetting(
                "fontFamily",
                value
              )
          )}


          <Text
            style={
              styles.inputLabel
            }
          >
            كثافة الواجهة
          </Text>

          {renderChoice(
            [
              {
                key:
                  "comfortable",
                name:
                  "مريحة",
              },
              {
                key:
                  "compact",
                name:
                  "مضغوطة",
              },
            ],
            settings.density,
            (value) =>
              updateSetting(
                "density",
                value
              )
          )}


          <Text
            style={
              styles.inputLabel
            }
          >
            شكل الأيقونات
          </Text>

          {renderChoice(
            [
              {
                key:
                  "circle",
                name:
                  "دائرية",
              },
              {
                key:
                  "rounded",
                name:
                  "مستديرة",
              },
              {
                key:
                  "square",
                name:
                  "مربعة",
              },
            ],
            settings.iconShape,
            (value) =>
              updateSetting(
                "iconShape",
                value
              )
          )}


          <Text
            style={
              styles.inputLabel
            }
          >
            حجم الشعار
          </Text>

          {renderChoice(
            [
              {
                key:
                  "small",
                name:
                  "صغير",
              },
              {
                key:
                  "medium",
                name:
                  "متوسط",
              },
              {
                key:
                  "large",
                name:
                  "كبير",
              },
            ],
            settings.logoSize,
            (value) =>
              updateSetting(
                "logoSize",
                value
              )
          )}


          {renderSwitch(
            "إظهار إطار حول الشعار",
            settings.logoBorder,
            (value) =>
              updateSetting(
                "logoBorder",
                value
              )
          )}

        </View>        {/* =================================
            أسعار الفحوصات
        ================================= */}

        <View
          style={
            styles.section
          }
        >

          <Text
            style={
              styles.sectionTitle
            }
          >
            💰 أسعار الفحوصات
          </Text>


          {renderSwitch(
            "تفعيل أسعار الفحوصات",
            settings.pricesEnabled,
            (value) =>
              updateSetting(
                "pricesEnabled",
                value
              )
          )}


          <Text
            style={
              styles.smallText
            }
          >
            يمكنك إضافة سعر لكل فحص
            وسيتم حفظ الأسعار داخل
            إعدادات المختبر.
          </Text>


          <View
            style={
              styles.addRow
            }
          >

            <TextInput
              value={
                newPriceTest
              }
              onChangeText={
                setNewPriceTest
              }
              placeholder="اسم الفحص"
              style={[
                styles.input,
                styles.addInput,
              ]}
            />


            <TextInput
              value={
                newPriceValue
              }
              onChangeText={
                setNewPriceValue
              }
              placeholder="السعر"
              keyboardType="numeric"
              style={[
                styles.input,
                styles.priceInput,
              ]}
            />


            <TouchableOpacity
              style={
                styles.addButton
              }
              onPress={
                addPrice
              }
            >

              <Text
                style={
                  styles.addButtonText
                }
              >
                +
              </Text>

            </TouchableOpacity>

          </View>


          {Object.keys(
            prices
          ).length === 0 ? (

            <Text
              style={
                styles.emptyText
              }
            >
              لا توجد أسعار مضافة
              حالياً.
            </Text>

          ) : (

            Object.entries(
              prices
            ).map(
              ([
                testName,
                price,
              ]) => (

                <View
                  key={
                    testName
                  }
                  style={
                    styles.listRow
                  }
                >

                  <View
                    style={
                      styles.listRowText
                    }
                  >

                    <Text
                      style={
                        styles.listTitle
                      }
                    >
                      {
                        testName
                      }
                    </Text>

                    <Text
                      style={
                        styles.listValue
                      }
                    >
                      {
                        String(
                          price
                        )
                      }
                    </Text>

                  </View>


                  <TouchableOpacity
                    onPress={() =>
                      deletePrice(
                        testName
                      )
                    }
                    style={
                      styles.deleteSmall
                    }
                  >

                    <Text
                      style={
                        styles.deleteSmallText
                      }
                    >
                      حذف
                    </Text>

                  </TouchableOpacity>

                </View>

              )
            )

          )}

        </View>


        {/* =================================
            الحدود الحرجة
        ================================= */}

        <View
          style={
            styles.section
          }
        >

          <Text
            style={
              styles.sectionTitle
            }
          >
            🚨 الحدود الحرجة
          </Text>


          {renderSwitch(
            "تفعيل تنبيهات النتائج الحرجة",
            settings.criticalAlertsEnabled,
            (value) =>
              updateSetting(
                "criticalAlertsEnabled",
                value
              )
          )}


          <Text
            style={
              styles.smallText
            }
          >
            أدخل الحد الأدنى والأعلى
            للفحص ليتم استخدامهما
            لاحقاً في تنبيهات النتائج.
          </Text>


          <View
            style={
              styles.addRangeRow
            }
          >

            <TextInput
              value={
                newRangeTest
              }
              onChangeText={
                setNewRangeTest
              }
              placeholder="اسم الفحص"
              style={
                styles.rangeTestInput
              }
            />


            <TextInput
              value={
                newRangeLow
              }
              onChangeText={
                setNewRangeLow
              }
              placeholder="من"
              keyboardType="numeric"
              style={
                styles.rangeNumberInput
              }
            />


            <TextInput
              value={
                newRangeHigh
              }
              onChangeText={
                setNewRangeHigh
              }
              placeholder="إلى"
              keyboardType="numeric"
              style={
                styles.rangeNumberInput
              }
            />


            <TouchableOpacity
              style={
                styles.addButton
              }
              onPress={
                addCriticalRange
              }
            >

              <Text
                style={
                  styles.addButtonText
                }
              >
                +
              </Text>

            </TouchableOpacity>

          </View>


          {Object.keys(
            criticalRanges
          ).length === 0 ? (

            <Text
              style={
                styles.emptyText
              }
            >
              لا توجد حدود حرجة
              مضافة حالياً.
            </Text>

          ) : (

            Object.entries(
              criticalRanges
            ).map(
              ([
                testName,
                range,
              ]) => {

                const item =
                  range as any;

                return (

                  <View
                    key={
                      testName
                    }
                    style={
                      styles.listRow
                    }
                  >

                    <View
                      style={
                        styles.listRowText
                      }
                    >

                      <Text
                        style={
                          styles.listTitle
                        }
                      >
                        {
                          testName
                        }
                      </Text>


                      <Text
                        style={
                          styles.listValue
                        }
                      >
                        من{" "}
                        {
                          String(
                            item?.low ??
                            ""
                          )
                        }{" "}
                        إلى{" "}
                        {
                          String(
                            item?.high ??
                            ""
                          )
                        }
                      </Text>

                    </View>


                    <TouchableOpacity
                      onPress={() =>
                        deleteCriticalRange(
                          testName
                        )
                      }
                      style={
                        styles.deleteSmall
                      }
                    >

                      <Text
                        style={
                          styles.deleteSmallText
                        }
                      >
                        حذف
                      </Text>

                    </TouchableOpacity>

                  </View>

                );

              }
            )

          )}

        </View>


        {/* =================================
            الإحصائيات
        ================================= */}

        <View
          style={
            styles.section
          }
        >

          <Text
            style={
              styles.sectionTitle
            }
          >
            📊 الإحصائيات
          </Text>


          {renderSwitch(
            "إظهار الجنس في الإحصائيات",
            settings.statsShowGender,
            (value) =>
              updateSetting(
                "statsShowGender",
                value
              )
          )}


          {renderSwitch(
            "إظهار الرسم البياني",
            settings.statsShowChart,
            (value) =>
              updateSetting(
                "statsShowChart",
                value
              )
          )}


          {renderSwitch(
            "إظهار التفاصيل تلقائياً",
            settings.statsAutoDetails,
            (value) =>
              updateSetting(
                "statsAutoDetails",
                value
              )
          )}

        </View>


        {/* =================================
            النسخ الاحتياطي التلقائي
        ================================= */}

        <View
          style={
            styles.section
          }
        >

          <Text
            style={
              styles.sectionTitle
            }
          >
            🔄 النسخ الاحتياطي التلقائي
          </Text>


          <Text
            style={
              styles.inputLabel
            }
          >
            طريقة النسخ التلقائي
          </Text>


          {renderChoice(
            [
              {
                key:
                  "off",
                name:
                  "متوقف",
              },
              {
                key:
                  "daily",
                name:
                  "يومي",
              },
              {
                key:
                  "weekly",
                name:
                  "أسبوعي",
              },
            ],
            settings.autoDriveBackupMode,
            (value) =>
              updateSetting(
                "autoDriveBackupMode",
                value
              )
          )}


          {renderNumberInput(
            "عدد النسخ المحتفظ بها",
            settings.driveBackupRetention,
            (value) =>
              updateSetting(
                "driveBackupRetention",
                value
              ),
            1,
            20
          )}

        </View>


        {/* =================================
            Google Drive
        ================================= */}

        <View
          style={
            styles.section
          }
        >

          <Text
            style={
              styles.sectionTitle
            }
          >
            ☁️ Google Drive
          </Text>


          <View
            style={
              styles.driveBox
            }
          >

            <Text
              style={
                styles.driveStatusText
              }
            >
              {
                driveUser
                  ? `الحساب: ${
                      driveUser.email ||
                      driveUser.name ||
                      "تم تسجيل الدخول"
                    }`
                  : "غير مسجل الدخول"
              }
            </Text>


            {driveLoading && (

              <Text
                style={
                  styles.loadingText
                }
              >
                جارٍ تنفيذ العملية...
              </Text>

            )}

          </View>


          {!driveUser ? (

            <TouchableOpacity
              style={
                styles.primaryButton
              }
              onPress={
                signIn
              }
              disabled={
                driveLoading
              }
            >

              <Text
                style={
                  styles.primaryButtonText
                }
              >
                🔑 تسجيل الدخول بحساب Google
              </Text>

            </TouchableOpacity>

          ) : (

            <>

              <TouchableOpacity
                style={
                  styles.primaryButton
                }
                onPress={
                  driveBackup
                }
                disabled={
                  driveLoading
                }
              >

                <Text
                  style={
                    styles.primaryButtonText
                  }
                >
                  ☁️ نسخ احتياطي إلى Google Drive
                </Text>

              </TouchableOpacity>


              <TouchableOpacity
                style={
                  styles.secondaryButton
                }
                onPress={
                  driveRestore
                }
                disabled={
                  driveLoading
                }
              >

                <Text
                  style={
                    styles.secondaryButtonText
                  }
                >
                  ♻️ استعادة من Google Drive
                </Text>

              </TouchableOpacity>


              <TouchableOpacity
                style={
                  styles.dangerButton
                }
                onPress={
                  signOut
                }
                disabled={
                  driveLoading
                }
              >

                <Text
                  style={
                    styles.dangerText
                  }
                >
                  تسجيل الخروج من Google
                </Text>

              </TouchableOpacity>

            </>

          )}


          {driveSummary ? (

            <View
              style={
                styles.infoBox
              }
            >

              <Text
                style={
                  styles.infoText
                }
              >
                {
                  driveSummary
                }
              </Text>

            </View>

          ) : null}

        </View>


        {/* =================================
            النسخ الاحتياطي المحلي
        ================================= */}

        <View
          style={
            styles.section
          }
        >

          <Text
            style={
              styles.sectionTitle
            }
          >
            💾 النسخ الاحتياطي المحلي
          </Text>


          <Text
            style={
              styles.smallText
            }
          >
            احفظ نسخة كاملة من بيانات
            المختبر على الجهاز أو
            استورد نسخة سابقة.
          </Text>


          <TouchableOpacity
            style={
              styles.primaryButton
            }
            onPress={
              backup
            }
          >

            <Text
              style={
                styles.primaryButtonText
              }
            >
              💾 إنشاء نسخة احتياطية
            </Text>

          </TouchableOpacity>


          <TouchableOpacity
            style={
              styles.secondaryButton
            }
            onPress={
              importFile
            }
          >

            <Text
              style={
                styles.secondaryButtonText
              }
            >
              📥 استيراد نسخة احتياطية
            </Text>

          </TouchableOpacity>

        </View>


        {/* =================================
            إعدادات الطباعة
        ================================= */}

        <View
          style={
            styles.section
          }
        >

          <Text
            style={
              styles.sectionTitle
            }
          >
            🖨️ إعدادات الطباعة والتقارير
          </Text>


          <Text
            style={
              styles.smallText
            }
          >
            تحكم بشكل التقرير وحجم
            الورق والخط والهوامش
            والعناصر التي تظهر أثناء
            الطباعة.
          </Text>


          <Text
            style={
              styles.inputLabel
            }
          >
            حجم الورق
          </Text>


          {renderChoice(
            PAPER_OPTIONS.map(
              (item) => ({
                key:
                  item.key,
                name:
                  item.name,
              })
            ),
            settings.printSettings.paper,
            (value) =>
              updatePrint({
                paper:
                  value,
              })
          )}


          <Text
            style={
              styles.inputLabel
            }
          >
            اتجاه الصفحة
          </Text>


          {renderChoice(
            [
              {
                key:
                  "portrait",
                name:
                  "عمودي",
              },
              {
                key:
                  "landscape",
                name:
                  "أفقي",
              },
            ],
            settings.printSettings
              .orientation,
            (value) =>
              updatePrint({
                orientation:
                  value,
              })
          )}


          <Text
            style={
              styles.inputLabel
            }
          >
            تخطيط التقارير
          </Text>


          {renderChoice(
            PRINT_LAYOUTS.map(
              (item) => ({
                key:
                  item.key,
                name:
                  item.name,
              })
            ),
            settings.printSettings
              .layout,
            (value) =>
              updatePrint({
                layout:
                  value,
              })
          )}


          {renderNumberInput(
            "المسافة بين التقارير",
            settings.printSettings
              .gap,
            (value) =>
              updatePrint({
                gap:
                  value,
              }),
            0,
            30
          )}


          <Text
            style={
              styles.subSectionTitle
            }
          >
            الهوامش
          </Text>


          {renderNumberInput(
            "الهامش العلوي",
            settings.printSettings
              .marginTop,
            (value) =>
              updatePrint({
                marginTop:
                  value,
              }),
            0,
            50
          )}


          {renderNumberInput(
            "الهامش الأيمن",
            settings.printSettings
              .marginRight,
            (value) =>
              updatePrint({
                marginRight:
                  value,
              }),
            0,
            50
          )}


          {renderNumberInput(
            "الهامش السفلي",
            settings.printSettings
              .marginBottom,
            (value) =>
              updatePrint({
                marginBottom:
                  value,
              }),
            0,
            50
          )}


          {renderNumberInput(
            "الهامش الأيسر",
            settings.printSettings
              .marginLeft,
            (value) =>
              updatePrint({
                marginLeft:
                  value,
              }),
            0,
            50
          )}

        </View>        {/* =================================
            إعدادات الطباعة - الخط والتقرير
        ================================= */}

        <Text
          style={
            styles.inputLabel
          }
        >
          نوع خط التقرير
        </Text>

        {renderChoice(
          FONTS.map(
            (font) => ({
              key: font,
              name: font,
            })
          ),
          settings.printSettings
            .fontFamily,
          (value) =>
            updatePrint({
              fontFamily:
                value,
            })
        )}


        {renderNumberInput(
          "حجم خط التقرير",
          settings.printSettings
            .fontSize,
          (value) =>
            updatePrint({
              fontSize:
                value,
            }),
          8,
          22
        )}


        {renderNumberInput(
          "حجم خط جدول الفحوصات",
          settings.printSettings
            .tableFontSize,
          (value) =>
            updatePrint({
              tableFontSize:
                value,
            }),
          7,
          18
        )}


        {/* =================================
            إعدادات الشعار في التقرير
        ================================= */}

        <Text
          style={
            styles.subSectionTitle
          }
        >
          شعار التقرير
        </Text>


        {renderSwitch(
          "إظهار الشعار في التقرير",
          settings.printSettings
            .showLogo,
          (value) =>
            updatePrint({
              showLogo:
                value,
            })
        )}


        <Text
          style={
            styles.inputLabel
          }
        >
          موضع الشعار
        </Text>


        {renderChoice(
          LOGO_POSITIONS.map(
            (item) => ({
              key:
                item.key,
              name:
                item.name,
            })
          ),
          settings.printSettings
            .logoPosition,
          (value) =>
            updatePrint({
              logoPosition:
                value,
            })
        )}


        <Text
          style={
            styles.inputLabel
          }
        >
          حجم الشعار في التقرير
        </Text>


        {renderChoice(
          LOGO_SIZES.map(
            (item) => ({
              key:
                item.key,
              name:
                item.name,
            })
          ),
          settings.printSettings
            .logoSize,
          (value) =>
            updatePrint({
              logoSize:
                value,
            })
        )}


        {/* =================================
            عنوان التقرير
        ================================= */}

        <Text
          style={
            styles.inputLabel
          }
        >
          عنوان التقرير
        </Text>


        <TextInput
          value={
            settings.printSettings
              .reportTitle
          }
          onChangeText={(value) =>
            updatePrint({
              reportTitle:
                value,
            })
          }
          placeholder="تقرير الفحوصات المخبرية"
          style={
            styles.input
          }
        />


        {/* =================================
            عناصر التقرير
        ================================= */}

        <Text
          style={
            styles.subSectionTitle
          }
        >
          العناصر الظاهرة في التقرير
        </Text>


        {renderSwitch(
          "إظهار اسم المركز",
          settings.printSettings
            .showCenter,
          (value) =>
            updatePrint({
              showCenter:
                value,
            })
        )}


        {renderSwitch(
          "إظهار الدائرة / القطاع",
          settings.printSettings
            .showDirectorate,
          (value) =>
            updatePrint({
              showDirectorate:
                value,
            })
        )}


        {renderSwitch(
          "إظهار التاريخ",
          settings.printSettings
            .showDate,
          (value) =>
            updatePrint({
              showDate:
                value,
            })
        )}


        {renderSwitch(
          "إظهار التسلسل",
          settings.printSettings
            .showSeq,
          (value) =>
            updatePrint({
              showSeq:
                value,
            })
        )}


        {renderSwitch(
          "إظهار الملاحظات",
          settings.printSettings
            .showNotes,
          (value) =>
            updatePrint({
              showNotes:
                value,
            })
        )}


        {renderSwitch(
          "إظهار النتائج الطبيعية",
          settings.printSettings
            .showNormal,
          (value) =>
            updatePrint({
              showNormal:
                value,
            })
        )}


        {/* =================================
            التذييل
        ================================= */}

        <Text
          style={
            styles.subSectionTitle
          }
        >
          تذييل التقرير
        </Text>


        {renderSwitch(
          "إظهار التذييل",
          settings.printSettings
            .showFooter,
          (value) =>
            updatePrint({
              showFooter:
                value,
            })
        )}


        <Text
          style={
            styles.inputLabel
          }
        >
          نص التذييل
        </Text>


        <TextInput
          value={
            settings.printSettings
              .footerText
          }
          onChangeText={(value) =>
            updatePrint({
              footerText:
                value,
            })
          }
          placeholder="مع تمنياتنا بالصحة والعافية"
          style={
            styles.input
          }
        />


        {/* =================================
            حدود التقرير
        ================================= */}

        <Text
          style={
            styles.subSectionTitle
          }
        >
          حدود التقرير
        </Text>


        {renderSwitch(
          "إظهار إطار التقرير",
          settings.printSettings
            .showBorder,
          (value) =>
            updatePrint({
              showBorder:
                value,
            })
        )}


        <Text
          style={
            styles.inputLabel
          }
        >
          لون الإطار
        </Text>


        <TextInput
          value={
            settings.printSettings
              .borderColor
          }
          onChangeText={(value) =>
            updatePrint({
              borderColor:
                value,
            })
          }
          placeholder="#777777"
          autoCapitalize="characters"
          style={
            styles.input
          }
        />


        {/* =================================
            إعادة ضبط الطباعة
        ================================= */}

        <TouchableOpacity
          style={
            styles.resetButton
          }
          onPress={
            resetPrintSettings
          }
        >

          <Text
            style={
              styles.resetButtonText
            }
          >
            🔄 إعادة إعدادات الطباعة
          </Text>

        </TouchableOpacity>

        </View>


        {/* =================================
            حالة المشروع
        ================================= */}

        <View
          style={
            styles.section
          }
        >

          <Text
            style={
              styles.sectionTitle
            }
          >
            ℹ️ حالة المشروع
          </Text>


          <View
            style={
              styles.statusRow
            }
          >

            <Text
              style={
                styles.statusLabel
              }
            >
              إصدار التطبيق
            </Text>

            <Text
              style={
                styles.statusValue
              }
            >
              1.0.0
            </Text>

          </View>


          <View
            style={
              styles.statusRow
            }
          >

            <Text
              style={
                styles.statusLabel
              }
            >
              التخزين المحلي
            </Text>

            <Text
              style={
                styles.statusValue
              }
            >
              فعال
            </Text>

          </View>


          <View
            style={
              styles.statusRow
            }
          >

            <Text
              style={
                styles.statusLabel
              }
            >
              Google Drive
            </Text>

            <Text
              style={
                styles.statusValue
              }
            >
              {driveUser
                ? "متصل"
                : "غير متصل"}
            </Text>

          </View>

        </View>


        {/* =================================
            زر الحفظ النهائي
        ================================= */}

        <TouchableOpacity
          style={
            styles.finalSaveButton
          }
          onPress={
            apply
          }
        >

          <Text
            style={
              styles.finalSaveText
            }
          >
            ✓ حفظ جميع الإعدادات
          </Text>

        </TouchableOpacity>


        <View
          style={
            styles.bottomSpace
          }
        />

      </ScrollView>


      {/* ===================================
          نافذة تعديل بيانات المختبر
      =================================== */}

      {labEditorVisible && (

        <View
          style={
            styles.modalOverlay
          }
        >

          <View
            style={
              styles.modalBox
            }
          >

            <Text
              style={
                styles.modalTitle
              }
            >
              {labEditorType ===
              "center"
                ? "تعديل اسم المركز"
                : "تعديل الدائرة / القطاع"}
            </Text>


            <TextInput
              value={
                labEditorValue
              }
              onChangeText={
                setLabEditorValue
              }
              style={
                styles.modalInput
              }
              autoFocus
            />


            <View
              style={
                styles.modalButtons
              }
            >

              <TouchableOpacity
                style={
                  styles.modalCancel
                }
                onPress={() =>
                  setLabEditorVisible(
                    false
                  )
                }
              >

                <Text
                  style={
                    styles.modalCancelText
                  }
                >
                  إلغاء
                </Text>

              </TouchableOpacity>


              <TouchableOpacity
                style={
                  styles.modalConfirm
                }
                onPress={
                  saveLabText
                }
              >

                <Text
                  style={
                    styles.modalConfirmText
                  }
                >
                  حفظ
                </Text>

              </TouchableOpacity>

            </View>

          </View>

        </View>

      )}


      {/* ===================================
          نافذة الاستيراد
      =================================== */}

      {importModalVisible && (

        <View
          style={
            styles.modalOverlay
          }
        >

          <View
            style={
              styles.modalBox
            }
          >

            <Text
              style={
                styles.modalTitle
              }
            >
              استيراد نسخة احتياطية
            </Text>


            <Text
              style={
                styles.modalMessage
              }
            >
              سيتم استبدال البيانات
              الحالية بالبيانات الموجودة
              في النسخة الاحتياطية.
            </Text>


            <View
              style={
                styles.modalButtons
              }
            >

              <TouchableOpacity
                style={
                  styles.modalCancel
                }
                onPress={() =>
                  setImportModalVisible(
                    false
                  )
                }
              >

                <Text
                  style={
                    styles.modalCancelText
                  }
                >
                  إلغاء
                </Text>

              </TouchableOpacity>


              <TouchableOpacity
                style={
                  styles.modalConfirm
                }
                onPress={() => {

                  setImportModalVisible(
                    false
                  );

                  importFile();

                }}
              >

                <Text
                  style={
                    styles.modalConfirmText
                  }
                >
                  استيراد
                </Text>

              </TouchableOpacity>

            </View>

          </View>

        </View>

      )}

    </SafeAreaView>

  );

      }const styles = StyleSheet.create({

  /* =====================================
     الصفحة
  ===================================== */

  safe: {
    flex: 1,
    backgroundColor: "#f5f7f6",
  },

  safeDark: {
    backgroundColor: "#111827",
  },

  container: {
    padding: 16,
    paddingBottom: 40,
  },


  /* =====================================
     الرأس
  ===================================== */

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },

  headerTextBox: {
    flex: 1,
    paddingRight: 12,
  },

  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1d3b36",
    textAlign: "right",
  },

  headerSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: "#6b7280",
    textAlign: "right",
  },

  saveButton: {
    backgroundColor: "#1d3b36",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },

  saveButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },


  /* =====================================
     الأقسام
  ===================================== */

  section: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1f2937",
    textAlign: "right",
    marginBottom: 14,
  },

  subSectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#374151",
    textAlign: "right",
    marginTop: 16,
    marginBottom: 10,
  },


  /* =====================================
     النصوص
  ===================================== */

  inputLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#374151",
    textAlign: "right",
    marginTop: 10,
    marginBottom: 7,
  },

  smallText: {
    fontSize: 12,
    color: "#6b7280",
    textAlign: "right",
    lineHeight: 20,
    marginBottom: 8,
  },

  emptyText: {
    fontSize: 13,
    color: "#9ca3af",
    textAlign: "center",
    paddingVertical: 12,
  },

  infoText: {
    fontSize: 13,
    color: "#374151",
    textAlign: "right",
    lineHeight: 20,
  },


  /* =====================================
     الحقول
  ===================================== */

  input: {
    width: "100%",
    minHeight: 46,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    backgroundColor: "#ffffff",
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#111827",
    fontSize: 14,
    textAlign: "right",
    marginBottom: 8,
  },

  numberInput: {
    width: 90,
    height: 42,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 9,
    backgroundColor: "#ffffff",
    paddingHorizontal: 10,
    color: "#111827",
    fontSize: 14,
    textAlign: "center",
  },

  numberRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 5,
  },


  /* =====================================
     الخيارات
  ===================================== */

  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    marginBottom: 8,
  },

  chip: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    backgroundColor: "#f9fafb",
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 20,
    marginLeft: 6,
    marginBottom: 7,
  },

  chipOn: {
    backgroundColor: "#1d3b36",
    borderColor: "#1d3b36",
  },

  chipText: {
    color: "#4b5563",
    fontSize: 13,
    fontWeight: "600",
  },

  chipOnText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },


  /* =====================================
     Switch
  ===================================== */

  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f1f2",
  },

  switchLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    textAlign: "right",
    marginRight: 12,
  },


  /* =====================================
     الثيمات
  ===================================== */

  themeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    marginBottom: 8,
  },

  themeCard: {
    width: "30%",
    minWidth: 90,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 11,
    marginLeft: 7,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    backgroundColor: "#fafafa",
  },

  themeCardActive: {
    borderColor: "#1d3b36",
    backgroundColor: "#eef5f2",
  },

  themeCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginBottom: 6,
  },

  themeName: {
    fontSize: 12,
    color: "#4b5563",
    fontWeight: "600",
  },

  themeNameActive: {
    fontSize: 12,
    color: "#1d3b36",
    fontWeight: "800",
  },


  /* =====================================
     الشعار
  ===================================== */

  logoPreview: {
    width: 90,
    height: 90,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: "#f3f4f6",
  },


  /* =====================================
     أزرار عامة
  ===================================== */

  primaryButton: {
    width: "100%",
    minHeight: 48,
    backgroundColor: "#1d3b36",
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    marginTop: 9,
  },

  primaryButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "800",
    textAlign: "center",
  },

  secondaryButton: {
    width: "100%",
    minHeight: 46,
    backgroundColor: "#f0f4f2",
    borderWidth: 1,
    borderColor: "#cbd8d3",
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    marginTop: 9,
  },

  secondaryButtonText: {
    color: "#1d3b36",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },

  dangerButton: {
    width: "100%",
    minHeight: 46,
    backgroundColor: "#fff1f2",
    borderWidth: 1,
    borderColor: "#fecdd3",
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    marginTop: 9,
  },

  dangerText: {
    color: "#be123c",
    fontSize: 14,
    fontWeight: "700",
  },

  resetButton: {
    width: "100%",
    minHeight: 46,
    backgroundColor: "#fef3c7",
    borderWidth: 1,
    borderColor: "#f59e0b",
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
  },

  resetButtonText: {
    color: "#92400e",
    fontSize: 14,
    fontWeight: "800",
  },

  finalSaveButton: {
    width: "100%",
    minHeight: 52,
    backgroundColor: "#1d3b36",
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },

  finalSaveText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
  },


  /* =====================================
     الأسعار
  ===================================== */

  addRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },

  addInput: {
    flex: 1,
    marginRight: 6,
    marginBottom: 0,
  },

  priceInput: {
    width: 80,
    marginRight: 6,
    marginBottom: 0,
  },

  addButton: {
    width: 46,
    height: 46,
    borderRadius: 10,
    backgroundColor: "#1d3b36",
    alignItems: "center",
    justifyContent: "center",
  },

  addButtonText: {
    color: "#ffffff",
    fontSize: 25,
    fontWeight: "500",
    lineHeight: 28,
  },

  listRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 11,
    paddingHorizontal: 10,
    marginTop: 7,
    backgroundColor: "#f9fafb",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  listRowText: {
    flex: 1,
    alignItems: "flex-end",
    paddingRight: 8,
  },

  listTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1f2937",
    textAlign: "right",
  },

  listValue: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 3,
    textAlign: "right",
  },

  deleteSmall: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: "#fee2e2",
    borderRadius: 8,
  },

  deleteSmallText: {
    color: "#b91c1c",
    fontSize: 12,
    fontWeight: "700",
  },


  /* =====================================
     الحدود الحرجة
  ===================================== */

  addRangeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },

  rangeTestInput: {
    flex: 1,
    minHeight: 46,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    backgroundColor: "#ffffff",
    paddingHorizontal: 9,
    color: "#111827",
    fontSize: 13,
    textAlign: "right",
    marginRight: 5,
  },

  rangeNumberInput: {
    width: 58,
    height: 46,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    backgroundColor: "#ffffff",
    paddingHorizontal: 5,
    color: "#111827",
    fontSize: 13,
    textAlign: "center",
    marginRight: 5,
  },


  /* =====================================
     Drive
  ===================================== */

  driveBox: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 11,
    padding: 12,
    marginBottom: 4,
  },

  driveStatusText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#374151",
    textAlign: "right",
  },

  loadingText: {
    marginTop: 7,
    fontSize: 12,
    color: "#1d3b36",
    textAlign: "right",
  },


  /* =====================================
     المعلومات والحالة
  ===================================== */

  infoBox: {
    backgroundColor: "#f0f7f4",
    borderWidth: 1,
    borderColor: "#d4e5df",
    borderRadius: 10,
    padding: 11,
    marginTop: 9,
  },

  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f1f2",
  },

  statusLabel: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "right",
  },

  statusValue: {
    fontSize: 14,
    color: "#1d3b36",
    fontWeight: "800",
    textAlign: "right",
  },

  bottomSpace: {
    height: 30,
  },


  /* =====================================
     النوافذ
  ===================================== */

  modalOverlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },

  modalBox: {
    width: "100%",
    maxWidth: 450,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 18,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1f2937",
    textAlign: "right",
    marginBottom: 14,
  },

  modalMessage: {
    fontSize: 14,
    color: "#4b5563",
    textAlign: "right",
    lineHeight: 22,
    marginBottom: 14,
  },

  modalInput: {
    width: "100%",
    minHeight: 48,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    paddingHorizontal: 12,
    color: "#111827",
    fontSize: 14,
    textAlign: "right",
    marginBottom: 15,
  },

  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
  },

  modalCancel: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 9,
    backgroundColor: "#f3f4f6",
    marginLeft: 8,
  },

  modalCancelText: {
    color: "#4b5563",
    fontSize: 14,
    fontWeight: "700",
  },

  modalConfirm: {
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 9,
    backgroundColor: "#1d3b36",
  },

  modalConfirmText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "800",
  },

});
