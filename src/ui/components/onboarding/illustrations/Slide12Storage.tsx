import React, { useEffect } from 'react';
import Svg, {
  G,
  Rect,
  Path,
  Circle,
  Defs,
  LinearGradient,
  Stop,
} from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Theme } from '../../../../constants/themes';

interface Slide12Props {
  colors: Theme['colors'];
}

const AnimatedRect = Animated.createAnimatedComponent(Rect);
const AnimatedG = Animated.createAnimatedComponent(G);

const Slide12Storage: React.FC<Slide12Props> = ({ colors }) => {
  // Bar chart heights (animated growth)
  const bar1Height = useSharedValue(0);
  const bar2Height = useSharedValue(0);
  const bar3Height = useSharedValue(0);

  // Trash can shake animation
  const trashRotation = useSharedValue(0);

  useEffect(() => {
    // Bars growing animation (staggered, 3s loop)
    bar1Height.value = withRepeat(
      withSequence(
        withTiming(80, { duration: 800, easing: Easing.out(Easing.cubic) }),
        withTiming(80, { duration: 1700 }), // Hold
        withTiming(0, { duration: 300 }) // Reset
      ),
      -1,
      false
    );

    bar2Height.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 300 }),
        withTiming(100, { duration: 800, easing: Easing.out(Easing.cubic) }),
        withTiming(100, { duration: 1400 }), // Hold
        withTiming(0, { duration: 300 }) // Reset
      ),
      -1,
      false
    );

    bar3Height.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 600 }),
        withTiming(60, { duration: 800, easing: Easing.out(Easing.cubic) }),
        withTiming(60, { duration: 1100 }), // Hold
        withTiming(0, { duration: 300 }) // Reset
      ),
      -1,
      false
    );

    // Trash can shake (subtle wiggle animation)
    trashRotation.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 200, easing: Easing.inOut(Easing.cubic) }),
        withTiming(10, { duration: 400, easing: Easing.inOut(Easing.cubic) }),
        withTiming(-10, { duration: 400, easing: Easing.inOut(Easing.cubic) }),
        withTiming(0, { duration: 200, easing: Easing.inOut(Easing.cubic) }),
        withTiming(0, { duration: 1800 }) // Pause
      ),
      -1,
      false
    );
  }, [bar1Height, bar2Height, bar3Height, trashRotation]);

  // Animated props for bars
  const bar1AnimatedProps = useAnimatedProps(() => ({
    y: 150 - bar1Height.value,
    height: bar1Height.value,
  }));

  const bar2AnimatedProps = useAnimatedProps(() => ({
    y: 150 - bar2Height.value,
    height: bar2Height.value,
  }));

  const bar3AnimatedProps = useAnimatedProps(() => ({
    y: 150 - bar3Height.value,
    height: bar3Height.value,
  }));

  // Animated props for trash can
  const trashAnimatedProps = useAnimatedProps(() => ({
    transform: [{ translateX: 220 }, { translateY: 80 }, { rotate: `${trashRotation.value}deg` }],
  }));

  return (
    <Svg width="300" height="220" viewBox="0 0 300 220">
      <Defs>
        <LinearGradient id="barGradient1" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor={colors.accent} stopOpacity="0.8" />
          <Stop offset="100%" stopColor={colors.accent} stopOpacity="0.5" />
        </LinearGradient>
        <LinearGradient id="barGradient2" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor={colors.secondary} stopOpacity="0.8" />
          <Stop offset="100%" stopColor={colors.secondary} stopOpacity="0.5" />
        </LinearGradient>
        <LinearGradient id="barGradient3" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor={colors.highlight} stopOpacity="0.8" />
          <Stop offset="100%" stopColor={colors.highlight} stopOpacity="0.5" />
        </LinearGradient>
      </Defs>

      {/* Bar chart container */}
      <G transform="translate(40, 40)">
        {/* Chart background */}
        <Rect
          x="0"
          y="0"
          width="160"
          height="130"
          rx="10"
          fill={colors.card}
          opacity="0.3"
        />

        {/* Grid lines */}
        <Path
          d="M 10,30 L 150,30 M 10,70 L 150,70 M 10,110 L 150,110"
          stroke={colors.border}
          strokeWidth="1"
          opacity="0.3"
          strokeDasharray="5,5"
        />

        {/* Animated Bar 1 - Articles */}
        <AnimatedRect
          x="20"
          width="30"
          rx="4"
          fill="url(#barGradient1)"
          animatedProps={bar1AnimatedProps}
        />

        {/* Animated Bar 2 - Used (highest) */}
        <AnimatedRect
          x="65"
          width="30"
          rx="4"
          fill="url(#barGradient2)"
          animatedProps={bar2AnimatedProps}
        />

        {/* Animated Bar 3 - Available */}
        <AnimatedRect
          x="110"
          width="30"
          rx="4"
          fill="url(#barGradient3)"
          animatedProps={bar3AnimatedProps}
        />

        {/* Bar labels */}
        <Rect x="15" y="120" width="40" height="6" rx="3" fill={colors.text} opacity="0.25" />
        <Rect x="60" y="120" width="40" height="6" rx="3" fill={colors.text} opacity="0.25" />
        <Rect x="105" y="120" width="40" height="6" rx="3" fill={colors.text} opacity="0.25" />
      </G>

      {/* Storage size indicator (top right) */}
      <G transform="translate(50, 185)">
        <Rect x="0" y="0" width="120" height="20" rx="10" fill={colors.accent} opacity="0.15" />
        <Rect x="10" y="6" width="50" height="8" rx="4" fill={colors.text} opacity="0.3" />
        <Rect x="70" y="6" width="40" height="8" rx="4" fill={colors.accent} opacity="0.4" />
      </G>

      {/* Animated trash can icon (right side) */}
      <AnimatedG animatedProps={trashAnimatedProps}>
        {/* Trash can lid */}
        <Rect
          x="-20"
          y="-10"
          width="40"
          height="4"
          rx="2"
          fill={colors.muted}
        />

        {/* Trash can body */}
        <Path
          d="M -15,-6 L -18,20 Q -18,24 -14,24 L 14,24 Q 18,24 18,20 L 15,-6 Z"
          fill={colors.muted}
          opacity="0.6"
          stroke={colors.border}
          strokeWidth="2"
        />

        {/* Trash can handle */}
        <Path
          d="M -8,-14 Q 0,-18 8,-14"
          fill="none"
          stroke={colors.muted}
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* Vertical lines on trash can */}
        <Path
          d="M -6,0 L -8,18 M 0,0 L 0,18 M 6,0 L 8,18"
          stroke={colors.background}
          strokeWidth="2"
          opacity="0.5"
          strokeLinecap="round"
        />

        {/* Clear cache hint */}
        <Circle cx="0" cy="30" r="8" fill={colors.accent} opacity="0.2" />
      </AnimatedG>

      {/* Cache size label */}
      <G transform="translate(185, 120)">
        <Rect x="0" y="0" width="70" height="14" rx="7" fill={colors.card} opacity="0.4" />
        <Rect x="8" y="4" width="54" height="6" rx="3" fill={colors.text} opacity="0.25" />
      </G>
    </Svg>
  );
};

export default Slide12Storage;
