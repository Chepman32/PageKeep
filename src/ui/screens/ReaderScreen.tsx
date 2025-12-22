import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
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
import { DeviceEventEmitter } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { ARTICLE_META_UPDATED_EVENT } from '../../services/SavePageService';
import { ArticleErrorOverlay } from '../components/ArticleErrorOverlay';

type ReaderScreenRouteProp = RouteProp<RootStackParamList, 'Reader'>;

const ReaderScreen: React.FC = () => {
  const { theme: appTheme } = useTheme();
  const styles = useMemo(() => createStyles(appTheme), [appTheme]);
  const navigation = useNavigation();
  const route = useRoute<ReaderScreenRouteProp>();
  const { articleId } = route.params;
  const { readerDefaults } = useSettingsStore();

  const [title, setTitle] = useState('');
  const [articleUrl, setArticleUrl] = useState('');
  const [isProcessingComplete, setIsProcessingComplete] = useState(true);
  const [isConnected, setIsConnected] = useState(true);
  const [showError, setShowError] = useState(false);
  const webViewRef = React.useRef<any>(null);

  const articleRepo = new ArticleRepository();

  useEffect(() => {
    loadArticle();
  }, [articleId]);

  // Monitor network connection
  useEffect(() => {
    const checkConnection = async () => {
      const state = await NetInfo.fetch();
      const connected = !!(state.isConnected && state.isInternetReachable !== false);
      setIsConnected(connected);
      updateShowError(isProcessingComplete, connected);
    };

    checkConnection();

    const unsubscribe = NetInfo.addEventListener(state => {
      const connected = !!(state.isConnected && state.isInternetReachable !== false);
      setIsConnected(connected);
      updateShowError(isProcessingComplete, connected);
    });

    return () => unsubscribe();
  }, [isProcessingComplete]);

  // Listen for processing completion
  useEffect(() => {
    const listener = DeviceEventEmitter.addListener(
      ARTICLE_META_UPDATED_EVENT,
      (payload: any) => {
        if (payload.articleId === articleId && payload.meta?.processingComplete === true) {
          console.log('[ReaderScreen] Processing completed, switching to local content');
          setIsProcessingComplete(true);
          setShowError(false);
        }
      }
    );

    return () => listener.remove();
  }, [articleId]);

  useEffect(() => {
    if (!webViewRef.current || !isProcessingComplete) {
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
    isProcessingComplete,
  ]);

  const updateShowError = (processingComplete: boolean, connected: boolean) => {
    setShowError(!processingComplete && !connected);
  };

  const loadArticle = async () => {
    try {
      const article = await articleRepo.findById(articleId);
      if (!article) {
        navigation.goBack();
        return;
      }

      setTitle(article.title);
      setArticleUrl(article.url);
      navigation.setOptions({ title: article.title });

      // Check processing status
      try {
        const meta = await FileSystem.readArticleMeta(articleId);
        const processingComplete = meta.processingComplete !== false;
        setIsProcessingComplete(processingComplete);

        // Determine if we should show error
        const state = await NetInfo.fetch();
        const connected = !!(state.isConnected && state.isInternetReachable !== false);
        setIsConnected(connected);
        updateShowError(processingComplete, connected);

        console.log('[ReaderScreen] Article loaded:', {
          processingComplete,
          connected,
          showError: !processingComplete && !connected,
        });
      } catch (error) {
        // No metadata file - assume complete (old articles)
        console.log('[ReaderScreen] No metadata, assuming complete');
        setIsProcessingComplete(true);
        setShowError(false);
      }
    } catch (error) {
      console.error('Error loading article:', error);
      navigation.goBack();
    }
  };

  const handleRetry = () => {
    loadArticle();
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

  // Determine what to show based on processing state and connection
  const renderContent = () => {
    // Show error overlay if processing not complete and no connection
    if (showError) {
      return (
        <ArticleErrorOverlay
          message="Error downloading the page content. Check your Internet connection"
          onRetry={handleRetry}
        />
      );
    }

    // Show live web page if processing not complete but has connection
    if (!isProcessingComplete && isConnected && articleUrl) {
      return (
        <WebView
          ref={webViewRef}
          source={{ uri: articleUrl }}
          style={styles.webview}
          onError={handleWebViewError}
          originWhitelist={['*']}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          mixedContentMode="always"
        />
      );
    }

    // Show local content (processing complete or default)
    return (
      <WebView
        ref={webViewRef}
        key={isProcessingComplete ? 'local' : 'loading'}
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
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {renderContent()}
    </SafeAreaView>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    webview: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
  });

export default ReaderScreen;
