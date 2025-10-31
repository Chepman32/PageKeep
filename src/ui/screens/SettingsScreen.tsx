import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Switch,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSettingsStore } from '../../store/settingsStore';
import { useIAPStore } from '../../store/iapStore';
import { FileSystem } from '../../utils/fileSystem';
import { SavePageService } from '../../services/SavePageService';

const SettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const {
    readerDefaults,
    downloadSettings,
    updateReaderDefaults,
    updateDownloadSettings,
    loadSettings,
  } = useSettingsStore();
  const { isPro, loadProStatus } = useIAPStore();
  const [storageUsed, setStorageUsed] = React.useState('0 MB');

  useEffect(() => {
    loadSettings();
    loadProStatus();
    loadStorageInfo();
  }, []);

  const loadStorageInfo = async () => {
    const bytes = await FileSystem.getTotalStorageUsed();
    setStorageUsed(FileSystem.formatBytes(bytes));
  };


  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content}>
        {/* Pro Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Status</Text>
            <Text style={styles.rowValue}>{isPro ? 'Pro' : 'Free'}</Text>
          </View>
        </View>

        {/* Reader Defaults */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reader Defaults</Text>

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Theme</Text>
            <Text style={styles.rowValue}>{readerDefaults.theme}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Font Size</Text>
            <Text style={styles.rowValue}>{readerDefaults.fontSize}pt</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Line Height</Text>
            <Text style={styles.rowValue}>{readerDefaults.lineHeight}</Text>
          </View>
        </View>

        {/* Download Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Download Settings</Text>

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Wi-Fi Only</Text>
            <Switch
              value={downloadSettings.wifiOnly}
              onValueChange={value =>
                updateDownloadSettings({ wifiOnly: value })
              }
            />
          </View>

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Download Images</Text>
            <Switch
              value={downloadSettings.downloadImages}
              onValueChange={value =>
                updateDownloadSettings({ downloadImages: value })
              }
            />
          </View>

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Download Styles</Text>
            <Switch
              value={downloadSettings.downloadStyles}
              onValueChange={value =>
                updateDownloadSettings({ downloadStyles: value })
              }
            />
          </View>

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Download Fonts</Text>
            <Switch
              value={downloadSettings.downloadFonts}
              onValueChange={value =>
                updateDownloadSettings({ downloadFonts: value })
              }
            />
          </View>
        </View>

        {/* Storage */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Storage</Text>

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Used</Text>
            <Text style={styles.rowValue}>{storageUsed}</Text>
          </View>
        </View>


        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Version</Text>
            <Text style={styles.rowValue}>1.0.0</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Privacy</Text>
            <Text style={styles.rowValue}>No data collection</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 28,
    color: '#3A84F7',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#111111',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#616161',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  rowLabel: {
    fontSize: 16,
    color: '#111111',
  },
  rowValue: {
    fontSize: 16,
    color: '#616161',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  actionText: {
    fontSize: 16,
    color: '#3A84F7',
    fontWeight: '500',
  },
});

export default SettingsScreen;
