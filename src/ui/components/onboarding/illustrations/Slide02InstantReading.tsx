import React, { useEffect } from 'react';
import Svg, {
  G,
  Rect,
  Path,
  Defs,
  LinearGradient,
  Stop,
  Circle,
} from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { Theme } from '../../../../constants/themes';

interface Slide02Props {
  colors: Theme['colors'];
}

const AnimatedRect = Animated.createAnimatedComponent(Rect);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);

const Slide02InstantReading: React.FC<Slide02Props> = ({ colors }) => {
  // Progress bar fill animation
  const progressWidth = useSharedValue(0);

  // Checkmark draw animation
  const checkmarkProgress = useSharedValue(0);

  // Checkmark scale/appearance
  const checkmarkScale = useSharedValue(0);

  useEffect(() => {
    // Animate progress bar from 0 to 100% (3s)
    progressWidth.value = withRepeat(
      withSequence(
        withTiming(200, {
          duration: 3000,
          easing: Easing.inOut(Easing.cubic),
        }),
        withTiming(200, { duration: 500 }) // Hold at 100%
      ),
      -1,
      false
    );

    // Animate checkmark drawing (synced with progress completion)
    checkmarkProgress.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 3000 }), // Wait while progress fills
        withTiming(1, {
          duration: 400,
          easing: Easing.out(Easing.cubic),
        }),
        withTiming(1, { duration: 100 }) // Hold
      ),
      -1,
      false
    );

    // Checkmark pop-in animation
    checkmarkScale.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 3000 }), // Hidden while progress fills
        withTiming(1.2, {
          duration: 200,
          easing: Easing.out(Easing.back(1.5)),
        }),
        withTiming(1, {
          duration: 100,
          easing: Easing.inOut(Easing.cubic),
        }),
        withTiming(1, { duration: 200 }) // Hold
      ),
      -1,
      false
    );
  }, [progressWidth, checkmarkProgress, checkmarkScale]);

  // Animated props for progress fill
  const progressAnimatedProps = useAnimatedProps(() => ({
    width: progressWidth.value,
  }));

  // Animated props for checkmark
  const checkmarkAnimatedProps = useAnimatedProps(() => {
    const pathLength = 40; // Approximate path length
    const dashOffset = pathLength * (1 - checkmarkProgress.value);

    return {
      strokeDasharray: pathLength,
      strokeDashoffset: dashOffset,
      transform: `translate(250, 170) scale(${checkmarkScale.value})`,
    };
  });

  return (
    <Svg width="300" height="220" viewBox="0 0 300 220">
      <Defs>
        <LinearGradient id="documentGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor={colors.card} stopOpacity="1" />
          <Stop offset="100%" stopColor={colors.card} stopOpacity="0.8" />
        </LinearGradient>
        <LinearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor={colors.accent} stopOpacity="1" />
          <Stop offset="100%" stopColor={colors.highlight} stopOpacity="1" />
        </LinearGradient>
      </Defs>

      {/* Document base */}
      <Rect
        x="50"
        y="20"
        width="200"
        height="180"
        rx="8"
        fill="url(#documentGradient)"
        stroke={colors.border}
        strokeWidth="2"
      />

      {/* Folded corner */}
      <Path
        d="M 230,20 L 230,40 L 250,40 Z"
        fill={colors.muted}
        opacity="0.4"
      />
      <Path
        d="M 230,40 L 250,40 L 250,20"
        fill="none"
        stroke={colors.border}
        strokeWidth="1.5"
      />

      {/* Document text lines */}
      <Rect x="70" y="45" width="140" height="8" rx="4" fill={colors.text} opacity="0.3" />
      <Rect x="70" y="60" width="120" height="8" rx="4" fill={colors.text} opacity="0.25" />
      <Rect x="70" y="75" width="150" height="8" rx="4" fill={colors.text} opacity="0.3" />
      <Rect x="70" y="90" width="110" height="8" rx="4" fill={colors.text} opacity="0.25" />

      <Rect x="70" y="110" width="130" height="8" rx="4" fill={colors.text} opacity="0.3" />
      <Rect x="70" y="125" width="145" height="8" rx="4" fill={colors.text} opacity="0.25" />
      <Rect x="70" y="140" width="100" height="8" rx="4" fill={colors.text} opacity="0.3" />

      {/* Progress bar container */}
      <Rect
        x="50"
        y="170"
        width="200"
        height="12"
        rx="6"
        fill={colors.muted}
        opacity="0.3"
      />

      {/* Animated progress bar fill */}
      <AnimatedRect
        x="50"
        y="170"
        height="12"
        rx="6"
        fill="url(#progressGradient)"
        animatedProps={progressAnimatedProps}
      />

      {/* Progress percentage text */}
      <Rect
        x="120"
        y="188"
        width="60"
        height="14"
        rx="7"
        fill={colors.accent}
        opacity="0.2"
      />

      {/* Animated checkmark (appears when progress completes) */}
      <AnimatedPath
        d="M -6,0 L -2,6 L 6,-6"
        stroke={colors.highlight}
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        animatedProps={checkmarkAnimatedProps}
      />

      {/* Checkmark background circle */}
      <Circle
        cx="250"
        cy="170"
        r="14"
        fill={colors.accent}
        opacity="0.15"
      />
    </Svg>
  );
};

export default Slide02InstantReading;
