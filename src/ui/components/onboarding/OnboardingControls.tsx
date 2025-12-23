import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../../../contexts/ThemeContext';
import { Theme } from '../../../constants/themes';
import { Haptics } from '../../../utils/haptics';
import { useTranslation } from 'react-i18next';

interface OnboardingControlsProps {
  currentIndex: number;
  totalSlides: number;
  onSkip: () => void;
  onGetStarted: () => void;
}

export const OnboardingControls: React.FC<OnboardingControlsProps> = ({
  currentIndex,
  totalSlides,
  onSkip,
  onGetStarted,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const isLastSlide = currentIndex === totalSlides - 1;

  const handleSkip = () => {
    Haptics.light();
    onSkip();
  };

  const handleGetStarted = () => {
    Haptics.medium();
    onGetStarted();
  };

  const getStartedButtonStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(isLastSlide ? 1 : 0, {
        duration: 300,
        easing: Easing.out(Easing.cubic),
      }),
      transform: [
        {
          translateY: withTiming(isLastSlide ? 0 : 20, {
            duration: 300,
            easing: Easing.out(Easing.cubic),
          }),
        },
      ],
    };
  });

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={handleSkip}
        style={styles.skipButton}
        activeOpacity={0.7}
        accessibilityLabel={t('onboarding.skip')}
        accessibilityRole="button"
        accessibilityHint="Skip onboarding and go to home screen"
      >
        <Text style={styles.skipText}>{t('onboarding.skip')}</Text>
      </TouchableOpacity>

      {isLastSlide && (
        <Animated.View style={[styles.getStartedContainer, getStartedButtonStyle]}>
          <TouchableOpacity
            onPress={handleGetStarted}
            style={styles.getStartedButton}
            activeOpacity={0.85}
            accessibilityLabel={t('onboarding.getStarted')}
            accessibilityRole="button"
            accessibilityHint="Complete onboarding and continue to app"
          >
            <Text style={styles.getStartedText}>{t('onboarding.getStarted')}</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      pointerEvents: 'box-none',
    },
    skipButton: {
      position: 'absolute',
      top: 60,
      right: 24,
      paddingHorizontal: 16,
      paddingVertical: 8,
      minWidth: 44,
      minHeight: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    skipText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.secondary,
    },
    getStartedContainer: {
      position: 'absolute',
      bottom: 100,
      left: 24,
      right: 24,
    },
    getStartedButton: {
      backgroundColor: theme.colors.accent,
      paddingVertical: 16,
      paddingHorizontal: 32,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 50,
      shadowColor: theme.colors.accent,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: theme.isDark ? 0.4 : 0.2,
      shadowRadius: 12,
      elevation: 6,
    },
    getStartedText: {
      fontSize: 18,
      fontWeight: '700',
      color: '#FFFFFF',
      letterSpacing: 0.5,
    },
  });
