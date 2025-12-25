import React, { useEffect, useState } from 'react';
import { AppNavigator } from './src/ui/navigation/AppNavigator';
import { FileSystem } from './src/utils/fileSystem';
import { getDatabase } from './src/data/database';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { Storage } from './src/utils/storage';
import './src/locales';
import { IncomingShareService } from './src/services/IncomingShareService';
import { View, StyleSheet, DeviceEventEmitter } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AnimatedSplashScreen } from './src/ui/components/AnimatedSplashScreen';
import { OnboardingScreen } from './src/ui/screens/OnboardingScreen';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSettingsStore } from './src/store/settingsStore';
import { NetworkMonitor } from './src/services/NetworkMonitor';

const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [isAppReady, setIsAppReady] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);

  useEffect(() => {
    initializeApp();

    // Cleanup on unmount
    return () => {
      NetworkMonitor.stop();
    };
  }, []);

  const initializeApp = async () => {
    try {
      // Load persisted settings early
      useSettingsStore.getState().loadSettings();

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

      // Start network monitoring for auto-retry
      NetworkMonitor.start();
    } catch {
      // Error initializing app
    } finally {
      setIsAppReady(true);
    }
  };

  const handleSplashEnd = () => {
    setShowSplash(false);
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  // Check onboarding status after app is ready
  useEffect(() => {
    if (isAppReady && !onboardingChecked) {
      const completed = Storage.isOnboardingCompleted();
      setShowOnboarding(!completed);
      setOnboardingChecked(true);
    }
  }, [isAppReady, onboardingChecked]);

  // Listen for reset onboarding event (temporary - for development)
  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener(
      'resetOnboarding',
      () => {
        setShowOnboarding(true);
        setOnboardingChecked(false);
      },
    );

    return () => subscription.remove();
  }, []);

  return (
    <GestureHandlerRootView style={styles.container}>
      <ThemeProvider>
        <View style={styles.container}>
          {isAppReady && <AppNavigator />}
          {showSplash && (
            <AnimatedSplashScreen
              isReady={isAppReady}
              onFinish={handleSplashEnd}
            />
          )}
          {showOnboarding && (
            <OnboardingScreen onComplete={handleOnboardingComplete} />
          )}
        </View>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
};

export default App;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
