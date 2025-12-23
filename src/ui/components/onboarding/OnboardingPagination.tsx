import React, { useMemo } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  interpolate,
  interpolateColor,
  SharedValue,
} from 'react-native-reanimated';
import { useTheme } from '../../../contexts/ThemeContext';
import { Theme } from '../../../constants/themes';
import { Haptics } from '../../../utils/haptics';

interface OnboardingPaginationProps {
  totalSlides: number;
  scrollX: SharedValue<number>;
  screenWidth: number;
  onDotPress: (index: number) => void;
}

const Dot: React.FC<{
  index: number;
  scrollX: SharedValue<number>;
  screenWidth: number;
  theme: Theme;
  onPress: () => void;
}> = ({ index, scrollX, screenWidth, theme, onPress }) => {
  const inputRange = [
    (index - 1) * screenWidth,
    index * screenWidth,
    (index + 1) * screenWidth,
  ];

  const dotStyle = useAnimatedStyle(() => {
    const scale = interpolate(scrollX.value, inputRange, [1, 1.3, 1], 'clamp');

    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0.4, 1, 0.4],
      'clamp',
    );

    return {
      transform: [{ scale }],
      opacity,
    };
  });

  const colorStyle = useAnimatedStyle(() => {
    const color = interpolateColor(scrollX.value, inputRange, [
      theme.colors.muted,
      theme.colors.accent,
      theme.colors.muted,
    ]);

    return {
      backgroundColor: color,
    };
  });

  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.dotTouchArea}
      activeOpacity={0.7}
      accessibilityLabel={`Go to slide ${index + 1}`}
      accessibilityRole="button"
    >
      <Animated.View style={[styles.dot, dotStyle, colorStyle]} />
    </TouchableOpacity>
  );
};

export const OnboardingPagination: React.FC<OnboardingPaginationProps> = ({
  totalSlides,
  scrollX,
  screenWidth,
  onDotPress,
}) => {
  const { theme } = useTheme();

  const handleDotPress = (index: number) => {
    Haptics.light();
    onDotPress(index);
  };

  return (
    <View style={styles.container}>
      {Array.from({ length: totalSlides }).map((_, index) => (
        <Dot
          key={index}
          index={index}
          scrollX={scrollX}
          screenWidth={screenWidth}
          theme={theme}
          onPress={() => handleDotPress(index)}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotTouchArea: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
