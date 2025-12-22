import React, { useLayoutEffect, useMemo, useState } from 'react';
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
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Clipboard from '@react-native-clipboard/clipboard';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
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
  const [clipboardUrl, setClipboardUrl] = useState<string | null>(null);

  const savePageService = new SavePageService();

  useLayoutEffect(() => {
    navigation.setOptions({
      title: t('add.title'),
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ marginLeft: 16 }}
        >
          <Icon name="close" size={24} color={theme.colors.secondary} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, theme, t]);

  const checkClipboard = async () => {
    try {
      const text = await Clipboard.getString();

      // Validate if clipboard contains a URL
      if (text && (text.trim().startsWith('http://') || text.trim().startsWith('https://'))) {
        // Only set if it's different from current URL input
        if (text.trim() !== url.trim()) {
          setClipboardUrl(text.trim());
        } else {
          setClipboardUrl(null);
        }
      } else {
        setClipboardUrl(null);
      }
    } catch (error) {
      console.error('Error checking clipboard:', error);
      setClipboardUrl(null);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      checkClipboard();
    }, [url])
  );

  const handleUseCopiedLink = () => {
    if (clipboardUrl) {
      setUrl(clipboardUrl);
      setClipboardUrl(null); // Hide button after using
    }
  };

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

        {clipboardUrl && (
          <TouchableOpacity
            style={styles.clipboardButton}
            onPress={handleUseCopiedLink}
          >
            <Icon name="content-paste" size={20} color={theme.colors.accent} />
            <Text style={styles.clipboardButtonText}>
              {t('add.useCopiedLink')}
            </Text>
          </TouchableOpacity>
        )}

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
    clipboardButton: {
      backgroundColor: theme.colors.card,
      borderRadius: 8,
      padding: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20,
      borderWidth: 1,
      borderColor: theme.colors.accent,
      borderStyle: 'dashed',
    },
    clipboardButtonText: {
      color: theme.colors.accent,
      fontSize: 15,
      fontWeight: '500',
      marginLeft: 8,
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
