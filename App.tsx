import React, { useEffect, useState } from 'react';
import { AppNavigator } from './src/ui/navigation/AppNavigator';
import { FileSystem } from './src/utils/fileSystem';
import { getDatabase } from './src/data/database';
import { ThemeProvider } from './src/contexts/ThemeContext';
import './src/locales';
import { IncomingShareService } from './src/services/IncomingShareService';
import { View, StyleSheet } from 'react-native';
import { AnimatedSplashScreen } from './src/ui/components/AnimatedSplashScreen';

const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Initialize file system
      await FileSystem.initialize();

      // Initialize database
      getDatabase();

      // Process any pending items shared into the app
      IncomingShareService.initialize();

      console.log('App initialized successfully');
    } catch (error) {
      console.error('Error initializing app:', error);
    }
  };

  const handleSplashEnd = () => {
    setShowSplash(false);
  };

  return (
    <ThemeProvider>
      <View style={styles.container}>
        <AppNavigator />
        {showSplash && <AnimatedSplashScreen onAnimationEnd={handleSplashEnd} />}
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
