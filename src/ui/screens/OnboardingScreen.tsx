import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  StatusBar,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Extrapolation,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { useTheme } from '../../contexts/ThemeContext';
import { Theme } from '../../constants/themes';
import { Storage } from '../../utils/storage';
import { Haptics } from '../../utils/haptics';
import { useTranslation } from 'react-i18next';
import { OnboardingSlide } from '../components/onboarding/OnboardingSlide';
import { OnboardingPagination } from '../components/onboarding/OnboardingPagination';
import { OnboardingControls } from '../components/onboarding/OnboardingControls';
import * as Illustrations from '../components/onboarding/illustrations';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const TOTAL_SLIDES = 5;

interface OnboardingScreenProps {
  onComplete: () => void;
}

interface SlideData {
  key: string;
  title: string;
  description: string;
  illustration: React.ReactNode;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({
  onComplete,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useSharedValue(0);
  const exitProgress = useSharedValue(0);

  // Slide data - keeping only essential slides
  const slides = useMemo(() => {
    const slideConfig = [
      { component: Illustrations.Slide01ShareExtension, number: 1 },
      { component: Illustrations.Slide03OfflineReading, number: 3 },
      { component: Illustrations.Slide04CleanReader, number: 4 },
      { component: Illustrations.Slide07Organization, number: 7 },
      { component: Illustrations.Slide14Privacy, number: 14 },
    ];

    return slideConfig.map(
      ({ component: IllustrationComponent, number }, index) => ({
        key: `slide-${index + 1}`,
        title: t(`onboarding.slide${number}.title`),
        description: t(`onboarding.slide${number}.description`),
        IllustrationComponent,
      }),
    );
  }, [t]);

  // Handle scroll
  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      scrollX.value = offsetX;
      const newIndex = Math.round(offsetX / SCREEN_WIDTH);
      if (
        newIndex !== currentSlideIndex &&
        newIndex >= 0 &&
        newIndex < TOTAL_SLIDES
      ) {
        setCurrentSlideIndex(newIndex);
        Haptics.selection();
      }
    },
    [currentSlideIndex, scrollX],
  );

  // Handle completion
  const completeOnboarding = useCallback(() => {
    exitProgress.value = withTiming(
      1,
      { duration: 400, easing: Easing.inOut(Easing.cubic) },
      finished => {
        if (finished) {
          runOnJS(finishOnboarding)();
        }
      },
    );
  }, [exitProgress]);

  const finishOnboarding = () => {
    try {
      Storage.setOnboardingCompleted(true);
    } catch {
      // Failed to save onboarding completion status
    }
    onComplete();
  };

  // Jump to specific slide
  const jumpToSlide = useCallback((index: number) => {
    flatListRef.current?.scrollToIndex({ index, animated: true });
  }, []);

  // Container exit animation
  const containerStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      exitProgress.value,
      [0, 1],
      [1, 1.05],
      Extrapolation.CLAMP,
    );
    const opacity = interpolate(
      exitProgress.value,
      [0, 1],
      [1, 0],
      Extrapolation.CLAMP,
    );

    return {
      opacity,
      transform: [{ scale }],
    };
  });

  // Render slide item
  const renderItem = useCallback(
    ({ item, index }: { item: (typeof slides)[0]; index: number }) => {
      const { IllustrationComponent } = item;
      return (
        <View style={styles.slideContainer}>
          <OnboardingSlide
            title={item.title}
            description={item.description}
            illustration={<IllustrationComponent colors={theme.colors} />}
          />
        </View>
      );
    },
    [styles.slideContainer, theme.colors],
  );

  const keyExtractor = useCallback((item: (typeof slides)[0]) => item.key, []);

  return (
    <View style={[StyleSheet.absoluteFill, styles.container]}>
      <StatusBar
        barStyle={theme.isDark ? 'light-content' : 'dark-content'}
        animated
        translucent
      />

      <Animated.View style={[styles.contentContainer, containerStyle]}>
        <FlatList
          ref={flatListRef}
          data={slides}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          bounces={false}
          decelerationRate="fast"
          getItemLayout={(_, index) => ({
            length: SCREEN_WIDTH,
            offset: SCREEN_WIDTH * index,
            index,
          })}
          initialNumToRender={2}
          maxToRenderPerBatch={2}
          windowSize={3}
          removeClippedSubviews
        />

        <View style={styles.paginationContainer}>
          <OnboardingPagination
            totalSlides={TOTAL_SLIDES}
            scrollX={scrollX}
            screenWidth={SCREEN_WIDTH}
            onDotPress={jumpToSlide}
          />
        </View>
      </Animated.View>

      <OnboardingControls
        currentIndex={currentSlideIndex}
        totalSlides={TOTAL_SLIDES}
        onSkip={completeOnboarding}
        onGetStarted={completeOnboarding}
      />
    </View>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      zIndex: 1000,
      elevation: 1000,
    },
    contentContainer: {
      flex: 1,
    },
    slideContainer: {
      width: SCREEN_WIDTH,
      height: SCREEN_HEIGHT,
    },
    paginationContainer: {
      position: 'absolute',
      bottom: 120,
      left: 0,
      right: 0,
      alignItems: 'center',
    },
  });
