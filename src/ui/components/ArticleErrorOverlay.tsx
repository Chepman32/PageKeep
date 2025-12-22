import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import NetInfo from '@react-native-community/netinfo';
import { useTheme } from '../../contexts/ThemeContext';
import { Theme } from '../../constants/themes';

interface ArticleErrorOverlayProps {
  message: string;
  onRetry?: () => void;
}

/**
 * Error overlay shown when article is not ready and there's no internet connection
 */
export const ArticleErrorOverlay: React.FC<ArticleErrorOverlayProps> = ({
  message,
  onRetry,
}) => {
  const { theme } = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Check connection status
    const checkConnection = async () => {
      const state = await NetInfo.fetch();
      setIsConnected(!!(state.isConnected && state.isInternetReachable !== false));
    };

    checkConnection();

    // Listen for connection changes
    const unsubscribe = NetInfo.addEventListener(state => {
      const connected = !!(state.isConnected && state.isInternetReachable !== false);
      setIsConnected(connected);

      // Auto-retry when connection is restored
      if (connected && onRetry) {
        onRetry();
      }
    });

    return () => unsubscribe();
  }, [onRetry]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Icon name="cloud-off-outline" size={64} color={theme.colors.muted} />
        <Text style={styles.message}>{message}</Text>
        {onRetry && (
          <TouchableOpacity
            style={styles.retryButton}
            onPress={onRetry}
            disabled={!isConnected}
          >
            <Icon name="refresh" size={20} color={theme.colors.card} />
            <Text style={styles.retryText}>
              {isConnected ? 'Retry' : 'Waiting for connection...'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    content: {
      alignItems: 'center',
      maxWidth: 300,
    },
    message: {
      fontSize: 16,
      color: theme.colors.text,
      textAlign: 'center',
      marginTop: 20,
      marginBottom: 30,
      lineHeight: 24,
    },
    retryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.accent,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
      gap: 8,
    },
    retryText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.card,
    },
  });
