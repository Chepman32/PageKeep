import React, { useEffect } from 'react';
import { AppNavigator } from './src/ui/navigation/AppNavigator';
import { FileSystem } from './src/utils/fileSystem';
import { getDatabase } from './src/data/database';

const App: React.FC = () => {
  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Initialize file system
      await FileSystem.initialize();

      // Initialize database
      getDatabase();

      console.log('App initialized successfully');
    } catch (error) {
      console.error('Error initializing app:', error);
    }
  };

  return <AppNavigator />;
};

export default App;
