import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Switch,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSettingsStore } from '../../store/settingsStore';
import { useIAPStore } from '../../store/iapStore';
import { FileSystem } from '../../utils/fileSystem';
import { useTheme } from '../../contexts/ThemeContext';
import { Theme, themes } from '../../constants/themes';
import type { ThemeId } from '../../contexts/ThemeContext';

const themeOptions: ThemeId[] = ['light', 'dark', 'solar', 'mono'];
const languageOptions = [
  'en',
  'ru',
  'es',
  'de',
  'fr',
  'pt',
  'ja',
  'it',
  'pl',
  'zh',
  'hi',
  'uk',
  'ko',
  'ar',
  'nl',
  'tr',
  'th',
  'vi',
  'id',
  'he',
  'sv',
  'nb',
  'da',
  'fi',
  'cs',
  'hu',
  'ro',
  'el',
  'ms',
  'fil',
] as const;

type LanguageCode = (typeof languageOptions)[number];

const languageAliasMap: Record<string, LanguageCode> = {
  sp: 'es',
  por: 'pt',
  jp: 'ja',
  ua: 'uk',
};

const normalizeLanguage = (value: string): LanguageCode =>
  (languageAliasMap[value] ?? value) as LanguageCode;

const SettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { t, i18n } = useTranslation();
  const { theme, themeId, setTheme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const readerDefaults = useSettingsStore(state => state.readerDefaults);
  const downloadSettings = useSettingsStore(state => state.downloadSettings);
  const preferences = useSettingsStore(state => state.preferences);
  const updateDownloadSettings = useSettingsStore(
    state => state.updateDownloadSettings,
  );
  const updatePreferences = useSettingsStore(
    state => state.updatePreferences,
  );
  const updateReaderDefaults = useSettingsStore(
    state => state.updateReaderDefaults,
  );
  const loadSettings = useSettingsStore(state => state.loadSettings);

  const isPro = useIAPStore(state => state.isPro);
  const loadProStatus = useIAPStore(state => state.loadProStatus);

  const [storageUsed, setStorageUsed] = useState('0 MB');
  const [isClearing, setIsClearing] = useState(false);

  // Local state for slider values (for smooth dragging without excessive updates)
  const [localFontSize, setLocalFontSize] = useState(readerDefaults.fontSize);
  const [localLineHeight, setLocalLineHeight] = useState(readerDefaults.lineHeight);
  const [localMargins, setLocalMargins] = useState(readerDefaults.margins);

  useEffect(() => {
    loadSettings();
    loadProStatus();

    FileSystem.getTotalStorageUsed()
      .then(bytes => setStorageUsed(FileSystem.formatBytes(bytes)))
      .catch(() => setStorageUsed('0 MB'));
  }, [loadSettings, loadProStatus]);

  useEffect(() => {
    const normalized = normalizeLanguage(preferences.language);
    if (preferences.language !== normalized) {
      updatePreferences({ language: normalized });
      i18n.changeLanguage(normalized);
    }
  }, [preferences.language, updatePreferences, i18n]);

  // Sync local slider values with store
  useEffect(() => {
    setLocalFontSize(readerDefaults.fontSize);
  }, [readerDefaults.fontSize]);

  useEffect(() => {
    setLocalLineHeight(readerDefaults.lineHeight);
  }, [readerDefaults.lineHeight]);

  useEffect(() => {
    setLocalMargins(readerDefaults.margins);
  }, [readerDefaults.margins]);

  const activeLanguage = useMemo(
    () => normalizeLanguage(preferences.language),
    [preferences.language],
  );

  const handleThemeSelect = (id: ThemeId) => {
    if (id !== themeId) {
      setTheme(id);
    }
  };

  const handleLanguageSelect = (code: LanguageCode) => {
    if (activeLanguage !== code) {
      updatePreferences({ language: code });
      i18n.changeLanguage(code);
    }
  };

  const handleReaderThemeSelect = (themeKey: string) => {
    if (themeKey !== readerDefaults.theme) {
      updateReaderDefaults({ theme: themeKey });
    }
  };

  const updateStorageDisplay = async () => {
    try {
      const bytes = await FileSystem.getTotalStorageUsed();
      setStorageUsed(FileSystem.formatBytes(bytes));
    } catch {
      setStorageUsed('0 MB');
    }
  };

  const handleClearCache = () => {
    Alert.alert(
      t('settings.clearCache'),
      t('settings.clearCacheConfirm'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('common.clear'),
          style: 'destructive',
          onPress: async () => {
            setIsClearing(true);
            try {
              const orphanedFiles = await FileSystem.findOrphanedFiles();
              await FileSystem.cleanupOrphanedFiles(orphanedFiles);
              await updateStorageDisplay();
              Alert.alert(
                t('common.success'),
                t('settings.cacheCleared'),
              );
            } catch (error) {
              Alert.alert(
                t('common.error'),
                t('settings.clearCacheFailed'),
              );
            } finally {
              setIsClearing(false);
            }
          },
        },
      ],
    );
  };

  const withAlpha = (hex: string, alpha: number): string => {
    const normalized = hex.replace('#', '');
    if (normalized.length !== 6) {
      return hex;
    }
    const alphaHex = Math.round(alpha * 255)
      .toString(16)
      .padStart(2, '0');
    return `#${normalized}${alphaHex}`;
  };

  const renderSwitch = (
    value: boolean,
    onValueChange: (next: boolean) => void,
  ) => {
    const activeTrack = Platform.OS === 'ios'
      ? withAlpha(theme.colors.accent, 0.55)
      : theme.colors.accent;
    const inactiveTrack = Platform.OS === 'ios'
      ? withAlpha(theme.colors.border, theme.isDark ? 0.45 : 0.35)
      : theme.colors.border;

    return (
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{
          false: inactiveTrack,
          true: activeTrack,
        }}
        thumbColor={
          Platform.OS === 'android'
            ? value
              ? '#FFFFFF'
              : theme.isDark
              ? '#E1E1E1'
              : '#FFFFFF'
            : undefined
        }
        ios_backgroundColor={inactiveTrack}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={theme.statusBarStyle} />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
        >
          <Icon
            name="chevron-left"
            size={28}
            color={theme.colors.accent}
            style={styles.backIcon}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('settings.title')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.account')}</Text>
          <View style={[styles.row, styles.rowLast]}>
            <Text style={styles.rowLabel}>{t('settings.status')}</Text>
            <Text style={styles.rowValue}>
              {isPro ? t('settings.pro') : t('settings.free')}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.appearance')}</Text>
          <Text style={styles.sectionSubtitle}>{t('settings.theme')}</Text>
          <View style={styles.themeGrid}>
            {themeOptions.map(id => {
              const option = themes[id];
              const isActive = themeId === id;
              return (
                <TouchableOpacity
                  key={id}
                  style={[
                    styles.themeOption,
                    isActive && styles.themeOptionActive,
                  ]}
                  onPress={() => handleThemeSelect(id)}
                  accessibilityRole="button"
                >
                  <View style={styles.themePreviewRow}>
                    <View
                      style={[
                        styles.themeSwatch,
                        {
                          backgroundColor: option.colors.background,
                          borderColor: option.colors.border,
                        },
                      ]}
                    />
                    <View
                      style={[
                        styles.themeAccent,
                        { backgroundColor: option.colors.accent },
                      ]}
                    />
                  </View>
                  <Text
                    style={[
                      styles.themeOptionText,
                      isActive && styles.themeOptionTextActive,
                    ]}
                  >
                    {t(`settings.themes.${id}`)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.feedback')}</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>{t('settings.sound')}</Text>
            {renderSwitch(preferences.soundEnabled, value =>
              updatePreferences({ soundEnabled: value }),
            )}
          </View>
          <View style={[styles.row, styles.rowLast]}>
            <Text style={styles.rowLabel}>{t('settings.haptics')}</Text>
            {renderSwitch(preferences.hapticsEnabled, value =>
              updatePreferences({ hapticsEnabled: value }),
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.language')}</Text>
          <View style={styles.languageGrid}>
            {languageOptions.map(code => {
              const isActive = activeLanguage === code;
              return (
                <TouchableOpacity
                  key={code}
                  style={[
                    styles.languageOption,
                    isActive && styles.languageOptionActive,
                  ]}
                  onPress={() => handleLanguageSelect(code)}
                  accessibilityRole="button"
                >
                  <Text
                    style={[
                      styles.languageOptionText,
                      isActive && styles.languageOptionTextActive,
                    ]}
                  >
                    {t(`settings.languages.${code}`)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.readerDefaults')}</Text>

          {/* Reader Theme Picker */}
          <Text style={styles.sectionSubtitle}>{t('reader.theme')}</Text>
          <View style={styles.themeGrid}>
            {themeOptions.map(id => {
              const option = themes[id];
              const isActive = readerDefaults.theme === id;
              return (
                <TouchableOpacity
                  key={id}
                  style={[
                    styles.themeOption,
                    isActive && styles.themeOptionActive,
                  ]}
                  onPress={() => handleReaderThemeSelect(id)}
                  accessibilityRole="button"
                >
                  <View style={styles.themePreviewRow}>
                    <View
                      style={[
                        styles.themeSwatch,
                        {
                          backgroundColor: option.colors.background,
                          borderColor: option.colors.border,
                        },
                      ]}
                    />
                    <View
                      style={[
                        styles.themeAccent,
                        { backgroundColor: option.colors.accent },
                      ]}
                    />
                  </View>
                  <Text
                    style={[
                      styles.themeOptionText,
                      isActive && styles.themeOptionTextActive,
                    ]}
                  >
                    {t(`settings.themes.${id}`)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Font Size Slider */}
          <View style={styles.sliderContainer}>
            <View style={styles.sliderLabelRow}>
              <Text style={styles.rowLabel}>{t('reader.fontSize')}</Text>
              <Text style={styles.rowValue}>{Math.round(localFontSize)}pt</Text>
            </View>
            <Slider
              value={localFontSize}
              minimumValue={14}
              maximumValue={24}
              step={1}
              onValueChange={setLocalFontSize}
              onSlidingComplete={(value) => {
                updateReaderDefaults({ fontSize: Math.round(value) });
              }}
              minimumTrackTintColor={theme.colors.accent}
              maximumTrackTintColor={theme.colors.border}
              thumbTintColor={Platform.OS === 'ios' ? theme.colors.accent : '#FFFFFF'}
              style={styles.slider}
            />
          </View>

          {/* Line Height Slider */}
          <View style={styles.sliderContainer}>
            <View style={styles.sliderLabelRow}>
              <Text style={styles.rowLabel}>{t('reader.lineHeight')}</Text>
              <Text style={styles.rowValue}>{localLineHeight.toFixed(1)}</Text>
            </View>
            <Slider
              value={localLineHeight}
              minimumValue={1.0}
              maximumValue={2.5}
              step={0.1}
              onValueChange={setLocalLineHeight}
              onSlidingComplete={(value) => {
                updateReaderDefaults({ lineHeight: parseFloat(value.toFixed(1)) });
              }}
              minimumTrackTintColor={theme.colors.accent}
              maximumTrackTintColor={theme.colors.border}
              thumbTintColor={Platform.OS === 'ios' ? theme.colors.accent : '#FFFFFF'}
              style={styles.slider}
            />
          </View>

          {/* Margins Slider */}
          <View style={[styles.sliderContainer, styles.sliderContainerLast]}>
            <View style={styles.sliderLabelRow}>
              <Text style={styles.rowLabel}>{t('reader.margins')}</Text>
              <Text style={styles.rowValue}>{Math.round(localMargins)}px</Text>
            </View>
            <Slider
              value={localMargins}
              minimumValue={8}
              maximumValue={48}
              step={4}
              onValueChange={setLocalMargins}
              onSlidingComplete={(value) => {
                updateReaderDefaults({ margins: Math.round(value) });
              }}
              minimumTrackTintColor={theme.colors.accent}
              maximumTrackTintColor={theme.colors.border}
              thumbTintColor={Platform.OS === 'ios' ? theme.colors.accent : '#FFFFFF'}
              style={styles.slider}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t('settings.downloadSettings')}
          </Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>
              {t('settings.download.wifiOnly')}
            </Text>
            {renderSwitch(downloadSettings.wifiOnly, value =>
              updateDownloadSettings({ wifiOnly: value }),
            )}
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>
              {t('settings.download.images')}
            </Text>
            {renderSwitch(downloadSettings.downloadImages, value =>
              updateDownloadSettings({ downloadImages: value }),
            )}
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>
              {t('settings.download.styles')}
            </Text>
            {renderSwitch(downloadSettings.downloadStyles, value =>
              updateDownloadSettings({ downloadStyles: value }),
            )}
          </View>
          <View style={[styles.row, styles.rowLast]}>
            <Text style={styles.rowLabel}>
              {t('settings.download.fonts')}
            </Text>
            {renderSwitch(downloadSettings.downloadFonts, value =>
              updateDownloadSettings({ downloadFonts: value }),
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.storage')}</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>{t('settings.storageUsed')}</Text>
            <Text style={styles.rowValue}>{storageUsed}</Text>
          </View>
          <View style={[styles.row, styles.rowLast]}>
            <TouchableOpacity
              style={[styles.clearCacheButton, isClearing && styles.clearCacheButtonDisabled]}
              onPress={handleClearCache}
              disabled={isClearing}
              accessibilityRole="button"
            >
              {isClearing ? (
                <ActivityIndicator size="small" color={theme.colors.accent} />
              ) : (
                <Text style={styles.clearCacheButtonText}>
                  {t('settings.clearCache')}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.section, styles.sectionLast]}>
          <Text style={styles.sectionTitle}>{t('settings.about')}</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>{t('settings.version')}</Text>
            <Text style={styles.rowValue}>1.0.0</Text>
          </View>
          <View style={[styles.row, styles.rowLast]}>
            <Text style={styles.rowLabel}>{t('settings.privacy')}</Text>
            <Text style={styles.rowValue}>{t('settings.noDataCollection')}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: theme.colors.card,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    backButton: {
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
    backIcon: {
      color: theme.colors.accent,
    },
    headerTitle: {
      flex: 1,
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      textAlign: 'center',
    },
    headerSpacer: {
      width: 40,
    },
    scroll: {
      flex: 1,
    },
    content: {
      paddingHorizontal: 20,
      paddingBottom: 32,
    },
    section: {
      backgroundColor: theme.colors.card,
      borderRadius: 16,
      paddingHorizontal: 20,
      paddingVertical: 16,
      marginTop: 20,
      borderWidth: theme.isDark ? 1 : 0,
      borderColor: theme.colors.border,
    },
    sectionLast: {
      marginBottom: 32,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.secondary,
      textTransform: 'uppercase',
      marginBottom: 12,
    },
    sectionSubtitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 12,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    rowLast: {
      borderBottomWidth: 0,
      paddingBottom: 0,
    },
    rowLabel: {
      fontSize: 16,
      color: theme.colors.text,
    },
    rowValue: {
      fontSize: 16,
      color: theme.colors.secondary,
    },
    themeGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    themeOption: {
      flex: 1,
      minWidth: '45%',
      maxWidth: '48%',
      backgroundColor: theme.colors.background,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: 'center',
      gap: 12,
    },
    themeOptionActive: {
      borderColor: theme.colors.accent,
      backgroundColor: theme.colors.card,
      shadowColor: theme.colors.accent,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 6,
    },
    themePreviewRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    themeSwatch: {
      width: 36,
      height: 24,
      borderRadius: 8,
      borderWidth: 1,
    },
    themeAccent: {
      width: 16,
      height: 24,
      borderRadius: 8,
    },
    themeOptionText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.secondary,
    },
    themeOptionTextActive: {
      color: theme.colors.accent,
    },
    languageGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    languageOption: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background,
    },
    languageOptionActive: {
      backgroundColor: theme.colors.accent,
      borderColor: theme.colors.accent,
    },
    languageOptionText: {
      fontSize: 14,
      color: theme.colors.secondary,
    },
    languageOptionTextActive: {
      color: theme.colors.card,
      fontWeight: '600',
    },
    sliderContainer: {
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    sliderContainerLast: {
      borderBottomWidth: 0,
      paddingBottom: 0,
    },
    sliderLabelRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    slider: {
      width: '100%',
      height: 40,
    },
    clearCacheButton: {
      flex: 1,
      backgroundColor: theme.colors.accent,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 44,
    },
    clearCacheButtonDisabled: {
      opacity: 0.5,
    },
    clearCacheButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
  });

export default SettingsScreen;
