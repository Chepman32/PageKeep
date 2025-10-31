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

  /**
   * Waits for background processing to complete before showing the page
   * This prevents showing unstyled pages before images are downloaded
   */
  const waitForProcessingComplete = async (
    articleId: string,
  ): Promise<void> => {
    const maxWaitTime = 30000; // Maximum 30 seconds
    const pollInterval = 500; // Check every 500ms
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      try {
        const meta = await FileSystem.readArticleMeta(articleId);
        if (meta.processingComplete === true) {
          console.log('✅ Processing complete, showing page');
          return;
        }
        console.log('⏳ Waiting for background processing...');
        await new Promise<void>(resolve => setTimeout(() => resolve(), pollInterval));
      } catch (error) {
        // If meta file doesn't exist or can't be read, assume processing is complete
        console.log('⚠️ Could not read metadata, proceeding anyway');
        return;
      }
    }

    // Timeout reached, show page anyway
    console.log('⏱️ Processing timeout reached, showing page');
  };

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

      // Wait for background processing to complete
      await waitForProcessingComplete(articleId);

      // Read HTML from disk
      let html = await FileSystem.readArticleHtml(articleId);

      console.log(`📄 Loaded HTML length: ${html.length} chars`);

      // Check for images in HTML
      const imgCount = (html.match(/<img/g) || []).length;
      const localImgCount = (html.match(/file:\/\/.*\/assets\/image_/g) || []).length;
      console.log(`🖼️  Found ${imgCount} <img> tags, ${localImgCount} with file:// paths`);

      // Inject theme
      const theme =
        themes[readerDefaults.theme as keyof typeof themes] || themes.light;
      const themeCSS = generateReaderCSS(
        theme,
        readerDefaults.fontSize,
        readerDefaults.lineHeight,
        readerDefaults.margins,
      );

      // Inject theme CSS into the theme placeholder
      html = html.replace(
        '<style id="pn-theme"></style>',
        `<style id="pn-theme">${themeCSS}</style>`,
      );

      // Write the styled HTML back to disk so WebView can load it via file:// URI
      await FileSystem.writeArticleHtml(articleId, html);

      const htmlPath = FileSystem.getArticleHtmlPath(articleId);
      const articleDir = FileSystem.getArticleDirectory(articleId);
      console.log(`📝 HTML path: ${htmlPath}`);
      console.log(`📁 Article dir: ${articleDir}`);

      // Check if image files exist
      const RNFS = await import('react-native-fs');
      const assetsDir = `${articleDir}/assets`;
      try {
        const files = await RNFS.default.readDir(assetsDir);
        console.log(`📂 Found ${files.length} files in assets directory`);
        files.slice(0, 3).forEach(file => {
          console.log(`  - ${file.name} (${file.size} bytes)`);
        });
      } catch (error) {
        console.error('❌ Could not read assets directory:', error);
      }

      setHtmlContent(html);
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

  const handleWebViewError = (event: any) => {
    console.error('❌ WebView error:', event.nativeEvent);
  };

  const handleWebViewLoad = () => {
    console.log('✅ WebView loaded successfully');
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
        onError={handleWebViewError}
        onLoad={handleWebViewLoad}
        allowingReadAccessToURL={`file://${FileSystem.getArticleDirectory(
          articleId,
        )}`}
        allowFileAccess={true}
        allowUniversalAccessFromFileURLs={true}
        originWhitelist={['*']}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        mixedContentMode="always"
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
