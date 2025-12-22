import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import { DeviceEventEmitter } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ArticleProcessingState, ARTICLE_PROCESSING_STARTED, ARTICLE_PROCESSING_FAILED } from '../../utils/articleProcessingState';
import { ARTICLE_META_UPDATED_EVENT } from '../../services/SavePageService';
import { useTheme } from '../../contexts/ThemeContext';

interface ArticleProcessingIndicatorProps {
  articleId: string;
  style?: ViewStyle;
}

/**
 * Shows a small spinner or error badge on article cards during processing
 */
export const ArticleProcessingIndicator: React.FC<ArticleProcessingIndicatorProps> = ({
  articleId,
  style,
}) => {
  const { theme } = useTheme();
  const [isProcessing, setIsProcessing] = useState(
    ArticleProcessingState.isProcessing(articleId)
  );
  const [hasFailed, setHasFailed] = useState(
    ArticleProcessingState.hasFailed(articleId)
  );

  useEffect(() => {
    // Subscribe to processing events
    const startedListener = DeviceEventEmitter.addListener(
      ARTICLE_PROCESSING_STARTED,
      (payload: any) => {
        if (payload.articleId === articleId) {
          setIsProcessing(true);
          setHasFailed(false);
        }
      }
    );

    const failedListener = DeviceEventEmitter.addListener(
      ARTICLE_PROCESSING_FAILED,
      (payload: any) => {
        if (payload.articleId === articleId) {
          setIsProcessing(false);
          setHasFailed(true);
        }
      }
    );

    const completedListener = DeviceEventEmitter.addListener(
      ARTICLE_META_UPDATED_EVENT,
      (payload: any) => {
        if (payload.articleId === articleId && payload.meta?.processingComplete === true) {
          setIsProcessing(false);
          setHasFailed(false);
        }
      }
    );

    return () => {
      startedListener.remove();
      failedListener.remove();
      completedListener.remove();
    };
  }, [articleId]);

  // Don't show anything if processing is complete
  if (!isProcessing && !hasFailed) {
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      {isProcessing && (
        <View style={styles.spinnerContainer}>
          <ActivityIndicator size="small" color={theme.colors.accent} />
        </View>
      )}
      {hasFailed && (
        <View style={styles.errorBadge}>
          <Icon name="alert-circle" size={16} color="#fff" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
  },
  spinnerContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  errorBadge: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#ff6b6b',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
});
