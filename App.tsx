import React, { useEffect } from 'react';
import { AppNavigator } from './src/ui/navigation/AppNavigator';
import { FileSystem } from './src/utils/fileSystem';
import { getDatabase } from './src/data/database';
import { ThemeProvider } from './src/contexts/ThemeContext';
import './src/locales';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { IncomingShareService } from './src/services/IncomingShareService';

const App: React.FC = () => {
  useEffect(() => {
    MaterialCommunityIcons.loadFont().catch(error =>
      console.warn('Failed to load icon font:', error),
    );
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

  return (
    <ThemeProvider>
      <AppNavigator />
    </ThemeProvider>
  );
};

export default App;
