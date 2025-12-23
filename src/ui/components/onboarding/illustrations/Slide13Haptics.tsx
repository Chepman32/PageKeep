import React, { useEffect } from 'react';
import Svg, {
  G,
  Rect,
  Circle,
  Path,
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

interface Slide13Props {
  colors: Theme['colors'];
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedG = Animated.createAnimatedComponent(G);

const Slide13Haptics: React.FC<Slide13Props> = ({ colors }) => {
  // Vibration wave animations (expanding circles)
  const wave1Radius = useSharedValue(0);
  const wave1Opacity = useSharedValue(0.8);

  const wave2Radius = useSharedValue(0);
  const wave2Opacity = useSharedValue(0.8);

  const wave3Radius = useSharedValue(0);
  const wave3Opacity = useSharedValue(0.8);

  // Touch point pulse
  const touchScale = useSharedValue(1);

  // Vibration lines
  const vibrationOffset = useSharedValue(0);

  useEffect(() => {
    // Wave 1 animation (expanding and fading)
    wave1Radius.value = withRepeat(
      withSequence(
        withTiming(50, { duration: 1200, easing: Easing.out(Easing.cubic) }),
        withTiming(0, { duration: 0 })
      ),
      -1,
      false
    );

    wave1Opacity.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 1200, easing: Easing.out(Easing.cubic) }),
        withTiming(0.8, { duration: 0 })
      ),
      -1,
      false
    );

    // Wave 2 animation (delayed)
    wave2Radius.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 400 }),
        withTiming(50, { duration: 1200, easing: Easing.out(Easing.cubic) }),
        withTiming(0, { duration: 0 })
      ),
      -1,
      false
    );

    wave2Opacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 400 }),
        withTiming(0, { duration: 1200, easing: Easing.out(Easing.cubic) }),
        withTiming(0.8, { duration: 0 })
      ),
      -1,
      false
    );

    // Wave 3 animation (more delayed)
    wave3Radius.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 800 }),
        withTiming(50, { duration: 1200, easing: Easing.out(Easing.cubic) }),
        withTiming(0, { duration: 0 })
      ),
      -1,
      false
    );

    wave3Opacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 800 }),
        withTiming(0, { duration: 1200, easing: Easing.out(Easing.cubic) }),
        withTiming(0.8, { duration: 0 })
      ),
      -1,
      false
    );

    // Touch point pulsing
    touchScale.value = withRepeat(
      withTiming(1.3, {
        duration: 1000,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true
    );

    // Vibration lines (subtle shake)
    vibrationOffset.value = withRepeat(
      withSequence(
        withTiming(3, { duration: 100, easing: Easing.inOut(Easing.cubic) }),
        withTiming(-3, { duration: 200, easing: Easing.inOut(Easing.cubic) }),
        withTiming(3, { duration: 200, easing: Easing.inOut(Easing.cubic) }),
        withTiming(0, { duration: 100, easing: Easing.inOut(Easing.cubic) }),
        withTiming(0, { duration: 1000 })
      ),
      -1,
      false
    );
  }, [wave1Radius, wave1Opacity, wave2Radius, wave2Opacity, wave3Radius, wave3Opacity, touchScale, vibrationOffset]);

  // Animated props for waves
  const wave1AnimatedProps = useAnimatedProps(() => ({
    r: wave1Radius.value,
    opacity: wave1Opacity.value,
  }));

  const wave2AnimatedProps = useAnimatedProps(() => ({
    r: wave2Radius.value,
    opacity: wave2Opacity.value,
  }));

  const wave3AnimatedProps = useAnimatedProps(() => ({
    r: wave3Radius.value,
    opacity: wave3Opacity.value,
  }));

  // Animated props for touch point
  const touchAnimatedProps = useAnimatedProps(() => ({
    transform: `translate(150, 120) scale(${touchScale.value})`,
  }));

  // Animated props for vibration lines
  const vibrationAnimatedProps = useAnimatedProps(() => ({
    transform: `translate(${vibrationOffset.value}, 0)`,
  }));

  return (
    <Svg width="300" height="220" viewBox="0 0 300 220">
      <Defs>
        <LinearGradient id="phoneGradient2" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor={colors.card} stopOpacity="1" />
          <Stop offset="100%" stopColor={colors.card} stopOpacity="0.7" />
        </LinearGradient>
      </Defs>

      {/* Phone outline */}
      <G transform="translate(110, 30)">
        <Rect
          x="0"
          y="0"
          width="80"
          height="140"
          rx="12"
          fill="url(#phoneGradient2)"
          stroke={colors.border}
          strokeWidth="2"
        />

        {/* Phone notch */}
        <Rect
          x="25"
          y="0"
          width="30"
          height="4"
          rx="2"
          fill={colors.background}
        />

        {/* Phone screen */}
        <Rect
          x="5"
          y="10"
          width="70"
          height="120"
          rx="6"
          fill={colors.background}
          opacity="0.5"
        />

        {/* Touch indicator icon on screen */}
        <Circle
          cx="40"
          cy="90"
          r="8"
          fill={colors.accent}
          opacity="0.3"
        />
        <Path
          d="M 40,82 L 40,98 M 32,90 L 48,90"
          stroke={colors.accent}
          strokeWidth="2"
          strokeLinecap="round"
        />
      </G>

      {/* Animated vibration waves (concentric circles) */}
      <AnimatedCircle
        cx="150"
        cy="120"
        fill="none"
        stroke={colors.highlight}
        strokeWidth="3"
        animatedProps={wave1AnimatedProps}
      />
      <AnimatedCircle
        cx="150"
        cy="120"
        fill="none"
        stroke={colors.highlight}
        strokeWidth="3"
        animatedProps={wave2AnimatedProps}
      />
      <AnimatedCircle
        cx="150"
        cy="120"
        fill="none"
        stroke={colors.highlight}
        strokeWidth="3"
        animatedProps={wave3AnimatedProps}
      />

      {/* Animated touch point indicator */}
      <AnimatedG animatedProps={touchAnimatedProps}>
        <Circle
          cx="0"
          cy="0"
          r="6"
          fill={colors.accent}
        />
      </AnimatedG>

      {/* Animated vibration effect lines (left side) */}
      <AnimatedPath
        d="M 80,80 Q 70,90 80,100 M 75,90 Q 65,90 75,90"
        stroke={colors.secondary}
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        opacity="0.4"
        animatedProps={vibrationAnimatedProps}
      />

      {/* Animated vibration effect lines (right side) */}
      <AnimatedPath
        d="M 220,80 Q 230,90 220,100 M 225,90 Q 235,90 225,90"
        stroke={colors.secondary}
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        opacity="0.4"
        animatedProps={vibrationAnimatedProps}
      />

      {/* Haptic feedback label (bottom) */}
      <G transform="translate(100, 190)">
        <Rect
          x="0"
          y="0"
          width="100"
          height="18"
          rx="9"
          fill={colors.accent}
          opacity="0.15"
        />
        <Rect
          x="15"
          y="5"
          width="70"
          height="8"
          rx="4"
          fill={colors.text}
          opacity="0.3"
        />
      </G>
    </Svg>
  );
};

export default Slide13Haptics;
