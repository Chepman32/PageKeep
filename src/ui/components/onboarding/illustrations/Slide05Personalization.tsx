import React, { useEffect } from 'react';
import Svg, {
  G,
  Circle,
  Rect,
  Path,
  Defs,
  LinearGradient,
  Stop,
} from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Theme } from '../../../../constants/themes';

interface Slide05Props {
  colors: Theme['colors'];
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedRect = Animated.createAnimatedComponent(Rect);

const Slide05Personalization: React.FC<Slide05Props> = ({ colors }) => {
  // Slider handle animation
  const sliderX = useSharedValue(0);

  // Line height animation (spacing changing)
  const lineSpacing = useSharedValue(0);

  // Theme selection animation (pulsing selected theme)
  const selectedThemeScale = useSharedValue(1);

  useEffect(() => {
    // Slider moving back and forth (3s loop)
    sliderX.value = withRepeat(
      withTiming(60, {
        duration: 3000,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true
    );

    // Line spacing animating (2.5s loop)
    lineSpacing.value = withRepeat(
      withTiming(8, {
        duration: 2500,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true
    );

    // Theme selection pulse (2s loop)
    selectedThemeScale.value = withRepeat(
      withTiming(1.15, {
        duration: 2000,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true
    );
  }, [sliderX, lineSpacing, selectedThemeScale]);

  // Animated props for slider handle
  const sliderAnimatedProps = useAnimatedProps(() => ({
    cx: 70 + sliderX.value,
  }));

  // Animated props for text line spacing
  const line2AnimatedProps = useAnimatedProps(() => ({
    y: 85 + lineSpacing.value,
  }));

  const line3AnimatedProps = useAnimatedProps(() => ({
    y: 105 + lineSpacing.value * 2,
  }));

  // Animated props for selected theme
  const themeAnimatedProps = useAnimatedProps(() => ({
    transform: `translate(50, 40) scale(${selectedThemeScale.value})`,
  }));

  return (
    <Svg width="300" height="220" viewBox="0 0 300 220">
      <Defs>
        <LinearGradient id="theme1" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#3A84F7" />
          <Stop offset="100%" stopColor="#6BA8FF" />
        </LinearGradient>
        <LinearGradient id="theme2" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#FF8A3D" />
          <Stop offset="100%" stopColor="#FFB366" />
        </LinearGradient>
        <LinearGradient id="theme3" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#6B6B6B" />
          <Stop offset="100%" stopColor="#9A9A9A" />
        </LinearGradient>
        <LinearGradient id="theme4" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#2D3748" />
          <Stop offset="100%" stopColor="#4A5568" />
        </LinearGradient>
      </Defs>

      {/* Theme swatches (top) */}
      <G>
        {/* Selected theme with animation */}
        <AnimatedCircle cx="0" cy="0" r="20" fill="url(#theme1)" animatedProps={themeAnimatedProps} />
        <AnimatedCircle cx="0" cy="0" r="24" fill="none" stroke={colors.accent} strokeWidth="3" animatedProps={themeAnimatedProps} />

        {/* Other theme options */}
        <Circle cx="110" cy="40" r="18" fill="url(#theme2)" opacity="0.7" />
        <Circle cx="170" cy="40" r="18" fill="url(#theme3)" opacity="0.7" />
        <Circle cx="230" cy="40" r="18" fill="url(#theme4)" opacity="0.7" />
      </G>

      {/* Font size slider */}
      <G transform="translate(40, 95)">
        {/* Slider label */}
        <Rect x="0" y="-20" width="50" height="12" rx="6" fill={colors.secondary} opacity="0.3" />

        {/* Slider track */}
        <Rect
          x="0"
          y="0"
          width="120"
          height="6"
          rx="3"
          fill={colors.muted}
          opacity="0.3"
        />

        {/* Slider fill (active portion) */}
        <AnimatedRect
          x="0"
          y="0"
          height="6"
          rx="3"
          fill={colors.accent}
          opacity="0.6"
          animatedProps={useAnimatedProps(() => ({
            width: 30 + sliderX.value,
          }))}
        />

        {/* Animated slider handle */}
        <AnimatedCircle
          cy="3"
          r="10"
          fill={colors.accent}
          stroke={colors.background}
          strokeWidth="3"
          animatedProps={sliderAnimatedProps}
        />

        {/* Size indicators */}
        <Rect x="135" y="-5" width="12" height="16" rx="2" fill={colors.text} opacity="0.2" />
        <Rect x="155" y="-8" width="16" height="22" rx="2" fill={colors.text} opacity="0.2" />
        <Rect x="180" y="-12" width="20" height="30" rx="2" fill={colors.text} opacity="0.2" />
      </G>

      {/* Line height preview with animated spacing */}
      <G transform="translate(40, 140)">
        {/* Label */}
        <Rect x="0" y="-15" width="55" height="10" rx="5" fill={colors.secondary} opacity="0.3" />

        {/* Text lines with animated spacing */}
        <Rect x="0" y="0" width="100" height="6" rx="3" fill={colors.text} opacity="0.35" />
        <AnimatedRect x="0" width="90" height="6" rx="3" fill={colors.text} opacity="0.35" animatedProps={line2AnimatedProps} />
        <AnimatedRect x="0" width="95" height="6" rx="3" fill={colors.text} opacity="0.35" animatedProps={line3AnimatedProps} />

        {/* Spacing indicator brackets */}
        <Path
          d="M 110,3 L 115,3 M 115,0 L 115,30 M 110,27 L 115,27"
          stroke={colors.accent}
          strokeWidth="2"
          opacity="0.5"
        />
      </G>

      {/* Margin controls (simplified representation) */}
      <G transform="translate(180, 140)">
        {/* Label */}
        <Rect x="0" y="-15" width="45" height="10" rx="5" fill={colors.secondary} opacity="0.3" />

        {/* Document with margins */}
        <Rect x="10" y="0" width="80" height="50" rx="4" fill={colors.card} opacity="0.4" stroke={colors.border} strokeWidth="1.5" />

        {/* Inner content area */}
        <Rect x="20" y="8" width="60" height="34" rx="2" fill={colors.text} opacity="0.1" />

        {/* Margin indicators */}
        <Path d="M 10,5 L 5,5 M 5,0 L 5,50 M 10,45 L 5,45" stroke={colors.accent} strokeWidth="1.5" opacity="0.6" />
        <Path d="M 90,5 L 95,5 M 95,0 L 95,50 M 90,45 L 95,45" stroke={colors.accent} strokeWidth="1.5" opacity="0.6" />
      </G>
    </Svg>
  );
};

export default Slide05Personalization;
