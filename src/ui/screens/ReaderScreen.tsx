import React, { useEffect, useMemo, useState } from 'react';
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
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { ArticleRepository } from '../../data/repositories/ArticleRepository';
import { FileSystem } from '../../utils/fileSystem';
import { useSettingsStore } from '../../store/settingsStore';
import { generateReaderCSS, themes, Theme } from '../../constants/themes';
import { useTheme } from '../../contexts/ThemeContext';

type ReaderScreenRouteProp = RouteProp<RootStackParamList, 'Reader'>;

const ReaderScreen: React.FC = () => {
  const { theme: appTheme } = useTheme();
  const styles = useMemo(() => createStyles(appTheme), [appTheme]);
  const navigation = useNavigation();
  const route = useRoute<ReaderScreenRouteProp>();
  const { articleId } = route.params;
  const { readerDefaults } = useSettingsStore();

  const [loading, setLoading] = useState(false); // Start as false, only show spinner if needed
  const [title, setTitle] = useState('');
  const [shouldReload, setShouldReload] = useState(0); // Used to force WebView reload
  const webViewRef = React.useRef<any>(null);

  const articleRepo = new ArticleRepository();

  /**
   * Waits for background processing to complete before showing the page
   * This prevents showing unstyled pages before images are downloaded
   * ONLY waits if processingComplete is explicitly false (meaning processing is ongoing)
   */
  const waitForProcessingComplete = async (
    articleId: string,
  ): Promise<void> => {
    try {
      const meta = await FileSystem.readArticleMeta(articleId);

      // If processing is already complete or flag doesn't exist, return immediately
      if (meta.processingComplete !== false) {
        console.log('✅ Processing already complete or not needed, showing page');
        return;
      }

      // Processing is ongoing (processingComplete === false), so show spinner and wait
      console.log('⏳ Background processing in progress, waiting...');
      setLoading(true); // Only show spinner when actually waiting

      const maxWaitTime = 30000; // Maximum 30 seconds
      const pollInterval = 500; // Check every 500ms
      const startTime = Date.now();

      while (Date.now() - startTime < maxWaitTime) {
        await new Promise<void>(resolve => setTimeout(() => resolve(), pollInterval));

        try {
          const updatedMeta = await FileSystem.readArticleMeta(articleId);
          if (updatedMeta.processingComplete === true) {
            console.log('✅ Processing complete, showing page');
            setLoading(false);
            return;
          }
          console.log('⏳ Still waiting for background processing...');
        } catch (error) {
          console.log('⚠️ Error reading metadata, proceeding anyway');
          setLoading(false);
          return;
        }
      }

      // Timeout reached, show page anyway
      console.log('⏱️ Processing timeout reached, showing page');
      setLoading(false);
    } catch (error) {
      // If meta file doesn't exist, assume processing is complete (old articles)
      console.log('⚠️ No metadata file, proceeding anyway');
      return;
    }
  };

  useEffect(() => {
    loadArticle();
  }, [articleId]);

  useEffect(() => {
    if (!webViewRef.current) {
      return;
    }

    const theme =
      themes[readerDefaults.theme as keyof typeof themes] || themes.light;
    const themeCSS = generateReaderCSS(
      theme,
      readerDefaults.fontSize,
      readerDefaults.lineHeight,
      readerDefaults.margins,
    );

    const jsCode = `
      (function() {
        const style = document.getElementById('pn-theme');
        if (style) {
          style.textContent = ${JSON.stringify(themeCSS)};
        }
      })();
      true;
    `;

    webViewRef.current.injectJavaScript(jsCode);
  }, [
    readerDefaults.theme,
    readerDefaults.fontSize,
    readerDefaults.lineHeight,
    readerDefaults.margins,
  ]);

  const loadArticle = async () => {
    try {
      const article = await articleRepo.findById(articleId);
      if (!article) {
        navigation.goBack();
        return;
      }

      setTitle(article.title);
      navigation.setOptions({ title: article.title });

      // Wait for background processing to complete (only if needed)
      // This function will set loading to false when done
      await waitForProcessingComplete(articleId);

      // Trigger WebView to reload the file (which now has images embedded)
      setShouldReload(prev => prev + 1);
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

    // Inject theme CSS after page loads
    const theme =
      themes[readerDefaults.theme as keyof typeof themes] || themes.light;
    const themeCSS = generateReaderCSS(
      theme,
      readerDefaults.fontSize,
      readerDefaults.lineHeight,
      readerDefaults.margins,
    );

    // Inject theme via JavaScript
    const jsCode = `
      (function() {
        const style = document.getElementById('pn-theme');
        if (style) {
          style.textContent = ${JSON.stringify(themeCSS)};
        }
      })();
      true; // Required for iOS
    `;

    webViewRef.current?.injectJavaScript(jsCode);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Loading or WebView */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={appTheme.colors.accent} />
        </View>
      ) : (
        <WebView
        ref={webViewRef}
        key={shouldReload} // Forces WebView to reload when shouldReload changes
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
      )}
    </SafeAreaView>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    webview: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
  });

export default ReaderScreen;
