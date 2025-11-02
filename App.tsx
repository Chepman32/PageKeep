import React, { useEffect, useState } from 'react';
import { AppNavigator } from './src/ui/navigation/AppNavigator';
import { FileSystem } from './src/utils/fileSystem';
import { getDatabase } from './src/data/database';
import { ThemeProvider } from './src/contexts/ThemeContext';
import './src/locales';
import { IncomingShareService } from './src/services/IncomingShareService';
import { View, StyleSheet } from 'react-native';
import { AnimatedSplashScreen } from './src/ui/components/AnimatedSplashScreen';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [isAppReady, setIsAppReady] = useState(false);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      await Promise.all([
        // Initialize file system
        FileSystem.initialize(),
        // Ensure icon fonts are available before rendering UI
        MaterialCommunityIcons.loadFont(),
      ]);

      // Initialize database
      getDatabase();

      // Process any pending items shared into the app
      IncomingShareService.initialize();

      console.log('App initialized successfully');
    } catch (error) {
      console.error('Error initializing app:', error);
    } finally {
      setIsAppReady(true);
    }
  };

  const handleSplashEnd = () => {
    setShowSplash(false);
  };

  return (
    <ThemeProvider>
      <View style={styles.container}>
        {isAppReady && <AppNavigator />}
        {showSplash && (
          <AnimatedSplashScreen
            isReady={isAppReady}
            onAnimationEnd={handleSplashEnd}
          />
        )}
      </View>
    </ThemeProvider>
  );
};

export default App;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
