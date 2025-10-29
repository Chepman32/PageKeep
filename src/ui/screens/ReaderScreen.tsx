import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { ArticleRepository } from '../../data/repositories/ArticleRepository';
import { FileSystem } from '../../utils/fileSystem';
import { useSettingsStore } from '../../store/settingsStore';
import { generateReaderCSS, themes } from '../../constants/themes';

type ReaderScreenRouteProp = RouteProp<RootStackParamList, 'Reader'>;

const ReaderScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<ReaderScreenRouteProp>();
  const { articleId } = route.params;
  const { readerDefaults } = useSettingsStore();

  const [htmlContent, setHtmlContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');

  const articleRepo = new ArticleRepository();

  useEffect(() => {
    loadArticle();
  }, [articleId]);

  const loadArticle = async () => {
    try {
      const article = await articleRepo.findById(articleId);
      if (!article) {
        navigation.goBack();
        return;
      }

      setTitle(article.title);

      const html = await FileSystem.readArticleHtml(articleId);

      // Inject theme
      const theme =
        themes[readerDefaults.theme as keyof typeof themes] || themes.light;
      const themeCSS = generateReaderCSS(
        theme,
        readerDefaults.fontSize,
        readerDefaults.lineHeight,
        readerDefaults.margins,
      );

      // Ensure proper HTML structure and encoding
      let styledHtml = html;
      
      // Add proper HTML structure if missing
      if (!styledHtml.includes('<!DOCTYPE html>')) {
        styledHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body>
${styledHtml}
</body>
</html>`;
      }
      
      // Inject theme
      styledHtml = styledHtml.replace(
        '<style id="pn-theme"></style>',
        `<style id="pn-theme">${themeCSS}</style>`,
      );

      setHtmlContent(styledHtml);
      setLoading(false);
    } catch (error) {
      console.error('Error loading article:', error);
      setLoading(false);
    }
  };

  const handleMessage = (event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);

      if (message.type === 'scroll') {
        // Update read progress
        articleRepo.updateReadProgress(articleId, message.progress);
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3A84F7" />
      </View>
    );
  }

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
        <Text style={styles.headerTitle} numberOfLines={1}>
          {title}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* WebView */}
      <WebView
        source={{
          uri: `file://${FileSystem.getArticleHtmlPath(articleId)}`,
        }}
        style={styles.webview}
        onMessage={handleMessage}
        allowingReadAccessToURL={`file://${FileSystem.getArticleDirectory(
          articleId,
        )}`}
        allowFileAccess={true}
        allowUniversalAccessFromFileURLs={true}
        originWhitelist={['*']}
        javaScriptEnabled={true}
        domStorageEnabled={true}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
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
    fontSize: 16,
    fontWeight: '600',
    color: '#111111',
    marginHorizontal: 12,
  },
  headerSpacer: {
    width: 40,
  },
  webview: {
    flex: 1,
  },
});

export default ReaderScreen;
