import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SavePageService } from '../../services/SavePageService';
import { useArticleStore } from '../../store/articleStore';
import { useTheme } from '../../contexts/ThemeContext';
import { Theme } from '../../constants/themes';
import { useTranslation } from 'react-i18next';

const AddScreen: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const navigation = useNavigation();
  const { fetchArticles } = useArticleStore();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const savePageService = new SavePageService();

  const handleSave = async () => {
    if (!url.trim()) {
      Alert.alert(t('common.error'), t('add.errors.emptyUrl'));
      return;
    }

    // Basic URL validation
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      Alert.alert(
        t('common.error'),
        t('add.errors.invalidUrl'),
      );
      return;
    }

    setLoading(true);

    try {
      // Start saving in background and get articleId immediately
      const articleId = await savePageService.saveFromUrlFast(url, {});

      // Show success immediately (background processing continues)
      setLoading(false);

      Alert.alert(t('common.success'), t('add.success'), [
        {
          text: t('common.view'),
          onPress: () => {
            navigation.goBack();
            // @ts-ignore
            navigation.navigate('Reader', { articleId });
          },
        },
        {
          text: t('common.ok'),
          onPress: () => navigation.goBack(),
        },
      ]);

      setUrl('');

      // Refresh articles list in background
      fetchArticles().catch(err =>
        console.error('Error refreshing articles:', err)
      );
    } catch (error) {
      setLoading(false);
      console.error('Error saving article:', error);
      Alert.alert(t('common.error'), t('add.errors.saveFailed'));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={theme.statusBarStyle} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('add.title')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.label}>{t('add.urlLabel')}</Text>
        <TextInput
          style={styles.input}
          placeholder={t('add.urlPlaceholder')}
          value={url}
          onChangeText={setUrl}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          editable={!loading}
        />

        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={theme.colors.card} />
          ) : (
            <Text style={styles.saveButtonText}>{t('add.saveButton')}</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.hint}>{t('add.hint')}</Text>
      </View>
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
    backButtonText: {
      fontSize: 24,
      color: theme.colors.secondary,
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
    content: {
      padding: 20,
    },
    label: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 8,
    },
    input: {
      backgroundColor: theme.colors.card,
      borderRadius: 8,
      padding: 16,
      fontSize: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: 20,
      color: theme.colors.text,
    },
    saveButton: {
      backgroundColor: theme.colors.accent,
      borderRadius: 8,
      padding: 16,
      alignItems: 'center',
      marginBottom: 16,
    },
    saveButtonDisabled: {
      opacity: 0.6,
    },
    saveButtonText: {
      color: theme.colors.card,
      fontSize: 16,
      fontWeight: '600',
    },
    hint: {
      fontSize: 14,
      color: theme.colors.secondary,
      textAlign: 'center',
      lineHeight: 20,
    },
  });

export default AddScreen;
